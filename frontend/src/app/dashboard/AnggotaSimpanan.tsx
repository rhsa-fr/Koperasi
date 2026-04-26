'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/axios'
import { Wallet, ArrowDownCircle, ArrowUpCircle, ReceiptText, Clock, FileText } from 'lucide-react'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

export default function AnggotaSimpanan({ user }: { user: any }) {
  const [loading, setLoading] = useState(true)
  const [simpananData, setSimpananData] = useState<any[]>([])
  const [saldo, setSaldo] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<any>('/auth/me')
      if (res.anggota) {
        setProfile(res.anggota)
        // Fetch Saldo List
        const saldoRes = await api.get<any[]>(`/simpanan/saldo/${res.anggota.id_anggota}`)
        setSaldo(saldoRes)
        
        // Fetch Transaction History
        const transRes = await api.get<any>(`/simpanan?id_anggota=${res.anggota.id_anggota}&limit=20`)
        setSimpananData(transRes.data)
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
         <div className="h-20 bg-slate-100 rounded-2xl w-full" />
         <div className="h-40 bg-slate-100 rounded-2xl w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Header Info */}
      <div className="card p-6 bg-emerald-500 text-white rounded-3xl border-none shadow-xl shadow-emerald-500/20">
         <div className="flex items-center gap-3 mb-4 opacity-90">
           <Wallet className="w-5 h-5" />
           <p className="text-sm font-bold uppercase tracking-widest">Dompet Simpanan</p>
         </div>
         <p className="text-[10px] font-medium uppercase tracking-widest opacity-80 mb-1">Total Saldo Aktivitas</p>
         <h2 className="text-3xl font-extrabold tracking-tight">
           {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
             .format(saldo.reduce((acc, curr) => acc + curr.saldo, 0))}
         </h2>
      </div>

      {/* Rincian Saldo */}
      <div className="space-y-3">
         <h3 className="text-xs font-bold text-ink-400 uppercase tracking-widest ml-1">Rincian per Simpanan</h3>
         {saldo.map((item, idx) => (
           <div key={idx} className="bg-white p-4 rounded-2xl border border-surface-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-ink-900">{item.nama_jenis_simpanan}</p>
                <p className="text-[10px] text-ink-400 font-medium">{item.is_wajib ? 'Wajib Dibayar' : 'Sukarela'}</p>
              </div>
              <p className="text-base font-extrabold text-emerald-600">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.saldo)}
              </p>
           </div>
         ))}
      </div>

      {/* Riwayat Transaksi */}
      <div className="space-y-3 pt-2">
         <h3 className="text-xs font-bold text-ink-400 uppercase tracking-widest ml-1 flex items-center gap-2">
           <Clock className="w-4 h-4" /> Riwayat Transaksi Terbaru
         </h3>
         
         <div className="bg-white rounded-3xl p-2 border border-surface-200">
           {simpananData.length === 0 ? (
             <div className="p-8 text-center text-ink-400">
               <FileText className="w-8 h-8 opacity-20 mx-auto mb-2" />
               <p className="text-xs font-medium">Belum ada transaksi</p>
             </div>
           ) : (
             <div className="divide-y divide-surface-100">
               {simpananData.map(trx => {
                 const isSetor = trx.tipe_transaksi === 'setor'
                 return (
                   <div key={trx.id_simpanan} className="p-4 flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                        isSetor ? "bg-emerald-50 text-emerald-500 border border-emerald-100" : "bg-red-50 text-red-500 border border-red-100"
                      )}>
                        {isSetor ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start mb-0.5">
                           <p className="text-sm font-bold text-ink-900 truncate pr-2">{trx.nama_jenis_simpanan}</p>
                           <p className={cn(
                             "text-sm font-extrabold whitespace-nowrap",
                             isSetor ? "text-emerald-500" : "text-red-500"
                           )}>
                             {isSetor ? '+' : '-'}{new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(trx.nominal)}
                           </p>
                         </div>
                         <div className="flex justify-between items-center text-[10px] text-ink-400 font-medium">
                           <p>{new Date(trx.tanggal_transaksi).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
                           <p className="font-bold text-ink-300">TRX-{trx.no_transaksi.split('-').pop()}</p>
                         </div>
                      </div>
                   </div>
                 )
               })}
             </div>
           )}
         </div>
      </div>
      
    </div>
  )
}
