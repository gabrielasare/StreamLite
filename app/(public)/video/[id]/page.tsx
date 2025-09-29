'use client'
import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

export default function Player({ params }: { params: { id: string } }) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [ready, setReady] = useState(false)
    useEffect(() => {
        (async () => {
        const r = await fetch(`/api/videos/${params.id}/stream`)
        if (!r.ok) return
        const { url } = await r.json()
        if (Hls.isSupported()) {
            const hls = new Hls()
            hls.loadSource(url)
            hls.attachMedia(videoRef.current!)
            hls.on(Hls.Events.MANIFEST_PARSED, () => setReady(true))
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
            videoRef.current.src = url
            setReady(true)
        }
    })()
    }, [params.id])
    return (
        <div>
            <video ref={videoRef} controls className="w-full aspect-video bg-black" />
            {!ready && <p className="mt-2 text-sm text-white/60">Loading stream…</p>}
        </div>
    )
}