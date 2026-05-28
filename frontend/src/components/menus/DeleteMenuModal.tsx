'use client'

import { useState } from 'react'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  menuLabel: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

export default function DeleteMenuModal({ open, menuLabel, onClose, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false)

  if (!open) return null

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in fade-in zoom-in-95 duration-200 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-5 border border-rose-100">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
        <h3 className="text-lg font-black text-ink-900 mb-2">Hapus Menu?</h3>
        <p className="text-sm text-ink-400 mb-8">
          Menu <strong className="text-ink-700">&quot;{menuLabel}&quot;</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={deleting}
            className="flex-1 h-12 rounded-xl text-sm font-bold text-ink-400 hover:bg-surface-50 transition-all border border-surface-200">
            Batal
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all disabled:opacity-50">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  )
}
