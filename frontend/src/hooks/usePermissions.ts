import { useCallback, Dispatch, SetStateAction } from 'react'

interface PermissionMatrix {
  [module: string]: {
    [action: string]: {
      id: number
      granted: boolean
    }
  }
}

const HIDDEN_ACTIONS = ['approve', 'reject']

export function usePermissions() {
  const togglePermission = useCallback((
    matrix: PermissionMatrix,
    module: string,
    action: string,
    setMatrix: Dispatch<SetStateAction<PermissionMatrix>>
  ) => {
    setMatrix((prev: PermissionMatrix) => {
      const newMatrix = { ...prev }
      const newModule = { ...prev[module] }

      if (action === 'verify') {
        // Toggle BOTH approve and reject if they exist
        const hasApprove = 'approve' in newModule
        const hasReject = 'reject' in newModule

        if (hasApprove || hasReject) {
          const isCurrentlyGranted = (hasApprove && newModule['approve'].granted) || (hasReject && newModule['reject'].granted)
          const targetValue = !isCurrentlyGranted

          if (hasApprove) newModule['approve'] = { ...newModule['approve'], granted: targetValue }
          if (hasReject) newModule['reject'] = { ...newModule['reject'], granted: targetValue }
        }
      } else if (newModule[action]) {
        newModule[action] = {
          ...newModule[action],
          granted: !newModule[action].granted
        }
      }

      newMatrix[module] = newModule
      return newMatrix
    })
  }, [])

  const getModuleActions = useCallback((matrix: PermissionMatrix, module: string) => {
    if (!matrix[module]) return []
    return Object.keys(matrix[module]).filter(a => !HIDDEN_ACTIONS.includes(a))
  }, [])

  const getGrantedActionsForModule = useCallback((matrix: PermissionMatrix, module: string) => {
    if (!matrix[module]) return []
    return Object.keys(matrix[module]).filter(a => matrix[module][a].granted && !HIDDEN_ACTIONS.includes(a))
  }, [])

  return {
    togglePermission,
    getModuleActions,
    getGrantedActionsForModule
  }
}
