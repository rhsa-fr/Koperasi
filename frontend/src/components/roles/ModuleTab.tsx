'use client'

import { Shield, ShieldCheck } from 'lucide-react'
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
  // Filter out approve/reject (they're handled by verify)
  const actionsList = Object.keys(actions).filter(a => a !== 'approve' && a !== 'reject')
  
  // Check if this module has approve/reject (which means verify should be shown)
  const hasApproveOrReject = 'approve' in actions || 'reject' in actions
  
  // Build final actions list - add verify if approve/reject exist, otherwise use filtered list
  const finalActionsList = hasApproveOrReject && !actionsList.includes('verify')
    ? [...actionsList, 'verify']
    : actionsList

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
        {finalActionsList.map(action => (
          <button
            key={action}
            disabled={saving || isReadOnly}
            onClick={() => onTogglePermission(moduleName, action)}
            className={cn(
              'p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-3 active:scale-95',
              // For verify, check if approve or reject is granted
              action === 'verify'
                ? (actions['approve']?.granted || actions['reject']?.granted)
                  ? 'bg-emerald-50 border-emerald-500 shadow-sm shadow-emerald-500/10'
                  : 'bg-surface-50 border-surface-300 hover:border-ink-800 hover:bg-white'
                : actions[action]?.granted
                  ? 'bg-emerald-50 border-emerald-500 shadow-sm shadow-emerald-500/10'
                  : 'bg-surface-50 border-surface-300 hover:border-ink-800 hover:bg-white',
              isReadOnly && 'opacity-40 cursor-not-allowed grayscale'
            )}
          >
            {action === 'verify'
              ? (actions['approve']?.granted || actions['reject']?.granted) 
                ? (
                  <>
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">{actionLabels[action] || 'Verifikasi'}</span>
                  </>
                )
                : (
                  <>
                    <Shield className="w-6 h-6 text-ink-400" />
                    <span className="text-xs font-bold text-ink-600">{actionLabels[action] || 'Verifikasi'}</span>
                  </>
                )
              : actions[action]?.granted ? (
                <>
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">{actionLabels[action]}</span>
                </>
              ) : (
                <>
                  <Shield className="w-6 h-6 text-ink-400" />
                  <span className="text-xs font-bold text-ink-600">{actionLabels[action]}</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {finalActionsList.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-ink-200 mx-auto mb-3" />
          <p className="text-ink-400 text-sm">Tidak ada aksi yang tersedia untuk module ini</p>
        </div>
      )}
    </div>
  )
}
