'use client'

import { Bell, Search, ChevronDown, LogOut, User, Settings, X, Clock, Trash2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/time'
import { generateRoleColor, formatRoleLabel } from '@/lib/role'
import { Loader2 } from 'lucide-react'
import ModalGantiPassword from '../ModalGantiPassword'
import Toast, { ToastData } from '@/components/ui/Toast'
import { api } from '@/lib/axios'

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  '/dashboard':                { title: 'Dashboard',      description: 'Ringkasan data koperasi'          },
  '/dashboard/anggota':        { title: 'Anggota',        description: 'Kelola data anggota koperasi'     },
  '/dashboard/profil-anggota': { title: 'Profil Anggota', description: 'Detail profil anggota'            },
  '/dashboard/jenis-simpanan': { title: 'Jenis Simpanan', description: 'Kelola jenis produk simpanan'     },
  '/dashboard/simpanan':       { title: 'Simpanan',       description: 'Transaksi simpanan anggota'       },
  '/dashboard/pinjaman':       { title: 'Pinjaman',       description: 'Pengajuan dan manajemen pinjaman' },
  '/dashboard/angsuran':       { title: 'Angsuran',       description: 'Pembayaran angsuran pinjaman'     },
  '/dashboard/laporan':        { title: 'Laporan',        description: 'Laporan keuangan koperasi'        },
}

// ROLE_LABELS and ROLE_COLORS removed as we use utilities from @/lib/role


const QUICK_LINKS = [
  { label: 'Dashboard', href: '/dashboard'                },
  { label: 'Anggota',   href: '/dashboard/anggota'        },
  { label: 'Simpanan',  href: '/dashboard/simpanan'       },
  { label: 'Pinjaman',  href: '/dashboard/pinjaman'       },
  { label: 'Angsuran',  href: '/dashboard/angsuran'       },
  { label: 'Laporan',   href: '/dashboard/laporan'        },
]

const NOTIF_COLORS: Record<string, string> = {
  warning: 'bg-amber-400', info: 'bg-blue-400', success: 'bg-emerald-400',
}

interface Notification {
  id: number
  type: 'warning' | 'info' | 'success'
  title: string
  desc: string
  timestamp: Date | string // Changed from 'time' to 'timestamp'
  read: boolean
  href?: string
}

export default function Header() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, logout } = useAuth()

  const [searchOpen,     setSearchOpen]     = useState(false)
  const [searchQuery,    setSearchQuery]    = useState('')
  const [notifOpen,      setNotifOpen]      = useState(false)
  const [userMenuOpen,   setUserMenuOpen]   = useState(false)
  const [notifications,  setNotifications]  = useState<Notification[]>([])
  const [notifLoading,   setNotifLoading]   = useState(true)
  const [loggingOut,     setLoggingOut]     = useState(false)
  const [confirmLogout,  setConfirmLogout]  = useState(false)
  const [gantiPassword,  setGantiPassword]  = useState(false)
  const [toast,          setToast]          = useState<ToastData | null>(null)

  const searchRef  = useRef<HTMLDivElement>(null)
  const notifRef   = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const prevUnreadCountRef = useRef<number>(0)

  const pageInfo   = PAGE_TITLES[pathname] ?? { title: 'Dashboard', description: '' }
  const unreadCount = notifications.filter(n => !n.read).length

  const today = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current   && !searchRef.current.contains(e.target as Node))   setSearchOpen(false)
      if (notifRef.current    && !notifRef.current.contains(e.target as Node))    setNotifOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Fetch notifications dari API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setNotifLoading(true)
        
        // Fetch data dengan improved error handling
        let angsuranRes = { data: [] }
        let pinjamanRes = { data: [] }
        
        try {
          const res = await api.get<any>('/angsuran?limit=100')
          angsuranRes = { data: Array.isArray(res) ? res : (res?.data || []) }

        } catch (err) {
          console.warn('Failed to fetch angsuran:', err)
          // Continue anyway, don't stop entire fetch
        }
        
        try {
          const res = await api.get<any>('/pinjaman?limit=100')
          pinjamanRes = { data: Array.isArray(res) ? res : (res?.data || []) }

        } catch (err) {
          console.warn('Failed to fetch pinjaman:', err)
        }
        const notifs: Notification[] = []
        let id = 1

        const angsuranList = angsuranRes.data
        const pinjamanList = pinjamanRes.data

        // Notifikasi: Angsuran jatuh tempo (belum dibayar)

        const overdueAngsuran = (Array.isArray(angsuranList) ? angsuranList : []).filter((a: any) => 
          a.status === 'pending' || a.status === 'belum_dibayar' || a.status === 'overdue'
        )
        if (overdueAngsuran.length > 0) {
          const latestAngsuran = overdueAngsuran[0]
          const timestamp = latestAngsuran.tanggal_jatuh_tempo || latestAngsuran.created_at || new Date()
          
          notifs.push({
            id: id++,
            type: 'warning',
            title: 'Angsuran Jatuh Tempo',
            desc: `${overdueAngsuran.length} angsuran belum dibayar`,
            timestamp,
            read: false,
            href: '/dashboard/angsuran',
          })
        }

        // Notifikasi: Pinjaman menunggu persetujuan
        const pendingLoans = (Array.isArray(pinjamanList) ? pinjamanList : []).filter((p: any) => 
          p.status === 'pending'
        )
        if (pendingLoans.length > 0) {
          const latestLoan = pendingLoans[0]
          const timestamp = latestLoan.created_at || latestLoan.tanggal_pengajuan || new Date()
          
          notifs.push({
            id: id++,
            type: 'info',
            title: 'Pinjaman Menunggu Persetujuan',
            desc: `${pendingLoans.length} pengajuan pinjaman menunggu persetujuan`,
            timestamp,
            read: false,
            href: '/dashboard/pinjaman',
          })
        }

        // Jika tidak ada notifikasi, tampilkan info
        if (notifs.length === 0) {
          notifs.push({
            id: id++,
            type: 'success',
            title: 'Semua Lancar',
            desc: 'Tidak ada pemberitahuan penting saat ini',
            timestamp: new Date(),
            read: true,
          })
        }

        // Check if there are new unread notifications
        const currentUnreadCount = notifs.filter(n => !n.read).length
        if (prevUnreadCountRef.current > 0 && currentUnreadCount > prevUnreadCountRef.current) {
          const newCount = currentUnreadCount - prevUnreadCountRef.current
          setToast({
            type: 'info',
            message: `${newCount} notifikasi baru: ${notifs.filter(n => !n.read).map(n => n.title).join(', ')}`
          })
        }
        prevUnreadCountRef.current = currentUnreadCount

        setNotifications(notifs)
      } catch (error) {
        console.error('Gagal memuat notifikasi:', error)
        setToast({
          type: 'error',
          message: 'Gagal memuat notifikasi'
        })
      } finally {
        setNotifLoading(false)
      }
    }

    fetchNotifications()
    // Refresh notifikasi setiap 30 detik
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user?.id])

  const filteredLinks = searchQuery.trim()
    ? QUICK_LINKS.filter(l => l.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : QUICK_LINKS

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const handleNotificationClick = useCallback((notif: Notification) => {
    // Tandai notifikasi sebagai sudah dibaca
    setNotifications(prev =>
      prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
    )
    // Navigate ke halaman jika ada href
    if (notif.href) {
      router.push(notif.href)
    }
    // Close dropdown
    setNotifOpen(false)
  }, [router])

  const handleDeleteNotification = useCallback((notifId: number) => {
    // Remove notification dari list
    setNotifications(prev => prev.filter(n => n.id !== notifId))
    setToast({
      type: 'info',
      message: 'Notifikasi dihapus'
    })
  }, [])

  // Buka dialog konfirmasi (bukan langsung logout)
  const openConfirm = useCallback(() => {
    setUserMenuOpen(false)
    setConfirmLogout(true)
  }, [])

  // Eksekusi logout setelah konfirmasi
  const handleLogout = useCallback(async () => {
    setConfirmLogout(false)
    setLoggingOut(true)
    await logout()
  }, [logout])

  const handleSearchNav = (href: string) => {
    router.push(href)
    setSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-6 md:px-8 shrink-0">

        {/* ── LEFT: Page Title ── */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">{pageInfo.title}</h1>
            {pageInfo.description && (
              <p className="text-[11px] text-slate-500 font-medium mt-1 uppercase tracking-wider">{pageInfo.description}</p>
            )}
          </div>
        </div>

        {/* ── RIGHT: Actions ── */}
        <div className="flex items-center gap-1.5">

          <span className="text-[11px] text-ink-300 hidden lg:block mr-2 select-none">{today}</span>

          {/* SEARCH */}
          <div ref={searchRef} className="relative">
            <button
              onClick={() => { setSearchOpen(v => !v); setNotifOpen(false); setUserMenuOpen(false) }}
              className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
                searchOpen ? 'bg-ink-800 text-white' : 'text-ink-400 hover:bg-surface-200 hover:text-ink-800')}
              aria-label="Cari"
            >
              <Search className="w-4 h-4" />
            </button>
            {searchOpen && (
              <div className="absolute right-0 top-10 w-72 bg-white rounded-xl border border-surface-300 shadow-lg overflow-hidden animate-fade-in">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-surface-200">
                  <Search className="w-4 h-4 text-ink-300 shrink-0" />
                  <input autoFocus type="text" value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari menu atau halaman..."
                    className="flex-1 text-sm text-ink-800 outline-none placeholder:text-ink-200 bg-transparent" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-ink-300 hover:text-ink-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="py-1.5 max-h-48 overflow-y-auto">
                  {filteredLinks.length > 0 ? (
                    <>
                      <p className="text-[10px] font-semibold text-ink-300 uppercase tracking-widest px-3 py-1.5">
                        {searchQuery ? 'Hasil' : 'Menu Cepat'}
                      </p>
                      {filteredLinks.map(link => (
                        <button key={link.href} onClick={() => handleSearchNav(link.href)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-100 transition-colors">
                          <span className="w-1.5 h-1.5 rounded-full bg-ink-300 shrink-0" />
                          <span className="text-sm text-ink-700">{link.label}</span>
                        </button>
                      ))}
                    </>
                  ) : (
                    <p className="text-xs text-ink-300 text-center py-4">Tidak ditemukan</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* NOTIFIKASI */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setNotifOpen(v => !v); setSearchOpen(false); setUserMenuOpen(false) }}
              className={cn('w-8 h-8 rounded-lg flex items-center justify-center relative transition-all duration-150',
                notifOpen ? 'bg-ink-800 text-white' : 'text-ink-400 hover:bg-surface-200 hover:text-ink-800')}
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-10 w-80 bg-white rounded-xl border border-surface-300 shadow-lg overflow-hidden animate-fade-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink-800">Notifikasi</p>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                        {unreadCount} baru
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11px] text-accent-600 hover:underline font-medium">
                      Tandai semua dibaca
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-surface-100">
                  {notifLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-4 h-4 animate-spin text-ink-400" />
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.map(notif => (
                      <div key={notif.id}
                        className={cn('w-full group text-left flex gap-3 px-4 py-3 transition-colors',
                          !notif.read ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-surface-50')}>
                        <button
                          onClick={() => handleNotificationClick(notif)}
                          className="flex-1 flex gap-3 items-start text-left"
                        >
                          <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', NOTIF_COLORS[notif.type])} />
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-xs font-semibold leading-snug', notif.read ? 'text-ink-600' : 'text-ink-800')}>
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-ink-400 mt-0.5 leading-relaxed line-clamp-2">{notif.desc}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-2.5 h-2.5 text-ink-200" />
                              <p className="text-[10px] text-ink-300">{formatRelativeTime(notif.timestamp)}</p>
                            </div>
                          </div>
                          {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteNotification(notif.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-md shrink-0"
                          title="Hapus notifikasi"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center py-8 text-ink-400">
                      <p className="text-xs">Tidak ada notifikasi</p>
                    </div>
                  )}
                </div>
                <div className="border-t border-surface-200 px-4 py-2.5">
                  <p className="text-[11px] text-ink-300 text-center">Notifikasi dari sistem koperasi</p>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-surface-300 mx-1" />

          {/* USER MENU */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => { setUserMenuOpen(v => !v); setSearchOpen(false); setNotifOpen(false) }}
              className={cn('flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg transition-all duration-150',
                userMenuOpen ? 'bg-surface-200' : 'hover:bg-surface-100')}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}>
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-ink-800 leading-none capitalize">
                  {user?.username?.split('@')?.[0] || 'User'}
                </p>


                <p className="text-[10px] text-ink-300 mt-0.5 capitalize">
                  {user ? formatRoleLabel(user.role) : '—'}
                </p>

              </div>
              <ChevronDown className={cn('w-3 h-3 text-ink-300 hidden md:block transition-transform duration-150', userMenuOpen && 'rotate-180')} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-10 w-56 bg-white rounded-xl border border-surface-300 shadow-lg overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-surface-200 bg-surface-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}>
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-800 truncate">{user?.username}</p>
                      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-md',
                        user ? generateRoleColor(user.role) : 'bg-surface-200 text-ink-500')}>
                        {user ? formatRoleLabel(user.role) : '—'}
                      </span>

                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { router.push('/dashboard/profil-anggota'); setUserMenuOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-surface-100 transition-colors">
                    <User className="w-4 h-4 text-ink-400" />
                    <span className="text-sm text-ink-700">Profil Saya</span>
                  </button>
                  <button
                    onClick={() => { setGantiPassword(true); setUserMenuOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-surface-100 transition-colors">
                    <Settings className="w-4 h-4 text-ink-400" />
                    <span className="text-sm text-ink-700">Ganti Password</span>
                  </button>
                </div>
                {/* Logout — sekarang buka konfirmasi */}
                <div className="border-t border-surface-200 py-1">
                  <button
                    onClick={openConfirm}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-red-50 transition-colors group disabled:opacity-60"
                  >
                    <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-500" />
                    <span className="text-sm text-red-500 group-hover:text-red-600 font-medium">
                      {loggingOut ? 'Keluar...' : 'Logout'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Dialog Konfirmasi Logout ── */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmLogout(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink-800">Konfirmasi Logout</h3>
                <p className="text-xs text-ink-400 mt-0.5">Anda akan keluar dari sistem</p>
              </div>
            </div>
            <p className="text-sm text-ink-600 mb-5">
              Yakin ingin logout? Anda perlu login kembali untuk mengakses dashboard.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 h-9 rounded-lg border border-surface-300 text-sm font-medium text-ink-600 hover:bg-surface-100 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 h-9 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
              >
                {loggingOut
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Keluar...</>
                  : 'Ya, Logout'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {gantiPassword && (
        <ModalGantiPassword onClose={() => setGantiPassword(false)} />
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}