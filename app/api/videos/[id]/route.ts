import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { presignGet } from '@/lib/s3'

export async function GET(_: Request, { params }: { params: { id: string } }) {
const v = await db.video.findUnique({ where: { id: params.id } })
if (!v?.hlsPath || v.status !== 'ready') return new NextResponse('Not ready', { status: 409 })
const url = await presignGet(v.hlsPath)
return NextResponse.json({ url })
}