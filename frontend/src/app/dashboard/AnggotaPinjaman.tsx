'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/axios'
import { CreditCard, Clock, Activity, FileText, ChevronRight, CheckCircle2, FilePlus, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import FormPinjaman from './pinjaman/FormPinjaman'
import ModalDetailPinjaman from './pinjaman/ModalDetailPinjaman'
import Toast, { ToastData } from '@/components/ui/Toast'
import { Pinjaman } from './pinjaman/types'

export default function AnggotaPinjaman({ user }: { user: any }) {
  const [loading, setLoading] = useState(true)
  const [pinjamanData, setPinjamanData] = useState<Pinjaman[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Pinjaman | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [selectedPinjaman, setSelectedPinjaman] = useState<Pinjaman | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<any>('/auth/me')
      if (res.anggota) {
        setProfile(res.anggota)
        // Fetch Pinjaman History with paginated response
        const pinjRes = await api.get<any>(`/pinjaman?id_anggota=${res.anggota.id_anggota}&limit=10`)
        setPinjamanData(pinjRes.data?.data || pinjRes.data || [])
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
      <div className="space-y-4 animate-pulse">
         <div className="h-32 bg-slate-200 rounded-2xl w-full" />
         <div className="h-40 bg-slate-100 rounded-2xl w-full" />
      </div>
    )
  }

  const activeLoans = pinjamanData.filter(p => ['disetujui', 'aktif'].includes(p.status.toLowerCase()))

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      {showLoanForm && profile && (
        <FormPinjaman 
          initialAnggota={profile}
          initialData={editingLoan}
          isMobile={true}
          onClose={() => { setShowLoanForm(false); setEditingLoan(null); }}
          onSuccess={(result) => {
            setShowLoanForm(false)
            setEditingLoan(null)
            setToast({ type: 'success', message: editingLoan ? `Revisi ${result.no_pinjaman} berhasil dikirim!` : `Pengajuan pinjaman ${result.no_pinjaman} berhasil dikirim!` })
            fetchData()
          }}
        />
      )}
      
      {/* Header Info */}
      <div className="card p-6 bg-indigo-600 text-white rounded-3xl border-none shadow-xl shadow-indigo-600/20 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
         <div className="flex items-center gap-3 mb-4 opacity-90 relative z-10">
           <CreditCard className="w-5 h-5" />
           <p className="text-sm font-bold uppercase tracking-widest">Tagihan Aktif</p>
         </div>
         <h2 className="text-3xl font-extrabold tracking-tight relative z-10">
           {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
             .format(activeLoans.reduce((acc, curr) => acc + (curr.sisa_pinjaman || 0), 0))}
         </h2>
      </div>

      {/* Tombol Ajukan Pinjaman */}
      <button
        onClick={() => setShowLoanForm(true)}
        className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-2xl p-4 font-black tracking-tight transition-all active:scale-[0.98] shadow-sm"
      >
        <FilePlus className="w-5 h-5" /> Ajukan Pinjaman Baru
      </button>

      {/* Riwayat Pinjaman */}
      <div className="space-y-3 pt-2">
         <h3 className="text-xs font-bold text-ink-400 uppercase tracking-widest ml-1 flex items-center gap-2">
           <Activity className="w-4 h-4" /> Riwayat Pengajuan
         </h3>
         
         <div className="space-y-3">
           {pinjamanData.length === 0 ? (
             <div className="bg-white rounded-3xl p-8 border border-surface-200 text-center text-ink-400">
               <FileText className="w-8 h-8 opacity-20 mx-auto mb-2" />
               <p className="text-xs font-medium">Belum ada riwayat pinjaman</p>
             </div>
           ) : (
             pinjamanData.map(pinj => {
               const st = pinj.status.toLowerCase()
               const isApprove = st === 'disetujui' || st === 'lunas'
               const isPending = st === 'pending' || st === 'menunggu'
               
               return (
                 <div 
                   key={pinj.id_pinjaman} 
                   onClick={() => {
                     setSelectedPinjaman(pinj);
                     setShowDetail(true);
                   }}
                   className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm flex flex-col gap-3 hover:border-indigo-300 transition-all cursor-pointer hover:shadow-md"
                 >
                    <div className="flex items-center justify-between">
                       <span className={cn(
                         "text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider",
                         isApprove ? "bg-emerald-50 text-emerald-600" :
                          isPending ? "bg-amber-50 text-amber-600" : 
                          st === 'dikembalikan' ? "bg-indigo-50 text-indigo-600" :
                          "bg-red-50 text-red-600"
                       )}>
                         {pinj.status}
                       </span>
                       <span className="text-[10px] font-bold text-ink-300">{pinj.no_pinjaman}</span>
                    </div>
                    
                    <div className="flex items-end justify-between">
                       <div>
                          <p className="text-[10px] uppercase font-bold text-ink-400 mb-0.5">Plafon Pinjaman</p>
                          <p className="text-xl font-extrabold text-ink-900 leading-none">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(pinj.nominal_pinjaman)}
                          </p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-ink-400 mb-0.5">Tenor</p>
                          <p className="text-sm font-bold text-ink-700 leading-none">{pinj.lama_angsuran} Bulan</p>
                       </div>
                    </div>

                    {pinj.history && pinj.history.length > 0 && (
                      <div className="pt-3 border-t border-surface-100 text-[11px] text-ink-500 space-y-2">
                        <div className="font-bold text-ink-600 uppercase tracking-wider text-[10px]">Riwayat</div>
                        {(pinj.history ?? []).slice(-3).map((item, index) => (
                          <div key={item.id_history || index} className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-ink-700">{item.status}</span>
                              <span className="text-[10px] text-ink-400">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                            </div>
                            {item.username && (
                              <div className="text-[9px] text-ink-400 mt-0.5 font-medium">
                                Oleh: <span className="font-bold text-ink-600">{item.username}</span> ({item.role})
                              </div>
                            )}
                            {item.catatan ? (
                              <p className="text-[10px] text-ink-500 mt-1.5 italic">"{item.catatan}"</p>
                            ) : (
                              <p className="text-[10px] text-ink-400 mt-1.5">Tidak ada catatan</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {st === 'disetujui' && (
                      <div className="pt-3 mt-1 border-t border-surface-100 flex items-center justify-between">
                         <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-bold">
                           <Clock className="w-3.5 h-3.5" /> Sisa {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(pinj.sisa_pinjaman)}
                         </div>
                      </div>
                    )}

                    {st === 'dikembalikan' && (
                      <div className="pt-3 mt-1 border-t border-surface-100 flex flex-col gap-3">
                         <div className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                            <p className="text-[10px] font-bold text-indigo-700 mb-1 flex items-center gap-1">
                               <AlertCircle className="w-3 h-3" /> Catatan Revisi:
                            </p>
                            <p className="text-[11px] text-indigo-600 italic">"{pinj.catatan_persetujuan || 'Tidak ada catatan'}"</p>
                         </div>
                         <button
                           onClick={(e) => { e.stopPropagation(); setEditingLoan(pinj); setShowLoanForm(true); }}
                           className="w-full py-2 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"
                         >
                           Revisi Pengajuan
                         </button>
                      </div>
                    )}
                 </div>
               )
             })
           )}
         </div>
      </div>
      
      {showDetail && selectedPinjaman && (
         <ModalDetailPinjaman 
           pinjaman={selectedPinjaman}
           onClose={() => { setShowDetail(false); setSelectedPinjaman(null); }}
           onRevise={() => {
             setEditingLoan(selectedPinjaman);
             setShowLoanForm(true);
           }}
         />
       )}
    </div>
  )
}
