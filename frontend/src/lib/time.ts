/**
 * Format timestamp to relative time in Indonesian
 * e.g., "5 menit lalu", "2 jam lalu", "3 hari lalu"
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const target = typeof date === 'string' ? new Date(date) : date

  // Invalid date
  if (isNaN(target.getTime())) {
    return 'Sekarang'
  }

  const diffMs = now.getTime() - target.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)

  if (diffSec < 60) {
    return 'Barusan'
  } else if (diffMin < 60) {
    return `${diffMin} menit lalu`
  } else if (diffHour < 24) {
    return `${diffHour} jam lalu`
  } else if (diffDay < 7) {
    return `${diffDay} hari lalu`
  } else if (diffWeek < 4) {
    return `${diffWeek} minggu lalu`
  } else if (diffMonth < 12) {
    return `${diffMonth} bulan lalu`
  } else {
    return 'Lama sekali'
  }
}

/**
 * Format date to human-readable format in Indonesian
 * e.g., "20 April 2026"
 */
export function formatDate(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date

  if (isNaN(target.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(target)
}

/**
 * Format time to HH:MM format
 * e.g., "14:30"
 */
export function formatTime(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date

  if (isNaN(target.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(target)
}
