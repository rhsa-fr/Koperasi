'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Layout, 
  Loader2, 
  Save, 
  CheckCircle2,
  AlertCircle,
  Shapes,
  UserCheck,
  Zap,
  Eye,
  Settings2,
  Lock
} from 'lucide-react'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'
import Toast, { ToastData } from '@/components/ui/Toast'
import Skeleton from '@/components/ui/Skeleton'
import IconRenderer from '@/components/layout/IconRenderer'

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

// ============================================================================
// Main Page
// ============================================================================

export default function MenuManagementPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [menus, setMenus] = useState<NavItem[]>([])
  
  // Visibility State
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([])
  
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
      // Delay for success feedback
      setTimeout(() => window.location.reload(), 2000)
    } catch (err) {
      setToast({ type: 'error', message: 'Gagal sinkronisasi data' })
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-700">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* ── Header Area ── */}
      <div className="mb-10 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-600 animate-pulse" />
            <span className="text-[10px] font-black text-accent-600 uppercase tracking-[0.2em]">Sistem Arsitektur</span>
          </div>
          <h1 className="text-3xl font-black text-ink-900 tracking-tight">Manajemen Akses Menu</h1>
          <p className="text-ink-400 text-sm max-w-xl font-medium">
            Atur visibilitas sidebar dan sinkronisasi izin akses (RBAC) untuk setiap jabatan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── Left: Role Switcher ── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-premium p-4 border-b-2 border-b-indigo-500/20">
            <h3 className="text-[10px] font-black text-ink-300 uppercase tracking-[0.2em] mb-4 px-1">Daftar Jabatan</h3>
            <div className="space-y-2">
              {loading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
              ) : roles.map(r => (
                <button
                  key={r.id_role}
                  onClick={() => setSelectedRoleId(r.id_role)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl text-left transition-all duration-300 flex items-center justify-between group",
                    selectedRoleId === r.id_role 
                      ? "bg-gradient-premium text-white shadow-lg translate-x-1" 
                      : "bg-white border border-surface-200 text-ink-600 hover:bg-surface-50 hover:border-accent-400/30 shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                      selectedRoleId === r.id_role ? "bg-white/10" : "bg-white border border-surface-200"
                    )}>
                      <UserCheck className="w-4 h-4" />
                    </div>
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
          
          <button 
            onClick={() => setConfirmSave(true)}
            disabled={saving || !selectedRoleId}
            className={cn(
              "w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-xl",
              "bg-gradient-premium text-white shadow-accent-600/20",
              "hover:opacity-90 active:scale-95 disabled:opacity-50"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin text-white/70" /> : <Save className="w-4 h-4 text-white/70" />}
              <span>Sinkronkan Akun</span>
            </div>
          </button>
        </div>

        {/* ── Right: Menu Tiles Filtering ── */}
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
                      <button
                        key={m.id_sidebar}
                        onClick={() => toggleVisibility(m.id_sidebar)}
                        className={cn(
                          "relative group p-5 rounded-[2rem] border-2 transition-all duration-500 text-left flex flex-col gap-6 overflow-hidden",
                          selectedMenuIds.includes(m.id_sidebar)
                            ? "bg-white border-accent-600 shadow-2xl ring-4 ring-accent-600/5 shadow-accent-600/10"
                            : "bg-white border-surface-100 shadow-sm hover:shadow-xl hover:border-accent-200"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className={cn(
                            "w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-700 shadow-lg",
                            selectedMenuIds.includes(m.id_sidebar) 
                              ? "bg-gradient-premium text-white rotate-6 scale-110" 
                              : "bg-surface-50 text-slate-400 group-hover:bg-accent-600 group-hover:text-white group-hover:rotate-6 shadow-sm"
                          )}>
                            <IconRenderer name={m.icon} className="w-7 h-7" />
                          </div>

                          <div className={cn(
                            "w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-500",
                            selectedMenuIds.includes(m.id_sidebar) 
                              ? "bg-accent-600 border-accent-600 text-white scale-110 shadow-lg shadow-accent-600/30" 
                              : "border-surface-200 bg-white shadow-sm"
                          )}>
                            {selectedMenuIds.includes(m.id_sidebar) && <CheckCircle2 className="w-5 h-5 fill-white/20" />}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className={cn(
                            "text-base font-black transition-colors tracking-tight", 
                            selectedMenuIds.includes(m.id_sidebar) ? "text-accent-950" : "text-ink-900"
                          )}>
                            {m.label}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-ink-300 uppercase tracking-widest">{m.resource}</span>
                            <div className="w-1 h-1 rounded-full bg-surface-300" />
                            <span className="text-[10px] font-bold text-accent-500 font-mono tracking-tight">{m.href}</span>
                          </div>
                        </div>

                        {/* Background Pattern */}
                        <div className={cn(
                            "absolute -right-8 -bottom-8 w-32 h-32 opacity-[0.03] transition-all duration-700 pointer-events-none group-hover:scale-150 rotate-12",
                            selectedMenuIds.includes(m.id_sidebar) ? "text-accent-600 opacity-10" : "text-ink-400"
                          )}>
                            <IconRenderer name={m.icon} className="w-full h-full" />
                          </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

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
              <button 
                onClick={handleSaveVisibility} 
                disabled={saving}
                className="flex-[2] h-12 rounded-xl bg-gradient-premium text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-accent-600/20 active:scale-95 transition-all"
              >
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
