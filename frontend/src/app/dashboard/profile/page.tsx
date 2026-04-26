'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  User, Shield, Key, Clock, 
  Wallet, CreditCard, ArrowUpCircle, 
  ArrowDownCircle, BadgeCheck, Phone, Mail, 
  AlertCircle, Loader2, Save, FilePlus,
  Activity, Settings2, ShieldCheck, ChevronRight, Zap
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'
import { formatRoleLabel } from '@/lib/role'
import Toast, { ToastData } from '@/components/ui/Toast'
import ModalGantiPassword from '@/components/ModalGantiPassword'
import FormPinjaman from '@/app/dashboard/pinjaman/FormPinjaman'
import IconRenderer from '@/components/layout/IconRenderer'
import AnggotaProfile from '../AnggotaProfile'
import Avatar from '@/components/ui/Avatar'

// ============================================================================
// Types
// ============================================================================

interface ProfileFull {
  id_user: number
  username: string
  role: string
  created_at: string
  anggota?: {
    id_anggota: number
    no_anggota: string
    status: string
    nama_lengkap?: string
    email?: string
    no_telepon?: string
    foto_profil?: string | null
    total_simpanan?: number
    total_pinjaman_aktif?: number
  } | null
}

interface PersonalLog {
  id_audit: number
  action: string
  resource: string
  timestamp: string
}

// ============================================================================
// Main Page
// ============================================================================

export default function ProfilePage() {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState<ProfileFull | null>(null)
  const [logs, setLogs] = useState<PersonalLog[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [gantiPassword, setGantiPassword] = useState(false)
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'keamanan' | 'aktivitas'>('info')

  if (authUser?.role === 'anggota') {
    return <AnggotaProfile user={authUser} />
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Get Me Full Info
      const res = await api.get<any>('/auth/me')
      
      // 2. If it's a member, get more details
      let fullProfile: ProfileFull = res
      if (res.anggota) {
        try {
          const detail = await api.get<any>(`/anggota/${res.anggota.id_anggota}/detail`)
          fullProfile.anggota = {
            ...res.anggota,
            nama_lengkap: detail.nama_lengkap,
            email: detail.email,
            no_telepon: detail.no_telepon,
            total_simpanan: detail.total_simpanan,
            total_pinjaman_aktif: detail.total_pinjaman_aktif
          }
        } catch (e) { console.warn('Failed to fetch detailed member info') }
      }
      
      setProfile(fullProfile)
      
      // 3. Get Logs (Simplified — if endpoint exists later)
      // await api.get('/auth/logs').then(setLogs).catch(() => {})
      
    } catch (err) {
      setToast({ type: 'error', message: 'Gagal memuat profil' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-accent-600" />
          <div className="absolute inset-0 blur-xl bg-accent-400/20 animate-pulse" />
        </div>
        <p className="text-ink-400 text-sm font-bold tracking-widest uppercase">Sinkronisasi Identitas...</p>
      </div>
    )
  }

  const isAnggota = profile?.anggota != null

  return (
    <div className="pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      {gantiPassword && <ModalGantiPassword onClose={() => setGantiPassword(false)} />}

      {/* ── HEADER: Identity Banner ── */}
      <div className="relative overflow-hidden bg-gradient-premium rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-accent-600/20 border border-white/10 group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-400/10 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          {/* Avatar Area */}
          <div className="relative">
             <Avatar 
                src={profile?.anggota?.foto_profil} 
                size="xl" 
                className="md:w-32 md:h-32 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 group-hover:scale-105 transition-transform duration-500"
             />
             <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 border border-surface-100">
               <BadgeCheck className="w-6 h-6 text-accent-600" />
             </div>
          </div>

          <div className="text-center md:text-left space-y-2">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
                {isAnggota ? profile?.anggota?.nama_lengkap : profile?.username}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[9px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
                  {formatRoleLabel(profile?.role || 'user')}
                </span>
                {isAnggota && (
                  <span className="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/20 text-emerald-100 text-[9px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
                    ID: {profile?.anggota?.no_anggota}
                  </span>
                )}
                <div className="hidden md:block w-px h-3 bg-white/20 mx-1" />
                <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-medium">
                  <Clock className="w-3 h-3" />
                  Gabung {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="ml-auto flex gap-3">
             <button 
              onClick={() => setGantiPassword(true)}
              className="h-12 px-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-xl"
             >
               <Key className="w-4 h-4" />
               Ganti Password
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── LEFT: Side Navigation & Quick Stats ── */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Navigation Card */}
          <div className="card p-4">
             <div className="space-y-1">
               {[
                 { id: 'info',      label: 'Informasi Akun',  icon: User,      desc: 'Data diri & keanggotan' },
                 { id: 'keamanan',  label: 'Keamanan Akses', icon: Shield,    desc: 'Password & Verifikasi' },
                 { id: 'aktivitas', label: 'Log Aktivitas',  icon: Activity,  desc: 'Riwayat transaksi & login' },
               ].map(tab => (
                 <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 group",
                    activeTab === tab.id 
                      ? "bg-accent-600 text-white shadow-lg shadow-accent-600/20 scale-[1.02]" 
                      : "text-ink-600 hover:bg-surface-50"
                  )}
                 >
                   <div className={cn(
                     "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                     activeTab === tab.id ? "bg-white/20" : "bg-surface-100 group-hover:bg-accent-50"
                   )}>
                     <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-white" : "text-ink-400 group-hover:text-accent-600")} />
                   </div>
                   <div className="text-left flex-1">
                     <p className="text-xs font-bold tracking-tight leading-none mb-1">{tab.label}</p>
                     <p className={cn("text-[9px] font-medium", activeTab === tab.id ? "text-white/60" : "text-ink-300")}>
                       {tab.desc}
                     </p>
                   </div>
                   <ChevronRight className={cn("w-4 h-4", activeTab === tab.id ? "opacity-100" : "opacity-0")} />
                 </button>
               ))}
             </div>
          </div>

          {/* Quick Member Stats (If applicable) */}
          {isAnggota && (
            <div className="grid grid-cols-1 gap-4">
               <div className="card p-5 border-l-4 border-l-emerald-500 overflow-hidden relative group">
                  <Wallet className="absolute -right-4 -top-4 w-24 h-24 text-emerald-500/5 group-hover:scale-125 transition-transform duration-700" />
                  <p className="text-[9px] font-bold text-ink-300 uppercase tracking-widest mb-1.5">Total Simpanan</p>
                  <p className="text-xl font-bold text-ink-900 tracking-tight">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(profile?.anggota?.total_simpanan || 0)}
                  </p>
                  <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-emerald-600">
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    Bisa ditarik kapan saja
                  </div>
               </div>

               <div className="card p-5 border-l-4 border-l-amber-500 overflow-hidden relative group">
                  <CreditCard className="absolute -right-4 -top-4 w-24 h-24 text-amber-500/5 group-hover:scale-125 transition-transform duration-700" />
                  <p className="text-[9px] font-bold text-ink-300 uppercase tracking-widest mb-1.5">Pinjaman Aktif</p>
                  <p className="text-xl font-bold text-ink-900 tracking-tight">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(profile?.anggota?.total_pinjaman_aktif || 0)}
                  </p>
                  <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-amber-600">
                    <Clock className="w-3.5 h-3.5" />
                    {profile?.anggota?.total_pinjaman_aktif ? 'Menunggu cicilan' : 'Tidak ada tagihan'}
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Main Content ── */}
        <div className="lg:col-span-8">
           
           {activeTab === 'info' && (
             <div className="space-y-6">
                
                {/* Independent Application Banner (If Member) */}
                {isAnggota && (
                  <div className="card p-8 bg-surface-900 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent-600/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    <div className="relative flex flex-col md:flex-row items-center gap-8">
                      <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-accent-600/20 text-accent-400 border border-accent-600/20 text-[9px] font-bold uppercase tracking-wider">
                           <Zap className="w-3 h-3 fill-accent-400" /> Fitur Mandiri
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight leading-none italic">Butuh Dana Mendesak?</h2>
                        <p className="text-ink-400 text-xs font-medium leading-relaxed">
                          Sekarang Anda bisa mengajukan pinjaman langsung dari akun Anda tanpa berkas fisik. 
                        </p>
                        <button 
                          onClick={() => setShowLoanForm(true)}
                          className="h-10 px-6 rounded-xl bg-white text-ink-950 text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-white/10 hover:-translate-y-1 active:scale-95 transition-all duration-300"
                        >
                          Ajukan Pinjaman Sekarang
                        </button>
                      </div>
                      <div className="w-48 h-48 rounded-[2.5rem] bg-white/5 border border-white/5 p-6 backdrop-blur-2xl flex items-center justify-center rotate-3 -mr-12 animate-float">
                        <FilePlus className="w-16 h-16 text-white/20" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Pinjaman Mandiri */}
                {showLoanForm && isAnggota && (
                  <FormPinjaman 
                    initialAnggota={profile.anggota as any}
                    onClose={() => setShowLoanForm(false)}
                    onSuccess={(result) => {
                      setShowLoanForm(false)
                      setToast({ type: 'success', message: `Pengajuan pinjaman ${result.no_pinjaman} berhasil dikirim!` })
                      fetchData() // Refresh stats
                    }}
                  />
                )}

                <div className="card p-0 overflow-hidden divide-y divide-surface-100">
                   <div className="px-8 py-6">
                      <p className="text-[10px] font-black text-ink-300 uppercase tracking-[0.2em] mb-1">Informasi Personal</p>
                      <h3 className="text-xl font-black text-ink-900 tracking-tight">Detail Data Akun</h3>
                   </div>
                   
                   <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-ink-300 uppercase tracking-widest ml-1">Username / Email</label>
                              <div className="h-14 px-5 rounded-2xl bg-surface-50 border border-surface-200 flex items-center text-sm font-bold text-ink-800">
                                <Mail className="w-4 h-4 mr-3 text-ink-200" /> {profile?.username}
                              </div>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-ink-300 uppercase tracking-widest ml-1">Jabatan Sistem</label>
                              <div className="h-14 px-5 rounded-2xl bg-surface-50 border border-surface-200 flex items-center text-sm font-bold text-ink-800">
                                <Shield className="w-4 h-4 mr-3 text-ink-200" /> {formatRoleLabel(profile?.role || 'user')}
                              </div>
                           </div>
                        </div>
                        
                        <div className="space-y-6">
                           {isAnggota ? (
                             <>
                               <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-ink-300 uppercase tracking-widest ml-1">Nama Lengkap Anggota</label>
                                  <div className="h-14 px-5 rounded-2xl bg-surface-50 border border-surface-200 flex items-center text-sm font-bold text-ink-800">
                                    <User className="w-4 h-4 mr-3 text-ink-200" /> {profile?.anggota?.nama_lengkap}
                                  </div>
                               </div>
                               <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-ink-300 uppercase tracking-widest ml-1">Nomor Telepon</label>
                                  <div className="h-14 px-5 rounded-2xl bg-surface-50 border border-surface-200 flex items-center text-sm font-bold text-ink-800">
                                    <Phone className="w-4 h-4 mr-3 text-ink-200" /> {profile?.anggota?.no_telepon || '—'}
                                  </div>
                               </div>
                             </>
                           ) : (
                             <div className="h-full rounded-2xl border-2 border-dashed border-surface-200 flex flex-col items-center justify-center p-8 text-center gap-4">
                               <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center">
                                 <AlertCircle className="w-6 h-6 text-ink-200" />
                               </div>
                               <div>
                                 <p className="text-xs font-black text-ink-800 tracking-tight">Akun Non-Anggota</p>
                                 <p className="text-[10px] text-ink-300 font-medium leading-relaxed max-w-[140px]">
                                   Anda adalah user administrator murni tanpa status keanggotaan koperasi.
                                 </p>
                               </div>
                             </div>
                           )}
                        </div>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'keamanan' && (
             <div className="card p-8 space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                      <ShieldCheck className="w-8 h-8" />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-ink-900 tracking-tight leading-none">Keamanan Akun</h2>
                      <p className="text-[10px] font-bold text-ink-300 uppercase tracking-widest mt-1.5">Lindungi privasi dan data finansial Anda</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-6 rounded-3xl border-2 border-surface-100 bg-white hover:border-accent-200 transition-all group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-xl bg-surface-50 flex items-center justify-center group-hover:bg-accent-600 group-hover:text-white transition-all">
                           <Key className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Aktif</span>
                      </div>
                      <h4 className="text-sm font-black text-ink-900 mb-1">Kata Sandi (Password)</h4>
                      <p className="text-[10px] text-ink-300 font-medium leading-relaxed mb-6">
                        Gunakan kombinasi simbol, angka, dan huruf untuk keamanan maksimal.
                      </p>
                      <button 
                        onClick={() => setGantiPassword(true)}
                        className="w-full h-10 rounded-xl bg-ink-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-accent-600 transition-all shadow-lg shadow-ink-950/20"
                      >
                        Ubah Password
                      </button>
                   </div>

                   <div className="p-6 rounded-3xl border-2 border-surface-100 bg-white opacity-50 cursor-not-allowed">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-xl bg-surface-50 flex items-center justify-center">
                           <Settings2 className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-ink-300 uppercase tracking-widest">Segera</span>
                      </div>
                      <h4 className="text-sm font-black text-ink-900 mb-1">Verifikasi Dua Langkah</h4>
                      <p className="text-[10px] text-ink-300 font-medium leading-relaxed">
                        Fitur keamanan tambahan sedang dikembangkan untuk melindungi akun Anda lebih jauh.
                      </p>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'aktivitas' && (
             <div className="card p-0 flex flex-col items-center justify-center py-24 gap-4 animate-in slide-in-from-right-4 duration-500">
                <div className="w-16 h-16 rounded-[2rem] bg-surface-50 flex items-center justify-center">
                   <Clock className="w-8 h-8 text-ink-200" />
                </div>
                <div className="text-center">
                   <h3 className="text-sm font-black text-ink-800 tracking-tight">Belum Ada Riwayat</h3>
                   <p className="text-[10px] text-ink-300 font-medium max-w-[200px] mt-1 leading-relaxed">
                     Semua aksi penting yang Anda lakukan akan tercatat rapi di sini sebagai bagian dari audit sistem.
                   </p>
                </div>
             </div>
           )}

        </div>
      </div>
    </div>
  )
}
