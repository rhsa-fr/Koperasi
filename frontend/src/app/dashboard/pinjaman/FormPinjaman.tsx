'use client'

import { useState, useEffect } from 'react'
import {
  X, Calculator, CheckCircle2, AlertCircle,
  FileText, Loader2, ChevronDown, User, Plus, BadgeCheck, Clock, Eye
} from 'lucide-react'
import {
  Pinjaman, PinjamanCreatePayload, Anggota, SyaratItem,
  getSyaratByNominal, hitungPinjaman, formatRupiah,
  SyaratChecklistResponse
} from './types'
import { cn, getFileUrl, openSafeFile, base64ToBlobUrl, isPdf, isImage } from '@/lib/utils'
import { api } from '@/lib/axios'

interface KoperasiSetting {
  nama_koperasi: string;
  deskripsi: string;
  alamat: string;
  bunga_default: number;
  max_pinjaman: number;
  min_pinjaman: number;
}


interface Props {
  onClose: () => void
  onSuccess: (pinjaman: Pinjaman) => void
  initialAnggota?: Anggota | null
  initialData?: Pinjaman | null
  isMobile?: boolean
}

const NOMINAL_PRESETS = [
  { label: '1 Jt', value: 1_000_000 },
  { label: '2 Jt', value: 2_000_000 },
  { label: '5 Jt', value: 5_000_000 },
  { label: '10 Jt', value: 10_000_000 },
  { label: '15 Jt', value: 15_000_000 },
  { label: '20 Jt', value: 20_000_000 },
  { label: '25 Jt', value: 25_000_000 },
  { label: '50 Jt', value: 50_000_000 },
]

function toDisplayValue(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('id-ID')
}

function parseDisplayValue(display: string): number {
  return Number(display.replace(/\./g, ''))
}

export default function FormPinjaman({ onClose, onSuccess, initialAnggota, initialData, isMobile = false }: Props) {
  const [anggotaQuery, setAnggotaQuery] = useState(initialAnggota?.nama_lengkap || initialData?.nama_anggota || '')
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([])
  const [anggotaDropdown, setAnggotaDropdown] = useState(false)

  // Init selectedAnggota dari initialAnggota atau initialData
  const initAnggota = initialAnggota || (initialData ? {
    id_anggota: initialData.id_anggota,
    nama_lengkap: initialData.nama_anggota || '',
    no_anggota: (initialData as any).no_anggota || '',
    email: '',
    no_telepon: '',
    tanggal_bergabung: '',
    status: 'aktif',
    foto_profil: null,
    created_at: '',
    updated_at: ''
  } : null)
  const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(initAnggota || null)

  const [nominalDisplay, setNominalDisplay] = useState(initialData ? toDisplayValue(initialData.nominal_pinjaman.toString()) : '')
  const nominal = nominalDisplay ? parseDisplayValue(nominalDisplay) : 0

  const [bunga, setBunga] = useState<number>(initialData?.bunga_persen || 2)
  const [lama, setLama] = useState<number>(initialData?.lama_angsuran || 12)
  const [keperluan, setKeperluan] = useState(initialData?.keperluan || '')
  const [tanggal, setTanggal] = useState(initialData?.tanggal_pengajuan || new Date().toISOString().split('T')[0])
  const [kalkulasi, setKalkulasi] = useState({ totalBunga: 0, totalPinjaman: 0, nominalAngsuran: 0 })
  const [syaratList, setSyaratList] = useState<SyaratItem[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({})
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<KoperasiSetting | null>(null)
  const [catatanRevisi, setCatatanRevisi] = useState('')


  const [anggotaDetail, setAnggotaDetail] = useState<any>(null)
  const [riwayatPinjaman, setRiwayatPinjaman] = useState<any[]>([])
  const [riwayatSimpanan, setRiwayatSimpanan] = useState<any[]>([])
  const [existingChecklist, setExistingChecklist] = useState<any[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'pdf' | 'img' | null>(null)
  const [previewKode, setPreviewKode] = useState<string | null>(null)

  // ── Fetch Settings & Extended Data ───────────────────────────────────────
  useEffect(() => {
    // Load Settings
    api.get<KoperasiSetting>('/setting')
      .then(res => {
        setSettings(res)
        setBunga(res.bunga_default || 2)
      })
      .catch(e => console.error("Gagal load setting koperasi", e))

    if (selectedAnggota && !isMobile) {

      Promise.all([
        api.get<any>(`/anggota/${selectedAnggota.id_anggota}/detail`),
        api.get<any>(`/pinjaman?id_anggota=${selectedAnggota.id_anggota}&limit=3`),
        api.get<any>(`/simpanan?id_anggota=${selectedAnggota.id_anggota}&limit=3`)
      ])
        .then(([detRes, pinjRes, simpRes]) => {
          // the detail response format might be at data or direct
          setAnggotaDetail(detRes.data || detRes)
          setRiwayatPinjaman(pinjRes.data?.data || pinjRes.data || [])
          setRiwayatSimpanan(simpRes.data?.data || simpRes.data || [])
        })
        .catch(e => console.error("Gagal load history anggota", e))
    } else {
      setAnggotaDetail(null)
      setRiwayatPinjaman([])
      setRiwayatSimpanan([])
    }

    // Load Existing Checklist if Editing
    if (initialData) {
      api.get<SyaratChecklistResponse>(`/syarat-peminjaman/pinjaman/${initialData.id_pinjaman}/checklist`)
        .then(res => setExistingChecklist(res.detail_syarat))
        .catch(e => console.error("Gagal load checklist eksisting", e))
    }
  }, [selectedAnggota, isMobile, initialData])

  // ── Cari anggota ─────────────────────────────────────────────────────────
  useEffect(() => {
    const search = anggotaQuery.trim()
    if (!search) { setAnggotaList([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await api.get<{ data: Anggota[] }>(
          `/anggota?search=${encodeURIComponent(search)}&status=aktif&limit=8`
        )
        setAnggotaList(res.data)
      } catch { setAnggotaList([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [anggotaQuery])

  // ── Kalkulasi otomatis ────────────────────────────────────────────────────
  useEffect(() => {
    if (nominal > 0 && bunga >= 0 && lama > 0) {
      setKalkulasi(hitungPinjaman(nominal, bunga, lama))
    } else {
      setKalkulasi({ totalBunga: 0, totalPinjaman: 0, nominalAngsuran: 0 })
    }
  }, [nominal, bunga, lama])

  // ── Update syarat berdasarkan nominal ────────────────────────────────────
  useEffect(() => {
    if (nominal > 0) setSyaratList(getSyaratByNominal(nominal))
    else setSyaratList([])
  }, [nominal])

  // ── Lock body scroll ──────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  const handleNominalInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, '')
    if (raw === '') { setNominalDisplay(''); return }
    if (!/^\d+$/.test(raw)) return
    setNominalDisplay(toDisplayValue(raw))
  }

  const handlePreset = (value: number) => {
    setNominalDisplay(value.toLocaleString('id-ID'))
  }

  // ── Submit — cukup buat pinjaman saja ────────────────────────────────────
  const handleSubmit = async () => {
    setError(null)
    if (!selectedAnggota) { setError('Pilih anggota terlebih dahulu'); return }
    if (!nominal || nominal <= 0) { setError('Masukkan nominal pinjaman yang valid'); return }
    if (settings && nominal > settings.max_pinjaman) {
      setError(`Nominal melebihi batas maksimal pinjaman (${formatRupiah(settings.max_pinjaman)})`);
      return;
    }
    if (settings && nominal < settings.min_pinjaman) {
      setError(`Nominal kurang dari batas minimal pinjaman (${formatRupiah(settings.min_pinjaman)})`);
      return;
    }
    if (!keperluan.trim()) { setError('Keperluan pinjaman harus diisi'); return }
    if (initialData && !catatanRevisi.trim()) {
      setError('Catatan perubahan / revisi wajib diisi')
      return
    }

    // ── Validasi file wajib ──
    const missingWajib = syaratList.find(s => {
      if (!s.is_wajib) return false

      // 1. Jika ada file baru yang dipilih di session ini
      if (selectedFiles[s.kode]) return false

      // 2. Jika dokumen sudah diunggah di session sebelumnya
      const isAlreadyUploaded = existingChecklist.some(
        ec => (ec.syarat?.kode_syarat === s.kode || ec.kode_syarat === s.kode) && ec.dokumen_path
      )
      if (isAlreadyUploaded) return false

      return true
    })

    if (missingWajib) {
      setError(`Dokumen wajib belum diunggah: ${missingWajib.nama}`)
      return
    }

    setLoading(true)
    try {
      const payload: any = {
        id_anggota: selectedAnggota.id_anggota,
        tanggal_pengajuan: tanggal,
        nominal_pinjaman: nominal,
        bunga_persen: bunga,
        lama_angsuran: lama,
        keperluan,
        ...(initialData ? { catatan_revisi: catatanRevisi } : {})
      }

      let pinjaman: Pinjaman
      if (initialData) {
        pinjaman = await api.put<Pinjaman>(`/pinjaman/${initialData.id_pinjaman}`, payload)
      } else {
        pinjaman = await api.post<Pinjaman>('/pinjaman', payload)
      }

      // ── Handle File Uploads ──
      const fileEntries = Object.entries(selectedFiles)
      if (fileEntries.length > 0) {
        setUploadingFiles(true)
        try {
          // 1. Ambil checklist untuk dapat id_pinjaman_syarat
          const checklistRes = await api.get<SyaratChecklistResponse>(
            `/syarat-peminjaman/pinjaman/${pinjaman.id_pinjaman}/checklist`
          )

          // 2. Upload setiap file
          for (const [kode, file] of fileEntries) {
            const ps = checklistRes.detail_syarat.find(d => d.syarat?.kode_syarat === kode || (d as any).kode_syarat === kode)
            if (ps) {
              const formData = new FormData()
              formData.append('file', file)
              await api.post(`/pinjaman/syarat/${ps.id_pinjaman_syarat}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              })
            }
          }
        } catch (e) {
          console.error("Gagal upload dokumen:", e)
          // Kita tetap anggap sukses ajukan pinjaman, tapi beri peringatan
          setError("Pinjaman berhasil diajukan, tapi beberapa dokumen gagal diunggah. Silakan upload nanti di detail pinjaman.")
        } finally {
          setUploadingFiles(false)
        }
      }

      onSuccess(pinjaman)
    } catch (e: any) {
      console.error('Submit Pinjaman Error Object:', e)
      console.dir(e)

      if (e.message === 'Network Error') {
        setError('Network Error: Gagal menghubungi server. Pastikan ukuran file total tidak melebihi 5MB atau cek koneksi internet Anda.')
      } else {
        setError(e.message || 'Gagal membuat pengajuan')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn(
      "z-50",
      isMobile
        ? "absolute inset-0 bg-surface-50 flex flex-col"
        : "fixed inset-0 bg-black/40 backdrop-blur-sm p-4 flex items-center justify-center py-8"
    )}>
      <div className={cn(
        "bg-white w-full flex flex-col animate-fade-in relative",
        isMobile
          ? "flex-1 min-h-0"
          : "rounded-2xl shadow-2xl max-w-2xl max-h-full overflow-hidden"
      )}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className={cn(
          "flex items-center justify-between px-6 py-4 border-b border-surface-200 shrink-0 bg-white z-20 shadow-sm",
          !isMobile && "rounded-t-2xl"
        )}>
          <div>
            <h2 className="text-base font-semibold text-ink-800">
              {initialData ? `Revisi Pengajuan ${initialData.no_pinjaman}` : 'Pengajuan Pinjaman Baru'}
            </h2>
            <p className="text-xs text-ink-300 mt-0.5">
              {initialData ? 'Perbaiki data sesuai catatan revisi' : 'Isi formulir pengajuan pinjaman anggota'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Riwayat Catatan saat Revisi */}
          {initialData && initialData.history && initialData.history.length > 0 && (
            <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> Riwayat Catatan
              </h3>

              {(() => {
                const sortedHistory = [...initialData.history!].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
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
                              {new Date(lastEntry.created_at).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })} • {new Date(lastEntry.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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
                                {lastEntry.status === 'dikembalikan' ? 'Perlu Revisi' : lastEntry.status}
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
                                    {new Date(entry.created_at).toLocaleDateString('id-ID')} {new Date(entry.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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

          {/* ── Data Anggota ─────────────────────────────────────────────── */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-300 mb-3">
              Data Anggota
            </h3>

            {!initialData && (
              <div className="relative mb-3">
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Cari Anggota <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input
                    type="text"
                    placeholder="Ketik nama atau nomor anggota..."
                    value={selectedAnggota ? selectedAnggota.nama_lengkap : anggotaQuery}
                    onFocus={() => { setAnggotaDropdown(true); if (selectedAnggota) setAnggotaQuery('') }}
                    onChange={e => {
                      setAnggotaQuery(e.target.value)
                      setSelectedAnggota(null)
                      setAnggotaDropdown(true)
                    }}
                    onBlur={() => setTimeout(() => setAnggotaDropdown(false), 150)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800 transition-colors"
                  />
                </div>

                {anggotaDropdown && anggotaList.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-surface-300 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                    {anggotaList.map(a => (
                      <button
                        key={a.id_anggota}
                        onMouseDown={() => {
                          setSelectedAnggota(a)
                          setAnggotaQuery(a.nama_lengkap)
                          setAnggotaDropdown(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-50 text-left transition-colors"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
                        >
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ink-800">{a.nama_lengkap}</p>
                          <p className="text-[10px] text-ink-400">{a.no_anggota}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedAnggota && (
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all",
                initialData ? "bg-surface-50 border-surface-200" : "bg-emerald-50 border-emerald-200"
              )}>
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <User className="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-ink-800 tracking-tight leading-none mb-1">
                    {selectedAnggota.nama_lengkap}
                  </p>
                  <p className="text-[10px] text-ink-400 font-bold uppercase tracking-widest">
                    {selectedAnggota.no_anggota}
                  </p>
                </div>
                {initialData && <BadgeCheck className="w-5 h-5 text-emerald-500 ml-auto" />}
              </div>
            )}

            {/* Tampilan Riwayat & Saldo Khusus Staff */}
            {!isMobile && selectedAnggota && anggotaDetail && (
              <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-surface-200 shadow-sm">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-ink-400 mb-1">Total Simpanan</p>
                    <p className="text-sm font-black text-emerald-600">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(anggotaDetail.total_simpanan || 0)}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-surface-200 shadow-sm">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-ink-400 mb-1">Tunggakan / Pinjaman Aktif</p>
                    <p className="text-sm font-black text-amber-600">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(anggotaDetail.total_pinjaman_aktif || 0)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-ink-900 border-b pb-1 mb-2">Pinjaman Terakhir</p>
                    {riwayatPinjaman.length > 0 ? riwayatPinjaman.map((p, i) => (
                      <div key={i} className="flex justify-between items-center text-xs mb-1.5 border-b border-white pb-1.5">
                        <span className="text-ink-600">{new Date(p.tanggal_pengajuan).toLocaleDateString('id-ID')}</span>
                        <span className={cn("font-bold text-[10px] px-1.5 py-0.5 rounded", p.status === 'lunas' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                          {p.status.toUpperCase()}
                        </span>
                      </div>
                    )) : <p className="text-[10px] text-ink-400 italic">Belum ada riwayat</p>}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-ink-900 border-b pb-1 mb-2">Simpanan Terakhir</p>
                    {riwayatSimpanan.length > 0 ? riwayatSimpanan.map((s, i) => (
                      <div key={i} className="flex justify-between items-center text-xs mb-1.5 border-b border-white pb-1.5">
                        <span className="text-ink-600">{new Date(s.tanggal_transaksi).toLocaleDateString('id-ID')}</span>
                        <span className={cn("font-bold text-[10px]", s.tipe_transaksi === 'setor' ? "text-emerald-600" : "text-amber-600")}>
                          {s.tipe_transaksi === 'setor' ? '+' : '-'} {new Intl.NumberFormat('id-ID').format(s.nominal)}
                        </span>
                      </div>
                    )) : <p className="text-[10px] text-ink-400 italic">Belum ada riwayat</p>}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── Data Pinjaman ─────────────────────────────────────────────── */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-300 mb-3">
              Data Pinjaman
            </h3>

            <div className={cn("grid gap-3", initialData ? "grid-cols-1" : "grid-cols-2")}>
              {!initialData && (
                <div>
                  <label className="block text-xs font-medium text-ink-600 mb-1.5">Tanggal Pengajuan</label>
                  <input
                    type="date" value={tanggal}
                    onChange={e => setTanggal(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Keperluan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" value={keperluan}
                  onChange={e => setKeperluan(e.target.value)}
                  placeholder="Contoh: Modal usaha"
                  className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800 transition-colors"
                />
              </div>

              <div className={initialData ? "col-span-1" : "col-span-2"}>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">
                  Nominal Pinjaman <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400 font-medium">Rp</span>
                  <input
                    type="text" inputMode="numeric"
                    value={nominalDisplay} onChange={handleNominalInput}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800 transition-colors"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {NOMINAL_PRESETS.map(p => (
                    <button
                      key={p.value} onClick={() => handlePreset(p.value)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-surface-100 text-ink-600 hover:bg-surface-200 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">Bunga (% / bln)</label>
                <input
                  type="number" min={0} max={100} step={0.5}
                  value={bunga} onChange={e => setBunga(Number(e.target.value))}
                  disabled={!!initialAnggota}
                  className={cn(
                    "w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none transition-colors",
                    !!initialAnggota
                      ? "bg-surface-100 border-surface-200 text-ink-500 cursor-not-allowed"
                      : "border-surface-300 focus:border-ink-800 bg-white"
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">Lama Angsuran</label>
                <div className="relative">
                  <select
                    value={lama} onChange={e => setLama(Number(e.target.value))}
                    className="w-full appearance-none px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800 bg-white pr-8 transition-colors"
                  >
                    {[3, 6, 12, 18, 24, 36, 48, 60].map(m => (
                      <option key={m} value={m}>{m} bulan</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-300 pointer-events-none" />
                </div>
              </div>
            </div>

            {initialData && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-ink-700 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Catatan Perubahan / Revisi <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={catatanRevisi}
                  onChange={e => setCatatanRevisi(e.target.value)}
                  placeholder="Tuliskan catatan perbaikan Anda di sini (misal: Sudah mengunggah berkas baru dan merubah keperluan)..."
                  className="w-full px-3 py-2.5 text-xs text-ink-800 border border-surface-300 rounded-xl focus:outline-none focus:border-indigo-600 bg-white transition-all placeholder:text-ink-200 resize-none leading-relaxed"
                />
              </div>
            )}

            {/* Kalkulasi */}
            {nominal > 0 && (
              <div className="mt-3 p-4 rounded-xl bg-ink-800 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-ink-200" />
                  <p className="text-xs font-semibold tracking-wide">Hasil Kalkulasi Otomatis</p>
                </div>
                <div className="flex flex-wrap justify-between gap-4">
                  {[
                    { label: 'Total Bunga', val: formatRupiah(kalkulasi.totalBunga) },
                    { label: 'Total Pinjaman', val: formatRupiah(kalkulasi.totalPinjaman) },
                    { label: 'Angsuran/Bulan', val: formatRupiah(kalkulasi.nominalAngsuran) },
                  ].map(item => (
                    <div key={item.label} className="min-w-[100px]">
                      <p className="text-[10px] text-ink-300 font-medium whitespace-nowrap">{item.label}</p>
                      <p className="text-sm font-bold mt-0.5 whitespace-nowrap">{item.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Syarat Pengajuan (informasi saja) ────────────────────────── */}
          {syaratList.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-300">
                  Syarat Pengajuan
                </h3>
                <span className="text-[10px] text-ink-300">{syaratList.length} syarat</span>
              </div>
              <p className="text-[11px] text-ink-400 mb-3">
                Siapkan dokumen berikut. Ketua akan memverifikasi kelengkapan syarat setelah pengajuan dikirim.
              </p>
              <div className="space-y-3">
                {syaratList.map(s => (
                  <div
                    key={s.kode}
                    className="p-3 rounded-xl border border-surface-200 bg-surface-50 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className={`w-4 h-4 shrink-0 ${s.is_wajib ? 'text-red-400' : 'text-ink-300'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-ink-800">{s.nama}</p>
                        <p className="text-[10px] text-ink-400 mt-0.5">{s.deskripsi}</p>
                      </div>
                      {s.is_wajib
                        ? <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold shrink-0">WAJIB</span>
                        : <span className="text-[9px] bg-surface-200 text-ink-400 px-1.5 py-0.5 rounded-full font-semibold shrink-0">OPSIONAL</span>
                      }
                    </div>

                    {/* Status Eksisting */}
                    {(() => {
                      const existing = existingChecklist.find(ec => (ec.syarat?.kode_syarat === s.kode || ec.kode_syarat === s.kode) && ec.dokumen_path)
                      if (!existing) return null
                      
                      const isVerified = existing.is_terpenuhi
                      
                      return (
                        <div className={cn(
                          "flex flex-col gap-2 p-3.5 rounded-2xl border transition-all duration-300",
                          isVerified 
                            ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" 
                            : "bg-rose-50/50 border-rose-100 text-rose-800"
                        )}>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              {isVerified ? (
                                <>
                                  <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span className="text-[11px] font-black tracking-tight uppercase">Dokumen Terverifikasi</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                                  <span className="text-[11px] font-black tracking-tight uppercase text-rose-700">Perlu Perbaikan (Revisi)</span>
                                </>
                              )}
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                if (previewKode === s.kode) {
                                  setPreviewUrl(null)
                                  setPreviewType(null)
                                  setPreviewKode(null)
                                } else {
                                  const url = base64ToBlobUrl(existing.dokumen_path)
                                  setPreviewUrl(url)
                                  setPreviewType(isPdf(existing.dokumen_path) ? 'pdf' : isImage(existing.dokumen_path) ? 'img' : null)
                                  setPreviewKode(s.kode)
                                }
                              }}
                              className={cn(
                                "text-[10px] font-bold uppercase bg-white px-3 py-1 rounded-xl shadow-sm border transition-all hover:scale-105 active:scale-95 flex items-center gap-1",
                                isVerified 
                                  ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" 
                                  : "border-rose-200 text-rose-700 hover:bg-rose-50"
                              )}
                            >
                              <Eye className="w-3 h-3" />
                              {previewKode === s.kode ? "Tutup" : "Lihat Dokumen"}
                            </button>
                          </div>
                          
                          {!isVerified && existing.catatan && (
                            <div className="mt-1 p-2.5 rounded-xl bg-white border border-rose-200/60 text-xs italic leading-relaxed text-rose-950">
                              <span className="font-bold not-italic block text-[9px] uppercase tracking-wider text-rose-500 mb-0.5">Catatan Koreksi Verifikator:</span>
                              "{existing.catatan}"
                            </div>
                          )}

                          {previewKode === s.kode && previewUrl && previewType && (
                            <div className="mt-2 p-3 border border-surface-200 rounded-xl bg-white relative overflow-hidden">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[9px] font-bold text-ink-400 uppercase tracking-widest">Pratinjau Dokumen</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewUrl(null)
                                    setPreviewType(null)
                                    setPreviewKode(null)
                                  }}
                                  className="p-1 hover:bg-surface-100 rounded text-ink-500 hover:text-ink-800 transition-colors"
                                  title="Tutup preview"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="border border-surface-100 rounded-lg overflow-hidden bg-surface-50 flex items-center justify-center min-h-[200px]">
                                {previewType === 'pdf' ? (
                                  <iframe src={previewUrl} className="w-full h-80 border-0" />
                                ) : (
                                  <img src={previewUrl} alt="Preview" className="max-w-full max-h-80 object-contain" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* File Upload Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id={`file-${s.kode}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setSelectedFiles(prev => ({ ...prev, [s.kode]: file }))
                          }
                        }}
                      />
                      <label
                        htmlFor={`file-${s.kode}`}
                        className={cn(
                          "flex-1 flex items-center justify-between px-3 py-2 rounded-lg border border-dashed transition-all cursor-pointer text-[11px]",
                          selectedFiles[s.kode]
                            ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                            : "bg-white border-surface-300 text-ink-400 hover:bg-surface-100"
                        )}
                      >
                        <span className="truncate max-w-[200px]">
                          {selectedFiles[s.kode] ? selectedFiles[s.kode].name : "Klik untuk ganti/unggah dokumen..."}
                        </span>
                        <Plus className="w-3.5 h-3.5" />
                      </label>
                      {selectedFiles[s.kode] && (
                        <button
                          onClick={() => setSelectedFiles(prev => {
                            const next = { ...prev }
                            delete next[s.kode]
                            return next
                          })}
                          className="p-2 text-ink-300 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className={cn(
          "px-6 py-4 bg-surface-50 border-t border-surface-200 flex justify-end gap-3 shrink-0 z-20",
          !isMobile && "rounded-b-2xl"
        )}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-ink-600 hover:bg-surface-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit} disabled={loading || uploadingFiles}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-ink-800 text-white text-sm font-semibold hover:bg-ink-700 transition-colors disabled:opacity-60"
          >
            {(loading || uploadingFiles) && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploadingFiles ? 'Mengunggah...' : loading ? 'Menyimpan...' : initialData ? 'Kirim Revisi' : 'Ajukan Pinjaman'}
          </button>
        </div>

      </div>
    </div>
  )
}