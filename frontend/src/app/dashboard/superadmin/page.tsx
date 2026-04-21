'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Users,
  ShieldAlert,
  Activity,
  ArrowUpRight,
  Lock,
  Settings,
  FileBarChart2,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react'
import axios from '@/lib/axios'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STATS_TEMPLATE = [
  {
    label: 'Total User',
    value: '0',
    sub: '+0 bulan ini',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    key: 'users',
  },
  {
    label: 'Total Role',
    value: '0',
    sub: 'Terkonfigurasi',
    icon: ShieldAlert,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    key: 'roles',
  },
]

const QUICK_ACTIONS = [
  { label: 'Kelola User', href: '/dashboard/users', icon: Users, desc: 'Manajemen akun sistem' },
  { label: 'Kelola Role', href: '/dashboard/roles', icon: ShieldAlert, desc: 'Atur izin dan akses' },
  { label: 'Audit Log', href: '/dashboard/audit', icon: FileBarChart2, desc: 'Lihat riwayat aktivitas' },
  { label: 'Pengaturan', href: '/dashboard/settings', icon: Settings, desc: 'Konfigurasi sistem' },
]

// Helper to get relative time string
function getRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Baru saja'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`
  
  // Format as date if older than 24h
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

// Activity mapping for icons and colors
const ACTIVITY_UI_MAP: Record<string, { icon: any, color: string }> = {
  create: { icon: CheckCircle2, color: 'text-emerald-500' },
  update: { icon: AlertCircle, color: 'text-amber-500' },
  delete: { icon: AlertCircle, color: 'text-red-500' },
  login:  { icon: Clock, color: 'text-blue-500' },
  default: { icon: Activity, color: 'text-ink-400' }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SuperadminDashboardPage() {
  const [stats, setStats] = useState<typeof STATS_TEMPLATE>(STATS_TEMPLATE)
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total roles and users
        const [rolesRes, usersRes] = await Promise.all([
          axios.get('/roles'),
          axios.get('/users')
        ])
        const totalRoles = rolesRes.data?.length || 0
        const totalUsers = usersRes.data?.meta?.total || 0

        // Update stats dengan data real
        setStats(prev => {
          const updated = [...prev]
          updated[0].value = String(totalUsers) // Total user from API
          updated[1].value = String(totalRoles) // Total Role from API
          return updated
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        // Keep default values if fetch fails
      } finally {
        setLoading(false)
      }
    }

    const fetchLogs = async () => {
      try {
        const res = await axios.get('/audit/latest?limit=6')
        setActivityLogs(res.data || [])
      } catch (err) {
        console.error('Failed to fetch logs:', err)
      } finally {
        setLoadingLogs(false)
      }
    }

    fetchStats()
    fetchLogs()
  }, [])

  // Helper to format log text
  const formatLogText = (log: any) => {
    const actionMap: any = {
      create: 'Membuat',
      update: 'Memperbarui',
      delete: 'Menghapus',
      login: 'Login'
    }
    const action = actionMap[log.action] || log.action
    const resource = log.resource.charAt(0).toUpperCase() + log.resource.slice(1).replace('_', ' ')
    
    return `${log.username} ${action.toLowerCase()} ${resource}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="card bg-gradient-to-r from-ink-800 to-purple-900 border-0 p-8 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-ink-200 mb-1">Panel Superadmin</p>
          <h1 className="text-3xl font-bold text-white">Selamat datang, Superadmin</h1>
          <p className="text-sm text-ink-200 mt-2">Kontrol penuh atas sistem koperasi. Kelola user, role, dan konfigurasi.</p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-white/60" />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`${s.color} w-5 h-5`} />
              </div>
              <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {s.sub}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-[11px] text-ink-300 font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold text-ink-800 mt-1">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 card space-y-5">
          <div>
            <h2 className="text-base font-bold text-ink-800">Aksi Cepat</h2>
            <p className="text-sm text-ink-400 mt-1">Akses fitur administratif utama</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(action => (
              <Link
                key={action.label}
                href={action.href}
                className="group flex flex-col gap-3 p-5 rounded-xl border border-surface-300 bg-surface-50 
                           hover:border-ink-800 hover:bg-ink-800 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-lg bg-white group-hover:bg-white/10 border border-surface-300 
                                group-hover:border-white/30 flex items-center justify-center transition-all">
                  <action.icon className="w-5 h-5 text-ink-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-800 group-hover:text-white transition-colors">{action.label}</p>
                  <p className="text-xs text-ink-400 group-hover:text-ink-200 mt-1 transition-colors">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-800">Aktivitas Terbaru</h2>
            <Link href="/dashboard/audit" className="text-[11px] text-accent-600 hover:underline flex items-center gap-1 font-medium">
              Semua <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {loadingLogs ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-4 h-4 rounded-full bg-slate-100 mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-2 bg-slate-50 rounded w-1/3" />
                  </div>
                </div>
              ))
            ) : activityLogs.length > 0 ? (
              activityLogs.map((log) => {
                const ui = ACTIVITY_UI_MAP[log.action] || ACTIVITY_UI_MAP.default
                return (
                  <div key={log.id_audit} className="flex items-start gap-3 pb-3 border-b border-surface-100 last:border-0 last:pb-0">
                    <ui.icon className={`w-4 h-4 mt-0.5 shrink-0 ${ui.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink-600 leading-snug">{formatLogText(log)}</p>
                      <p className="text-[10px] text-ink-300 mt-1">{getRelativeTime(log.timestamp)}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs text-ink-300 italic">Belum ada aktivitas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Tools Card */}
      <div className="card bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink-800">Keamanan Sistem</h2>
            <p className="text-xs text-ink-600 mt-1">Role superadmin memiliki akses penuh ke semua fitur tanpa batasan. Gunakan dengan hati-hati.</p>
          </div>
          <Lock className="w-6 h-6 text-purple-600 shrink-0" />
        </div>
      </div>
    </div>
  )
}
