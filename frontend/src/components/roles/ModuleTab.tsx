'use client'

import { Shield, ShieldCheck, Eye, Plus, Edit2, Trash2, CheckCircle2, XCircle, RotateCcw, Info, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Permission {
  id: number
  granted: boolean
}

interface ModuleTabProps {
  moduleName: string
  moduleLabel: string
  actions: {
    [action: string]: Permission
  }
  actionLabels: Record<string, string>
  saving: boolean
  isReadOnly: boolean
  onTogglePermission: (module: string, action: string) => void
}

export default function ModuleTab({
  moduleName,
  moduleLabel,
  actions,
  actionLabels,
  saving,
  isReadOnly,
  onTogglePermission
}: ModuleTabProps) {
  const actionsList = Object.keys(actions)

  const ACTION_CONFIG: Record<string, { icon: any, color: string, textColor: string }> = {
    read: { icon: Eye, color: "bg-blue-50 border-blue-500 shadow-blue-500/10", textColor: "text-blue-700" },
    create: { icon: Plus, color: "bg-emerald-50 border-emerald-500 shadow-emerald-500/10", textColor: "text-emerald-700" },
    update: { icon: Edit2, color: "bg-amber-50 border-amber-500 shadow-amber-500/10", textColor: "text-amber-700" },
    delete: { icon: Trash2, color: "bg-rose-50 border-rose-500 shadow-rose-500/10", textColor: "text-rose-700" },
    approve: { icon: CheckCircle2, color: "bg-teal-50 border-teal-500 shadow-teal-500/10", textColor: "text-teal-700" },
    reject: { icon: XCircle, color: "bg-pink-50 border-pink-500 shadow-pink-500/10", textColor: "text-pink-700" },
    return: { icon: RotateCcw, color: "bg-indigo-50 border-indigo-500 shadow-indigo-500/10", textColor: "text-indigo-700" },
    detail: { icon: Info, color: "bg-cyan-50 border-cyan-500 shadow-cyan-500/10", textColor: "text-cyan-700" },
    export: { icon: Download, color: "bg-purple-50 border-purple-500 shadow-purple-500/10", textColor: "text-purple-700" },
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-surface-200">
        <div className="w-12 h-12 rounded-xl bg-ink-800/10 flex items-center justify-center">
          <Shield className="w-6 h-6 text-ink-800" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-ink-800">{moduleLabel}</h2>
          <p className="text-sm text-ink-400 mt-0.5">Kelola izin akses untuk module ini</p>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {actionsList.map(action => {
          const isGranted = actions[action]?.granted
          const config = ACTION_CONFIG[action] || { icon: ShieldCheck, color: "bg-emerald-50 border-emerald-500 shadow-emerald-500/10", textColor: "text-emerald-700" }
          const Icon = isGranted ? config.icon : Shield

          return (
            <button
              key={action}
              disabled={saving || isReadOnly}
              onClick={() => onTogglePermission(moduleName, action)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-3 active:scale-95 shadow-sm',
                isGranted
                  ? `${config.color} border-opacity-100`
                  : 'bg-surface-50 border-surface-300 hover:border-ink-800 hover:bg-white',
                isReadOnly && 'opacity-40 cursor-not-allowed grayscale'
              )}
            >
              <Icon className={cn("w-6 h-6", isGranted ? config.textColor : "text-ink-400")} />
              <span className={cn("text-xs font-bold", isGranted ? config.textColor : "text-ink-600")}>
                {actionLabels[action] || action}
              </span>
            </button>
          )
        })}
      </div>

      {/* Empty State */}
      {actionsList.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-ink-200 mx-auto mb-3" />
          <p className="text-ink-400 text-sm">Tidak ada aksi yang tersedia untuk module ini</p>
        </div>
      )}
    </div>
  )
}
