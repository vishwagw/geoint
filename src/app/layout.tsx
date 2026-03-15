import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GEOINT — Real-Time Geopolitical Intelligence',
  description: 'Live geopolitical intelligence platform. Monitor global threats, track events, and receive AI-powered analysis in real time.',
  keywords: ['geopolitical', 'intelligence', 'risk analysis', 'global events', 'security'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-white antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
