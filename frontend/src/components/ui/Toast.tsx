'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'loading'

export interface ToastData {
  type: ToastType
  message: string
}

interface ToastProps {
  type: ToastType
  message: string
  onClose: () => void
  duration?: number
}

export default function Toast({ type, message, onClose, duration = 3000 }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onClose, 300) // matches animation duration
    }, duration)

    return () => clearTimeout(timer)
  }, [onClose, duration])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    loading: <Loader2 className="w-5 h-5 text-ink-400 animate-spin" />,
  }

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-100',
    error: 'bg-rose-50 border-rose-100',
    info: 'bg-blue-50 border-blue-100',
    loading: 'bg-white border-surface-200',
  }

  return (
    <div className={cn(
      "fixed top-6 right-6 z-[100] flex items-center gap-3 p-4 pr-12 rounded-2xl border shadow-2xl",
      "animate-in slide-in-from-right-full duration-300",
      isExiting && "animate-out fade-out slide-out-to-right-full fill-mode-forwards",
      bgColors[type]
    )}>
      <div className="shrink-0">{icons[type]}</div>
      <div className="flex-1">
        <p className="text-sm font-bold text-ink-800 leading-tight">{message}</p>
      </div>
      <button 
        onClick={() => {
          setIsExiting(true)
          setTimeout(onClose, 300)
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-ink-300 hover:bg-black/5 hover:text-ink-600 transition-all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
