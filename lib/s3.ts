import { Client } from 'minio'


export const s3 = new Client({
    endPoint: process.env.S3_ENDPOINT!.replace(/^https?:\/\//,''),
    port: process.env.S3_ENDPOINT!.includes('https') ? 443 : 9000,
    useSSL: process.env.S3_ENDPOINT!.startsWith('https'),
    accessKey: process.env.S3_ACCESS_KEY_ID!,
    secretKey: process.env.S3_SECRET_ACCESS_KEY!
})


export async function ensureBucket(bucket: string) {
    const exists = await s3.bucketExists(bucket).catch(()=>false)
    if (!exists) await s3.makeBucket(bucket, process.env.S3_REGION || 'us-east-1')
}


export async function presignPut(key: string, expiry = 60*10) {
    return s3.presignedPutObject(process.env.S3_BUCKET!, key, expiry)
}


export async function presignGet(key: string, expiry = 60*5) {
    return s3.presignedGetObject(process.env.S3_BUCKET!, key, expiry)
}