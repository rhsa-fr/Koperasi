import * as Icons from 'lucide-react'
import { LucideProps } from 'lucide-react'

interface IconRendererProps extends LucideProps {
  name: string
}

export default function IconRenderer({ name, ...props }: IconRendererProps) {
  // @ts-ignore - Dynamically access lucide icon
  const IconComponent = Icons[name]

  if (!IconComponent) {
    // Fallback to a default icon if not found
    return <Icons.HelpCircle {...props} />
  }

  return <IconComponent {...props} />
}
