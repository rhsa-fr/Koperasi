'use client'

import { useState, useEffect } from 'react'
import {
  X, Calculator, CheckCircle2, AlertCircle,
  FileText, Loader2, ChevronDown, User, Plus, BadgeCheck
} from 'lucide-react'
import {
  Pinjaman, PinjamanCreatePayload, Anggota, SyaratItem,
  getSyaratByNominal, hitungPinjaman, formatRupiah,
  SyaratChecklistResponse
} from './types'
import { cn } from '@/lib/utils'
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
  isMobile?: boolean
}

const NOMINAL_PRESETS = [
  { label: '1 Jt',  value: 1_000_000  },
  { label: '2 Jt',  value: 2_000_000  },
  { label: '5 Jt',  value: 5_000_000  },
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

export default function FormPinjaman({ onClose, onSuccess, initialAnggota, isMobile = false }: Props) {
  const [anggotaQuery, setAnggotaQuery]       = useState(initialAnggota?.nama_lengkap || '')
  const [anggotaList, setAnggotaList]         = useState<Anggota[]>([])
  const [anggotaDropdown, setAnggotaDropdown] = useState(false)
  const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(initialAnggota || null)

  const [nominalDisplay, setNominalDisplay] = useState('')
  const nominal = nominalDisplay ? parseDisplayValue(nominalDisplay) : 0

  const [bunga, setBunga]         = useState<number>(2)
  const [lama, setLama]           = useState<number>(12)
  const [keperluan, setKeperluan] = useState('')
  const [tanggal, setTanggal]     = useState(new Date().toISOString().split('T')[0])
  const [kalkulasi, setKalkulasi] = useState({ totalBunga: 0, totalPinjaman: 0, nominalAngsuran: 0 })
  const [syaratList, setSyaratList] = useState<SyaratItem[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({})
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [settings, setSettings]   = useState<KoperasiSetting | null>(null)


  const [anggotaDetail, setAnggotaDetail] = useState<any>(null)
  const [riwayatPinjaman, setRiwayatPinjaman] = useState<any[]>([])
  const [riwayatSimpanan, setRiwayatSimpanan] = useState<any[]>([])

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
  }, [selectedAnggota, isMobile])

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
    if (!selectedAnggota)         { setError('Pilih anggota terlebih dahulu'); return }
    if (!nominal || nominal <= 0) { setError('Masukkan nominal pinjaman yang valid'); return }
    if (settings && nominal > settings.max_pinjaman) {
      setError(`Nominal melebihi batas maksimal pinjaman (${formatRupiah(settings.max_pinjaman)})`);
      return;
    }
    if (settings && nominal < settings.min_pinjaman) {
      setError(`Nominal kurang dari batas minimal pinjaman (${formatRupiah(settings.min_pinjaman)})`);
      return;
    }
    if (!keperluan.trim())        { setError('Keperluan pinjaman harus diisi'); return }


    // ── Validasi file wajib ──
    const missingWajib = syaratList.find(s => s.is_wajib && !selectedFiles[s.kode])
    if (missingWajib) {
      setError(`Dokumen wajib belum diunggah: ${missingWajib.nama}`)
      return
    }

    setLoading(true)
    try {
      const payload: PinjamanCreatePayload = {
        id_anggota:        selectedAnggota.id_anggota,
        tanggal_pengajuan: tanggal,
        nominal_pinjaman:  nominal,
        bunga_persen:      bunga,
        lama_angsuran:     lama,
        keperluan,
      }
      
      const pinjaman = await api.post<Pinjaman>('/pinjaman', payload)
      
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
            const ps = checklistRes.detail_syarat.find(d => d.syarat?.kode_syarat === kode)
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal membuat pengajuan')
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
              <h2 className="text-base font-semibold text-ink-800">Pengajuan Pinjaman Baru</h2>
              <p className="text-xs text-ink-300 mt-0.5">Isi formulir pengajuan pinjaman anggota</p>
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

            {/* ── Data Anggota ─────────────────────────────────────────────── */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-300 mb-3">
                Data Anggota
              </h3>

              {!initialAnggota ? (
                <div className="relative">
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
              ) : null}

              {selectedAnggota && (
                <div className={cn(
                  "mt-2 flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all",
                  initialAnggota ? "bg-surface-50 border-surface-200" : "bg-emerald-50 border-emerald-200"
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
                  {initialAnggota && <BadgeCheck className="w-5 h-5 text-emerald-500 ml-auto" />}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-600 mb-1.5">Tanggal Pengajuan</label>
                  <input
                    type="date" value={tanggal}
                    onChange={e => setTanggal(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800 transition-colors"
                  />
                </div>

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

                <div className="col-span-2">
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
                    className="w-full px-3 py-2.5 text-sm border border-surface-300 rounded-xl focus:outline-none focus:border-ink-800 transition-colors"
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

              {/* Kalkulasi */}
              {nominal > 0 && (
                <div className="mt-3 p-4 rounded-xl bg-ink-800 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="w-4 h-4 text-ink-200" />
                    <p className="text-xs font-semibold tracking-wide">Hasil Kalkulasi Otomatis</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total Bunga',    val: formatRupiah(kalkulasi.totalBunga)      },
                      { label: 'Total Pinjaman', val: formatRupiah(kalkulasi.totalPinjaman)   },
                      { label: 'Angsuran/Bulan', val: formatRupiah(kalkulasi.nominalAngsuran) },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-[10px] text-ink-300 font-medium">{item.label}</p>
                        <p className="text-sm font-bold mt-0.5">{item.val}</p>
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
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700" 
                              : "bg-white border-surface-300 text-ink-400 hover:bg-surface-100"
                          )}
                        >
                          <span className="truncate max-w-[200px]">
                            {selectedFiles[s.kode] ? selectedFiles[s.kode].name : "Pilih file dokumen..."}
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
              {uploadingFiles ? 'Mengunggah...' : loading ? 'Menyimpan...' : 'Ajukan Pinjaman'}
            </button>
          </div>

      </div>
    </div>
  )
}