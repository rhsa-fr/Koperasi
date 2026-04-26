// src/components/ui/Avatar.tsx
import { User } from 'lucide-react'
import { cn, getFileUrl } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_MAP = {
  sm:  { wrapper: 'w-7 h-7 rounded-lg',   icon: 'w-4 h-4' },
  md:  { wrapper: 'w-9 h-9 rounded-xl',   icon: 'w-5 h-5' },
  lg:  { wrapper: 'w-11 h-11 rounded-xl', icon: 'w-6 h-6' },
  xl:  { wrapper: 'w-16 h-16 rounded-2xl', icon: 'w-8 h-8' },
}

export default function Avatar({ src, size = 'md', className }: AvatarProps) {
  const { wrapper, icon } = SIZE_MAP[size]
  const imageUrl = getFileUrl(src)

  return (
    <div
      className={cn(
        'flex items-center justify-center shrink-0 overflow-hidden bg-slate-100 border-2 border-white shadow-sm',
        wrapper,
        className
      )}
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="Avatar" 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1a2f4a, #2a7fc5)' }}
        >
          <User className={cn(icon, 'text-white')} />
        </div>
      )}
    </div>
  )
}