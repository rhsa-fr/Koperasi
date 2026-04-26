'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Key, Save, Loader2, Plus, X } from 'lucide-react'
import Toast, { ToastData } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import RoleSelector from '@/components/roles/RoleSelector'
import PermissionMatrixWrapper from '@/components/roles/PermissionMatrix'
import { useRolesState } from '@/hooks/useRolesState'
import { useRoleAPI } from '@/hooks/useRoleAPI'
import { usePermissions } from '@/hooks/usePermissions'

// ============================================================================
// Constants
// ============================================================================

import { 
  MODULES, 
  ACTION_LABELS, 
  MODULE_LABELS, 
  ADMIN_ONLY_RESOURCES 
} from '@/components/roles/constants'

// ============================================================================
// Main Page
// ============================================================================

export default function RolesManagementPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')
  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [confirmSaveRole, setConfirmSaveRole] = useState(false)

  const rolesState = useRolesState()
  const { fetchRoles, fetchMenus, fetchRolePermissions, savePermissions, createRole } = useRoleAPI()
  const { togglePermission } = usePermissions()

  const {
    roles,
    setRoles,
    menus,
    setMenus,
    selectedRoleId,
    setSelectedRoleId,
    matrix,
    setMatrix,
    loading,
    setLoading,
    matrixLoading,
    setMatrixLoading,
    saving,
    setSaving,
    toast,
    setToast,
    error,
    setError,
    activeTab,
    setActiveTab,
    isReadOnly
  } = rolesState

  // Get visible modules based on role
  const visibleModules = MODULES.filter(m => {
    if (selectedRoleId !== 1) {
      return !ADMIN_ONLY_RESOURCES.includes(m)
    }
    return true
  })

  const hasInitializedTab = useRef(false)

  // 1. Fetch Basic Data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rolesData, menusData] = await Promise.all([fetchRoles(), fetchMenus()])
      setRoles(rolesData)
      setMenus(menusData)
      if (rolesData.length > 0) {
        setSelectedRoleId(rolesData[0].id_role)
      }
    } catch (err) {
      setError('Gagal memuat data role')
    } finally {
      setLoading(false)
    }
  }, [fetchRoles, fetchMenus, setRoles, setMenus, setSelectedRoleId, setLoading, setError])

  useEffect(() => {
    fetchData()
  }, [fetchData])
  // 2. Fetch Role Specific Permissions
  useEffect(() => {
    if (selectedRoleId && menus.length > 0) {
      const fetchPermissions = async () => {
        setMatrixLoading(true)
        try {
          const permMatrix = await fetchRolePermissions(selectedRoleId, menus)
          setMatrix(permMatrix)
        } catch (err) {
          setError('Gagal memuat matriks izin')
        } finally {
          setMatrixLoading(false)
        }
      }
      fetchPermissions()
    }
  }, [selectedRoleId, menus, fetchRolePermissions, setMatrix, setMatrixLoading, setError])

  // 3. Initialize active tab only once when visibleModules first has items
  useEffect(() => {
    if (visibleModules.length > 0 && !hasInitializedTab.current) {
      hasInitializedTab.current = true
      setActiveTab(visibleModules[0])
    }
  }, [visibleModules, setActiveTab])

  const handleTogglePermission = (module: string, action: string) => {
    togglePermission(matrix, module, action, setMatrix)
  }

  const handleSave = async () => {
    setConfirmSaveRole(false)
    if (!selectedRoleId) return
    setSaving(true)
    try {
      await savePermissions(selectedRoleId, matrix)
      setToast({ type: 'success', message: 'Izin fungsional berhasil diperbarui!' })
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Gagal menyimpan izin' })
    } finally {
      setSaving(false)
    }
  }

  const handleTabChange = (module: string) => {
    setActiveTab(module)
  }

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      setToast({ type: 'error', message: 'Nama role wajib diisi' })
      return
    }
    
    // Format name to underscore e.g. "Kepala Cabang" -> "kepala_cabang"
    const formattedName = newRoleName.trim().toLowerCase().replace(/\s+/g, '_')
    
    setIsCreatingRole(true)
    try {
      const newRole = await createRole(formattedName, newRoleDesc)
      setToast({ type: 'success', message: `Role ${newRole.name} berhasil dibuat!` })
      await fetchData() // refresh roles
      setSelectedRoleId(newRole.id_role)
      setIsAddModalOpen(false)
      setNewRoleName('')
      setNewRoleDesc('')
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Gagal membuat role' })
    } finally {
      setIsCreatingRole(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* ── Header Area (Ultra Simplified) ── */}
      <div className="mb-10 px-2 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-600 animate-pulse" />
            <span className="text-[10px] font-bold text-accent-600 uppercase tracking-[0.2em]">System Architect</span>
          </div>
          <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">Manajemen Role</h1>
          <p className="text-ink-400 text-sm max-w-xl font-medium">
            Kelola izin fungsional per jabatan untuk mengontrol akses fitur secara spesifik.
          </p>
        </div>

        <button
          onClick={() => setConfirmSaveRole(true)}
          disabled={saving || matrixLoading || isReadOnly}
          className={cn(
            "h-11 px-6 rounded-xl font-bold transition-all duration-300",
            "bg-gradient-premium text-white shadow-lg shadow-accent-600/20",
            "hover:opacity-90 active:scale-95 disabled:opacity-50"
          )}
        >
          <div className="flex items-center gap-3">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>{isReadOnly ? 'Role Terkunci' : 'Simpan Perubahan'}</span>
          </div>
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
        {/* Role List Sidebar */}
        <div className="lg:col-span-1">
          <RoleSelector
            roles={roles}
            selectedRoleId={selectedRoleId}
            loading={loading}
            onSelectRole={setSelectedRoleId}
            onAddRoleClick={() => setIsAddModalOpen(true)}
          />
        </div>

        {/* Permissions Matrix with Tabs */}
        <div className="lg:col-span-3">
          <PermissionMatrixWrapper
            modules={visibleModules}
            matrix={matrix}
            moduleLabels={MODULE_LABELS}
            actionLabels={ACTION_LABELS}
            activeTab={activeTab}
            matrixLoading={matrixLoading}
            saving={saving}
            isReadOnly={isReadOnly}
            onTabChange={handleTabChange}
            onTogglePermission={handleTogglePermission}
          />
        </div>
      </div>

      {/* Add Role Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent-950/40 backdrop-blur-md" onClick={() => !isCreatingRole && setIsAddModalOpen(false)} />
          <div className="relative bg-white/90 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-gradient-premium p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">Tambah Role</h3>
                    <p className="text-xs text-white/60 text-indigo-100">Buat kelompok akses baru</p>
                  </div>
                </div>
                <button onClick={() => !isCreatingRole && setIsAddModalOpen(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Role</label>
                <input 
                  type="text" 
                  placeholder="Misal: Sekretaris"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-white/50 text-ink-800 text-sm outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deskripsi (Opsional)</label>
                <input 
                  type="text" 
                  placeholder="Pencatat administrasi..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-white/50 text-ink-800 text-sm outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-surface-300 text-sm font-bold text-ink-600 hover:bg-surface-50 transition-all"
                  disabled={isCreatingRole}
                >
                  Batal
                </button>
                <button 
                  onClick={handleCreateRole}
                  disabled={isCreatingRole || !newRoleName.trim()}
                  className="flex-1 h-11 rounded-xl bg-accent-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-accent-700 transition-all disabled:opacity-50 shadow-lg shadow-accent-600/20"
                >
                  {isCreatingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Save Confirmation Modal ── */}
      {confirmSaveRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmSaveRole(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center shrink-0 border border-accent-100">
                <Save className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <span className="text-xs font-bold text-ink-800">Simpan Perubahan</span>
                <p className="text-[10px] uppercase font-bold tracking-wider text-ink-400 mt-0.5">Role {roles.find(r => r.id_role === selectedRoleId)?.name}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-ink-600 mb-6 leading-relaxed">
              Yakin ingin menyimpan perubahan pada matriks izin role ini? Akses pengguna terkait akan langsung terpengaruh.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmSaveRole(false)}
                className="flex-1 h-10 rounded-xl border border-surface-300 text-sm font-bold text-slate-500 hover:bg-surface-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 bg-gradient-premium shadow-md shadow-accent-600/20 active:scale-95"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Memproses...</>
                  : 'Ya, Simpan'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
