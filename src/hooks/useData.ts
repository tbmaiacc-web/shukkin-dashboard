import { useState, useEffect, useCallback } from 'react'
import { Employee, Shift } from '../types'
import { GAS_URL } from '../config'

interface DataState {
  employees: Employee[]
  shifts: Shift[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  updateShiftLocal: (date: string, employeeName: string, shiftType: string, location: string, notes: string) => void
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

  const fetchAll = useCallback(async (silent = false) => {
    if (!GAS_URL) {
      const mock = await import('../mockData')
      setEmployees(mock.MOCK_EMPLOYEES)
      setShifts(mock.MOCK_SHIFTS)
      setLoading(false)
      return
    }

    if (!silent) {
      setLoading(true)
      setError(null)
    }

    try {
      const r = await fetch(`${GAS_URL}?action=all`)
      const data: { employees: any[]; shifts: Shift[] } = await r.json()
      // GASはスプレッドシートの値を文字列で返すことがあるため数値列を明示的に変換
      const employees: Employee[] = (data.employees || []).map((e: any) => ({
        ...e,
        paidLeaveAllotted:       e.paidLeaveAllotted       != null ? Number(e.paidLeaveAllotted)       : undefined,
        paidLeaveUsed:           e.paidLeaveUsed           != null ? Number(e.paidLeaveUsed)           : undefined,
        anniversaryLeaveAllotted: e.anniversaryLeaveAllotted != null ? Number(e.anniversaryLeaveAllotted) : undefined,
        anniversaryLeaveUsed:    e.anniversaryLeaveUsed    != null ? Number(e.anniversaryLeaveUsed)    : undefined,
      }))
      setEmployees(employees)
      setShifts(data.shifts || [])
      saveCache(employees, data.shifts || [])
    } catch (e: any) {
      if (!silent) setError(`データ取得エラー: ${e.message}`)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // 初回ロード（キャッシュ優先）
  useEffect(() => {
    const cache = loadCache()
    if (cache) {
      setEmployees(cache.employees)
      setShifts(cache.shifts)
      setLoading(false)
      return
    }
    fetchAll()
  }, [fetchAll])

  return {
    employees,
    shifts,
    loading,
    error,
    reload: () => {
      sessionStorage.removeItem(CACHE_KEY)
      return fetchAll(true) // silent: UIをアンマウントせずバックグラウンド更新
    },
    updateShiftLocal: (date, employeeName, shiftType, location, notes) => {
      setShifts(prev => {
        const filtered = prev.filter(s => !(s.date === date && s.employeeName === employeeName))
        const next = shiftType === '出勤'
          ? filtered
          : [...filtered, { date, employeeName, shiftType, location, notes }]
        saveCache(employees, next)
        return next
      })
    },
  }
}
