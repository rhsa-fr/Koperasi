'use client'

import { useState, useEffect } from 'react'
import { 
  X, FileText, CheckCircle2, XCircle, Clock, AlertCircle, 
  User, CreditCard, Calendar, Info, Eye, Download, ChevronDown
} from 'lucide-react'
import { api } from '@/lib/axios'
import { cn, getFileUrl, openSafeFile, base64ToBlobUrl, isPdf, isImage } from '@/lib/utils'
import { Pinjaman, formatRupiah, SyaratChecklistResponse } from './types'

interface Props {
  pinjaman: Pinjaman
  onClose: () => void
  onRevise?: () => void
}

export default function ModalDetailPinjaman({ pinjaman, onClose, onRevise }: Props) {
  const [checklist, setChecklist] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'pdf' | 'img' | null>(null)

  useEffect(() => {
    setLoading(true)
    api.get<SyaratChecklistResponse>(`/syarat-peminjaman/pinjaman/${pinjaman.id_pinjaman}/checklist`)
      .then(res => setChecklist(res.detail_syarat))
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [pinjaman.id_pinjaman])

  const st = pinjaman.status.toLowerCase()
  const isApprove = st === 'disetujui' || st === 'lunas'
  const isReject = st === 'ditolak'
  const isRevision = st === 'dikembalikan'
  const isPending = st === 'pending' || st === 'menunggu'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm p-4 flex items-center justify-center z-[60] py-8">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-base font-black text-ink-800 tracking-tight">Detail Pinjaman</h2>
            <p className="text-[10px] text-ink-300 font-bold uppercase tracking-widest">{pinjaman.no_pinjaman}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-ink-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Status Banner */}
          <div className={cn(
            "p-4 rounded-2xl border flex items-start gap-3",
            isApprove ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
            isReject  ? "bg-red-50 border-red-100 text-red-800" :
            isRevision ? "bg-indigo-50 border-indigo-100 text-indigo-800" :
            "bg-amber-50 border-amber-100 text-amber-800"
          )}>
            {isApprove ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> :
             isReject ? <XCircle className="w-5 h-5 mt-0.5" /> :
             <Clock className="w-5 h-5 mt-0.5" />}
            
            <div className="flex-1">
              <p className="text-sm font-black uppercase tracking-tight leading-tight">
                Status: {pinjaman.status.toUpperCase()}
              </p>
              {pinjaman.catatan_persetujuan && (
                <div className="mt-2 p-3 bg-white/50 rounded-xl border border-current/10">
                  <p className="text-[10px] font-bold opacity-60 uppercase mb-1">Catatan Admin/Ketua:</p>
                  <p className="text-xs italic leading-relaxed">"{pinjaman.catatan_persetujuan}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Grid Info Utama */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="bg-surface-50 p-4 rounded-2xl border border-surface-200">
                <p className="text-[10px] font-bold text-ink-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Anggota
                </p>
                <p className="text-sm font-bold text-ink-800">{pinjaman.nama_anggota}</p>
                <p className="text-[10px] text-ink-400">{pinjaman.no_pinjaman}</p>
              </div>
              
              <div className="bg-surface-50 p-4 rounded-2xl border border-surface-200">
                <p className="text-[10px] font-bold text-ink-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Tanggal Pengajuan
                </p>
                <p className="text-sm font-bold text-ink-800">{pinjaman.tanggal_pengajuan}</p>
              </div>
            </div>

            <div className="bg-ink-900 p-4 rounded-2xl text-white flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1">Nominal Pinjaman</p>
                  <p className="text-2xl font-black">{formatRupiah(pinjaman.nominal_pinjaman)}</p>
                </div>
                <CreditCard className="w-6 h-6 text-ink-600" />
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] font-bold text-ink-400 uppercase">Tenor</p>
                  <p className="text-xs font-bold">{pinjaman.lama_angsuran} Bln</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-ink-400 uppercase">Bunga</p>
                  <p className="text-xs font-bold">{pinjaman.bunga_persen}%</p>
                </div>
                <div className="col-span-2 mt-2">
                  <p className="text-[9px] font-bold text-ink-400 uppercase">Angsuran/Bln</p>
                  <p className="text-sm font-bold text-emerald-400">{formatRupiah(pinjaman.nominal_angsuran)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Keperluan */}
          <div className="bg-surface-50 p-4 rounded-2xl border border-surface-200">
            <p className="text-[10px] font-bold text-ink-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Info className="w-3 h-3" /> Keperluan Pinjaman
            </p>
            <p className="text-sm text-ink-700 leading-relaxed">{pinjaman.keperluan || '—'}</p>
          </div>

          {pinjaman.history && pinjaman.history.length > 0 && (
            <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> Riwayat Catatan
              </h3>
              
              {(() => {
                const sortedHistory = [...pinjaman.history].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                const lastEntry = sortedHistory[sortedHistory.length - 1]
                const olderEntries = sortedHistory.slice(0, -1)
                
                return (
                  <div className="space-y-3">
                    {/* Catatan Terakhir - Prominent Message Bubble */}
                    {lastEntry && (
                      <div className={cn(
                        "relative p-5 rounded-2xl border border-surface-200/80 shadow-lg shadow-surface-300/20 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-surface-300/30 flex gap-4 overflow-hidden",
                        lastEntry.status === 'dikembalikan' ? "border-l-4 border-l-red-500" :
                        lastEntry.status === 'disetujui' || lastEntry.status === 'lunas' ? "border-l-4 border-l-emerald-500" :
                        lastEntry.status === 'ditolak' ? "border-l-4 border-l-rose-500" :
                        "border-l-4 border-l-amber-500"
                      )}>
                        {/* Background Glow Effect */}
                        <div className={cn(
                          "absolute inset-0 opacity-[0.03] pointer-events-none",
                          lastEntry.status === 'dikembalikan' ? "bg-red-500" :
                          lastEntry.status === 'disetujui' || lastEntry.status === 'lunas' ? "bg-emerald-500" :
                          lastEntry.status === 'ditolak' ? "bg-rose-500" :
                          "bg-amber-500"
                        )} />

                        {/* Avatar */}
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md",
                          lastEntry.status === 'dikembalikan' ? "bg-gradient-to-br from-red-500 to-rose-600" :
                          lastEntry.status === 'disetujui' || lastEntry.status === 'lunas' ? "bg-gradient-to-br from-emerald-500 to-teal-600" :
                          lastEntry.status === 'ditolak' ? "bg-gradient-to-br from-rose-505 to-pink-600" :
                          "bg-gradient-to-br from-amber-500 to-yellow-600"
                        )}>
                          {lastEntry.username ? lastEntry.username.slice(0, 2).toUpperCase() : 'US'}
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-ink-800 tracking-tight">{lastEntry.username || 'System'}</span>
                              <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-surface-100 text-ink-400 border border-surface-200">
                                {lastEntry.role || 'user'}
                              </span>
                            </div>
                            <span className="text-[10px] font-medium text-ink-400">
                              {new Date(lastEntry.created_at).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })} • {new Date(lastEntry.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}
                            </span>
                          </div>

                          {/* Message text bubble */}
                          <div className={cn(
                            "p-3 rounded-2xl text-xs leading-relaxed font-semibold relative after:absolute after:top-3 after:-left-2 after:w-0 after:h-0 after:border-t-8 after:border-t-transparent after:border-b-8 after:border-b-transparent",
                            lastEntry.status === 'dikembalikan' ? "bg-red-50/60 text-red-950 border border-red-100 after:border-r-8 after:border-r-red-50/60" :
                            lastEntry.status === 'disetujui' || lastEntry.status === 'lunas' ? "bg-emerald-50/60 text-emerald-950 border border-emerald-100 after:border-r-8 after:border-r-emerald-50/60" :
                            lastEntry.status === 'ditolak' ? "bg-rose-50/60 text-rose-950 border border-rose-100 after:border-r-8 after:border-r-rose-50/60" :
                            "bg-amber-50/60 text-amber-950 border border-amber-100 after:border-r-8 after:border-r-amber-50/60"
                          )}>
                            {/* Status indicator bubble inside */}
                            <div className="mb-1.5 flex items-center gap-1.5">
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                lastEntry.status === 'dikembalikan' ? "bg-red-500" :
                                lastEntry.status === 'disetujui' || lastEntry.status === 'lunas' ? "bg-emerald-500" :
                                lastEntry.status === 'ditolak' ? "bg-rose-500" :
                                "bg-amber-500"
                              )} />
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-wider",
                                lastEntry.status === 'dikembalikan' ? "text-red-700" :
                                lastEntry.status === 'disetujui' || lastEntry.status === 'lunas' ? "text-emerald-700" :
                                lastEntry.status === 'ditolak' ? "text-rose-700" :
                                "text-amber-700"
                              )}>
                                {lastEntry.status === 'dikembalikan' ? '⚠️ Perlu Revisi' : lastEntry.status}
                              </span>
                            </div>
                            "{lastEntry.catatan || 'Tidak ada catatan tambahan'}"
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Catatan Sebelumnya - Collapsed */}
                    {olderEntries.length > 0 && (
                      <details className="group">
                        <summary className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5 outline-none select-none py-1">
                          <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform text-indigo-500" />
                          Lihat riwayat sebelumnya ({olderEntries.length})
                        </summary>
                        <div className="mt-4 space-y-4 pl-4 border-l-2 border-dashed border-surface-200/80 max-h-[220px] overflow-y-auto custom-scrollbar pt-2 pr-1">
                          {olderEntries.reverse().map(entry => (
                            <div
                              key={entry.id_history}
                              className="flex gap-3 items-start relative group/item"
                            >
                              {/* Circle connection on timeline */}
                              <div className="absolute -left-[21px] top-3.5 w-2 h-2 rounded-full bg-white border-2 border-surface-300 group-hover/item:border-indigo-500 transition-colors" />

                              {/* Mini Avatar */}
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-surface-200 to-surface-300 text-[10px] font-black text-ink-600 flex items-center justify-center shrink-0 shadow-sm">
                                {entry.username ? entry.username.slice(0, 2).toUpperCase() : 'US'}
                              </div>

                              <div className="flex-1 space-y-1.5">
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-black text-ink-700">{entry.username || 'System'}</span>
                                    <span className="text-[9px] text-ink-400">({entry.role || 'user'})</span>
                                  </div>
                                  <span className="text-[9px] text-ink-400 font-medium">
                                    {new Date(entry.created_at).toLocaleDateString('id-ID')} {new Date(entry.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}
                                  </span>
                                </div>
                                <div className="p-3 rounded-2xl bg-white border border-surface-200 shadow-sm text-[11px] text-ink-600 leading-relaxed font-medium relative after:absolute after:top-2.5 after:-left-1.5 after:w-0 after:h-0 after:border-t-6 after:border-t-transparent after:border-r-6 after:border-r-white after:border-b-6 after:border-b-transparent">
                                  <div className="mb-1 flex items-center gap-1">
                                    <span className={cn(
                                      "w-1 h-1 rounded-full",
                                      entry.status === 'dikembalikan' ? "bg-red-500" :
                                      entry.status === 'disetujui' || entry.status === 'lunas' ? "bg-emerald-500" :
                                      entry.status === 'ditolak' ? "bg-rose-500" :
                                      "bg-amber-500"
                                    )} />
                                    <span className="text-[8px] font-bold uppercase tracking-wider text-ink-400">{entry.status}</span>
                                  </div>
                                  "{entry.catatan || 'Tidak ada catatan tambahan'}"
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Dokumen Syarat */}
          <section className="space-y-3">
             <h3 className="text-xs font-bold text-ink-800 uppercase tracking-widest flex items-center gap-2">
               <FileText className="w-4 h-4" /> Dokumen Persyaratan
             </h3>
             {loading ? (
               <div className="space-y-2 animate-pulse">
                 <div className="h-12 bg-surface-100 rounded-xl w-full" />
                 <div className="h-12 bg-surface-100 rounded-xl w-full" />
               </div>
             ) : checklist.length === 0 ? (
               <p className="text-xs text-ink-300 italic">Tidak ada dokumen persyaratan.</p>
             ) : (
               <div className="grid grid-cols-1 gap-2">
                  {checklist.map(item => (
                    <div key={item.id_pinjaman_syarat} className="flex items-center justify-between p-3 rounded-2xl border border-surface-200 bg-white hover:border-ink-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          item.dokumen_path ? "bg-emerald-50 text-emerald-600" : "bg-surface-100 text-ink-200"
                        )}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-ink-800">{item.nama_syarat || item.syarat?.nama_syarat}</p>
                          <p className="text-[10px] text-ink-400">{item.dokumen_path ? 'Dokumen terunggah' : 'Belum diunggah'}</p>
                        </div>
                      </div>
                      {item.dokumen_path && (
                        <button 
                          onClick={() => {
                            const url = base64ToBlobUrl(item.dokumen_path)
                            setPreviewUrl(url)
                            setPreviewType(isPdf(item.dokumen_path) ? 'pdf' : isImage(item.dokumen_path) ? 'img' : null)
                          }}
                          className="p-2 text-ink-400 hover:text-ink-900 hover:bg-surface-100 rounded-lg transition-all"
                          title="Lihat Dokumen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
               </div>
             )}

             {/* Inline Preview Container */}
             {previewUrl && previewType && (
               <div className="mt-4 p-4 border border-surface-200 rounded-2xl bg-surface-50 relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">Preview Dokumen</span>
                   <button
                     onClick={() => {
                       setPreviewUrl(null)
                       setPreviewType(null)
                     }}
                     className="p-1 hover:bg-surface-200 rounded-lg text-ink-500 hover:text-ink-800 transition-colors"
                     title="Tutup preview"
                   >
                     <X className="w-4 h-4" />
                   </button>
                 </div>
                 <div className="border border-surface-200 rounded-xl overflow-hidden bg-white flex items-center justify-center min-h-[300px]">
                   {previewType === 'pdf' ? (
                     <iframe src={previewUrl} className="w-full h-[400px] border-0" />
                   ) : (
                     <img src={previewUrl} alt="Preview dokumen" className="max-w-full max-h-[400px] object-contain" />
                   )}
                 </div>
               </div>
             )}
          </section>

        </div>

         {/* Footer */}
        <div className="px-6 py-4 bg-surface-50 border-t border-surface-200 flex justify-end gap-2.5">
          <button onClick={onClose} className="px-6 py-2 rounded-xl border border-surface-300 bg-white text-ink-600 text-sm font-bold hover:bg-surface-100 transition-colors">
            Tutup
          </button>
          {isRevision && onRevise && (
            <button 
              onClick={() => {
                onClose();
                onRevise();
              }}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              Revisi Pengajuan
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
