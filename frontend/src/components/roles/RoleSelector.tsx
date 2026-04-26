'use client'

import { Shield, CheckCircle2, UserPlus, UserCheck, AlertCircle, Info, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Skeleton from '@/components/ui/Skeleton'

interface Role {
  id_role: number
  name: string
  description: string
  is_active: boolean
}

interface RoleSelectorProps {
  roles: Role[]
  selectedRoleId: number | null
  loading: boolean
  onSelectRole: (roleId: number) => void
  onAddRoleClick: () => void
  onEditRoleClick: (role: Role) => void
  onDeleteRoleClick: (role: Role) => void
}

export default function RoleSelector({
  roles,
  selectedRoleId,
  loading,
  onSelectRole,
  onAddRoleClick,
  onEditRoleClick,
  onDeleteRoleClick
}: RoleSelectorProps) {
  // Filter out superadmin (id_role === 1) since it's read-only
  const editableRoles = roles.filter(r => r.id_role !== 1)

  return (
    <div className="space-y-4">
      <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg shadow-ink-900/5 p-4 border-b-2 border-b-indigo-500/20">
        <h3 className="text-[10px] font-black text-ink-300 uppercase tracking-[0.2em] mb-4 px-1">Daftar Jabatan</h3>
        <div className="space-y-2">
          {loading ? (
            Array(4)
              .fill(0)
              .map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
          ) : (
            <>
              {editableRoles.map(r => (
                <div key={r.id_role} className="relative group/item">
                  <button
                    onClick={() => onSelectRole(r.id_role)}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl text-left transition-all duration-300 flex items-center justify-between group',
                      selectedRoleId === r.id_role
                        ? 'bg-gradient-premium text-white shadow-lg translate-x-1'
                        : 'bg-white border border-surface-200 text-ink-600 hover:bg-surface-50 hover:border-accent-400/30'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm shrink-0",
                        selectedRoleId === r.id_role ? "bg-white/10" : "bg-white border border-surface-200"
                      )}>
                        <UserCheck className={cn("w-4 h-4", selectedRoleId === r.id_role ? "text-white" : "text-slate-400")} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold capitalize tracking-tight leading-tight truncate">{r.name.replace('_', ' ')}</span>
                        {r.description && <span className={cn("text-[10px] font-medium opacity-60 line-clamp-1", selectedRoleId === r.id_role ? "text-white" : "text-ink-400")}>{r.description}</span>}
                      </div>
                    </div>
                    {selectedRoleId === r.id_role && (
                      <div className="w-5 h-5 rounded-full bg-accent-400 text-white flex items-center justify-center animate-in zoom-in">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                  
                  {/* Action Buttons Overlay */}
                  <div className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all duration-300 translate-x-2 group-hover/item:translate-x-0",
                    selectedRoleId === r.id_role && "right-8" // shift left if checked
                  )}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditRoleClick(r); }}
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                        selectedRoleId === r.id_role ? "bg-white/20 text-white hover:bg-white/30" : "bg-white border border-surface-200 text-ink-400 hover:text-accent-600 hover:border-accent-400 shadow-sm"
                      )}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteRoleClick(r); }}
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                        selectedRoleId === r.id_role ? "bg-white/20 text-white hover:bg-white/30" : "bg-rose-50 border border-rose-100 text-rose-400 hover:bg-rose-500 hover:text-white shadow-sm"
                      )}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={onAddRoleClick}
                className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-dashed border-surface-300 text-slate-400 hover:border-accent-400 hover:text-accent-600 hover:bg-accent-50/50 transition-all flex items-center justify-center gap-2 group"
              >
                <UserPlus className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span className="text-sm font-bold">Tambah Role</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-accent-50 border border-accent-200/50 p-4 rounded-2xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-white border border-accent-200 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-accent-600" />
        </div>
        <p className="text-[11px] text-accent-700 font-medium leading-relaxed">
          Pilih jabatan di atas untuk mengelola <strong>matriks izin fungsional</strong> secara spesifik.
        </p>
      </div>
    </div>
  )
}
