'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Save, Plus, Eye, Edit2, Trash2, CheckCircle2, XCircle, RotateCcw, Info, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  id_sidebar?: number
  label: string
  href: string
  icon: string
  section: string
  resource: string
  order_weight: number
  is_active: boolean
  actions?: string[]
}

interface Props {
  open: boolean
  item: NavItem | null
  onClose: () => void
  onSave: (data: Omit<NavItem, 'id_sidebar'>) => Promise<void>
}

const SECTIONS = [
  { value: 'main', label: 'Utama' },
  { value: 'data', label: 'Data Master' },
  { value: 'keuangan', label: 'Keuangan' },
  { value: 'report', label: 'Laporan' },
  { value: 'admin', label: 'Administrator' },
]

const ICONS = [
  'LayoutDashboard','Users','UserPlus','Wallet','CreditCard','PiggyBank',
  'FileText','BarChart3','Settings','ShieldCheck','Menu','Landmark',
  'Receipt','TrendingUp','Bell','ClipboardList','FolderOpen','Database',
]

const empty: NavItem = { label:'', href:'', icon:'LayoutDashboard', section:'main', resource:'', order_weight:0, is_active:true, actions:['read'] }

export default function MenuFormModal({ open, item, onClose, onSave }: Props) {
  const [form, setForm] = useState<NavItem>(empty)
  const [saving, setSaving] = useState(false)
  const [customAction, setCustomAction] = useState('')
  const isEdit = !!item?.id_sidebar

  useEffect(() => {
    setForm(item ? { ...item } : { ...empty })
  }, [item, open])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { id_sidebar, ...data } = form
      await onSave(data)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const set = (k: keyof NavItem, v: any) => setForm(p => ({ ...p, [k]: v }))

  const toggleAction = (action: string) => {
    const currentActions = form.actions || []
    if (currentActions.includes(action)) {
      set('actions', currentActions.filter(a => a !== action))
    } else {
      set('actions', [...currentActions, action])
    }
  }

  const addCustomAction = () => {
    if (customAction && !(form.actions || []).includes(customAction)) {
      set('actions', [...(form.actions || []), customAction])
      setCustomAction('')
    }
  }

  const PREDEFINED_ACTIONS = ['read', 'create', 'update', 'delete', 'approve', 'reject', 'return', 'detail', 'export']

  const ACTION_CONFIG: Record<string, { icon: any, color: string }> = {
    read: { icon: Eye, color: "bg-blue-50 border-blue-200 text-blue-700 shadow-blue-500/10" },
    create: { icon: Plus, color: "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-500/10" },
    update: { icon: Edit2, color: "bg-amber-50 border-amber-200 text-amber-700 shadow-amber-500/10" },
    delete: { icon: Trash2, color: "bg-rose-50 border-rose-200 text-rose-700 shadow-rose-500/10" },
    approve: { icon: CheckCircle2, color: "bg-teal-50 border-teal-200 text-teal-700 shadow-teal-500/10" },
    reject: { icon: XCircle, color: "bg-pink-50 border-pink-200 text-pink-700 shadow-pink-500/10" },
    return: { icon: RotateCcw, color: "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-indigo-500/10" },
    detail: { icon: Info, color: "bg-cyan-50 border-cyan-200 text-cyan-700 shadow-cyan-500/10" },
    export: { icon: Download, color: "bg-purple-50 border-purple-200 text-purple-700 shadow-purple-500/10" },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in fade-in zoom-in-95 duration-200 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-ink-900">{isEdit ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-surface-50 text-ink-400"><X className="w-5 h-5" /></button>
        </div>

        {/* Label */}
        <div>
          <label className="text-[11px] font-bold text-ink-400 uppercase tracking-widest mb-1.5 block">Label</label>
          <input value={form.label} onChange={e => set('label', e.target.value)} required
            className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium text-ink-800 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-all" placeholder="Nama menu" />
        </div>

        {/* Href */}
        <div>
          <label className="text-[11px] font-bold text-ink-400 uppercase tracking-widest mb-1.5 block">Path (href)</label>
          <input value={form.href} onChange={e => set('href', e.target.value)} required
            className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium text-ink-800 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-all" placeholder="/dashboard/..." />
        </div>

        {/* Resource */}
        <div>
          <label className="text-[11px] font-bold text-ink-400 uppercase tracking-widest mb-1.5 block">Resource (RBAC)</label>
          <input value={form.resource} onChange={e => set('resource', e.target.value)} required
            className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium text-ink-800 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-all" placeholder="users, roles, dll" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Section */}
          <div>
            <label className="text-[11px] font-bold text-ink-400 uppercase tracking-widest mb-1.5 block">Section</label>
            <select value={form.section} onChange={e => set('section', e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium text-ink-800 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-all">
              {SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Order Weight */}
          <div>
            <label className="text-[11px] font-bold text-ink-400 uppercase tracking-widest mb-1.5 block">Urutan</label>
            <input type="number" value={form.order_weight} onChange={e => set('order_weight', parseInt(e.target.value) || 0)}
              className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium text-ink-800 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-all" />
          </div>
        </div>

        {/* Icon Picker */}
        <div>
          <label className="text-[11px] font-bold text-ink-400 uppercase tracking-widest mb-1.5 block">Icon</label>
          <div className="grid grid-cols-6 gap-2">
            {ICONS.map(ic => {
              const Ic = require('lucide-react')[ic]
              return (
                <button key={ic} type="button" onClick={() => set('icon', ic)}
                  className={cn("w-full aspect-square rounded-xl border-2 flex items-center justify-center transition-all",
                    form.icon === ic ? "border-accent-600 bg-accent-50 text-accent-700 shadow-md" : "border-surface-200 bg-white text-ink-400 hover:border-accent-300 hover:bg-accent-50/50"
                  )}>
                  {Ic ? <Ic className="w-5 h-5" /> : <span className="text-[9px]">{ic}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-bold text-ink-700">Status Aktif</span>
          <button type="button" onClick={() => set('is_active', !form.is_active)}
            className={cn("w-12 h-7 rounded-full transition-all duration-300 relative",
              form.is_active ? "bg-accent-600" : "bg-surface-300"
            )}>
            <div className={cn("w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all duration-300",
              form.is_active ? "left-6" : "left-1"
            )} />
          </button>
        </div>

        {/* Actions (Permissions) */}
        <div className="border-t border-surface-200 pt-4">
          <label className="text-[11px] font-bold text-ink-400 uppercase tracking-widest mb-2 block">Izin Akses (Actions)</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PREDEFINED_ACTIONS.map(action => {
              const isSelected = (form.actions || []).includes(action)
              const config = ACTION_CONFIG[action]
              const Icon = config?.icon

              return (
                <button key={action} type="button" onClick={() => toggleAction(action)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5",
                    isSelected 
                      ? `${config.color} shadow-sm scale-[1.02]`
                      : "bg-surface-50 border-surface-200 text-ink-400 hover:bg-surface-100 hover:border-surface-300"
                  )}>
                  {Icon && <Icon className={cn("w-3.5 h-3.5", isSelected ? "" : "opacity-40")} />}
                  {action}
                </button>
              )
            })}
            {/* Render custom actions that are not predefined */}
            {(form.actions || []).filter(a => !PREDEFINED_ACTIONS.includes(a)).map(action => (
              <button key={action} type="button" onClick={() => toggleAction(action)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-accent-50 border-accent-300 text-accent-700">
                {action} <X className="w-3 h-3 inline-block ml-1" />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={customAction} onChange={e => setCustomAction(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomAction())}
              className="flex-1 h-9 px-3 rounded-lg border border-surface-200 bg-surface-50 text-xs text-ink-800 focus:outline-none focus:border-accent-500" placeholder="Custom action..." />
            <button type="button" onClick={addCustomAction}
              className="h-9 px-4 rounded-lg bg-gradient-to-r from-accent-600 to-accent-500 text-white text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md shadow-accent-600/10 active:scale-95">
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl text-sm font-bold text-ink-400 hover:bg-surface-50 transition-all border border-surface-200">Batal</button>
          <button type="submit" disabled={saving}
            className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-[#1A2F4A] to-[#2A7FC5] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isEdit ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </form>
    </div>
  )
}
