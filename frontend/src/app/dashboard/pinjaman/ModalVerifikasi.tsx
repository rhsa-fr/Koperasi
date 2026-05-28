'use client'

import { useState, useEffect } from 'react'
import {
  X, CheckCircle2, XCircle, Loader2,
  Calendar, FileText, ShieldCheck, ShieldX,
  Wallet, CreditCard, ArrowDownCircle, ArrowUpCircle,
  AlertCircle, ExternalLink, Clock, ChevronDown, Eye
} from 'lucide-react'
import { Pinjaman, PinjamanApprovePayload, PinjamanRejectPayload, formatRupiah } from './types'
import { cn, getFileUrl, isImage, isPdf, openSafeFile, base64ToBlobUrl } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

import { api } from '@/lib/axios'


// ============================================================================
// Types
// ============================================================================

interface SyaratDetail {
  id_pinjaman_syarat: number
  id_syarat: number
  is_terpenuhi: boolean
  dokumen_path: string | null
  catatan: string | null
  nama_syarat: string | null
  deskripsi_syarat: string | null
  dokumen_diperlukan: string | null
  syarat?: {
    is_wajib: boolean
    nama_syarat: string
    deskripsi: string | null
  }
}

interface ChecklistResponse {
  total_syarat: number
  syarat_terpenuhi: number
  syarat_belum_terpenuhi: number
  persentase_kelengkapan: number
  semua_syarat_wajib_terpenuhi: boolean
  detail_syarat: SyaratDetail[]
}

interface SaldoSimpanan {
  id_anggota: number
  nama_anggota: string
  id_jenis_simpanan: number
  nama_jenis_simpanan: string
  is_wajib: boolean
  total_setor: number
  total_tarik: number
  saldo: number
}

interface RiwayatTransaksi {
  id_simpanan: number
  no_transaksi: string
  tanggal_transaksi: string
  tipe_transaksi: 'setor' | 'tarik'
  nominal: number
  saldo_akhir: number
  keterangan?: string
  nama_jenis_simpanan?: string
}

interface RiwayatPinjaman {
  id_pinjaman: number
  no_pinjaman: string
  tanggal_pengajuan: string
  nominal_pinjaman: number
  total_pinjaman: number
  sisa_pinjaman: number
  status: string
  lama_angsuran: number
}

interface Props {
  pinjaman: Pinjaman
  onClose: () => void
  onSuccess: (updated: Pinjaman) => void
}

// ============================================================================
// ModalVerifikasi
// ============================================================================

export default function ModalVerifikasi({ pinjaman, onClose, onSuccess }: Props) {
  const { can } = useAuth()
  const [mode, setMode] = useState<'idle' | 'setuju' | 'tolak' | 'kembalikan'>('idle')
  const [catatan, setCatatan] = useState('')
  const [tanggalPersetujuan, setTanggalPersetujuan] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [tanggalPencairan, setTanggalPencairan] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Checklist syarat
  const [checklist, setChecklist]               = useState<ChecklistResponse | null>(null)
  const [loadingChecklist, setLoadingChecklist] = useState(true)
  const [togglingId, setTogglingId]             = useState<number | null>(null)
  
  // Saldo & Riwayat
  const [activeTab, setActiveTab]               = useState<'ringkasan' | 'syarat'>('ringkasan')
  const [saldoList, setSaldoList]               = useState<SaldoSimpanan[]>([])
  const [riwayatTransaksi, setRiwayatTransaksi] = useState<RiwayatTransaksi[]>([])
  const [riwayatPinjaman, setRiwayatPinjaman]   = useState<RiwayatPinjaman[]>([])
  const [loadingSaldo, setLoadingSaldo]         = useState(false)
  const [loadingRiwayat, setLoadingRiwayat]     = useState(false)

  // Pratinjau Dokumen
  const [activeDoc, setActiveDoc]               = useState<string | null>(null)
  const [selectedSyaratId, setSelectedSyaratId] = useState<number | null>(null)

  // Set default active doc jika ada
  useEffect(() => {
    if (activeTab === 'syarat' && checklist && !activeDoc) {
      const firstWithDoc = checklist.detail_syarat.find(d => d.dokumen_path)
      if (firstWithDoc) {
        setActiveDoc(firstWithDoc.dokumen_path)
        setSelectedSyaratId(firstWithDoc.id_pinjaman_syarat)
      }
    }
  }, [activeTab, checklist, activeDoc])


  // ── Fetch checklist saat modal dibuka ──────────────────────────────────────
  const fetchChecklist = async () => {
    setLoadingChecklist(true)
    try {
      const data = await api.get<ChecklistResponse>(
        `/syarat-peminjaman/pinjaman/${pinjaman.id_pinjaman}/checklist`
      )
      setChecklist(data)
    } catch {
      setChecklist(null)
    } finally {
      setLoadingChecklist(false)
    }
  }

  // ── Fetch Saldo Anggota ────────────────────────────────────────────────────
  const fetchSaldo = async () => {
    if (!pinjaman.id_anggota) return
    setLoadingSaldo(true)
    try {
      const data = await api.get<SaldoSimpanan[]>(
        `/simpanan/saldo/${pinjaman.id_anggota}`
      )
      setSaldoList(data)
    } catch {
      setSaldoList([])
    } finally {
      setLoadingSaldo(false)
    }
  }

  // ── Fetch Riwayat (Transaksi Simpanan & Riwayat Pinjaman) ─────────────────
  const fetchRiwayat = async () => {
    if (!pinjaman.id_anggota) return
    setLoadingRiwayat(true)
    try {
      const [transaksi, pinjamans] = await Promise.all([
        api.get<{ data: RiwayatTransaksi[] }>(`/simpanan?id_anggota=${pinjaman.id_anggota}&limit=10`),
        api.get<{ data: RiwayatPinjaman[] }>(`/pinjaman?id_anggota=${pinjaman.id_anggota}&limit=10`),
      ])
      setRiwayatTransaksi(transaksi.data)
      setRiwayatPinjaman(pinjamans.data)
    } catch {
      setRiwayatTransaksi([])
      setRiwayatPinjaman([])
    } finally {
      setLoadingRiwayat(false)
    }
  }

  // ── Fetch saldo dan riwayat saat modal dibuka ──────────────────────────
  useEffect(() => {
    fetchSaldo()
    fetchRiwayat()
    fetchChecklist()
  }, [pinjaman.id_pinjaman])

  // ── Lock body scroll ──────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  // ── Toggle checkbox syarat ─────────────────────────────────────────────────
  const handleToggleSyarat = async (idPinjamanSyarat: number, isTerpenuhi: boolean) => {
    setTogglingId(idPinjamanSyarat)
    try {
      await api.post(`/syarat-peminjaman/pinjaman-syarat/${idPinjamanSyarat}/verify`, {
        is_terpenuhi: isTerpenuhi,
        catatan: null,
      })
      // Refresh checklist setelah toggle
      await fetchChecklist()
    } catch {
      // silent — bisa tambah toast jika diperlukan
    } finally {
      setTogglingId(null)
    }
  }

  // ── Approve ────────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    setError(null)
    setLoading(true)
    if (!checklist?.semua_syarat_wajib_terpenuhi) {
      setError('Semua syarat wajib harus terpenuhi sebelum menyetujui pinjaman')
      setLoading(false)
      return
    }

    try {
      const payload: PinjamanApprovePayload = {
        tanggal_persetujuan: tanggalPersetujuan,
        tanggal_pencairan:   tanggalPencairan,
        catatan_persetujuan: catatan,
      }
      const result = await api.put<Pinjaman>(
        `/pinjaman/${pinjaman.id_pinjaman}/approve`,
        payload
      )
      onSuccess(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal menyetujui pinjaman')
    } finally {
      setLoading(false)
    }
  }

  // ── Reject ─────────────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!catatan.trim()) { setError('Alasan penolakan wajib diisi'); return }
    setError(null)
    setLoading(true)
    try {
      const payload: PinjamanRejectPayload = { catatan_persetujuan: catatan }
      const result = await api.put<Pinjaman>(
        `/pinjaman/${pinjaman.id_pinjaman}/reject`,
        payload
      )
      onSuccess(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal menolak pinjaman')
    } finally {
      setLoading(false)
    }
  }

  // ── Return ─────────────────────────────────────────────────────────────────
  const handleReturn = async () => {
    if (!catatan.trim()) { setError('Catatan revisi wajib diisi'); return }
    setError(null)
    setLoading(true)
    try {
      const payload: PinjamanRejectPayload = { catatan_persetujuan: catatan }
      const result = await api.put<Pinjaman>(
        `/pinjaman/${pinjaman.id_pinjaman}/return`,
        payload
      )
      onSuccess(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal mengembalikan pinjaman')
    } finally {
      setLoading(false)
    }
  }

  const persen = checklist ? Math.round(checklist.persentase_kelengkapan) : 0

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center py-8">
        <div className={cn(
          "bg-white rounded-2xl shadow-2xl w-full flex flex-col animate-fade-in relative transition-all duration-300",
          activeTab === 'syarat' && checklist && checklist.detail_syarat.some(d => d.dokumen_path) 
            ? "max-w-6xl" 
            : "max-w-xl"
        )}>


          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 shrink-0">
            <div>
              <h2 className="text-base font-semibold text-ink-800">Verifikasi Pinjaman</h2>
              <p className="text-xs text-ink-300 mt-0.5">{pinjaman.no_pinjaman}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-ink-400" />
            </button>
          </div>

          {/* ── Tab Navigation ─────────────────────────────────────────────── */}
          <div className="flex gap-1 px-6 pt-4 shrink-0">
            {(['ringkasan', 'syarat'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-semibold transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-gradient-premium text-white shadow-md'
                    : 'text-ink-500 hover:bg-surface-100'
                }`}
              >
                {tab === 'syarat' && checklist && (
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                    checklist.semua_syarat_wajib_terpenuhi
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {checklist.syarat_terpenuhi}
                  </span>
                )}
                {tab === 'ringkasan' ? 'Ringkasan' : 'Syarat'}
              </button>
            ))}
          </div>

          {/* ── Body ──────────────────────────────────────────────────────── */}
          <div className="px-6 py-4 space-y-4">

            {/* ════════════════════════════════ TAB: RINGKASAN ══════════════ */}
            {activeTab === 'ringkasan' && (
              <>
                {/* Info pinjaman */}
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-ink-800 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white">
                        {pinjaman.nama_anggota?.slice(0, 2).toUpperCase() ?? 'AN'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-800">{pinjaman.nama_anggota}</p>
                      <p className="text-xs text-ink-400">{pinjaman.keperluan}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-surface-200">
                    {[
                      { label: 'Nominal Pinjaman', val: formatRupiah(pinjaman.nominal_pinjaman) },
                      { label: 'Total + Bunga',    val: formatRupiah(pinjaman.total_pinjaman)   },
                      { label: 'Angsuran/Bulan',   val: formatRupiah(pinjaman.nominal_angsuran) },
                      { label: 'Lama Angsuran',    val: `${pinjaman.lama_angsuran} bulan`       },
                      { label: 'Bunga',            val: `${pinjaman.bunga_persen}% / bulan`     },
                      { label: 'Tgl. Pengajuan',   val: pinjaman.tanggal_pengajuan              },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-[10px] text-ink-300">{item.label}</p>
                        <p className="text-xs font-semibold text-ink-800">{item.val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Progress kelengkapan syarat */}
                  {checklist && (
                    <div className="pt-3 border-t border-surface-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] text-ink-400 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Kelengkapan Syarat
                        </p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-semibold text-ink-600">
                            {checklist.syarat_terpenuhi}/{checklist.total_syarat}
                          </p>
                          {checklist.semua_syarat_wajib_terpenuhi
                            ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            : <ShieldX    className="w-3.5 h-3.5 text-red-400" />
                          }
                        </div>
                      </div>
                      <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            checklist.semua_syarat_wajib_terpenuhi ? 'bg-emerald-500' : 'bg-amber-400'
                          }`}
                          style={{ width: `${persen}%` }}
                        />
                      </div>
                      {!checklist.semua_syarat_wajib_terpenuhi && (
                        <p className="text-[10px] text-amber-600 mt-1">
                          Ada syarat wajib yang belum dicentang. Lihat tab Syarat.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Riwayat Catatan & Revisi Pengajuan Ini */}
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
                                lastEntry.status === 'ditolak' ? "bg-gradient-to-br from-rose-500 to-pink-600" :
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

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-red-50 border border-red-100">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                {/* Mode: setuju */}
                {mode === 'setuju' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <p className="text-xs font-semibold text-emerald-700">Menyetujui Pengajuan Pinjaman</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-ink-600 mb-1.5">
                          <Calendar className="w-3 h-3 inline mr-1" />Tgl. Persetujuan
                        </label>
                        <input
                          type="date"
                          value={tanggalPersetujuan}
                          onChange={e => setTanggalPersetujuan(e.target.value)}
                          className="w-full h-9 px-3 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-600 mb-1.5">
                          <Calendar className="w-3 h-3 inline mr-1" />Tgl. Pencairan
                        </label>
                        <input
                          type="date"
                          value={tanggalPencairan}
                          onChange={e => setTanggalPencairan(e.target.value)}
                          className="w-full h-9 px-3 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink-600 mb-1.5">Catatan (opsional)</label>
                      <textarea
                        rows={3}
                        value={catatan}
                        onChange={e => setCatatan(e.target.value)}
                        placeholder="Catatan persetujuan..."
                        className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-emerald-400 resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setMode('idle')}
                        className="flex-1 py-2.5 rounded-xl border border-surface-300 text-sm font-medium text-ink-600 hover:bg-surface-100 transition-colors"
                      >
                        Kembali
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={loading || loadingChecklist || !checklist?.semua_syarat_wajib_terpenuhi}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loading
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                          : <><CheckCircle2 className="w-4 h-4" /> Konfirmasi Setuju</>
                        }
                      </button>
                    </div>
                  </div>
                )}

                {/* Mode: kembalikan */}
                {mode === 'kembalikan' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
                      <ArrowUpCircle className="w-4 h-4 text-blue-500" />
                      <p className="text-xs font-semibold text-blue-700">Kembalikan untuk Revisi</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink-600 mb-1.5">
                        Catatan Revisi <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={catatan}
                        onChange={e => setCatatan(e.target.value)}
                        placeholder="Tuliskan hal-hal yang perlu diperbaiki oleh peminjam..."
                        className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-blue-400 resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setMode('idle')}
                        className="flex-1 py-2.5 rounded-xl border border-surface-300 text-sm font-medium text-ink-600 hover:bg-surface-100 transition-colors"
                      >
                        Kembali
                      </button>
                      <button
                        onClick={handleReturn}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                      >
                        {loading
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                          : <><ArrowUpCircle className="w-4 h-4" /> Konfirmasi Revisi</>
                        }
                      </button>
                    </div>
                  </div>
                )}

                {/* Mode: tolak */}
                {mode === 'tolak' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <p className="text-xs font-semibold text-red-700">Menolak Pengajuan Pinjaman</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink-600 mb-1.5">
                        Alasan Penolakan <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={catatan}
                        onChange={e => setCatatan(e.target.value)}
                        placeholder="Tuliskan alasan penolakan secara jelas..."
                        className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-red-400 resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setMode('idle')}
                        className="flex-1 py-2.5 rounded-xl border border-surface-300 text-sm font-medium text-ink-600 hover:bg-surface-100 transition-colors"
                      >
                        Kembali
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                      >
                        {loading
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                          : <><XCircle className="w-4 h-4" /> Konfirmasi Tolak</>
                        }
                      </button>
                    </div>
                  </div>
                )}

                {/* ════════ Saldo Anggota ════════ */}
                <div className="pt-4 border-t border-surface-200 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-ink-300 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" /> Saldo Simpanan Anggota
                  </h3>
                  {loadingSaldo ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-4 h-4 animate-spin text-ink-300" />
                    </div>
                  ) : saldoList.length === 0 ? (
                    <p className="text-xs text-ink-400 py-4 text-center">Belum ada data saldo</p>
                  ) : (
                    <>
                      {/* Summary Total Saldo Akhir */}
                      <div className="p-3 rounded-xl bg-gradient-to-br from-ink-800 to-ink-700 text-white">
                        <p className="text-xs font-medium opacity-80">Jumlah Saldo Akhir</p>
                        <p className="text-xl font-bold mt-1">
                          {formatRupiah(saldoList.reduce((total, item) => total + item.saldo, 0))}
                        </p>

                      </div>

                      {/* Breakdown per jenis */}
                      <div className="space-y-2">
                        {saldoList.map(saldo => (
                          <div key={saldo.id_jenis_simpanan} className="p-3 rounded-lg bg-surface-50 border border-surface-200">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-xs font-semibold text-ink-800">{saldo.nama_jenis_simpanan}</p>
                                {saldo.is_wajib && <span className="text-[9px] text-amber-600 font-semibold">Wajib</span>}
                              </div>
                              <p className="text-sm font-bold text-ink-800">{formatRupiah(saldo.saldo)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-1">
                                <ArrowDownCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                                <div>
                                  <p className="text-[9px] text-ink-400">Setor</p>
                                  <p className="text-xs font-semibold text-emerald-600">{formatRupiah(saldo.total_setor)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <ArrowUpCircle className="w-3 h-3 text-red-500 shrink-0" />
                                <div>
                                  <p className="text-[9px] text-ink-400">Tarik</p>
                                  <p className="text-xs font-semibold text-red-500">{formatRupiah(saldo.total_tarik)}</p>
                                </div>
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* ════════ Riwayat Pinjaman ════════ */}
                <div className="pt-4 border-t border-surface-200 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-ink-300 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Riwayat Pinjaman Anggota
                  </h3>
                  {loadingRiwayat ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-4 h-4 animate-spin text-ink-300" />
                    </div>
                  ) : riwayatPinjaman.length === 0 ? (
                    <p className="text-xs text-ink-400 py-4 text-center">Belum ada riwayat pinjaman</p>
                  ) : (
                    <div className="space-y-2">
                      {riwayatPinjaman.slice(0, 5).map(p => {
                        const statusColor = {
                          'pending': 'text-amber-600',
                          'disetujui': 'text-blue-600',
                          'ditolak': 'text-red-600',
                          'lunas': 'text-emerald-600',
                        }[p.status] || 'text-ink-600'

                        const statusBg = {
                          'pending': 'bg-amber-50',
                          'disetujui': 'bg-blue-50',
                          'ditolak': 'bg-red-50',
                          'lunas': 'bg-emerald-50',
                        }[p.status] || 'bg-surface-50'

                        return (
                          <div key={p.id_pinjaman} className={`flex items-center justify-between p-3 rounded-lg border border-surface-200 ${statusBg}`}>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-ink-800 font-mono truncate">{p.no_pinjaman}</p>
                              <p className="text-[10px] text-ink-400">{p.tanggal_pengajuan}</p>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <p className="text-xs font-bold text-ink-800 whitespace-nowrap">{formatRupiah(p.nominal_pinjaman)}</p>
                              <p className={`text-[10px] font-semibold ${statusColor} capitalize`}>{p.status}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Mode: idle — tombol aksi */}
                {mode === 'idle' && (
                  <div className="flex gap-2 pt-4">
                    {(can('pinjaman', 'verify') || can('pinjaman', 'approve')) && (
                      <button
                        onClick={() => { setMode('kembalikan'); setError(null); setCatatan('') }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-colors"
                      >
                        <ArrowUpCircle className="w-4 h-4" /> Kembalikan
                      </button>
                    )}
                    {can('pinjaman', 'reject') && (
                      <button
                        onClick={() => { setMode('tolak'); setError(null); setCatatan('') }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Tolak
                      </button>
                    )}
                    {can('pinjaman', 'approve') && (
                      <button
                        onClick={() => { setMode('setuju'); setError(null) }}
                        disabled={loadingChecklist || !checklist?.semua_syarat_wajib_terpenuhi}
                        title={!checklist?.semua_syarat_wajib_terpenuhi ? 'Lengkapi syarat wajib terlebih dahulu' : ''}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-300 disabled:text-ink-300"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Setujui
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ════════════════════════════════ TAB: SYARAT ════════════════ */}
            {activeTab === 'syarat' && (
              <div className="space-y-3">
                {loadingChecklist ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-ink-300" />
                  </div>

                ) : !checklist || checklist.detail_syarat.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-8 h-8 text-ink-200 mb-2" />
                    <p className="text-sm text-ink-400">Tidak ada syarat untuk pengajuan ini</p>
                    <p className="text-xs text-ink-300 mt-1">Pinjaman dapat langsung diproses</p>
                  </div>

                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* ── LEFT: Checklist ── */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold ${
                          checklist.semua_syarat_wajib_terpenuhi
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                          {checklist.semua_syarat_wajib_terpenuhi
                            ? <ShieldCheck className="w-4 h-4 shrink-0" />
                            : <ShieldX    className="w-4 h-4 shrink-0" />
                          }
                          {checklist.semua_syarat_wajib_terpenuhi
                            ? `Semua syarat terpenuhi (${checklist.syarat_terpenuhi}/${checklist.total_syarat})`
                            : `${checklist.syarat_belum_terpenuhi} syarat belum terpenuhi`
                          }
                        </div>

                        {/* List syarat — Redesigned Review Workflow */}
                        <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">

                      {checklist.detail_syarat.map(d => {
                        const isWajib = d.syarat?.is_wajib ?? false
                        const nama    = d.nama_syarat ?? d.syarat?.nama_syarat ?? 'Syarat'
                        const deskripsi = d.deskripsi_syarat ?? d.syarat?.deskripsi ?? null
                        const isToggling = togglingId === d.id_pinjaman_syarat
                        const hasDocument = !!d.dokumen_path

                        return (
                          <div
                            key={d.id_pinjaman_syarat}
                            onClick={() => {
                              if (d.dokumen_path) {
                                setActiveDoc(d.dokumen_path)
                                setSelectedSyaratId(d.id_pinjaman_syarat)
                              }
                            }}
                            className={cn(
                              "relative group p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer",
                              selectedSyaratId === d.id_pinjaman_syarat
                                ? "border-ink-800 bg-white ring-2 ring-ink-800/10"
                                : d.is_terpenuhi
                                  ? "bg-emerald-50/50 border-emerald-100 shadow-sm"
                                  : (isWajib && !hasDocument)
                                    ? "bg-red-50/50 border-red-50"
                                    : "bg-surface-50/50 border-surface-100"
                            )}
                          >

                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                {/* Title & Badge */}
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <h4 className={cn(
                                    "text-sm font-bold tracking-tight",
                                    d.is_terpenuhi ? "text-emerald-900" : "text-ink-900"
                                  )}>
                                    {nama}
                                  </h4>
                                  {isWajib && (
                                    <span className={cn(
                                      "text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider",
                                      d.is_terpenuhi ? "bg-emerald-200 text-emerald-800" : "bg-red-200 text-red-700"
                                    )}>
                                      Wajib
                                    </span>
                                  )}
                                  {d.is_terpenuhi ? (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full">
                                      <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                                    </span>
                                  ) : hasDocument ? (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                      <FileText className="w-3 h-3" /> Siap Review
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-ink-400 bg-surface-200/50 px-2 py-0.5 rounded-full">
                                      <AlertCircle className="w-3 h-3" /> Belum Unggah
                                    </span>
                                  )}
                                </div>
                                
                                {deskripsi && (
                                  <p className="text-[11px] text-ink-500 line-clamp-2 leading-relaxed">
                                    {deskripsi}
                                  </p>
                                )}

                                {/* Document Link */}
                                {hasDocument && (
                                  <div className="mt-3">
                                    <button 
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setActiveDoc(d.dokumen_path)
                                        setSelectedSyaratId(d.id_pinjaman_syarat)
                                      }}
                                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2a7fc5] hover:text-[#1e5f96] transition-colors bg-white px-3 py-1.5 rounded-lg border border-surface-200 shadow-sm"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      Lihat Dokumen
                                    </button>
                                  </div>

                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="shrink-0 flex flex-col items-end">
                                {d.is_terpenuhi ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleToggleSyarat(d.id_pinjaman_syarat, false)
                                    }}

                                    disabled={isToggling}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 text-[11px] font-bold hover:bg-red-50 transition-all disabled:opacity-50"
                                  >
                                    {isToggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                    Batal
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleToggleSyarat(d.id_pinjaman_syarat, true)
                                    }}

                                    disabled={isToggling || (!hasDocument && isWajib)}
                                    title={(!hasDocument && isWajib) ? "Dokumen wajib belum diunggah" : ""}
                                    className={cn(
                                      "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all shadow-sm active:scale-95",
                                      hasDocument
                                        ? "bg-gradient-premium text-white hover:opacity-90"
                                        : "bg-surface-200 text-ink-300 cursor-not-allowed"
                                    )}
                                  >
                                    {isToggling ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    Verifikasi
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                        </div>

                        <p className="text-[10px] text-ink-300 text-center pt-1">
                          Klik untuk melihat dokumen dan lakukan verifikasi
                        </p>
                      </div>

                      {/* ── RIGHT: Document Viewer ── */}
                      <div className="lg:col-span-7 bg-surface-100 rounded-2xl border border-surface-200 overflow-hidden flex flex-col h-[70vh] sticky top-0">
                        <div className="bg-white px-4 py-3 border-b border-surface-200 flex items-center justify-between shrink-0">
                          <h4 className="text-xs font-bold text-ink-800 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-ink-400" />
                            Pratinjau Dokumen
                          </h4>
                          {activeDoc && (
                            <a 
                              href={base64ToBlobUrl(activeDoc)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-accent-600 hover:underline flex items-center gap-1"
                            >
                              Buka di Tab Baru <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        
                        <div className="flex-1 overflow-auto bg-surface-200/50 flex items-center justify-center p-4">
                          {activeDoc ? (
                            isImage(activeDoc) ? (
                              <img 
                                src={base64ToBlobUrl(activeDoc)} 
                                alt="Pratinjau Dokumen" 
                                className="max-w-full max-h-full object-contain rounded shadow-lg animate-fade-in"
                              />
                            ) : isPdf(activeDoc) ? (
                              <iframe 
                                src={base64ToBlobUrl(activeDoc)} 
                                className="w-full h-full rounded shadow-lg"
                                title="PDF Viewer"
                              />
                            ) : (
                              <div className="text-center p-8">
                                <AlertCircle className="w-12 h-12 text-ink-200 mx-auto mb-3" />
                                <p className="text-sm font-semibold text-ink-400">Format file tidak didukung untuk pratinjau</p>
                                <a 
                                  href={base64ToBlobUrl(activeDoc)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="mt-4 inline-block px-4 py-2 bg-ink-800 text-white rounded-lg text-xs"
                                >
                                  Unduh/Lihat Langsung
                                </a>
                              </div>
                            )
                          ) : (
                            <div className="text-center p-12">
                              <div className="w-16 h-16 bg-surface-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-ink-200" />
                              </div>
                              <p className="text-sm font-bold text-ink-400">Pilih dokumen untuk melihat pratinjau</p>
                              <p className="text-xs text-ink-300 mt-1 uppercase tracking-widest">Workspace Verifikasi</p>
                            </div>
                          )}
                        </div>
                    </div>
                  </div>
                </>
              )}

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}