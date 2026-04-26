'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Home, Wallet, CreditCard, User, Menu, Bell, Loader2, ArrowLeft, CheckCircle2, AlertTriangle, Info, Volume2, Megaphone } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { api, API_BASE_URL } from '@/lib/axios'
import Avatar from '@/components/ui/Avatar'

interface NotifikasiResponse {
  id_notifikasi: number;
  tipe: 'success' | 'warning' | 'info' | 'system';
  judul: string;
  pesan: string;
  is_read: boolean;
  created_at: string;
}

interface KoperasiSetting {
  nama_koperasi: string;
}


interface MobileLayoutProps {
  children: React.ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState<NotifikasiResponse[]>([])
  const [setting, setSetting] = useState<KoperasiSetting | null>(null)

  
  // Real API Fetch
  const loadNotifs = async () => {
    try {
      const res = await api.get<NotifikasiResponse[]>('/notifikasi')
      setNotifications(res || [])
    } catch (e) {
      console.error('Gagal memuat notifikasi:', e)
      setNotifications([])
    }
  }

  // Reload saat laci dibuka
  useEffect(() => {
    if (showNotifs) {
      loadNotifs()
    } else {
      // Load diam-diam di background sekali saat aplikasi boot up
      loadNotifs()
    }
  }, [showNotifs])

  // Load Settings
  useEffect(() => {
    api.get<KoperasiSetting>(`/setting?t=${Date.now()}`)
      .then(res => setSetting(res))
      .catch(e => console.error(e))
  }, [])


  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifikasi/${id}/read`)
      // Refresh local list quickly without hitting server again
      setNotifications(prev => prev.map(n => n.id_notifikasi === id ? { ...n, is_read: true } : n))
    } catch (e) {
      console.error(e)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const NAV_ITEMS = [
    { label: 'Beranda', icon: Home,       href: '/dashboard' },
    { label: 'Simpanan',icon: Wallet,     href: '/dashboard/simpanan' },
    { label: 'Pinjaman',icon: CreditCard, href: '/dashboard/pinjaman' },
    { label: 'Profil',  icon: User,       href: '/dashboard/profile' },
  ]

  return (
    <div className="flex justify-center h-[100dvh] bg-slate-100/50 overflow-hidden">
      {/* Mobile Wrapper Container (Restricts max-width on desktop) */}
      <div className="w-full max-w-md bg-[#f8fafc] h-full flex flex-col relative shadow-2xl shadow-indigo-900/10 overflow-hidden">
        
        {/* Mobile Header */}
        <header className="absolute top-0 inset-x-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-surface-200/60 px-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
             <Avatar 
               src={user?.anggota?.foto_profil} 
               size="md"
               className="shadow-md shadow-accent-600/30"
             />
             <div>
               <p className="text-[10px] font-bold text-accent-600 uppercase tracking-widest leading-none">
                 {setting?.nama_koperasi || 'Koperasi Sijam'}
               </p>
               <p className="text-sm font-bold text-ink-900 leading-tight">Halo!</p>
             </div>
          </div>
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setShowNotifs(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-100 text-ink-600 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95"
            >
              <Bell className="w-5 h-5" />
              {/* Red Dot Unread Indicator */}
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 h-4 min-w-4 px-1 bg-red-500 rounded-full border-2 border-white flex items-center justify-center animate-in zoom-in shadow-sm">
                  <span className="text-[9px] font-black text-white leading-none tracking-tighter">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto w-full relative z-0 custom-scrollbar pb-24 pt-20 px-5">
           {children}
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="absolute bottom-0 inset-x-0 z-40 h-[72px] bg-white border-t border-surface-200 pb-safe shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.05)]">
          <div className="h-full flex items-center justify-around px-2">
             {NAV_ITEMS.map((item) => {
               const isActive = pathname === item.href
               return (
                 <button 
                   key={item.label}
                   onClick={() => router.push(item.href)}
                   className="relative flex flex-col items-center justify-center w-16 h-full gap-1 group"
                 >
                   <div className={cn(
                     "flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300",
                     isActive ? "bg-accent-50 text-accent-600 scale-110" : "text-ink-300 group-hover:bg-surface-50 group-hover:text-ink-500"
                   )}>
                     <item.icon className={cn("w-5 h-5 transition-colors", isActive && "fill-accent-100/50")} />
                   </div>
                   <span className={cn(
                     "text-[9px] font-bold transition-colors duration-300",
                     isActive ? "text-accent-600" : "text-ink-400"
                   )}>
                     {item.label}
                   </span>
                   {isActive && (
                     <div className="absolute top-0 inset-x-0 mx-auto w-8 h-1 bg-gradient-premium rounded-b-full shadow-[0_0_10px_rgba(42,127,197,0.5)]" />
                   )}
                 </button>
               )
             })}
          </div>
        </nav>

        {/* ── Notification Drawer Overlay ── */}
        {showNotifs && (
          <div className="absolute inset-0 z-[100] bg-surface-50 flex flex-col animate-fade-in fade-in-from-right-8">
            <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-surface-200 shadow-sm shrink-0">
               <button 
                 onClick={() => setShowNotifs(false)}
                 className="w-10 h-10 rounded-full bg-surface-100 hover:bg-surface-200 flex items-center justify-center text-ink-600 transition-colors"
               >
                 <ArrowLeft className="w-5 h-5" />
               </button>
               <div>
                  <h2 className="text-xl font-black text-ink-900 tracking-tight">Notifikasi</h2>
                  <p className="text-[10px] uppercase font-bold text-ink-400 tracking-widest leading-none mt-1">
                    {unreadCount} Pesan Belum Dibaca
                  </p>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-safe bg-slate-50 border-t border-white">
               {notifications.length === 0 ? (
                 <div className="pt-20 text-center">
                   <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-ink-300" />
                   </div>
                   <p className="text-sm font-bold text-ink-500">Belum ada notifikasi.</p>
                 </div>
               ) : notifications.map((n) => {
                  let Icon = Info
                  let iconBg = "bg-blue-100"
                  let iconColor = "text-blue-600"
                  
                  if (n.tipe === 'success') {
                     Icon = CheckCircle2; iconBg = "bg-emerald-100"; iconColor = "text-emerald-600"
                  } else if (n.tipe === 'warning') {
                     Icon = AlertTriangle; iconBg = "bg-amber-100"; iconColor = "text-amber-600"
                  } else if (n.tipe === 'system') {
                     Icon = Megaphone; iconBg = "bg-purple-100"; iconColor = "text-purple-600"
                  }

                  return (
                    <div 
                      key={n.id_notifikasi} 
                      onClick={() => !n.is_read && markAsRead(n.id_notifikasi)}
                      className={cn(
                        "p-4 rounded-3xl border transition-all cursor-pointer hover:shadow-md",
                        n.is_read ? "bg-white border-surface-200 opacity-75" : "bg-white border-blue-100 shadow-sm shadow-blue-900/5 ring-1 ring-blue-500/10"
                      )}
                    >
                       <div className="flex gap-4">
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-1", iconBg)}>
                             <Icon className={cn("w-6 h-6", iconColor)} />
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-start justify-between gap-2 mb-1">
                               <h4 className={cn("text-sm font-bold truncate", n.is_read ? "text-ink-700" : "text-ink-900")}>{n.judul}</h4>
                               <span className="text-[9px] font-bold text-ink-400 whitespace-nowrap mt-0.5">
                                 {new Date(n.created_at).toLocaleDateString('id-ID')}
                               </span>
                             </div>
                             <p className={cn("text-xs leading-relaxed", n.is_read ? "text-ink-500" : "text-ink-600 font-medium")}>{n.pesan}</p>
                          </div>
                       </div>
                    </div>
                  )
               })}
               {notifications.length > 0 && (
                 <div className="pt-6 pb-20 text-center">
                   <p className="text-[10px] font-bold text-ink-300 uppercase tracking-widest">Tidak ada lagi notifikasi</p>
                 </div>
               )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
