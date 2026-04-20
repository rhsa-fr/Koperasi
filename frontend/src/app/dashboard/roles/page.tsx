'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Key, ShieldCheck, Lock, Unlock, Search, RefreshCw, 
  Settings, Loader2, AlertCircle, CheckCircle2, X,
  Layout, Save, Shield
} from 'lucide-react'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'
import Toast, { ToastData } from '@/components/ui/Toast'
import Skeleton from '@/components/ui/Skeleton'

// ============================================================================
// Types
// ============================================================================

interface Role {
  id_role: number
  name: string
  description: string
  is_active: boolean
}

interface Menu {
  id_permission: number
  menu: string
  action: string
  description?: string
}

interface PermissionMatrix {
  [module: string]: {
    [action: string]: {
      id: number
      granted: boolean
    }
  }
}

// ============================================================================
// Constants
// ============================================================================

const MODULES = [
  'users', 'anggota', 'profil_anggota', 'jenis_simpanan', 
  'simpanan', 'pinjaman', 'angsuran', 'laporan', 'dashboard',
  'audit', 'rbac', 'roles'
]

const ACTIONS = [
  'read', 'create', 'update', 'delete', 'export', 
  'setor', 'tarik', 'bayar', 'approve', 'reject', 'verify'
]

const HIDDEN_ACTIONS = ['approve', 'reject']
const DISPLAY_ACTIONS = ACTIONS.filter(a => !HIDDEN_ACTIONS.includes(a))

const ACTION_LABELS: Record<string, string> = {
  read: 'Lihat', create: 'Tambah', update: 'Ubah', delete: 'Hapus', export: 'Ekspor',
  setor: 'Setor', tarik: 'Tarik', bayar: 'Bayar', verify: 'Verifikasi'
}

// ============================================================================
// Main Page
// ============================================================================

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [matrix, setMatrix] = useState<PermissionMatrix>({})
  const [loading, setLoading] = useState(true)
  const [matrixLoading, setMatrixLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const isReadOnly = selectedRoleId === 1 // ID 1 is Super Admin

  // 1. Fetch Basic Data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rolesData, menusData] = await Promise.all([
        api.get<Role[]>('/roles'),
        api.get<Menu[]>('/roles/menus') // We need to create this endpoint or handle it
      ])
      setRoles(rolesData)
      setMenus(menusData)
      if (rolesData.length > 0) setSelectedRoleId(rolesData[0].id_role)
    } catch (err) {
      // Fallback if menus endpoint doesn't exist yet
      try {
        const rolesData = await api.get<Role[]>('/roles')
        setRoles(rolesData)
        if (rolesData.length > 0) setSelectedRoleId(rolesData[0].id_role)
      } catch (inner) {
        setError('Gagal memuat data role')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 2. Fetch Role Specific Permissions
  const fetchRolePermissions = useCallback(async (roleId: number) => {
    if (menus.length === 0) return
    setMatrixLoading(true)
    try {
      const newMatrix: PermissionMatrix = {}
      
      // Initialize matrix with ALL possible combinations from the menus list
      menus.forEach(item => {
        if (!newMatrix[item.menu]) newMatrix[item.menu] = {}
        newMatrix[item.menu][item.action] = { id: item.id_permission, granted: false }
      })

      // Fetch currently assigned permissions for this role
      try {
        const rolePermissions = await api.get<any[]>(`/roles/${roleId}/permissions`)
        rolePermissions.forEach(p => {
          // Find by menu and action names returned from the permissions endpoint
          if (newMatrix[p.menu] && newMatrix[p.menu][p.action]) {
            newMatrix[p.menu][p.action].granted = true
          }
        })
      } catch (err) {
        console.warn('Failed to fetch role permissions', err)
      }

      setMatrix(newMatrix)
    } catch (err) {
      console.error(err)
      setError('Gagal memuat matriks izin')
    } finally {
      setMatrixLoading(false)
    }
  }, [menus])

  useEffect(() => {
    if (selectedRoleId && menus.length > 0) fetchRolePermissions(selectedRoleId)
  }, [selectedRoleId, menus, fetchRolePermissions])

  const togglePermission = (module: string, action: string) => {
    setMatrix(prev => {
      // 1. Immutable copy of the matrix
      const newMatrix = { ...prev }
      
      // 2. Immutable copy of the module
      const newModule = { ...prev[module] }
      
      if (action === 'verify') {
        // Toggle BOTH approve and reject if they exist
        const hasApprove = !!newModule['approve']
        const hasReject = !!newModule['reject']
        
        if (hasApprove || hasReject) {
          const isCurrentlyGranted = (hasApprove && newModule['approve'].granted) || (hasReject && newModule['reject'].granted)
          const targetValue = !isCurrentlyGranted
          
          if (hasApprove) newModule['approve'] = { ...newModule['approve'], granted: targetValue }
          if (hasReject) newModule['reject'] = { ...newModule['reject'], granted: targetValue }
        }
      } else if (newModule[action]) {
        // 3. Immutable copy of the action
        newModule[action] = {
          ...newModule[action],
          granted: !newModule[action].granted
        }
      }
      
      newMatrix[module] = newModule
      return newMatrix
    })
  }

  const handleSave = async () => {
    if (!selectedRoleId) return
    setSaving(true)
    try {
      const permissions: { menu: string, actions: string[] }[] = []
      
      // Get all modules present in current matrix
      const moduleNames = Object.keys(matrix)
      
      for (const module of moduleNames) {
        const grantedActions = Object.keys(matrix[module]).filter(a => matrix[module][a].granted)
        if (grantedActions.length > 0) {
          permissions.push({ menu: module, actions: grantedActions })
        }
      }

      await api.put(`/roles/${selectedRoleId}/permissions`, { permissions })
      setToast({ type: 'success', message: 'Izin fungsional berhasil diperbarui!' })
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Gagal menyimpan izin' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-ink-800 flex items-center justify-center shadow-lg shadow-ink-800/20">
            <Key className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink-800">Manajemen Role & Izin</h1>
            <p className="text-sm text-ink-400 mt-0.5">Konfigurasi matrix hak akses aplikasi secara real-time</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving || matrixLoading || isReadOnly}
          className="h-11 px-6 rounded-xl bg-ink-800 text-white font-bold flex items-center gap-2 hover:bg-ink-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-ink-800/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isReadOnly ? 'Role Terkunci' : 'Simpan Perubahan'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-surface-300 shadow-card p-5">
            <h3 className="text-[10px] font-bold text-ink-300 uppercase tracking-widest mb-4">Pilih Role</h3>
            <div className="space-y-2">
              {loading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
              ) : (
                roles.map(r => (
                  <button
                    key={r.id_role}
                    onClick={() => setSelectedRoleId(r.id_role)}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl text-left transition-all flex items-center justify-between group border",
                      selectedRoleId === r.id_role 
                        ? "bg-ink-800 border-ink-800 text-white shadow-lg shadow-ink-800/10" 
                        : "bg-surface-50 border-surface-300 text-ink-600 hover:bg-white hover:border-ink-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className={cn("w-4 h-4", selectedRoleId === r.id_role ? "text-white" : "text-ink-400")} />
                      <span className="text-sm font-bold capitalize">{r.name.replace('_', ' ')}</span>
                    </div>
                    {selectedRoleId === r.id_role && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                ))
              )}
            </div>
          </div>

          {isReadOnly ? (
            <div className="bg-ink-800 rounded-2xl border border-ink-700 p-5 shadow-lg shadow-ink-800/10">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Akses Permanen</h4>
                  <p className="text-[10px] text-ink-300 mt-1 leading-relaxed">
                    Role Super Admin memiliki akses penuh ke semua fitur sistem secara permanen untuk menjamin ketersediaan akses administratif utama.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Catatan:</strong> Perubahan pada matrix ini akan berdampak langsung pada tampilan menu user yang bersangkutan setelah mereka melakukan refresh atau login ulang.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-surface-300 shadow-card overflow-hidden">
            <div className="p-6 border-b border-surface-200 flex items-center justify-between bg-surface-50">
               <div className="flex items-center gap-3">
                  <Layout className="w-5 h-5 text-ink-800" />
                  <h2 className="text-sm font-bold text-ink-800">Permission Matrix</h2>
               </div>
               {selectedRoleId && (
                 <span className="px-3 py-1 rounded-full bg-ink-800 text-white text-[10px] font-bold uppercase tracking-wider">
                   Role: {roles.find(r => r.id_role === selectedRoleId)?.name}
                 </span>
               )}
            </div>

            <div className="overflow-x-auto">
              {matrixLoading ? (
                <div className="aspect-video flex flex-col items-center justify-center gap-3 bg-surface-50">
                  <Loader2 className="w-8 h-8 animate-spin text-ink-800" />
                  <p className="text-sm text-ink-400 font-medium">Memuat konfigurasi izin...</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-white border-b border-surface-200">
                      <th className="px-6 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest">Modul / Resource</th>
                      {DISPLAY_ACTIONS.map(a => (
                        <th key={a} className="px-4 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest text-center">
                          {ACTION_LABELS[a]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 italic">
                    {Object.keys(matrix).sort().map(m => (
                      <tr key={m} className="hover:bg-surface-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 rounded-full bg-ink-800/10" />
                            <span className="text-sm font-bold text-ink-800 capitalize">{m.replace('_', ' ')}</span>
                          </div>
                        </td>
                        {DISPLAY_ACTIONS.map(a => (
                          <td key={a} className="px-4 py-4 text-center">
                              {a === 'verify' ? (
                                // Virtual Verification Column
                                (matrix[m]?.['approve'] || matrix[m]?.['reject']) ? (
                                  <button
                                    disabled={saving || isReadOnly}
                                    onClick={() => togglePermission(m, 'verify')}
                                    className={cn(
                                      "mx-auto w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border-2 active:scale-90",
                                      ((matrix[m]?.['approve']?.granted) || (matrix[m]?.['reject']?.granted))
                                        ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm shadow-emerald-500/10" 
                                        : "bg-surface-50 border-surface-300 text-ink-300 hover:border-ink-800 hover:bg-white",
                                      isReadOnly && "opacity-40 cursor-not-allowed grayscale"
                                    )}
                                  >
                                    {((matrix[m]?.['approve']?.granted) || (matrix[m]?.['reject']?.granted)) ? (
                                      <ShieldCheck className="w-5 h-5 animate-in zoom-in duration-300" />
                                    ) : (
                                      <Shield className="w-4 h-4" />
                                    )}
                                  </button>
                                ) : (
                                  <div className="w-10 h-10 mx-auto rounded-xl bg-surface-50/50 border border-dashed border-surface-200" />
                                )
                              ) : matrix[m]?.[a] ? (
                                <button
                                  disabled={saving || isReadOnly}
                                  onClick={() => togglePermission(m, a)}
                                  className={cn(
                                    "mx-auto w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border-2 active:scale-90",
                                    matrix[m][a].granted 
                                      ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm shadow-emerald-500/10" 
                                      : "bg-surface-50 border-surface-300 text-ink-300 hover:border-ink-800 hover:bg-white",
                                    isReadOnly && "opacity-40 cursor-not-allowed grayscale"
                                  )}
                                >
                                  {matrix[m][a].granted ? (
                                    <ShieldCheck className="w-5 h-5 animate-in zoom-in duration-300" />
                                  ) : (
                                    <Shield className="w-4 h-4" />
                                  )}
                                </button>
                              ) : (
                                <div className="w-10 h-10 mx-auto rounded-xl bg-surface-50/50 border border-dashed border-surface-200" />
                              )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-6 bg-surface-50 border-t border-surface-200 text-right">
               <p className="text-xs text-ink-300 mb-2 italic">Periksa kembali setiap izin sebelum menekan tombol simpan.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
