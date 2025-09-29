import { NextResponse } from 'next/server'
import { ensureBucket, presignPut } from '@/lib/s3'
import { db } from '@/lib/db'


export async function POST() {
    await ensureBucket(process.env.S3_BUCKET!)
    const key = `raw/${crypto.randomUUID()}.mp4`
    const url = await presignPut(key)
    const job = await db.uploadJob.create({ data: { uploaderId: 'admin', sourceKey: key, status: 'queued' } })
    return NextResponse.json({ url, jobId: job.id })
}