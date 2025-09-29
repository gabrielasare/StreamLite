import { Queue, Worker, QueueScheduler } from 'bullmq'
import Redis from 'ioredis'
import { Client as Minio } from 'minio'
import { PrismaClient } from '@prisma/client'
import { renditions } from './ffmpegPresets'
import { exec as _exec } from 'node:child_process'
import { promisify } from 'node:util'
const exec = promisify(_exec)

const redis = new Redis(process.env.REDIS_URL!)
const queueName = 'transcode'
export const queue = new Queue(queueName, { connection: redis })
new QueueScheduler(queueName, { connection: redis })

const db = new PrismaClient()
const s3 = new Minio({
    endPoint: process.env.S3_ENDPOINT!.replace(/^https?:\/\//,''),
    port: process.env.S3_ENDPOINT!.includes('https') ? 443 : 9000,
    useSSL: process.env.S3_ENDPOINT!.startsWith('https'),
    accessKey: process.env.S3_ACCESS_KEY_ID!,
    secretKey: process.env.S3_SECRET_ACCESS_KEY!
})


async function processJob(job: any) {
    const { jobId, sourceKey, videoId } = job.data
    const base = `hls/${videoId || jobId}`
    const localIn = `/tmp/input.mp4`

    // Download raw upload locally
    await s3.fGetObject(process.env.S3_BUCKET!, sourceKey, localIn)

    // Build ffmpeg command for HLS with multiple variants
    const outDir = `/tmp/hls`
    await exec(`mkdir -p ${outDir}`)
    const variantCmds = renditions.map(r => `-vf scale=${r.width}:${r.height} -c:a aac -ar 48000 -c:v h264 -b:v ${r.bitrate} -hls_time 4 -hls_segment_filename ${outDir}/${r.name}_%03d.ts -hls_playlist_type vod ${outDir}/${r.name}.m3u8`)

    // Simple loop: one rendition at a time (easier for beginners). For production, use a filter_complex.
    for (const r of renditions) {
        const cmd = `ffmpeg -y -i ${localIn} -vf scale=${r.width}:${r.height} -c:a aac -ar 48000 -c:v h264 -b:v ${r.bitrate} -hls_time 4 -hls_segment_filename ${outDir}/${r.name}_%03d.ts -hls_playlist_type vod ${outDir}/${r.name}.m3u8`
        await exec(cmd)
    }
    // Create master playlist
    const master = [
        '#EXTM3U',
        ...renditions.map(r => `#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=${r.width}x${r.height}\n${r.name}.m3u8`)
    ].join('\n')
    await exec(`bash -lc "cat > ${outDir}/master.m3u8 <<'EOF'\n${master}\nEOF"`)

    // Upload artifacts back to S3
    for await (const file of ['master.m3u8', ...renditions.map(r => `${r.name}.m3u8`)]) {
        await s3.fPutObject(process.env.S3_BUCKET!, `${base}/${file}`, `${outDir}/${file}`)
    }
    // Upload segments
    const { execSync } = await import('node:child_process')
    for (const r of renditions) {
        execSync(`bash -lc 'for f in ${outDir}/${r.name}_*.ts; do mc=\"$f\"; done'`)
    }
    // naive upload of segments
    // (For brevity; replace with fs.readdir + loop to upload each .ts)

    await db.video.update({ where: { id: videoId }, data: { status: 'ready', hlsPath: `${base}/master.m3u8` } })
}


new Worker(queueName, processJob, { connection: redis })

// Boot: watch UploadJob table and enqueue (simpler option: add an API that enqueues).
setInterval(async () => {
    const jobs = await db.uploadJob.findMany({ where: { status: 'queued' }, take: 5 })
    for (const j of jobs) {
        const video = await db.video.create({ data: { title: 'New Upload', description: 'Pending', durationSec: 0, genres: [], maturity: 'G', status: 'processing' } })
        await db.uploadJob.update({ where: { id: j.id }, data: { status: 'running', videoId: video.id } })
        await queue.add('transcode', { jobId: j.id, sourceKey: j.sourceKey, videoId: video.id })
    }
}, 5000)