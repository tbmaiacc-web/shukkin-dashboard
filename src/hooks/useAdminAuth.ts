import { useState, useCallback } from 'react'
import { verifyAdminPin } from './useMutation'

const SESSION_KEY = 'tbm_admin_auth'

function isAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean>(isAuthenticated)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  const login = useCallback(async (pin: string): Promise<boolean> => {
    setVerifying(true)
    setError('')
    try {
      const ok = await verifyAdminPin(pin)
      if (ok) {
        sessionStorage.setItem(SESSION_KEY, '1')
        setIsAdmin(true)
        return true
      } else {
        setError('PINが正しくありません')
        return false
      }
    } catch {
      setError('認証に失敗しました')
      return false
    } finally {
      setVerifying(false)
    }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setIsAdmin(false)
    setError('')
  }, [])

  return { isAdmin, verifying, error, login, logout, clearError: () => setError('') }
}
