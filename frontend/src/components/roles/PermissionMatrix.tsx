'use client'

import { useState } from 'react'
import { Search, Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import ModuleTab from './ModuleTab'

interface PermissionMatrix {
  [module: string]: {
    [action: string]: {
      id: number
      granted: boolean
    }
  }
}

interface PermissionMatrixProps {
  modules: string[]
  matrix: PermissionMatrix
  moduleLabels: Record<string, string>
  actionLabels: Record<string, string>
  activeTab: string
  matrixLoading: boolean
  saving: boolean
  isReadOnly: boolean
  onTabChange: (module: string) => void
  onTogglePermission: (module: string, action: string) => void
}

export default function PermissionMatrixWrapper({
  modules,
  matrix,
  moduleLabels,
  actionLabels,
  activeTab,
  matrixLoading,
  saving,
  isReadOnly,
  onTabChange,
  onTogglePermission
}: PermissionMatrixProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredModules = modules.filter(m => {
    const label = moduleLabels[m] || m
    return label.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl shadow-premium overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-right duration-500">
      {/* Tabs Header with Search */}
      <div className="border-b border-surface-200 bg-surface-50/50 p-5 space-y-4">
        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accent-400 transition-colors" />
          <input
            type="text"
            placeholder="Cari module izin..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-300 bg-white text-sm text-ink-800 placeholder:text-slate-400 outline-none focus:border-accent-400 focus:ring-4 focus:ring-accent-400/5 transition-all shadow-sm"
          />
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-hide">
          {filteredModules.map(module => (
            <button
              key={module}
              onClick={() => onTabChange(module)}
              className={cn(
                'px-5 py-2.5 rounded-xl whitespace-nowrap font-bold text-xs transition-all border shrink-0',
                activeTab === module
                  ? 'bg-gradient-premium border-transparent text-white shadow-lg shadow-accent-600/20 px-6'
                  : 'bg-white text-slate-500 border-surface-200 hover:border-accent-400 hover:text-accent-600 hover:bg-white'
              )}
            >
              {moduleLabels[module] || module}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 min-h-[400px]">
        {matrixLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-accent-400" />
            </div>
            <p className="text-sm text-slate-400 font-bold tracking-tight">Menyusun matriks izin...</p>
          </div>
        ) : matrix[activeTab] ? (
          <ModuleTab
            moduleName={activeTab}
            moduleLabel={moduleLabels[activeTab] || activeTab}
            actions={matrix[activeTab]}
            actionLabels={actionLabels}
            saving={saving}
            isReadOnly={isReadOnly}
            onTogglePermission={onTogglePermission}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-20">
            <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 text-sm font-bold">Module tidak ditemukan</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-5 bg-surface-50/50 border-t border-surface-200">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/50 border border-white/50 text-slate-500">
          <Info className="w-4 h-4 text-accent-400 shrink-0" />
          <p className="text-[11px] font-medium leading-relaxed italic">
            <strong>Catatan:</strong> Periksa kembali setiap izin sebelum menekan tombol simpan. Izin ini bersifat fungsional dan langsung berpengaruh pada hak akses user.
          </p>
        </div>
      </div>
    </div>
  )
}
