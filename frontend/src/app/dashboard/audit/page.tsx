'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  History, Search, RefreshCw, Clock, User, 
  Shield, Activity, Loader2, AlertCircle, Calendar
} from 'lucide-react'
import { api } from '@/lib/axios'
import { cn } from '@/lib/utils'
import Skeleton from '@/components/ui/Skeleton'

interface AuditLog {
  id_audit: number
  user_id: number
  username: string
  role: string
  action: string
  resource: string
  target_id?: number
  details?: any
  timestamp: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<AuditLog[]>('/roles/audit/logs')
      setLogs(data)
    } catch (err) {
      // If endpoint doesn't return data yet, fallback to empty
      setLogs([])
      setError(err instanceof Error ? err.message : 'Gagal memuat audit logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const filteredLogs = logs.filter(log => 
    log.username.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.resource.toLowerCase().includes(search.toLowerCase())
  )

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
      case 'update': return 'bg-blue-50 text-blue-600 border-blue-100'
      case 'delete': return 'bg-rose-50 text-rose-600 border-rose-100'
      case 'assign': return 'bg-violet-50 text-violet-600 border-violet-100'
      default: return 'bg-slate-50 text-slate-600 border-slate-100'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-ink-800 flex items-center justify-center shadow-lg shadow-ink-800/20">
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink-800">Audit Log RBAC</h1>
            <p className="text-sm text-ink-400 mt-0.5">Riwayat lengkap perubahan role dan izin sistem</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
            <input
              type="text"
              placeholder="Cari aktivitas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 h-10 w-full md:w-64 rounded-xl border border-surface-300 bg-white outline-none focus:ring-2 focus:ring-ink-800/10 focus:border-ink-800 transition-all text-sm"
            />
          </div>
          <button 
            onClick={fetchLogs}
            className="w-10 h-10 rounded-xl border border-surface-300 bg-white flex items-center justify-center hover:bg-surface-50 transition-all text-ink-400"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl border border-surface-300 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="px-6 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest">Waktu</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest">Aktor</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest">Aksi</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest">Resource</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest">Detail Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-sm">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Activity className="w-12 h-12 text-ink-200" />
                      <p className="text-ink-400 font-medium">{error ? 'Gagal memuat data log' : 'Belum ada aktivitas yang tercatat'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id_audit} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center gap-2 text-ink-400">
                         <Clock className="w-3.5 h-3.5" />
                         <span className="text-xs">
                           {new Date(log.timestamp).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                         </span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className="w-7 h-7 rounded-lg bg-ink-800/10 flex items-center justify-center">
                           <User className="w-3.5 h-3.5 text-ink-800" />
                         </div>
                         <span className="font-bold text-ink-800">{log.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", getActionColor(log.action))}>
                         {log.action}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-ink-600 font-medium">
                       {log.resource}
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-xs text-ink-400 max-w-xs truncate" title={JSON.stringify(log.details)}>
                         {JSON.stringify(log.details)}
                       </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
