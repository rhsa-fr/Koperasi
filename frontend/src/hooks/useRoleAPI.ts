import { useCallback } from 'react'
import { api } from '@/lib/axios'

interface Role {
  id_role: number
  name: string
  description: string
  is_active: boolean
}

interface Menu {
  id_permission: number
  menu: string
  action: string
  description?: string
}

interface PermissionMatrix {
  [module: string]: {
    [action: string]: {
      id: number
      granted: boolean
    }
  }
}

export function useRoleAPI() {
  const fetchRoles = useCallback(async (): Promise<Role[]> => {
    try {
      const data = await api.get<Role[]>('/roles')
      return data
    } catch (err) {
      console.error('Failed to fetch roles:', err)
      throw new Error('Gagal memuat data role')
    }
  }, [])

  const fetchMenus = useCallback(async (): Promise<Menu[]> => {
    try {
      const data = await api.get<Menu[]>('/roles/menus')
      return data
    } catch (err) {
      console.warn('Failed to fetch menus, using empty array:', err)
      return []
    }
  }, [])

  const fetchRolePermissions = useCallback(
    async (roleId: number, menus: Menu[]): Promise<PermissionMatrix> => {
      if (menus.length === 0) return {}

      try {
        const newMatrix: PermissionMatrix = {}

        // Initialize matrix with ALL possible combinations from the menus list
        menus.forEach(item => {
          if (!newMatrix[item.menu]) newMatrix[item.menu] = {}
          newMatrix[item.menu][item.action] = { id: item.id_permission, granted: false }
        })

        // Fetch currently assigned permissions for this role
        try {
          const rolePermissions = await api.get<any[]>(`/roles/${roleId}/permissions`)
          rolePermissions.forEach(p => {
            if (newMatrix[p.menu] && newMatrix[p.menu][p.action]) {
              newMatrix[p.menu][p.action].granted = true
            }
          })
        } catch (err) {
          console.warn('Failed to fetch role permissions:', err)
        }

        return newMatrix
      } catch (err) {
        console.error('Error building permission matrix:', err)
        throw new Error('Gagal memuat matriks izin')
      }
    },
    []
  )

  const savePermissions = useCallback(
    async (roleId: number, matrix: PermissionMatrix) => {
      try {
        const permissions: { menu: string; actions: string[] }[] = []

        const moduleNames = Object.keys(matrix)
        for (const module of moduleNames) {
          const grantedActions = Object.keys(matrix[module]).filter(a => matrix[module][a].granted)
          if (grantedActions.length > 0) {
            permissions.push({ menu: module, actions: grantedActions })
          }
        }

        await api.put(`/roles/${roleId}/permissions`, { permissions })
        return { success: true, message: 'Izin fungsional berhasil diperbarui!' }
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Gagal menyimpan izin')
      }
    },
    []
  )

  const createRole = useCallback(
    async (name: string, description: string): Promise<Role> => {
      try {
        const data = await api.post<Role>('/roles/', { name, description, is_active: true })
        return data
      } catch (err: any) {
        const detail = err?.response?.data?.detail || err?.message || 'Gagal membuat role baru'
        throw new Error(detail)
      }
    },
    []
  )

  const deleteRole = useCallback(
    async (roleId: number): Promise<void> => {
      try {
        await api.delete(`/roles/${roleId}`)
      } catch (err: any) {
        const detail = err?.response?.data?.detail || err?.message || 'Gagal menghapus role'
        throw new Error(detail)
      }
    },
    []
  )

  const fetchUserPermissions = useCallback(
    async (userId: number, roleId: number, menus: Menu[]): Promise<PermissionMatrix> => {
      if (menus.length === 0) return {}

      try {
        const newMatrix: PermissionMatrix = {}

        // 1. Fetch Role Permissions (Base layer)
        const rolePermissions = await api.get<any[]>(`/roles/${roleId}/permissions`)
        const rolePermMap: Record<string, boolean> = {}
        rolePermissions.forEach(p => {
          rolePermMap[`${p.menu}:${p.action}`] = true
        })

        // 2. Initialize matrix with role defaults
        menus.forEach(item => {
          if (!newMatrix[item.menu]) newMatrix[item.menu] = {}
          const isGrantedByRole = rolePermMap[`${item.menu}:${item.action}`] || false
          newMatrix[item.menu][item.action] = { id: item.id_permission, granted: isGrantedByRole }
        })

        // 3. Fetch and Apply User Overrides
        try {
          const userOverrides = await api.get<any[]>(`/users/${userId}/permissions`)
          userOverrides.forEach(o => {
            if (newMatrix[o.menu] && newMatrix[o.menu][o.action]) {
              newMatrix[o.menu][o.action].granted = o.is_granted
            }
          })
        } catch (err) {
          console.warn('Failed to fetch user overrides:', err)
        }

        return newMatrix
      } catch (err) {
        console.error('Error building user permission matrix:', err)
        throw new Error('Gagal memuat matriks izin user')
      }
    },
    []
  )

  const saveUserPermissions = useCallback(
    async (userId: number, roleId: number, matrix: PermissionMatrix) => {
      try {
        // 1. Fetch current Role permissions to find the delta
        const rolePermissions = await api.get<any[]>(`/roles/${roleId}/permissions`)
        const rolePermMap: Record<string, boolean> = {}
        rolePermissions.forEach(p => {
          rolePermMap[`${p.menu}:${p.action}`] = true
        })

        const overrides: { permission_id: number; is_granted: boolean }[] = []

        // Iterate through matrix and find differences from role
        Object.keys(matrix).forEach(module => {
          Object.keys(matrix[module]).forEach(action => {
            const item = matrix[module][action]
            const isGrantedByRole = rolePermMap[`${module}:${action}`] || false
            
            if (item.granted !== isGrantedByRole) {
              overrides.push({ permission_id: item.id, is_granted: item.granted })
            }
          })
        })

        await api.put(`/users/${userId}/permissions`, { permissions: overrides })
        return { success: true, message: 'Izin kustom berhasil diperbarui!' }
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Gagal menyimpan izin kustom')
      }
    },
    []
  )

  return {
    fetchRoles,
    fetchMenus,
    fetchRolePermissions,
    fetchUserPermissions,
    savePermissions,
    saveUserPermissions,
    createRole,
    deleteRole
  }
}
