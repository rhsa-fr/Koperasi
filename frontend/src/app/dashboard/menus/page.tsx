'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Layout, Plus, Search, RefreshCw, Pencil, Trash2, 
  Settings, Loader2, Save, MoveUp, MoveDown, CheckCircle2,
  AlertCircle, X, ExternalLink
} from 'lucide-react'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import Toast, { ToastData } from '@/components/ui/Toast'
import Skeleton from '@/components/ui/Skeleton'
import IconRenderer from '@/components/layout/IconRenderer'

// ============================================================================
// Types
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
  { value: 'main',     label: 'Utama (Main)' },
  { value: 'data',     label: 'Data Master' },
  { value: 'keuangan', label: 'Keuangan' },
  { value: 'report',   label: 'Laporan' },
  { value: 'admin',    label: 'Administrator' },
]

const COMMON_ICONS = [
  'LayoutDashboard', 'Users', 'UserCircle', 'Wallet', 'PiggyBank', 
  'CreditCard', 'Receipt', 'FileBarChart2', 'Settings', 'UserCog', 
  'Key', 'History', 'Package', 'Box', 'PieChart', 'BarChart', 
  'Bell', 'Shield', 'FileText', 'Calendar', 'Home'
]

// ============================================================================
// Main Page
// ============================================================================

export default function MenuManagementPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [menus, setMenus] = useState<NavItem[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  
  // 1. Fetch Basic Data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [rolesData, menusData] = await Promise.all([
        api.get<any[]>('/roles'),
        api.get<NavItem[]>('/sidebar/manage')
      ])
      
      // Filter out Super Admin from manageable roles
      const filteredRoles = rolesData.filter(r => r.name !== 'super_admin' && r.id_role !== 1)
      
      setRoles(filteredRoles)
      setMenus(menusData)
      
      // Set default to first available role (usually 'admin')
      if (filteredRoles.length > 0) setSelectedRoleId(filteredRoles[0].id_role)
    } catch (err) {
      setToast({ type: 'error', message: 'Gagal memuat data' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 2. Fetch Visibility for Selected Role
  useEffect(() => {
    if (selectedRoleId) {
      // ── Admin-only UI ──
      api.get<number[]>(`/sidebar/role/${selectedRoleId}`)
        .then(setSelectedMenuIds)
        .catch(() => setSelectedMenuIds([]))
    }
  }, [selectedRoleId])

  const toggleVisibility = (menuId: number) => {
    setSelectedMenuIds(prev => 
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    )
  }

  const handleSave = async () => {
    if (!selectedRoleId) return
    setSaving(true)
    try {
      await api.put(`/sidebar/role/${selectedRoleId}`, selectedMenuIds)
      setToast({ type: 'success', message: 'Visibilitas menu berhasil diperbarui!' })
      // Auto-refresh after a short delay
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      setToast({ type: 'error', message: 'Gagal menyimpan konfigurasi' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-ink-800 flex items-center justify-center shadow-lg shadow-ink-800/20">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink-800">Manajemen Visibilitas Sidebar</h1>
            <p className="text-sm text-ink-400 mt-0.5">Atur menu yang muncul untuk setiap role pengguna</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="h-11 px-6 rounded-xl bg-ink-800 text-white font-bold flex items-center gap-2 hover:bg-ink-700 transition-all shadow-lg shadow-ink-800/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Konfigurasi
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-surface-300 shadow-card p-5">
             <h3 className="text-[10px] font-bold text-ink-300 uppercase tracking-widest mb-4">Pilih Role</h3>
             <div className="space-y-2">
                {loading ? (
                  Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
                ) : roles.map(r => (
                  <button
                    key={r.id_role}
                    onClick={() => setSelectedRoleId(r.id_role)}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl text-left transition-all flex items-center justify-between border",
                      selectedRoleId === r.id_role 
                        ? "bg-ink-800 border-ink-800 text-white shadow-lg shadow-ink-800/10" 
                        : "bg-surface-50 border-surface-300 text-ink-600 hover:bg-white hover:border-ink-800"
                    )}
                  >
                    <span className="text-sm font-bold capitalize">{r.name.replace('_', ' ')}</span>
                    {selectedRoleId === r.id_role && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                ))}
             </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
             <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
             <p className="text-[11px] text-amber-800 leading-relaxed">
               <strong>Catatan:</strong> Menu yang dicentang akan muncul di sidebar role tersebut. Pastikan konfigurasi sudah benar sebelum menyimpan.
             </p>
          </div>
        </div>

        {/* Menu Matrix */}
        <div className="lg:col-span-3">
           <div className="space-y-6">
              {SECTIONS.map(section => {
                const sectionMenus = menus.filter(m => 
                  m.section === section.value && 
                  !['users', 'roles', 'menus', 'audit'].includes(m.resource)
                )
                if (sectionMenus.length === 0) return null

                return (
                  <div key={section.value} className="space-y-3">
                    <h3 className="text-[10px] font-bold text-ink-300 uppercase tracking-[0.2em] px-2">{section.label}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {sectionMenus.map(m => (
                         <button
                           key={m.id_sidebar}
                           onClick={() => toggleVisibility(m.id_sidebar)}
                           className={cn(
                             "p-4 rounded-2xl border transition-all text-left flex items-center justify-between group",
                             selectedMenuIds.includes(m.id_sidebar)
                               ? "bg-emerald-50 border-emerald-500"
                               : "bg-white border-surface-300 hover:border-ink-800"
                           )}
                         >
                           <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                selectedMenuIds.includes(m.id_sidebar) ? "bg-emerald-500 text-white" : "bg-surface-50 text-ink-300 group-hover:bg-ink-800 group-hover:text-white"
                              )}>
                                 <IconRenderer name={m.icon} className="w-5 h-5" />
                              </div>
                              <div>
                                 <p className={cn("text-sm font-bold", selectedMenuIds.includes(m.id_sidebar) ? "text-emerald-900" : "text-ink-800")}>{m.label}</p>
                                 <p className="text-[10px] text-ink-400 mt-0.5">{m.href}</p>
                              </div>
                           </div>
                           <div className={cn(
                             "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                             selectedMenuIds.includes(m.id_sidebar) ? "bg-emerald-500 border-emerald-500 text-white" : "border-surface-200 bg-white"
                           )}>
                              {selectedMenuIds.includes(m.id_sidebar) && <CheckCircle2 className="w-3.5 h-3.5" />}
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
    </div>
  )
}
