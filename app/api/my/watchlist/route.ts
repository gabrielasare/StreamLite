import { NextResponse } from 'next/server'
import { db } from '@/lib/db'


export async function POST(req: Request) {
    const { userId, videoId } = await req.json()
    await db.watchlist.upsert({
    where: { userId_videoId: { userId, videoId } },
    update: {},
    create: { userId, videoId }
    })
    return NextResponse.json({ ok: true })
}