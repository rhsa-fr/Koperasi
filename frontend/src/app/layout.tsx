import type { Metadata } from 'next'
import { AuthProvider } from '@/context/AuthContext'
import '@/styles/globals.css'

import { Outfit } from 'next/font/google'

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: {
    default: 'Koperasi — Sistem Manajemen',
    template: '%s | Koperasi',
  },
  description: 'Sistem manajemen koperasi simpan pinjam',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body className={`${outfit.variable} font-sans antialiased text-ink-700`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}