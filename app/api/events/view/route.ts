import { NextResponse } from 'next/server'
import { db } from '@/lib/db'


export async function POST(req: Request) {
    const { userId, videoId, kind, positionS } = await req.json()
    await db.viewEvent.create({ data: { userId, videoId, kind, positionS } })
    return NextResponse.json({ ok: true })
}