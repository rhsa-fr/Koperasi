'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  UserCog, UserPlus, Search, RefreshCw, Pencil, Trash2, 
  ShieldCheck, ShieldAlert, CheckCircle2, X, Loader2,
  Users,
  Shield,
  Activity,
  UserCheck,
  AlertCircle
} from 'lucide-react'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import Toast, { ToastData } from '@/components/ui/Toast'
import Skeleton from '@/components/ui/Skeleton'
import PermissionMatrixWrapper from '@/components/roles/PermissionMatrix'
import { useRoleAPI } from '@/hooks/useRoleAPI'
import { usePermissions } from '@/hooks/usePermissions'
import { MODULES, MODULE_LABELS, ACTION_LABELS, ADMIN_ONLY_RESOURCES } from '@/components/roles/constants'

// ============================================================================
// Types
// ============================================================================

interface UserData {
  id_user: number
  username: string
  role: string
  is_active: boolean
  created_at: string
}

interface PaginatedUsers {
  data: UserData[]
  meta: {
    total: number
    skip: number
    limit: number
    page: number
    total_pages: number
  }
}

// ============================================================================
// Components
// ============================================================================

function UserAvatar({ username }: { username: string }) {
  return (
    <div 
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg overflow-hidden group relative"
      style={{ background: 'linear-gradient(135deg, #1A2F4A, #2A7FC5)' }}
    >
      <span className="relative z-10">{username.substring(0, 1).toUpperCase()}</span>
      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const configs: Record<string, { bg: string, text: string, border: string }> = {
    super_admin: { bg: 'bg-rose-50',     text: 'text-rose-600',   border: 'border-rose-100' },
    admin:       { bg: 'bg-violet-50',   text: 'text-violet-600', border: 'border-violet-100' },
    ketua:       { bg: 'bg-accent-50',  text: 'text-accent-600', border: 'border-accent-200' },
    bendahara:   { bg: 'bg-amber-50',    text: 'text-amber-600',  border: 'border-amber-200' },
    teler:       { bg: 'bg-emerald-50',  text: 'text-emerald-600',border: 'border-emerald-200' },
  }
  
  const theme = configs[role] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }
  
  return (
    <span className={cn(
      'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all',
      theme.bg, theme.text, theme.border
    )}>
      {role.replace('_', ' ')}
    </span>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function UsersManagementPage() {
  const { user: currentUser, can } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [toast, setToast] = useState<ToastData | null>(null)
  const [total, setTotal] = useState(0)
  
  const [rolesList, setRolesList] = useState<{name: string, description?: string}[]>([])
  const [editUser, setEditUser] = useState<UserData | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'admin' })
  const [saving, setSaving] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null)
  const [confirmSaveUser, setConfirmSaveUser] = useState(false)
  
  // Custom Permissions States
  const { fetchMenus, fetchUserPermissions, saveUserPermissions } = useRoleAPI()
  const { togglePermission } = usePermissions()
  const [menus, setMenus] = useState<any[]>([])
  const [permissionMatrix, setPermissionMatrix] = useState<any>({})
  const [activeTab, setActiveTab] = useState('dashboard')
  const [matrixLoading, setMatrixLoading] = useState(false)
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [editTab, setEditTab] = useState<'account' | 'permissions'>('account')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<PaginatedUsers>('/users') 
      setUsers(res.data)
      setTotal(res.meta.total)
    } catch (err) {
      setToast({ type: 'error', message: 'Gagal memuat daftar user' })
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRolesList = useCallback(async () => {
    try {
      const res = await api.get<any[]>('/roles')
      setRolesList(res || [])
    } catch (err) {
      console.error("Gagal memuat daftar role", err)
    }
  }, [])

  const fetchAllMenus = useCallback(async () => {
    try {
      const data = await fetchMenus()
      setMenus(data)
    } catch (err) {
      console.error("Gagal memuat data menu", err)
    }
  }, [fetchMenus])

  useEffect(() => {
    fetchUsers()
    fetchRolesList()
    fetchAllMenus()
  }, [fetchUsers, fetchRolesList, fetchAllMenus])

  // Fetch permissions when editing user
  useEffect(() => {
    if (editUser && menus.length > 0) {
      const loadUserPermissions = async () => {
        setMatrixLoading(true)
        try {
          const roleObj = rolesList.find(r => r.name === editUser.role)
          if (roleObj) {
            // @ts-ignore - id_role should exist in the roles object from backend
            const roleId = roleObj.id_role
            const matrix = await fetchUserPermissions(editUser.id_user, roleId, menus)
            setPermissionMatrix(matrix)
          }
        } catch (err) {
          console.error("Gagal memuat izin user", err)
        } finally {
          setMatrixLoading(false)
        }
      }
      loadUserPermissions()
      setEditTab('account') // Reset tab when opening modal
    }
  }, [editUser, menus, rolesList, fetchUserPermissions])

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) {
      setToast({ type: 'error', message: 'Username dan Password wajib diisi' })
      return
    }
    setSaving(true)
    try {
      await api.post('/users', newUser)
      setToast({ type: 'success', message: `User ${newUser.username} berhasil ditambahkan` })
      fetchUsers()
      setShowAddModal(false)
      setNewUser({ username: '', password: '', role: 'admin' })
    } catch (err: any) {
      setToast({ type: 'error', message: err.response?.data?.detail || 'Gagal menambahkan user' })
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return
    
    setSaving(true)
    try {
      await api.delete(`/users/${userToDelete.id_user}`)
      setToast({ type: 'success', message: `User ${userToDelete.username} berhasil dihapus` })
      fetchUsers()
    } catch (err: any) {
      setToast({ type: 'error', message: err.response?.data?.detail || 'Gagal menghapus user' })
    } finally {
      setSaving(false)
      setUserToDelete(null)
    }
  }

  const executeSaveUser = async () => {
    setConfirmSaveUser(false)
    if (editTab === 'account') {
      await handleUpdateUser(editUser!, { role: editUser!.role, is_active: editUser!.is_active })
    } else {
      await handleSaveOnlyPermissions()
    }
  }

  const handleUpdateUser = async (u: UserData, updates: Partial<UserData>) => {
    setSaving(true)
    try {
      await api.put(`/users/${u.id_user}`, updates)
      
      // If we are in permissions tab, save permissions as well
      if (editTab === 'permissions') {
         setSavingPermissions(true)
         try {
            const roleObj = rolesList.find(r => r.name === u.role)
            if (roleObj) {
               // @ts-ignore
               await saveUserPermissions(u.id_user, roleObj.id_role, permissionMatrix)
            }
         } finally {
            setSavingPermissions(false)
         }
      }

      setToast({ type: 'success', message: `User ${u.username} berhasil diupdate` })
      fetchUsers()
      setEditUser(null)
    } catch (err: any) {
      setToast({ type: 'error', message: err.response?.data?.detail || err.message || 'Gagal update user' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveOnlyPermissions = async () => {
    if (!editUser) return
    setSavingPermissions(true)
    try {
        const roleObj = rolesList.find(r => r.name === editUser.role)
        if (roleObj) {
            // @ts-ignore
            await saveUserPermissions(editUser.id_user, roleObj.id_role, permissionMatrix)
            setToast({ type: 'success', message: 'Izin kustom berhasil disimpan!' })
        }
    } catch (err: any) {
        setToast({ type: 'error', message: err.message || 'Gagal menyimpan izin' })
    } finally {
        setSavingPermissions(false)
    }
  }

  const handleToggleUserPermission = (module: string, action: string) => {
    togglePermission(permissionMatrix, module, action, setPermissionMatrix)
  }

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* ── Header Area (Ultra Simplified) ── */}
      <div className="mb-10 px-2 flex flex-col md:flex-row md:items-end justify-between gap-6 overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-600 animate-pulse" />
            <span className="text-[10px] font-bold text-accent-600 uppercase tracking-[0.2em]">System Architect</span>
          </div>
          <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">Manajemen Pengguna</h1>
          <p className="text-ink-400 text-sm max-w-xl font-medium">
            Kelola entitas pengguna, peran jabatan, dan status akses sistem secara tersentralisasi.
          </p>
        </div>

        <div className="flex items-center gap-3">
           <button 
              onClick={() => setShowAddModal(true)}
              className="h-11 px-6 rounded-xl bg-gradient-premium text-white font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all shadow-md shadow-accent-600/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pengguna</span>
            </button>
              <button 
                onClick={fetchUsers}
                className="w-11 h-11 rounded-xl bg-white border border-surface-200 text-ink-400 flex items-center justify-center hover:bg-surface-50 transition-all hover:rotate-180 duration-500 shadow-sm"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>
          </div>
        </div>

      {/* ── Stats Summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total User', value: total, icon: Users, color: 'text-accent-600', bg: 'bg-accent-50' },
          { label: 'User Aktif', value: users.filter(u => u.is_active).length, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'User Non-Aktif', value: users.filter(u => !u.is_active).length, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-white/40 shadow-premium flex items-center gap-5 group hover:scale-[1.02] transition-all duration-300">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6", stat.bg)}>
              <stat.icon className={cn("w-7 h-7", stat.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-800 leading-none">{stat.value}</p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase tracking-wider leading-none">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter ── */}
      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent-400 transition-colors" />
        <input
          type="text"
          placeholder="Cari nama pengguna atau jabatan..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
          className="w-full pl-12 pr-4 h-12 rounded-2xl border border-surface-200 bg-white/80 backdrop-blur-md outline-none focus:border-accent-400 focus:ring-4 focus:ring-accent-400/5 transition-all text-sm font-medium shadow-premium"
        />
      </div>

      {/* ── Users Table ── */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-premium overflow-hidden animate-in slide-in-from-bottom duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-50/50 border-b border-surface-100">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pengguna</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role / Jabatan</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Akses</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tgl Terdaftar</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50 text-sm">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-5"><Skeleton className="h-5 w-40 rounded-lg" /></td>
                    <td className="px-8 py-5"><Skeleton className="h-7 w-24 rounded-lg" /></td>
                    <td className="px-8 py-5"><Skeleton className="h-5 w-20 rounded-lg" /></td>
                    <td className="px-8 py-5"><Skeleton className="h-5 w-32 rounded-lg" /></td>
                    <td className="px-8 py-5 text-right"><Skeleton className="h-10 w-20 ml-auto rounded-xl" /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center">
                        <Users className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-sm font-bold tracking-tight">Tidak ada pengguna yang terdaftar</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id_user} className="hover:bg-surface-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <UserAvatar username={u.username} />
                        <div>
                          <p className="font-semibold text-ink-800 tracking-tight">{u.username}</p>
                          <p className="text-[10px] text-slate-400 font-medium tracking-wider">ID: 00{u.id_user}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", u.is_active ? "bg-emerald-500 animate-pulse" : "bg-rose-400")} />
                        <span className={cn("text-xs font-semibold", u.is_active ? "text-emerald-600" : "text-rose-500")}>
                          {u.is_active ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-400 font-medium text-xs">
                      {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditUser(u)}
                          className="w-10 h-10 rounded-xl text-slate-400 hover:bg-accent-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                        >
                          <Pencil className="w-4.5 h-4.5" />
                        </button>
                        {currentUser?.username !== u.username && (
                           <button 
                            onClick={() => setUserToDelete(u)}
                            disabled={saving}
                            className="w-10 h-10 rounded-xl text-slate-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center justify-center disabled:opacity-20"
                           >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit User Modal ── */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent-950/40 backdrop-blur-md" onClick={() => setEditUser(null)} />
          <div className="relative bg-white/90 backdrop-blur-3xl border border-white/40 rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col md:flex-row">
            
            {/* ── Top-right Close Button ── */}
            <button 
              onClick={() => setEditUser(null)}
              className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-ink-900 md:text-ink-400 flex items-center justify-center transition-all backdrop-blur-md border border-white/20"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Left Side: Account Info */}
            <div className="w-full md:w-80 bg-gradient-to-b from-accent-900 to-accent-950 p-8 text-white flex flex-col shrink-0">
               <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center mx-auto mb-6 border border-white/10 backdrop-blur-md">
                  <UserCog className="w-10 h-10 text-white" />
               </div>
               <h3 className="text-xl font-bold tracking-tight text-center">Edit Pengguna</h3>
               <p className="text-[10px] text-white/50 mt-1 uppercase tracking-wider font-bold text-center mb-8">Role: {editUser.role}</p>

               <div className="space-y-4 flex-1">
                  <button 
                    onClick={() => setEditTab('account')}
                    className={cn(
                      "w-full h-12 rounded-2xl flex items-center gap-4 px-5 transition-all duration-300 font-bold text-sm",
                      editTab === 'account' ? "bg-white text-accent-900 shadow-xl" : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Activity className="w-5 h-5" />
                    <span>Data Akun</span>
                  </button>
                  <button 
                    onClick={() => setEditTab('permissions')}
                    className={cn(
                      "w-full h-12 rounded-2xl flex items-center gap-4 px-5 transition-all duration-300 font-bold text-sm",
                      editTab === 'permissions' ? "bg-white text-accent-900 shadow-xl" : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Shield className="w-5 h-5" />
                    <span>Izin Kustom</span>
                  </button>
               </div>

               <div className="pt-8 border-t border-white/10 space-y-3">
                  <button 
                    onClick={() => setConfirmSaveUser(true)}
                    disabled={saving || savingPermissions}
                    className="w-full h-12 rounded-2xl bg-gradient-premium text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-accent-950/50"
                  >
                    {saving || savingPermissions ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>SIMPAN PERUBAHAN</span>
                  </button>
               </div>
            </div>

            {/* Right Side: Tab Content */}
            <div className="flex-1 bg-surface-50/50 p-8 overflow-y-auto">
               {editTab === 'account' ? (
                  <div className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-right duration-500">
                    <div>
                      <h4 className="text-xl font-bold text-ink-800 tracking-tight mb-1">Informasi Akun</h4>
                      <p className="text-xs text-slate-400 font-medium">Update kredensial dan status akses pengguna</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">ID Pengguna</label>
                        <div className="h-14 px-5 rounded-2xl border border-surface-200 bg-white flex items-center text-ink-800 text-sm font-medium shadow-sm">
                          {editUser.username}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Ganti Password (Opsional)</label>
                        <input 
                          type="password" 
                          placeholder="Kosongkan jika tidak ingin mengubah"
                          onChange={(e) => setEditUser({...editUser, password: e.target.value} as any)}
                          className="w-full h-14 px-5 rounded-2xl border border-surface-200 bg-white text-ink-800 text-sm font-medium outline-none focus:border-accent-400 focus:ring-4 focus:ring-accent-400/5 transition-all shadow-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Target Jabatan / Role</label>
                        <select 
                          value={editUser.role}
                          onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                          className="w-full h-14 px-5 rounded-2xl border border-surface-200 bg-white text-ink-800 text-sm font-medium outline-none focus:border-accent-400 focus:ring-4 focus:ring-accent-400/5 transition-all shadow-sm"
                        >
                          {rolesList.filter(r => r.name !== 'super_admin' || editUser.role === 'super_admin').map(r => (
                            <option key={r.name} value={r.name}>
                              {r.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="p-6 rounded-3xl bg-white border border-surface-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", editUser.is_active ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500")}>
                            {editUser.is_active ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-ink-800 leading-none">Status Autentikasi</p>
                            <p className={cn("text-[10px] font-bold mt-1.5", editUser.is_active ? 'text-emerald-500' : 'text-rose-500')}>
                              {editUser.is_active ? 'AKSES DIBERIKAN' : 'AKSES DICABUT'}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setEditUser({...editUser, is_active: !editUser.is_active})}
                          className={cn(
                            "w-14 h-7 rounded-full relative transition-all duration-500 p-1",
                            editUser.is_active ? "bg-emerald-500" : "bg-slate-300"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-500 transform",
                            editUser.is_active ? "translate-x-7" : "translate-x-0"
                          )} />
                        </button>
                      </div>
                    </div>
                  </div>
               ) : (
                  <div className="h-full flex flex-col animate-in fade-in slide-in-from-left duration-500">
                    <div className="mb-6">
                      <h4 className="text-xl font-bold text-ink-800 tracking-tight mb-1">Izin Kustom (Override)</h4>
                      <p className="text-xs text-slate-400 font-medium">Beri izin spesifik yang melampaui standar Role</p>
                    </div>

                    <div className="flex-1 min-h-0">
                      <PermissionMatrixWrapper
                        modules={MODULES.filter(m => {
                           if (editUser.role !== 'super_admin') {
                              return !ADMIN_ONLY_RESOURCES.includes(m)
                           }
                           return true
                        })}
                        matrix={permissionMatrix}
                        moduleLabels={MODULE_LABELS}
                        actionLabels={ACTION_LABELS}
                        activeTab={activeTab}
                        matrixLoading={matrixLoading}
                        saving={savingPermissions}
                        isReadOnly={false}
                        onTabChange={setActiveTab}
                        onTogglePermission={handleToggleUserPermission}
                      />
                    </div>
                  </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add User Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent-950/40 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white/90 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* ── Top-right Close Button ── */}
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="bg-gradient-premium p-8 text-white text-center">
               <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 border border-white/10 backdrop-blur-md">
                  <UserPlus className="w-8 h-8 text-white" />
               </div>
               <h3 className="text-xl font-bold tracking-tight">Pengguna Baru</h3>
               <p className="text-xs text-white/60 mt-1 uppercase tracking-wider font-bold">Registrasi Akses Sistem</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID Pengguna (Email/Username)</label>
                <input 
                  type="text" 
                  placeholder="admin@koperasi.id"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full h-12 px-4 rounded-xl border border-surface-200 bg-white text-ink-800 text-sm font-medium outline-none focus:border-accent-400 focus:ring-4 focus:ring-accent-400/5 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kata Sandi Default</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full h-12 px-4 rounded-xl border border-surface-200 bg-white text-ink-800 text-sm font-medium outline-none focus:border-accent-400 focus:ring-4 focus:ring-accent-400/5 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penugasan Jabatan</label>
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full h-12 px-4 rounded-xl border border-surface-200 bg-white text-ink-800 text-sm font-medium outline-none focus:border-accent-400 focus:ring-4 focus:ring-accent-400/5 transition-all"
                >
                  <option value="" disabled>Pilih Role</option>
                  {rolesList.filter(r => r.name !== 'super_admin').map(r => (
                    <option key={r.name} value={r.name}>
                      {r.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleCreateUser}
                  disabled={saving}
                  className="w-full h-12 rounded-xl bg-accent-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-accent-700 transition-all shadow-lg shadow-accent-600/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Daftarkan User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setUserToDelete(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <span className="text-xs font-bold text-ink-800">Hapus Pengguna</span>
                <p className="text-[10px] uppercase font-bold tracking-wider text-ink-400 mt-0.5">{userToDelete.username}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-ink-600 mb-6 leading-relaxed">
              Yakin ingin menghapus pengguna ini? Akses pengguna ke dalam sistem akan dihentikan secara permanen.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 h-10 rounded-xl border border-surface-300 text-sm font-bold text-slate-500 hover:bg-surface-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={saving}
                className="flex-1 h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Menghapus...</>
                  : 'Ya, Hapus'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save Confirmation Modal ── */}
      {confirmSaveUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmSaveUser(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center shrink-0 border border-accent-100">
                <CheckCircle2 className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <span className="text-xs font-bold text-ink-800">Simpan Perubahan</span>
                <p className="text-[10px] uppercase font-bold tracking-wider text-ink-400 mt-0.5">{editUser?.username}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-ink-600 mb-6 leading-relaxed">
              Yakin ingin menyimpan perubahan informasi dan hak akses pada pengguna ini?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmSaveUser(false)}
                className="flex-1 h-10 rounded-xl border border-surface-300 text-sm font-bold text-slate-500 hover:bg-surface-50 transition-all"
              >
                Kembali
              </button>
              <button
                onClick={executeSaveUser}
                disabled={saving || savingPermissions}
                className="flex-1 h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 bg-gradient-premium shadow-md shadow-accent-600/20 active:scale-95"
              >
                {(saving || savingPermissions)
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
