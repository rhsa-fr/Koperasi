'use client'

import { Shield, CheckCircle2, UserPlus, UserCheck, AlertCircle, Info } from 'lucide-react'
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
}

export default function RoleSelector({
  roles,
  selectedRoleId,
  loading,
  onSelectRole,
  onAddRoleClick
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
                <button
                  key={r.id_role}
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
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                      selectedRoleId === r.id_role ? "bg-white/10" : "bg-white border border-surface-200"
                    )}>
                      <UserCheck className={cn("w-4 h-4", selectedRoleId === r.id_role ? "text-white" : "text-slate-400")} />
                    </div>
                    <span className="text-sm font-bold capitalize tracking-tight">{r.name.replace('_', ' ')}</span>
                  </div>
                  {selectedRoleId === r.id_role && (
                    <div className="w-5 h-5 rounded-full bg-accent-400 text-white flex items-center justify-center animate-in zoom-in">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  )}
                </button>
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
