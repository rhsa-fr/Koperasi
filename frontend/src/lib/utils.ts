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

export function getFileUrl(path: string | null): string {
  if (!path) return ''
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  return `${apiBase}/uploads/${path}`
}

export function isImage(filename: string | null): boolean {
  if (!filename) return false
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')
}

export function isPdf(filename: string | null): boolean {
  if (!filename) return false
  const ext = filename.split('.').pop()?.toLowerCase()
  return ext === 'pdf'
}

