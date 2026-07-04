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
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    loading: <Loader2 className="w-5 h-5 animate-spin" />,
  }

  const typeStyles = {
    success: {
      container: 'bg-emerald-50/90 border-emerald-200/60 shadow-emerald-500/10',
      iconContainer: 'bg-emerald-100/80 text-emerald-600 border-emerald-200/30',
      message: 'text-emerald-950',
      closeButton: 'text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700',
      progressBar: 'bg-emerald-500'
    },
    error: {
      container: 'bg-rose-50/90 border-rose-200/60 shadow-rose-500/10',
      iconContainer: 'bg-rose-100/80 text-rose-600 border-rose-200/30',
      message: 'text-rose-950',
      closeButton: 'text-rose-500 hover:bg-rose-100 hover:text-rose-700',
      progressBar: 'bg-rose-500'
    },
    info: {
      container: 'bg-blue-50/90 border-blue-200/60 shadow-blue-500/10',
      iconContainer: 'bg-blue-100/80 text-blue-600 border-blue-200/30',
      message: 'text-blue-950',
      closeButton: 'text-blue-500 hover:bg-blue-100 hover:text-blue-700',
      progressBar: 'bg-blue-500'
    },
    loading: {
      container: 'bg-slate-50/90 border-slate-200/60 shadow-slate-500/10',
      iconContainer: 'bg-slate-100/80 text-slate-500 border-slate-200/30',
      message: 'text-slate-800',
      closeButton: 'text-slate-400 hover:bg-slate-200 hover:text-slate-600',
      progressBar: 'bg-slate-400'
    }
  }

  return (
    <div className={cn(
      "fixed top-20 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-[9999]",
      "flex items-center gap-3 py-3 px-4 min-w-[280px] max-w-[90vw] rounded-2xl border",
      "backdrop-blur-xl shadow-2xl",
      "animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300",
      isExiting && "animate-out fade-out zoom-out-95 slide-out-to-top-2 fill-mode-forwards",
      typeStyles[type].container
    )}>
      <div className={cn(
        "shrink-0 flex items-center justify-center w-8 h-8 rounded-xl shadow-sm border",
        typeStyles[type].iconContainer
      )}>
        {icons[type]}
      </div>
      
      <div className="flex-1 mr-2">
        <p className={cn("text-[13px] font-bold leading-tight", typeStyles[type].message)}>
          {message}
        </p>
      </div>

      <button 
        onClick={() => {
          setIsExiting(true)
          setTimeout(onClose, 500)
        }}
        className={cn(
          "shrink-0 p-1.5 rounded-lg transition-all active:scale-90",
          typeStyles[type].closeButton
        )}
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar Animation */}
      <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-black/[0.04] overflow-hidden rounded-full">
        <div 
          className={cn(
            "h-full transition-all duration-[3000ms] ease-linear",
            typeStyles[type].progressBar
          )}
          style={{ width: isExiting ? '0%' : '100%' }}
        />
      </div>
    </div>
  )
}

