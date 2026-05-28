import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function getFileUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('data:')) return path
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  return `${apiBase}/uploads/${path}`
}

export function base64ToBlobUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('data:')) {
    try {
      const parts = path.split(';base64,')
      const contentType = parts[0].split(':')[1]
      const raw = window.atob(parts[1])
      const rawLength = raw.length
      const uInt8Array = new Uint8Array(rawLength)
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i)
      }
      const blob = new Blob([uInt8Array], { type: contentType })
      return URL.createObjectURL(blob)
    } catch (e) {
      console.error("Gagal mengonversi base64 ke blob:", e)
      return path
    }
  }
  return getFileUrl(path)
}

export function openSafeFile(path: string | null | undefined) {
  if (!path) return
  const url = base64ToBlobUrl(path)
  
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function isImage(path: string | null | undefined): boolean {
  if (!path) return false
  if (path.startsWith('data:')) {
    return path.includes('image/')
  }
  const ext = path.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')
}

export function isPdf(path: string | null | undefined): boolean {
  if (!path) return false
  if (path.startsWith('data:')) {
    return path.includes('application/pdf')
  }
  const ext = path.split('.').pop()?.toLowerCase()
  return ext === 'pdf'
}

