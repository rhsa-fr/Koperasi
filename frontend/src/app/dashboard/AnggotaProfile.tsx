'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Shield, Key, FileText, ChevronRight, Mail, Phone, LogOut, Loader2, ArrowLeft, Camera } from 'lucide-react'
import { api, API_BASE_URL } from '@/lib/axios'
import { useAuth } from '@/context/AuthContext'
import ModalGantiPassword from '@/components/ModalGantiPassword'
import Toast, { ToastData } from '@/components/ui/Toast'
import Avatar from '@/components/ui/Avatar'

export default function AnggotaProfile({ user }: { user: any }) {
  const { logout, refreshSession } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  
  const [activeView, setActiveView] = useState<'menu' | 'info'>('menu')
  const [gantiPassword, setGantiPassword] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  
  // State untuk API Wilayah
  const [listProvinsi, setListProvinsi] = useState<any[]>([])
  const [listKota, setListKota] = useState<any[]>([])
  const [loadingWilayah, setLoadingWilayah] = useState(false)

  const [editForm, setEditForm] = useState({
    nama_lengkap: '',
    email: '',
    no_telepon: '',
    nik: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    alamat: '',
    kota: '',
    provinsi: '',
    kode_pos: '',
    pekerjaan: ''
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<any>('/auth/me')
      if (res.anggota) {
        const detail = await api.get<any>(`/anggota/${res.anggota.id_anggota}/detail`)
        // Gabungkan data, tapi pastikan foto_profil tidak hilang jika salah satu null
        const mergedProfile = { ...res.anggota, ...detail }
        if (!mergedProfile.foto_profil && res.anggota.foto_profil) {
          mergedProfile.foto_profil = res.anggota.foto_profil
        }
        setProfile(mergedProfile)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile?.id_anggota) return

    // ── Validasi Tipe File ────────────────────────────────────────────────────
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setToast({ 
        type: 'error', 
        message: 'Format file tidak didukung. Harap gunakan JPG atau PNG.' 
      })
      e.target.value = '' // reset input
      return
    }

    // ── Validasi Ukuran (Max 5MB sesuai config backend) ──────────────────────
    if (file.size > 5 * 1024 * 1024) {
      setToast({ 
        type: 'error', 
        message: 'Ukuran file terlalu besar. Maksimal 5MB.' 
      })
      e.target.value = ''
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      await api.post(`/anggota/${profile.id_anggota}/upload-foto`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setToast({ type: 'success', message: 'Foto profil berhasil diperbarui!' })
      await fetchData()
      await refreshSession()
    } catch (err: any) {
      setToast({ 
        type: 'error', 
        message: err.message || 'Gagal mengunggah foto profil' 
      })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
         <div className="h-40 bg-slate-200 rounded-3xl w-full" />
         <div className="h-64 bg-slate-100 rounded-3xl w-full" />
      </div>
    )
  }

  // SUB-PAGE: Detail Informasi
  if (activeView === 'info') {
    return (
      <div className="animate-fade-in pb-10 space-y-4 lg:max-w-4xl lg:mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => {
            setActiveView('menu')
            setIsEditing(false)
          }}
          className="w-10 h-10 bg-white border border-surface-200 rounded-full flex items-center justify-center text-ink-600 hover:bg-surface-50 transition-all shadow-sm mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between px-1 mb-2">
           <h2 className="text-2xl font-black tracking-tight text-ink-900">Informasi Akun</h2>
           {!isEditing && (
             <button 
                onClick={async () => {
                   setEditForm({
                     nama_lengkap: profile?.nama_lengkap || '',
                     email: profile?.email || '',
                     no_telepon: profile?.no_telepon || '',
                     nik: profile?.profil?.nik || '',
                     tempat_lahir: profile?.profil?.tempat_lahir || '',
                     tanggal_lahir: profile?.profil?.tanggal_lahir || '',
                     jenis_kelamin: profile?.profil?.jenis_kelamin || '',
                     alamat: profile?.profil?.alamat || '',
                     kota: profile?.profil?.kota || '',
                     provinsi: profile?.profil?.provinsi || '',
                     kode_pos: profile?.profil?.kode_pos || '',
                     pekerjaan: profile?.profil?.pekerjaan || ''
                   })
                   setIsEditing(true)
                   
                   // Load Provinsi saat mulai edit
                   setLoadingWilayah(true)
                   try {
                     const res = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
                     const data = await res.json()
                     setListProvinsi(data)
                   } catch (e) {
                     console.error("Gagal load provinsi", e)
                   } finally {
                     setLoadingWilayah(false)
                   }
                }}
               className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg bg-blue-50"
             >
               Edit Profil
             </button>
           )}
        </div>
        
        <div className="bg-white rounded-3xl p-6 border border-surface-200 shadow-sm space-y-5">
           <div>
             <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1.5">Nama Lengkap</p>
             {isEditing ? (
               <input 
                 autoFocus
                 value={editForm.nama_lengkap} 
                 onChange={e => setEditForm({ ...editForm, nama_lengkap: e.target.value })}
                 className="w-full text-sm font-bold text-ink-900 border-b border-surface-300 focus:border-blue-500 focus:outline-none pb-1 bg-transparent"
               />
             ) : (
               <p className="text-sm font-bold text-ink-900">{profile?.nama_lengkap || '-'}</p>
             )}
           </div>
           
           <div>
             <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1.5">Email / Username</p>
             {isEditing ? (
               <input 
                 value={editForm.email} 
                 onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                 className="w-full text-sm font-bold text-ink-900 border-b border-surface-300 focus:border-blue-500 focus:outline-none pb-1 bg-transparent"
               />
             ) : (
               <p className="text-sm font-bold text-ink-700 flex items-center gap-2">
                 <Mail className="w-4 h-4 text-ink-300" /> {profile?.email || user.username}
               </p>
             )}
           </div>

           <div>
             <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1.5">No. Telepon / WhatsApp</p>
             {isEditing ? (
               <input 
                 value={editForm.no_telepon} 
                 onChange={e => setEditForm({ ...editForm, no_telepon: e.target.value })}
                 className="w-full text-sm font-bold text-ink-900 border-b border-surface-300 focus:border-blue-500 focus:outline-none pb-1 bg-transparent"
               />
             ) : (
               <p className="text-sm font-bold text-ink-700 flex items-center gap-2">
                 <Phone className="w-4 h-4 text-ink-300" /> {profile?.no_telepon || '-'}
               </p>
             )}
           </div>

           <div>
             <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1.5">Nomor Keanggotaan</p>
             <p className="inline-flex px-2.5 py-1 rounded-md bg-accent-50 text-accent-700 text-xs font-bold font-mono">
               {profile?.no_anggota || '-'}
             </p>
           </div>
           <div>
             <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1.5">Status Keanggotaan</p>
             <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               {profile?.status || 'AKTIF'}
             </div>
           </div>
        </div>

        <h3 className="text-[10px] font-black text-ink-400 uppercase tracking-[0.2em] px-2 mt-6 mb-2">Data Tambahan</h3>
        <div className="bg-white rounded-3xl p-6 border border-surface-200 shadow-sm space-y-5">
           
           <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1.5">NIK (KTP)</p>
                {isEditing ? (
                  <input 
                    value={editForm.nik} 
                    onChange={e => setEditForm({ ...editForm, nik: e.target.value })}
                    className="w-full text-sm font-bold text-ink-900 border-b border-surface-300 focus:border-blue-500 focus:outline-none pb-1 bg-transparent"
                    placeholder="16 Digit NIK"
                  />
                ) : (
                  <p className="text-sm font-bold text-ink-900">{profile?.profil?.nik || '-'}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1.5">Pekerjaan</p>
                {isEditing ? (
                  <input 
                    value={editForm.pekerjaan} 
                    onChange={e => setEditForm({ ...editForm, pekerjaan: e.target.value })}
                    className="w-full text-sm font-bold text-ink-900 border-b border-surface-300 focus:border-blue-500 focus:outline-none pb-1 bg-transparent"
                  />
                ) : (
                  <p className="text-sm font-bold text-ink-900">{profile?.profil?.pekerjaan || '-'}</p>
                )}
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1.5">Tempat Lahir</p>
                {isEditing ? (
                  <input 
                    value={editForm.tempat_lahir} 
                    onChange={e => setEditForm({ ...editForm, tempat_lahir: e.target.value })}
                    className="w-full text-sm font-bold text-ink-900 border-b border-surface-300 focus:border-blue-500 focus:outline-none pb-1 bg-transparent"
                  />
                ) : (
                  <p className="text-sm font-bold text-ink-900">{profile?.profil?.tempat_lahir || '-'}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1.5">Tanggal Lahir</p>
                {isEditing ? (
                  <input 
                    type="date"
                    value={editForm.tanggal_lahir} 
                    onChange={e => setEditForm({ ...editForm, tanggal_lahir: e.target.value })}
                    className="w-full text-sm font-bold text-ink-900 border-b border-surface-300 focus:border-blue-500 focus:outline-none pb-1 bg-transparent"
                  />
                ) : (
                  <p className="text-sm font-bold text-ink-900">
                    {profile?.profil?.tanggal_lahir ? new Date(profile.profil.tanggal_lahir).toLocaleDateString('id-ID') : '-'}
                  </p>
                )}
              </div>
           </div>

           <div>
             <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1.5">Jenis Kelamin</p>
             {isEditing ? (
               <select 
                 value={editForm.jenis_kelamin} 
                 onChange={e => setEditForm({ ...editForm, jenis_kelamin: e.target.value })}
                 className="w-full text-sm font-bold text-ink-900 border-b border-surface-300 focus:border-blue-500 focus:outline-none pb-1 bg-transparent"
               >
                 <option value="">Pilih</option>
                 <option value="L">Laki-laki</option>
                 <option value="P">Perempuan</option>
               </select>
             ) : (
               <p className="text-sm font-bold text-ink-900">
                 {profile?.profil?.jenis_kelamin === 'L' ? 'Laki-laki' : profile?.profil?.jenis_kelamin === 'P' ? 'Perempuan' : '-'}
               </p>
             )}
           </div>

           <div>
             <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1.5">Alamat Lengkap</p>
             {isEditing ? (
               <input 
                 value={editForm.alamat} 
                 onChange={e => setEditForm({ ...editForm, alamat: e.target.value })}
                 className="w-full text-sm font-bold text-ink-900 border-b border-surface-300 focus:border-blue-500 focus:outline-none pb-1 bg-transparent"
               />
             ) : (
               <p className="text-sm font-bold text-ink-900">{profile?.profil?.alamat || '-'}</p>
             )}
           </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="col-span-1">
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1.5">Provinsi</p>
                {isEditing ? (
                  <select 
                    value={listProvinsi.find(p => p.name === editForm.provinsi)?.id || ''} 
                    onChange={async (e) => {
                      const id = e.target.value
                      const name = listProvinsi.find(p => p.id === id)?.name || ''
                      setEditForm({ ...editForm, provinsi: name, kota: '' })
                      setListKota([])
                      
                      if (id) {
                        setLoadingWilayah(true)
                        try {
                          const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id}.json`)
                          const data = await res.json()
                          setListKota(data)
                        } catch (e) {
                          console.error("Gagal load kota", e)
                        } finally {
                          setLoadingWilayah(false)
                        }
                      }
                    }}
                    className="w-full text-sm font-bold text-ink-900 border-b border-surface-300 focus:border-blue-500 focus:outline-none pb-1 bg-transparent"
                  >
                    <option value="">Pilih Provinsi</option>
                    {listProvinsi.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-bold text-ink-900 truncate">{profile?.profil?.provinsi || '-'}</p>
                )}
              </div>

              <div className="col-span-1">
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1.5">Kota/Kabupaten</p>
                {isEditing ? (
                  <select 
                    value={listKota.find(k => k.name === editForm.kota)?.id || ''} 
                    disabled={!editForm.provinsi || loadingWilayah}
                    onChange={e => {
                      const id = e.target.value
                      const name = listKota.find(k => k.id === id)?.name || ''
                      setEditForm({ ...editForm, kota: name })
                    }}
                    className="w-full text-sm font-bold text-ink-900 border-b border-surface-300 focus:border-blue-500 focus:outline-none pb-1 bg-transparent disabled:opacity-50"
                  >
                    <option value="">{loadingWilayah ? 'Memuat...' : 'Pilih Kota'}</option>
                    {listKota.map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-bold text-ink-900 truncate">{profile?.profil?.kota || '-'}</p>
                )}
              </div>
              
              <div className="col-span-1">
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1.5">Kode Pos</p>
                {isEditing ? (
                  <input 
                    value={editForm.kode_pos} 
                    onChange={e => setEditForm({ ...editForm, kode_pos: e.target.value })}
                    className="w-full text-sm font-bold text-ink-900 border-b border-surface-300 focus:border-blue-500 focus:outline-none pb-1 bg-transparent"
                  />
                ) : (
                  <p className="text-sm font-bold text-ink-900 truncate">{profile?.profil?.kode_pos || '-'}</p>
                )}
              </div>
           </div>

        </div>

        {isEditing && (
           <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 rounded-xl border border-surface-300 text-ink-600 font-bold active:scale-95 transition-transform"
              >
                Batal
              </button>
              <button 
                onClick={async () => {
                  if (!profile?.id_anggota) return
                  setSaving(true)
                  try {
                    // Update main member data
                    await api.put(`/anggota/${profile.id_anggota}`, {
                      nama_lengkap: editForm.nama_lengkap,
                      email: editForm.email,
                      no_telepon: editForm.no_telepon
                    })
                    // Update extended profile data
                    await api.post(`/anggota/${profile.id_anggota}/profil`, {
                      nik: editForm.nik,
                      tempat_lahir: editForm.tempat_lahir,
                      tanggal_lahir: editForm.tanggal_lahir || null,
                      jenis_kelamin: editForm.jenis_kelamin || null,
                      alamat: editForm.alamat,
                      kota: editForm.kota,
                      provinsi: editForm.provinsi,
                      kode_pos: editForm.kode_pos,
                      pekerjaan: editForm.pekerjaan
                    })
                    
                    await fetchData()
                    await refreshSession()
                    setIsEditing(false)
                  } catch (e) {
                    alert('Gagal menyimpan profil')
                  } finally {
                    setSaving(false)
                  }
                }}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold active:scale-95 transition-transform flex justify-center items-center"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Perubahan'}
              </button>
           </div>
        )}
      </div>
    )
  }

  // MAIN VIEW
  return (
    <div className="space-y-6 animate-fade-in pb-10 lg:max-w-4xl lg:mx-auto">
      {gantiPassword && <ModalGantiPassword onClose={() => setGantiPassword(false)} />}
      
      {/* Profile Header Card */}
      <div className="card p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-3xl border-none shadow-xl shadow-slate-900/10 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
         <div className="relative z-10 flex items-center gap-5">
            <div 
               onClick={() => document.getElementById('foto-upload')?.click()}
               className="relative cursor-pointer group"
            >
               <Avatar 
                  src={profile?.profil?.foto_profil || profile?.foto_profil} 
                  size="xl"
               />
               
               <div className="absolute inset-0 bg-black/40 rounded-[2rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
               </div>
               
               {uploading && (
                 <div className="absolute inset-0 bg-white/60 rounded-[2rem] flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                 </div>
               )}
               
               <input 
                  id="foto-upload"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleUploadFoto}
               />
            </div>
            <div className="flex-1 min-w-0">
               <h2 className="text-xl font-extrabold tracking-tight truncate">{profile?.nama_lengkap || user.username}</h2>
               <p className="text-xs text-slate-300 font-medium truncate mb-1.5">{profile?.email || 'Anggota Koperasi'}</p>
               <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-white/20 text-white/90">
                 ID: {profile?.no_anggota || user?.anggota?.no_anggota || '-'}
               </span>
            </div>
         </div>
      </div>

      {toast && (
        <Toast 
          type={toast.type} 
          message={toast.message} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Settings Menu */}
      <div className="space-y-4">
         
         <div className="bg-white rounded-3xl border border-surface-200 overflow-hidden shadow-sm">
            <button 
              onClick={() => setActiveView('info')}
              className="w-full flex items-center p-4 hover:bg-surface-50 transition-colors group border-b border-surface-100"
            >
               <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                 <FileText className="w-5 h-5" />
               </div>
               <div className="text-left flex-1 px-4">
                 <p className="text-sm font-bold text-ink-900">Data Pribadi</p>
                 <p className="text-[10px] text-ink-400 font-medium mt-0.5">Lihat informasi detail akun Anda</p>
               </div>
               <ChevronRight className="w-5 h-5 text-ink-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </button>
            
            <button 
              onClick={() => setGantiPassword(true)}
              className="w-full flex items-center p-4 hover:bg-surface-50 transition-colors group"
            >
               <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                 <Shield className="w-5 h-5" />
               </div>
               <div className="text-left flex-1 px-4">
                 <p className="text-sm font-bold text-ink-900">Keamanan Akses</p>
                 <p className="text-[10px] text-ink-400 font-medium mt-0.5">Ubah password akun secara berkala</p>
               </div>
               <ChevronRight className="w-5 h-5 text-ink-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
            </button>
         </div>

         <div className="bg-white rounded-3xl border border-surface-200 overflow-hidden shadow-sm p-2">
            <button 
              onClick={() => setConfirmLogout(true)}
              disabled={loggingOut}
              className="w-full flex items-center p-3 rounded-2xl hover:bg-rose-50 transition-colors group disabled:opacity-50"
            >
               <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-rose-500 group-hover:bg-red-100/50 transition-colors">
                 {loggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
               </div>
               <div className="text-left flex-1 px-2">
                 <p className="text-sm font-bold text-rose-600">{loggingOut ? 'Keluar...' : 'Keluar Akun'}</p>
               </div>
            </button>
         </div>

         {/* ── Confirm Logout Dialog (Mobile Style) ── */}
         {confirmLogout && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 pb-24">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setConfirmLogout(false)} />
             <div className="relative bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-500">
               <div className="flex flex-col items-center text-center">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-rose-50 flex items-center justify-center text-rose-500 mb-6 shadow-inner ring-1 ring-rose-100">
                   <LogOut className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-black text-ink-900 tracking-tight mb-2">Konfirmasi Logout</h3>
                 <p className="text-xs text-ink-400 font-medium leading-relaxed mb-8">
                   Apakah Anda yakin ingin keluar dari akun? Anda perlu login kembali untuk mengakses data koperasi.
                 </p>
                 <div className="grid grid-cols-2 gap-3 w-full">
                    <button 
                      onClick={() => setConfirmLogout(false)}
                      className="h-14 rounded-2xl border border-surface-200 text-ink-600 font-black text-[11px] uppercase tracking-widest hover:bg-surface-50 transition-all"
                    >
                      Batal
                    </button>
                    <button 
                      disabled={loggingOut}
                      onClick={async () => {
                        setLoggingOut(true)
                        await logout()
                        setLoggingOut(false)
                        setConfirmLogout(false)
                      }}
                      className="h-14 rounded-2xl bg-rose-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-rose-900/20 active:scale-95 transition-all flex items-center justify-center"
                    >
                      {loggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ya, Keluar'}
                    </button>
                 </div>
               </div>
             </div>
           </div>
         )}


         <p className="text-center text-[10px] font-bold text-ink-300 uppercase tracking-widest pt-4">
           Aplikasi Koperasi v1.0.0
         </p>

      </div>
    </div>
  )
}
