/**
 * Generate a consistent color based on string input
 * Returns Tailwind classes for bg and text color
 */
export function generateRoleColor(roleName: string): string {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
    'bg-indigo-100 text-indigo-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
    'bg-orange-100 text-orange-700',
  ]

  // Generate hash from role name to always get same color
  let hash = 0
  for (let i = 0; i < roleName.length; i++) {
    const char = roleName.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

/**
 * Format role name to human-readable label
 * e.g., "super_admin" -> "Super Admin"
 */
export function formatRoleLabel(roleName: string): string {
  const predefined: Record<string, string> = {
    admin: 'Administrator',
    ketua: 'Ketua',
    bendahara: 'Bendahara',
    super_admin: 'Super Admin',
  }

  if (predefined[roleName]) {
    return predefined[roleName]
  }

  // Convert snake_case to Title Case
  return roleName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
