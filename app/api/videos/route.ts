import { NextResponse } from 'next/server'
import { db } from '@/lib/db'


export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''
    const where = search ? { title: { contains: search, mode: 'insensitive' } } : {}
    const videos = await db.video.findMany({ where, orderBy: { createdAt: 'desc' }, take: 24 })
    return NextResponse.json(videos)
}