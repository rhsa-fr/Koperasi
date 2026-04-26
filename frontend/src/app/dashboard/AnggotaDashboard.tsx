'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, CreditCard, Clock, Activity, ArrowRight, Zap, FilePlus, ChevronRight, UserCircle, Bell, Megaphone } from 'lucide-react'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'
import Skeleton from '@/components/ui/Skeleton'
import FormPinjaman from './pinjaman/FormPinjaman'
import Toast, { ToastData } from '@/components/ui/Toast'

export default function AnggotaDashboard({ user }: { user: any }) {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<any>('/auth/me')
      if (res.anggota) {
        const detail = await api.get<any>(`/anggota/${res.anggota.id_anggota}/detail`)
        setProfile({
          ...res.anggota,
          ...detail
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 w-full bg-slate-200 rounded-3xl" />
        <div className="flex gap-4 px-2">
           <div className="h-20 w-1/4 bg-slate-100 rounded-2xl" />
           <div className="h-20 w-1/4 bg-slate-100 rounded-2xl" />
           <div className="h-20 w-1/4 bg-slate-100 rounded-2xl" />
           <div className="h-20 w-1/4 bg-slate-100 rounded-2xl" />
        </div>
        <div className="h-32 w-full bg-slate-100 rounded-3xl" />
      </div>
    )
  }

  const activeLoanVal = profile?.total_pinjaman_aktif || 0
  const pendingLoanVal = profile?.total_pinjaman_pending || 0
  const hasActiveLoan = activeLoanVal > 0 || pendingLoanVal > 0

  return (
    <div className="animate-fade-in relative pb-10 lg:max-w-5xl lg:mx-auto">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      {showLoanForm && profile && (
        <FormPinjaman 
          initialAnggota={profile}
          isMobile={true}
          onClose={() => setShowLoanForm(false)}
          onSuccess={(result) => {
            setShowLoanForm(false)
            setToast({ type: 'success', message: `Pengajuan pinjaman ${result.no_pinjaman} berhasil dikirim!` })
            fetchData() // Refresh stats
          }}
        />
      )}
      
      {/* 1. Wallet Card (E-Wallet Aesthetic) */}
      <div className="relative z-10 w-full mb-12 mt-2">
         <div className="w-full bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 rounded-[28px] p-6 pb-20 text-white shadow-2xl shadow-indigo-900/30 overflow-hidden relative">
            {/* Dekorasi Neumorphic Card */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none" />
            
            {/* Header Dompet */}
            <div className="flex items-center justify-between mb-6 relative z-10">
               <div>
                  <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-bold mb-0.5">Saldo Simpanan</p>
                  <p className="text-xs font-medium text-white/50">{profile?.no_anggota}</p>
               </div>
               <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                  <Wallet className="w-4 h-4 text-white" />
               </div>
            </div>

            {/* Saldo Angka */}
            <div className="relative z-10">
               <div className="flex items-start gap-1.5 mb-2">
                  <span className="text-sm font-bold text-indigo-200 mt-1">Rp</span>
                  <span className="text-[2.5rem] leading-none font-black tracking-tight">
                    {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(profile?.total_simpanan || 0)}
                  </span>
               </div>
               <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] text-emerald-300 font-bold tracking-widest mt-1">
                  ★ SALDO TERSIMPAN
               </div>
            </div>
         </div>
         
         {/* 2. Overlapping Quick Actions */}
         <div className="absolute -bottom-8 left-0 right-0 px-5 z-20">
            <div className="bg-white rounded-[24px] p-4 shadow-xl shadow-surface-200/60 flex justify-between items-center sm:px-6">
               <button onClick={() => router.push('/dashboard/simpanan')} className="flex flex-col items-center gap-1.5 w-16 group">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all transform group-active:scale-95">
                     <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-ink-600">Top Up</span>
               </button>
               <button onClick={() => router.push('/dashboard/pinjaman')} className="flex flex-col items-center gap-1.5 w-16 group">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all transform group-active:scale-95">
                     <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-ink-600">Tagihan</span>
               </button>
               <button onClick={() => setShowLoanForm(true)} className="flex flex-col items-center gap-1.5 w-16 group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all transform group-active:scale-95">
                     <FilePlus className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-ink-600">Ajukan</span>
               </button>
               <button onClick={() => router.push('/dashboard/profile')} className="flex flex-col items-center gap-1.5 w-16 group">
                  <div className="w-10 h-10 rounded-xl bg-surface-100 text-ink-400 flex items-center justify-center group-hover:bg-ink-100 group-hover:text-ink-600 transition-all transform group-active:scale-95">
                     <UserCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-ink-600">Lainnya</span>
               </button>
            </div>
         </div>
      </div>

      {/* Spacing from overlapping elements */}
      <div className="h-4" />

      {/* 3. Dynamic Loan Widget (Menyatu dgn UI) */}
      <h3 className="text-xs font-black text-ink-900 uppercase tracking-widest pl-1 mb-3">Pusat Tagihan</h3>
      {hasActiveLoan ? (
        <div 
          onClick={() => router.push('/dashboard/pinjaman')}
          className={cn(
            "rounded-3xl p-5 relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer shadow-sm border",
            pendingLoanVal > 0 && activeLoanVal === 0 
              ? "bg-blue-50 border-blue-200" 
              : "bg-amber-50 border-amber-200"
          )}
        >
           <div className="absolute top-0 right-0 p-4 opacity-10">
             {pendingLoanVal > 0 && activeLoanVal === 0 
               ? <Clock className="w-24 h-24 text-blue-600 -mr-6 -mt-6" />
               : <CreditCard className="w-24 h-24 text-amber-600 -mr-6 -mt-6" />
             }
           </div>
           <div className="flex items-start gap-4 mb-3 relative z-10">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0",
                pendingLoanVal > 0 && activeLoanVal === 0 
                  ? "bg-blue-500 shadow-blue-500/30" 
                  : "bg-amber-500 shadow-amber-500/30"
              )}>
                 {pendingLoanVal > 0 && activeLoanVal === 0 ? <Clock className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                 <p className={cn(
                   "text-xs font-bold mb-0.5",
                   pendingLoanVal > 0 && activeLoanVal === 0 ? "text-blue-800" : "text-amber-800"
                 )}>
                   {pendingLoanVal > 0 && activeLoanVal === 0 ? "Pengajuan Sedang Diproses" : "Tagihan Pinjaman Anda"}
                 </p>
                 <p className={cn(
                   "text-[10px] font-medium leading-tight pr-4",
                   pendingLoanVal > 0 && activeLoanVal === 0 ? "text-blue-700/80" : "text-amber-700/80"
                 )}>
                   {pendingLoanVal > 0 && activeLoanVal === 0 
                     ? "Mohon tunggu verifikasi dari Ketua Koperasi untuk pencairan dana."
                     : "Pantau sisa pinjaman yang perlu lunas agar bebas hambatan."}
                 </p>
              </div>
           </div>
           <div className={cn(
             "rounded-2xl p-4 flex items-center justify-between border shadow-sm relative z-10",
             pendingLoanVal > 0 && activeLoanVal === 0 ? "bg-white border-blue-100" : "bg-white border-amber-100"
           )}>
              <div>
                 <p className="text-[10px] font-bold text-ink-300 uppercase tracking-widest mb-0.5">
                   {pendingLoanVal > 0 && activeLoanVal === 0 ? "Nominal Diajukan" : "Total Sisa"}
                 </p>
                 <p className="text-xl font-extrabold text-ink-900 tracking-tight">
                   {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
                     activeLoanVal > 0 ? activeLoanVal : pendingLoanVal
                   )}
                 </p>
              </div>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                pendingLoanVal > 0 && activeLoanVal === 0 ? "bg-blue-50 text-blue-500" : "bg-amber-50 text-amber-500"
              )}>
                 <ChevronRight className="w-4 h-4" />
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 relative overflow-hidden flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 flex-shrink-0 relative z-10">
              <Zap className="w-6 h-6" />
           </div>
           <div className="relative z-10">
              <p className="text-sm font-bold text-emerald-800 mb-0.5">Semua Lunas!</p>
              <p className="text-[10px] text-emerald-700/80 font-medium leading-tight pr-4">Saat ini Anda bebas dari cicilan pinjaman.</p>
           </div>
           <div className="absolute right-0 bottom-0 p-4 opacity-[0.03]">
             <CreditCard className="w-32 h-32 text-emerald-900 -mr-8 -mb-8" />
           </div>
        </div>
      )}

      {/* 4. Banner Promo / Informasi */}
      <h3 className="text-xs font-black text-ink-900 uppercase tracking-widest pl-1 mt-8 mb-3">Papan Informasi</h3>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-5 text-white flex items-center gap-5 relative overflow-hidden shadow-md">
         {/* Background Decor */}
         <div className="absolute -left-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl" />
         
         <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner z-10">
            <Megaphone className="w-6 h-6 text-white" />
         </div>
         <div className="z-10 pr-2">
            <p className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-1">Pengumuman</p>
            <p className="text-sm font-black leading-tight mb-1">Bagi Hasil SHU Akhir Tahun Segera Tiba!</p>
            <p className="text-[10px] text-blue-50/80 leading-relaxed font-medium">Tingkatkan terus simpanan dan aktivitas anda untuk mendapatkan benefit maksimal.</p>
         </div>
      </div>

    </div>
  )
}
