async function fetchVideos() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/videos`, { cache: 'no-store' })
    return res.json()
}

export default async function Page() {
    const videos = await fetchVideos()
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {videos.map((v: any) => (
                <a key={v.id} href={`/video/${v.id}`} className="block rounded overflow-hidden bg-white/5 p-2 hover:bg-white/10">
                    <div className="aspect-video bg-white/10 mb-2" />
                    <div className="text-sm font-medium">{v.title}</div>
                    <div className="text-xs text-white/60">{v.genres?.join(', ')}</div>
                </a>
            ))}
        </div>
    )
}