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
      setTimeout(onClose, 500)
    }, duration)

    return () => clearTimeout(timer)
  }, [onClose, duration])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    loading: <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />,
  }

  const styles = {
    success: 'border-emerald-100 shadow-emerald-500/10',
    error: 'border-rose-100 shadow-rose-500/10',
    info: 'border-blue-100 shadow-blue-500/10',
    loading: 'border-slate-100 shadow-slate-500/10',
  }

  return (
    <div className={cn(
      "fixed top-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-[9999]",
      "flex items-center gap-3 py-3 px-4 min-w-[280px] max-w-[90vw] rounded-2xl border",
      "bg-white/80 backdrop-blur-xl shadow-2xl",
      "animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300",
      isExiting && "animate-out fade-out zoom-out-95 slide-out-to-top-2 fill-mode-forwards",
      styles[type]
    )}>
      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-white shadow-sm border border-black/[0.03]">
        {icons[type]}
      </div>
      
      <div className="flex-1 mr-2">
        <p className="text-[13px] font-bold text-slate-800 leading-tight">
          {message}
        </p>
      </div>

      <button 
        onClick={() => {
          setIsExiting(true)
          setTimeout(onClose, 500)
        }}
        className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-90"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar Animation */}
      <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-slate-100/50 overflow-hidden rounded-full">
        <div 
          className={cn(
            "h-full transition-all duration-[3000ms] ease-linear",
            type === 'success' ? 'bg-emerald-500' : 
            type === 'error' ? 'bg-rose-500' : 
            type === 'info' ? 'bg-blue-500' : 'bg-slate-400'
          )}
          style={{ width: isExiting ? '0%' : '100%' }}
        />
      </div>
    </div>
  )
}

