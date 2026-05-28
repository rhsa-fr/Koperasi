'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Layout, Loader2, Save, CheckCircle2, AlertCircle, Shapes, UserCheck, Zap,
  Eye, Settings2, Lock, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  GripVertical, Search, Filter
} from 'lucide-react'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'
import Toast, { ToastData } from '@/components/ui/Toast'
import Skeleton from '@/components/ui/Skeleton'
import IconRenderer from '@/components/layout/IconRenderer'
import MenuFormModal from '@/components/menus/MenuFormModal'
import DeleteMenuModal from '@/components/menus/DeleteMenuModal'

// ============================================================================
// Types & Constants
// ============================================================================

interface NavItem {
  id_sidebar: number
  label: string
  href: string
  icon: string
  section: string
  resource: string
  order_weight: number
  is_active: boolean
}

const SECTIONS = [
  { value: 'main',     label: 'Utama (Main)', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
  { value: 'data',     label: 'Data Master', icon: Shapes, color: 'text-blue-500', bg: 'bg-blue-50' },
  { value: 'keuangan', label: 'Keuangan', icon: Settings2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { value: 'report',   label: 'Laporan', icon: Layout, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { value: 'admin',    label: 'Administrator', icon: Lock, color: 'text-purple-500', bg: 'bg-purple-50' },
]

type TabMode = 'visibility' | 'crud'

// ============================================================================
// Main Page
// ============================================================================

export default function MenuManagementPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [menus, setMenus] = useState<NavItem[]>([])
  
  // Visibility State
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([])
  
  // Tab & CRUD State
  const [activeTab, setActiveTab] = useState<TabMode>('visibility')
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<NavItem | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<NavItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // UI State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [confirmSave, setConfirmSave] = useState(false)

  // 1. Fetch Basic Data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [rolesData, menusData] = await Promise.all([
        api.get<any[]>('/roles'),
        api.get<NavItem[]>('/sidebar/manage')
      ])
      
      const filteredRoles = rolesData.filter(r => r.name !== 'super_admin' && r.id_role !== 1)
      setRoles(filteredRoles)
      setMenus(menusData)
      
      if (filteredRoles.length > 0 && !selectedRoleId) {
        setSelectedRoleId(filteredRoles[0].id_role)
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Gagal memuat data' })
    } finally {
      setLoading(false)
    }
  }, [selectedRoleId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 2. Fetch Visibility Mapping
  useEffect(() => {
    if (selectedRoleId) {
      api.get<number[]>(`/sidebar/role/${selectedRoleId}`)
        .then(setSelectedMenuIds)
        .catch(() => setSelectedMenuIds([]))
    }
  }, [selectedRoleId])

  // 3. Handlers: Visibility
  const toggleVisibility = (menuId: number) => {
    setSelectedMenuIds(prev => 
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    )
  }

  const handleSaveVisibility = async () => {
    setConfirmSave(false)
    if (!selectedRoleId) return
    setSaving(true)
    try {
      await api.put(`/sidebar/role/${selectedRoleId}`, selectedMenuIds)
      setToast({ type: 'success', message: 'Visibilitas menu & izin akses disinkronkan!' })
      setTimeout(() => window.location.reload(), 2000)
    } catch (err) {
      setToast({ type: 'error', message: 'Gagal sinkronisasi data' })
      setSaving(false)
    }
  }

  // 4. CRUD Handlers
  const handleCreateMenu = async (data: Omit<NavItem, 'id_sidebar'>) => {
    try {
      await api.post('/sidebar', data)
      setToast({ type: 'success', message: 'Menu berhasil ditambahkan!' })
      await fetchData()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Gagal menambah menu' })
      throw err
    }
  }

  const handleUpdateMenu = async (data: Omit<NavItem, 'id_sidebar'>) => {
    if (!editItem) return
    try {
      await api.put(`/sidebar/${editItem.id_sidebar}`, data)
      setToast({ type: 'success', message: 'Menu berhasil diperbarui!' })
      await fetchData()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Gagal memperbarui menu' })
      throw err
    }
  }

  const handleDeleteMenu = async () => {
    if (!deleteItem) return
    try {
      await api.delete(`/sidebar/${deleteItem.id_sidebar}`)
      setToast({ type: 'success', message: `Menu "${deleteItem.label}" berhasil dihapus!` })
      await fetchData()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Gagal menghapus menu' })
    }
  }

  const handleToggleActive = async (item: NavItem) => {
    try {
      await api.put(`/sidebar/${item.id_sidebar}`, { is_active: !item.is_active })
      setToast({ type: 'success', message: `Menu "${item.label}" ${!item.is_active ? 'diaktifkan' : 'dinonaktifkan'}` })
      await fetchData()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Gagal mengubah status' })
    }
  }

  // Filter menus by search
  const filteredMenus = menus.filter(m =>
    !searchQuery || m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.resource.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-700">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* ── Header Area ── */}
      <div className="mb-8 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-600 animate-pulse" />
            <span className="text-[10px] font-black text-accent-600 uppercase tracking-[0.2em]">Sistem Arsitektur</span>
          </div>
          <h1 className="text-3xl font-black text-ink-900 tracking-tight">Manajemen Akses Menu</h1>
          <p className="text-ink-400 text-sm max-w-xl font-medium">
            Atur visibilitas sidebar, kelola master menu, dan sinkronisasi izin akses (RBAC).
          </p>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <button onClick={() => setActiveTab('visibility')}
          className={cn("px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
            activeTab === 'visibility' 
              ? "bg-gradient-to-r from-[#1A2F4A] to-[#2A7FC5] text-white shadow-lg" 
              : "bg-white border border-surface-200 text-ink-500 hover:bg-surface-50"
          )}>
          <div className="flex items-center gap-2"><Eye className="w-4 h-4" /> Visibilitas Role</div>
        </button>
        <button onClick={() => setActiveTab('crud')}
          className={cn("px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
            activeTab === 'crud' 
              ? "bg-gradient-to-r from-[#1A2F4A] to-[#2A7FC5] text-white shadow-lg" 
              : "bg-white border border-surface-200 text-ink-500 hover:bg-surface-50"
          )}>
          <div className="flex items-center gap-2"><Settings2 className="w-4 h-4" /> Kelola Master Menu</div>
        </button>
      </div>

      {/* ══════════ TAB: VISIBILITY ══════════ */}
      {activeTab === 'visibility' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left: Role Switcher ── */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-premium p-4 border-b-2 border-b-indigo-500/20">
              <h3 className="text-[10px] font-black text-ink-300 uppercase tracking-[0.2em] mb-4 px-1">Daftar Jabatan</h3>
              <div className="space-y-2">
                {loading ? (
                  Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
                ) : roles.map(r => (
                  <button key={r.id_role} onClick={() => setSelectedRoleId(r.id_role)}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl text-left transition-all duration-300 flex items-center justify-between group",
                      selectedRoleId === r.id_role 
                        ? "bg-gradient-premium text-white shadow-lg translate-x-1" 
                        : "bg-white border border-surface-200 text-ink-600 hover:bg-surface-50 hover:border-accent-400/30 shadow-sm"
                    )}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                        selectedRoleId === r.id_role ? "bg-white/10" : "bg-white border border-surface-200"
                      )}><UserCheck className="w-4 h-4" /></div>
                      <span className="text-sm font-bold capitalize tracking-tight">{r.name.replace('_', ' ')}</span>
                    </div>
                    {selectedRoleId === r.id_role && (
                      <div className="w-5 h-5 rounded-full bg-accent-400 text-white flex items-center justify-center animate-in zoom-in">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <button onClick={() => setConfirmSave(true)} disabled={saving || !selectedRoleId}
              className={cn("w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-xl",
                "bg-gradient-premium text-white shadow-accent-600/20",
                "hover:opacity-90 active:scale-95 disabled:opacity-50"
              )}>
              <div className="flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin text-white/70" /> : <Save className="w-4 h-4 text-white/70" />}
                <span>Sinkronkan Akun</span>
              </div>
            </button>
          </div>

          {/* ── Right: Menu Tiles ── */}
          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 gap-12">
              {SECTIONS.map((section, idx) => {
                const sectionMenus = menus.filter(m => m.section === section.value)
                if (sectionMenus.length === 0) return null
                return (
                  <div key={section.value} className={cn("space-y-4 animate-in slide-in-from-bottom duration-500")} style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex items-center gap-3 px-2">
                      <div className={cn("w-10 h-10 rounded-2xl shadow-premium flex items-center justify-center", section.bg, section.color)}>
                        <section.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-ink-900 tracking-tight leading-none">{section.label}</h3>
                        <p className="text-[10px] font-bold text-ink-300 uppercase tracking-widest mt-1">Grup Navigasi</p>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-surface-200 to-transparent ml-4" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {sectionMenus.map(m => (
                        <button key={m.id_sidebar} onClick={() => toggleVisibility(m.id_sidebar)}
                          className={cn(
                            "relative group p-5 rounded-[2rem] border-2 transition-all duration-500 text-left flex flex-col gap-6 overflow-hidden",
                            selectedMenuIds.includes(m.id_sidebar)
                              ? "bg-white border-accent-600 shadow-2xl ring-4 ring-accent-600/5 shadow-accent-600/10"
                              : "bg-white border-surface-100 shadow-sm hover:shadow-xl hover:border-accent-200"
                          )}>
                          <div className="flex items-center justify-between">
                            <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-700 shadow-lg",
                              selectedMenuIds.includes(m.id_sidebar) 
                                ? "bg-gradient-premium text-white rotate-6 scale-110" 
                                : "bg-surface-50 text-slate-400 group-hover:bg-accent-600 group-hover:text-white group-hover:rotate-6 shadow-sm"
                            )}><IconRenderer name={m.icon} className="w-7 h-7" /></div>
                            <div className={cn("w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-500",
                              selectedMenuIds.includes(m.id_sidebar) 
                                ? "bg-accent-600 border-accent-600 text-white scale-110 shadow-lg shadow-accent-600/30" 
                                : "border-surface-200 bg-white shadow-sm"
                            )}>{selectedMenuIds.includes(m.id_sidebar) && <CheckCircle2 className="w-5 h-5 fill-white/20" />}</div>
                          </div>
                          <div className="space-y-2">
                            <p className={cn("text-base font-black transition-colors tracking-tight", 
                              selectedMenuIds.includes(m.id_sidebar) ? "text-accent-950" : "text-ink-900"
                            )}>{m.label}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-ink-300 uppercase tracking-widest">{m.resource}</span>
                              <div className="w-1 h-1 rounded-full bg-surface-300" />
                              <span className="text-[10px] font-bold text-accent-500 font-mono tracking-tight">{m.href}</span>
                            </div>
                          </div>
                          <div className={cn("absolute -right-8 -bottom-8 w-32 h-32 opacity-[0.03] transition-all duration-700 pointer-events-none group-hover:scale-150 rotate-12",
                            selectedMenuIds.includes(m.id_sidebar) ? "text-accent-600 opacity-10" : "text-ink-400"
                          )}><IconRenderer name={m.icon} className="w-full h-full" /></div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ TAB: CRUD MASTER MENU ══════════ */}
      {activeTab === 'crud' && (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari menu..."
                className="w-full h-11 pl-11 pr-4 rounded-xl border border-surface-200 bg-white text-sm font-medium text-ink-800 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-all shadow-sm" />
            </div>
            <button onClick={() => { setEditItem(null); setFormOpen(true) }}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#1A2F4A] to-[#2A7FC5] text-white text-sm font-bold flex items-center gap-2 shadow-lg hover:opacity-90 active:scale-95 transition-all">
              <Plus className="w-4 h-4" /> Tambah Menu
            </button>
          </div>

          {/* Menu Cards by Section */}
          <div className="grid grid-cols-1 gap-10">
            {SECTIONS.map((section, idx) => {
              const sectionMenus = filteredMenus.filter(m => m.section === section.value)
              if (sectionMenus.length === 0) return null
              return (
                <div key={section.value} className="space-y-4 animate-in slide-in-from-bottom duration-500" style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className="flex items-center gap-3 px-2">
                    <div className={cn("w-10 h-10 rounded-2xl shadow-premium flex items-center justify-center", section.bg, section.color)}>
                      <section.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-ink-900 tracking-tight leading-none">{section.label}</h3>
                      <p className="text-[10px] font-bold text-ink-300 uppercase tracking-widest mt-1">{sectionMenus.length} menu</p>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-surface-200 to-transparent ml-4" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sectionMenus.map(m => (
                      <div key={m.id_sidebar}
                        className={cn(
                          "relative group bg-white rounded-2xl border-2 p-5 transition-all duration-300 hover:shadow-xl",
                          m.is_active ? "border-surface-100 hover:border-accent-200" : "border-rose-100 bg-rose-50/30 opacity-70"
                        )}>
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all",
                            m.is_active ? "bg-gradient-to-br from-[#1A2F4A] to-[#2A7FC5] text-white" : "bg-surface-100 text-ink-300"
                          )}>
                            <IconRenderer name={m.icon} className="w-6 h-6" />
                          </div>
                          
                          {/* Status Badge */}
                          <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                            m.is_active ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                          )}>
                            {m.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="mb-4">
                          <h4 className="text-base font-black text-ink-900 tracking-tight">{m.label}</h4>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-black text-ink-300 uppercase tracking-widest">{m.resource}</span>
                            <div className="w-1 h-1 rounded-full bg-surface-300" />
                            <span className="text-[10px] font-bold text-accent-500 font-mono">{m.href}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-medium text-ink-300">Urutan: {m.order_weight}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-3 border-t border-surface-100">
                          <button onClick={() => handleToggleActive(m)} title={m.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                              m.is_active 
                                ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" 
                                : "text-rose-500 bg-rose-50 hover:bg-rose-100"
                            )}>
                            {m.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            {m.is_active ? 'Aktif' : 'Off'}
                          </button>
                          <div className="flex-1" />
                          <button onClick={() => { setEditItem(m); setFormOpen(true) }} title="Edit"
                            className="p-2.5 rounded-xl text-ink-400 hover:text-accent-600 hover:bg-accent-50 transition-all">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setDeleteItem(m); setDeleteOpen(true) }} title="Hapus"
                            className="p-2.5 rounded-xl text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {filteredMenus.length === 0 && !loading && (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-surface-50 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-ink-300" />
                </div>
                <p className="text-sm font-bold text-ink-400">Tidak ada menu ditemukan</p>
                <p className="text-xs text-ink-300 mt-1">Coba ubah kata kunci pencarian</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <MenuFormModal
        open={formOpen}
        item={editItem}
        onClose={() => { setFormOpen(false); setEditItem(null) }}
        onSave={editItem ? handleUpdateMenu : handleCreateMenu}
      />

      <DeleteMenuModal
        open={deleteOpen}
        menuLabel={deleteItem?.label || ''}
        onClose={() => { setDeleteOpen(false); setDeleteItem(null) }}
        onConfirm={handleDeleteMenu}
      />

      {/* ── Save Confirmation Visibility ── */}
      {confirmSave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmSave(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-fade-in zoom-in duration-300 overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/5 rounded-full -mr-16 -mt-16" />
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-6 border border-indigo-100 shadow-sm">
              <Save className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-black text-ink-900 leading-none mb-2">Simpan Perubahan?</h3>
            <p className="text-sm font-medium text-ink-400 leading-relaxed mb-8">
              Sinkronkan visibilitas sidebar dan izin akses teknis untuk jabatan ini sekarang?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSave(false)} className="flex-1 h-12 rounded-xl text-xs font-bold text-ink-400 hover:bg-surface-50 transition-all">Batal</button>
              <button onClick={handleSaveVisibility} disabled={saving}
                className="flex-[2] h-12 rounded-xl bg-gradient-premium text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-accent-600/20 active:scale-95 transition-all">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                YA, TERAPKAN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
