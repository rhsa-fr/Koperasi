'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  UserCog, UserPlus, Search, RefreshCw, Pencil, Trash2, 
  ShieldCheck, ShieldAlert, CheckCircle2, X, Loader2,
  ChevronLeft, ChevronRight, AlertCircle, Clock, Users
} from 'lucide-react'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import Toast, { ToastData } from '@/components/ui/Toast'
import Skeleton from '@/components/ui/Skeleton'

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
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
      style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
    >
      {username.substring(0, 1).toUpperCase()}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    super_admin: 'bg-rose-100 text-rose-700 border-rose-200',
    admin:       'bg-violet-100 text-violet-700 border-violet-200',
    ketua:       'bg-blue-100 text-blue-700 border-blue-200',
    bendahara:   'bg-amber-100 text-amber-700 border-amber-200',
  }
  
  const cls = colors[role] || 'bg-slate-100 text-slate-700 border-slate-200'
  
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border', cls)}>
      {role.replace('_', ' ')}
    </span>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function UsersManagementPage() {
  const { user: currentUser, can } = useAuth()
  const canManage = can('users', 'update') || can('users', 'create')
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  
  const [editUser, setEditUser] = useState<UserData | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'admin' })
  const [saving, setSaving] = useState(false)

  const LIMIT = 10

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<PaginatedUsers>('/users') 
      setUsers(res.data)
      setTotal(res.meta.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar user')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

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

  const handleDeleteUser = async (u: UserData) => {
    if (!window.confirm(`Yakin ingin menghapus user ${u.username}?`)) return
    
    setSaving(true)
    try {
      await api.delete(`/users/${u.id_user}`)
      setToast({ type: 'success', message: `User ${u.username} berhasil dihapus` })
      fetchUsers()
    } catch (err: any) {
      setToast({ type: 'error', message: err.response?.data?.detail || 'Gagal menghapus user' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateUser = async (u: UserData, updates: Partial<UserData>) => {
    setSaving(true)
    try {
      await api.put(`/users/${u.id_user}`, updates)
      setToast({ type: 'success', message: `User ${u.username} berhasil diupdate` })
      fetchUsers()
      setEditUser(null)
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Gagal update user' })
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-ink-800 flex items-center justify-center shadow-lg shadow-ink-800/20">
            <UserCog className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink-800">Manajemen Pengguna</h1>
            <p className="text-sm text-ink-400 mt-0.5">Kelola hak akses dan status keaktifan user sistem</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
            <input
              type="text"
              placeholder="Cari user atau role..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
              className="pl-10 pr-4 h-10 w-full md:w-64 rounded-xl border border-surface-300 bg-white outline-none focus:ring-2 focus:ring-ink-800/10 focus:border-ink-800 transition-all text-sm"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="h-10 px-4 rounded-xl bg-ink-800 text-white font-bold flex items-center gap-2 hover:bg-ink-700 transition-all shadow-lg shadow-ink-800/20"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Pengguna</span>
          </button>
          <button 
            onClick={fetchUsers}
            className="w-10 h-10 rounded-xl border border-surface-300 bg-white flex items-center justify-center hover:bg-surface-50 transition-all text-ink-400"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total User', value: total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'User Aktif', value: users.filter(u => u.is_active).length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Menunggu Review', value: 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-surface-300 flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-800 leading-none">{stat.value}</p>
              <p className="text-xs text-ink-400 mt-1 font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-surface-300 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="px-6 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest">Pengguna</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest">Role / Jabatan</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest">Tgl Terdaftar</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-sm">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <UserCog className="w-12 h-12 text-ink-200" />
                      <p className="text-ink-400 font-medium">Tidak ada pengguna yang ditemukan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id_user} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar username={u.username} />
                        <div>
                          <p className="font-bold text-ink-800">{u.username}</p>
                          <p className="text-[10px] text-ink-300">ID: #{u.id_user}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", u.is_active ? "bg-emerald-500" : "bg-red-400")} />
                        <span className={cn("font-medium", u.is_active ? "text-emerald-600" : "text-red-500")}>
                          {u.is_active ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-ink-400">
                      {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditUser(u)}
                          className="p-2 rounded-lg text-ink-300 hover:bg-ink-800 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-ink-800/20"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {currentUser?.username !== u.username && (
                           <button 
                            onClick={() => handleDeleteUser(u)}
                            disabled={saving}
                            className="p-2 rounded-lg text-ink-300 hover:bg-red-500 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-red-500/20 disabled:opacity-50"
                            title="Hapus Pengguna"
                           >
                            <Trash2 className="w-4 h-4" />
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

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditUser(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-ink-800 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <UserCog className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">Edit Pengguna</h3>
                    <p className="text-xs text-white/60">Sesuaikan role dan status akses</p>
                  </div>
                </div>
                <button onClick={() => setEditUser(null)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-ink-300 uppercase tracking-widest">Username</label>
                <input 
                  type="text" 
                  disabled 
                  value={editUser.username}
                  className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-ink-400 text-sm italic"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-ink-300 uppercase tracking-widest">Jabatan / Role</label>
                <select 
                  value={editUser.role}
                  onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                  className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-white text-ink-800 text-sm outline-none focus:ring-2 focus:ring-ink-800/10 focus:border-ink-800"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="ketua">Ketua</option>
                  <option value="bendahara">Bendahara</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-50 border border-surface-200">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", editUser.is_active ? "bg-emerald-50" : "bg-red-50")}>
                    {editUser.is_active ? <ShieldCheck className="w-5 h-5 text-emerald-500" /> : <ShieldAlert className="w-5 h-5 text-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-800">Status Akun</p>
                    <p className="text-[10px] text-ink-300">{editUser.is_active ? 'Akses diperbolehkan' : 'Akses diblokir'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditUser({...editUser, is_active: !editUser.is_active})}
                  className={cn(
                    "w-12 h-6 rounded-full relative transition-all duration-300",
                    editUser.is_active ? "bg-emerald-500" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm",
                    editUser.is_active ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  onClick={() => setEditUser(null)}
                  className="flex-1 h-11 rounded-xl border border-surface-300 text-sm font-bold text-ink-600 hover:bg-surface-50 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={() => handleUpdateUser(editUser, { role: editUser.role, is_active: editUser.is_active })}
                  disabled={saving}
                  className="flex-1 h-11 rounded-xl bg-ink-800 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-ink-700 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-ink-800 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">Tambah Pengguna Baru</h3>
                    <p className="text-xs text-white/60">Buat akun untuk pengurus atau admin</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-ink-300 uppercase tracking-widest">Username / Email</label>
                <input 
                  type="text" 
                  placeholder="admin@koprasi.com"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-white text-ink-800 text-sm outline-none focus:ring-2 focus:ring-ink-800/10 focus:border-ink-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-ink-300 uppercase tracking-widest">Password Default</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-white text-ink-800 text-sm outline-none focus:ring-2 focus:ring-ink-800/10 focus:border-ink-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-ink-300 uppercase tracking-widest">Jabatan / Role</label>
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-white text-ink-800 text-sm outline-none focus:ring-2 focus:ring-ink-800/10 focus:border-ink-800"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="ketua">Ketua</option>
                  <option value="bendahara">Bendahara</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-11 rounded-xl border border-surface-300 text-sm font-bold text-ink-600 hover:bg-surface-50 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleCreateUser}
                  disabled={saving}
                  className="flex-1 h-11 rounded-xl bg-ink-800 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-ink-700 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat Akun'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
