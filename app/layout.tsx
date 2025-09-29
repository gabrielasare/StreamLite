import './globals.css'
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en"><body className="min-h-screen">
            <header className="p-4 border-b border-white/10">StreamLite</header>
            <main className="p-4 max-w-6xl mx-auto">{children}</main>
        </body></html>
    )
}
