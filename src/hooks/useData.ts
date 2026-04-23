import { useState, useEffect } from 'react'
import { Employee, Shift } from '../types'
import { GAS_URL } from '../config'

interface DataState {
  employees: Employee[]
  shifts: Shift[]
  loading: boolean
  error: string | null
  reload: () => void
}

const CACHE_KEY = 'shukkin_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5分

function loadCache(): { employees: Employee[]; shifts: Shift[]; ts: number } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.ts > CACHE_TTL) return null
    return data
  } catch {
    return null
  }
}

function saveCache(employees: Employee[], shifts: Shift[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ employees, shifts, ts: Date.now() }))
  } catch {}
}

export function useData(): DataState {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const cache = loadCache()
    if (cache) {
      setEmployees(cache.employees)
      setShifts(cache.shifts)
      setLoading(false)
      return
    }

    if (!GAS_URL) {
      // GAS未設定時はモックデータで表示
      import('../mockData').then(mock => {
        setEmployees(mock.MOCK_EMPLOYEES)
        setShifts(mock.MOCK_SHIFTS)
        setLoading(false)
      })
      return
    }

    setLoading(true)
    setError(null)

    fetch(`${GAS_URL}?action=all`)
      .then(r => r.json())
      .then((data: { employees: Employee[]; shifts: Shift[] }) => {
        setEmployees(data.employees || [])
        setShifts(data.shifts || [])
        saveCache(data.employees || [], data.shifts || [])
      })
      .catch(e => setError(`データ取得エラー: ${e.message}`))
      .finally(() => setLoading(false))
  }, [tick])

  return {
    employees,
    shifts,
    loading,
    error,
    reload: () => {
      sessionStorage.removeItem(CACHE_KEY)
      setTick(t => t + 1)
    },
  }
}
