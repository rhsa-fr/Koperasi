'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Settings, Loader2, AlertCircle, CheckCircle2, X, Building2, Wallet, Landmark, Info, Save, RotateCcw } from 'lucide-react'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

interface Setting {
  id_setting: number
  nama_koperasi: string
  deskripsi?: string
  alamat?: string
  no_telepon?: string
  email?: string
  bunga_default: number
  denda_keterlambatan: number
  min_nominal_pinjaman: number
  max_nominal_pinjaman?: number
  max_lama_angsuran: number
  saldo_minimal_simpanan: number
}

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

export default function SettingsPage() {
  const { can, user } = useAuth()
  
  // Super Admin bypass or check permission
  const isAdmin = user?.role === 'super_admin' || can('settings', 'update')
  
  const [setting, setSetting] = useState<Setting | null>(null)
  const [form, setForm] = useState<Partial<Setting>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, type, message }])
    
    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)

    return () => clearTimeout(timer)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const fetchSetting = useCallback(async () => {
    try {
      setLoading(true)
      // Added cache-busting to ensure fresh data
      const data = await api.get<Setting>(`/setting?t=${Date.now()}`)
      setSetting(data)
      setForm(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat setting')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSetting()
  }, [fetchSetting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) {
      addToast('Anda tidak memiliki izin untuk mengubah pengaturan.', 'error')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Explicitly pick fields to send to backend to avoid schema validation issues
      const payload = {
        nama_koperasi: form.nama_koperasi,
        deskripsi: form.deskripsi,
        alamat: form.alamat,
        no_telepon: form.no_telepon,
        email: form.email,
        bunga_default: form.bunga_default,
        denda_keterlambatan: form.denda_keterlambatan,
        min_nominal_pinjaman: form.min_nominal_pinjaman,
        max_nominal_pinjaman: form.max_nominal_pinjaman,
        max_lama_angsuran: form.max_lama_angsuran,
        saldo_minimal_simpanan: form.saldo_minimal_simpanan
      }
      
      const updated = await api.put<Setting>('/setting', payload)
      setSetting(updated)
      
      addToast('Pengaturan Koperasi berhasil diperbarui!', 'success')
      
      // Delay to show success before reload
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal menyimpan setting'
      setError(errorMsg)
      addToast(errorMsg, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-accent-600 animate-spin" />
        <p className="text-slate-400 font-medium text-sm animate-pulse">Menghubungkan ke sistem...</p>
      </div>
    )
  }

  return (
    <>
      {/* Premium Dialog Toasts */}
      {mounted && createPortal(
        <>
          {toasts.length > 0 && (
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[60] animate-in fade-in duration-300" />
          )}

          <div className="fixed inset-0 pointer-events-none z-[70] flex items-center justify-center p-4">
            {toasts.map(toast => (
              <div key={toast.id} className="pointer-events-auto bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-sm p-8 animate-in zoom-in-95 fade-in duration-300">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center",
                    toast.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                  )}>
                    {toast.type === 'success' ? (
                      <CheckCircle2 className="w-8 h-8" />
                    ) : (
                      <AlertCircle className="w-8 h-8" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-lg">
                      {toast.type === 'success' ? 'Sukses!' : 'Gagal'}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed px-4">
                      {toast.message}
                    </p>
                  </div>

                  <button
                    onClick={() => removeToast(toast.id)}
                    className="mt-4 w-full h-12 rounded-2xl font-bold text-white transition-all active:scale-95 shadow-lg"
                    style={{ background: toast.type === 'success' ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #e11d48, #f43f5e)' }}
                  >
                    Dimengerti
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>,
        document.body
      )}

      <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pengaturan Koperasi</h1>
              <p className="text-slate-500 font-medium text-sm mt-1">Konfigurasi parameter identitas & bisnis koperasi</p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setForm(setting || {}); addToast('Form dikembalikan ke data awal', 'success') }}
                className="h-11 px-5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm bg-white hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                form="settings-form"
                type="submit"
                disabled={saving}
                className="h-11 px-8 rounded-xl text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-accent-600/20 active:scale-95 transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Perubahan
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="px-5 py-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-4 animate-shake">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-rose-100">
              <AlertCircle className="w-5 h-5 text-rose-500" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-bold text-rose-900">Kesalahan Sistem</p>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 bg-white/50 p-2 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form id="settings-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: Identity */}
          <div className="md:col-span-12 lg:col-span-7 space-y-8">
            <div className="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Identitas Koperasi</h2>
                  <p className="text-xs text-slate-400 font-medium">Data publik yang muncul di login & kwitansi</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-2 block">Nama Koperasi</label>
                  <input
                    type="text"
                    required
                    value={form.nama_koperasi ?? ''}
                    onChange={e => setForm({ ...form, nama_koperasi: e.target.value })}
                    disabled={!isAdmin}
                    className="w-full h-12 px-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-accent-400/30 focus:ring-4 focus:ring-accent-400/5 transition-all text-slate-900 font-semibold outline-none"
                    placeholder="Masukkan nama koperasi..."
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-2 block">Deskripsi Singkat</label>
                  <textarea
                    rows={4}
                    value={form.deskripsi ?? ''}
                    onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                    disabled={!isAdmin}
                    className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-accent-400/30 transition-all text-slate-900 font-semibold outline-none resize-none"
                    placeholder="Tuliskan slogan atau deskripsi singkat..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-2 block">Email Instansi</label>
                    <input
                      type="email"
                      value={form.email ?? ''}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      disabled={!isAdmin}
                      className="w-full h-12 px-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-accent-400/30 transition-all text-slate-900 font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-2 block">No. Telepon</label>
                    <input
                      type="text"
                      value={form.no_telepon ?? ''}
                      onChange={e => setForm({ ...form, no_telepon: e.target.value })}
                      disabled={!isAdmin}
                      className="w-full h-12 px-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-accent-400/30 transition-all text-slate-900 font-semibold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-2 block">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={form.alamat ?? ''}
                    onChange={e => setForm({ ...form, alamat: e.target.value })}
                    disabled={!isAdmin}
                    className="w-full h-12 px-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-accent-400/30 transition-all text-slate-900 font-semibold outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Calculations */}
          <div className="md:col-span-12 lg:col-span-5 space-y-8">
            
            {/* Loan Config */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Parameter Pinjaman</h2>
                  <p className="text-xs text-slate-400 font-medium">Aturan bunga dan plafon kredit</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                    <label className="text-[10px] uppercase font-extrabold text-slate-400 mb-1.5 block">Bunga Default</label>
                    <div className="flex items-center gap-2">
                       <input
                        type="number"
                        step="0.01"
                        value={form.bunga_default ?? ''}
                        onChange={e => setForm({ ...form, bunga_default: parseFloat(e.target.value) || 0 })}
                        disabled={!isAdmin}
                        className="w-full bg-transparent text-xl font-extrabold text-slate-900 outline-none"
                      />
                      <span className="text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                    <label className="text-[10px] uppercase font-extrabold text-slate-400 mb-1.5 block">Denda Keterlambatan</label>
                    <div className="flex items-center gap-2">
                       <input
                        type="number"
                        step="0.01"
                        value={form.denda_keterlambatan ?? ''}
                        onChange={e => setForm({ ...form, denda_keterlambatan: parseFloat(e.target.value) || 0 })}
                        disabled={!isAdmin}
                        className="w-full bg-transparent text-xl font-extrabold text-slate-900 outline-none"
                      />
                      <span className="text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-2 block">Minimal Pinjaman (Rp)</label>
                  <input
                    type="number"
                    step="1000"
                    value={form.min_nominal_pinjaman ?? ''}
                    onChange={e => setForm({ ...form, min_nominal_pinjaman: parseFloat(e.target.value) || 0 })}
                    disabled={!isAdmin}
                    className="w-full h-12 px-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-emerald-400/30 transition-all text-slate-900 font-extrabold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-2 block">Maksimal Pinjaman (Rp)</label>
                  <input
                    type="number"
                    step="1000"
                    value={form.max_nominal_pinjaman ?? ''}
                    onChange={e => setForm({ ...form, max_nominal_pinjaman: e.target.value ? parseFloat(e.target.value) : undefined })}
                    disabled={!isAdmin}
                    className="w-full h-12 px-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-emerald-400/30 transition-all text-slate-900 font-extrabold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-2 block">Tenor Maksimal (Bulan)</label>
                  <input
                    type="number"
                    value={form.max_lama_angsuran ?? ''}
                    onChange={e => setForm({ ...form, max_lama_angsuran: parseInt(e.target.value) || 0 })}
                    disabled={!isAdmin}
                    className="w-full h-12 px-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-emerald-400/30 transition-all text-slate-900 font-extrabold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Savings Config */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Parameter Simpanan</h2>
                  <p className="text-xs text-slate-400 font-medium">Batas minimal saldo & penarikan</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-2 block">Saldo Minimal Mengendap (Rp)</label>
                  <input
                    type="number"
                    step="1000"
                    value={form.saldo_minimal_simpanan ?? ''}
                    onChange={e => setForm({ ...form, saldo_minimal_simpanan: parseFloat(e.target.value) || 0 })}
                    disabled={!isAdmin}
                    className="w-full h-12 px-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-amber-400/30 transition-all text-slate-900 font-extrabold outline-none"
                  />
                  <div className="mt-3 flex items-start gap-2 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                    <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 leading-tight">
                      Anggota tidak dapat menarik saldo jika nominal sisa penarikan berada di bawah angka ini.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </form>

        {!isAdmin && (
           <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 font-medium text-sm">
             <AlertCircle className="w-4 h-4" />
             Anda dalam mode baca (Read Only). Hubungi Super Admin untuk izin pengeditan.
           </div>
        )}
      </div>
    </>
  )
}
