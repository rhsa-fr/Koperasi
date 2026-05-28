import { useState, useCallback } from 'react'

interface Role {
  id_role: number
  name: string
  description: string
  is_active: boolean
}

interface PermissionMatrix {
  [module: string]: {
    [action: string]: {
      id: number
      granted: boolean
    }
  }
}

interface ToastData {
  type: 'success' | 'error'
  message: string
}

export function useRolesState() {
  const [roles, setRoles] = useState<Role[]>([])
  const [menus, setMenus] = useState<any[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [matrix, setMatrix] = useState<PermissionMatrix>({})
  const [loading, setLoading] = useState(true)
  const [matrixLoading, setMatrixLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [sidebarLabels, setSidebarLabels] = useState<Record<string, string>>({})

  const isReadOnly = selectedRoleId === 1 // ID 1 is Super Admin

  return {
    roles,
    setRoles,
    menus,
    setMenus,
    selectedRoleId,
    setSelectedRoleId,
    matrix,
    setMatrix,
    loading,
    setLoading,
    matrixLoading,
    setMatrixLoading,
    saving,
    setSaving,
    toast,
    setToast,
    error,
    setError,
    activeTab,
    setActiveTab,
    sidebarLabels,
    setSidebarLabels,
    isReadOnly
  }
}
