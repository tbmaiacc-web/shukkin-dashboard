import { GAS_URL } from '../config'
import { Employee, HistoryEntry } from '../types'

async function gasGet(params: Record<string, string>): Promise<void> {
  const url = new URL(GAS_URL)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  await fetch(url.toString())
}

export async function upsertShift(
  date: string,
  employeeName: string,
  shiftType: string,
  location: string,
  notes = ''
) {
  await gasGet({ action: 'upsertShift', date, employeeName, shiftType, location, notes })
}

export async function deleteShift(date: string, employeeName: string) {
  await gasGet({ action: 'deleteShift', date, employeeName })
}

export async function updateEmployee(employee: Employee) {
  await gasGet({
    action: 'updateEmployee',
    id: employee.id,
    name: employee.name,
    role: employee.role,
    location: employee.location,
    paidLeaveAllotted: String(employee.paidLeaveAllotted ?? 10),
    paidLeaveUsed: String(employee.paidLeaveUsed ?? 0),
  })
}

export async function addEmployee(employee: Employee) {
  await gasGet({
    action: 'addEmployee',
    name: employee.name,
    role: employee.role,
    location: employee.location,
    paidLeaveAllotted: String(employee.paidLeaveAllotted ?? 10),
    paidLeaveUsed: String(employee.paidLeaveUsed ?? 0),
  })
}

// ─── シフト変更履歴 ──────────────────────────────────────

export async function addHistory(
  date: string,
  employeeName: string,
  oldShift: string,
  newShift: string,
): Promise<void> {
  try {
    await gasGet({ action: 'addHistory', date, employeeName, oldShift, newShift })
  } catch {
    // 履歴記録失敗は silent（メイン操作には影響させない）
  }
}

export async function getHistory(limit = 60): Promise<HistoryEntry[]> {
  try {
    const url = new URL(GAS_URL)
    url.searchParams.set('action', 'getHistory')
    url.searchParams.set('limit', String(limit))
    const r = await fetch(url.toString())
    const data = await r.json()
    return data.history || []
  } catch {
    return []
  }
}

// ─── 有給残日数更新（有休シフト適用時に自動インクリメント） ──

export async function incrementUsedLeave(employeeName: string): Promise<void> {
  try {
    await gasGet({ action: 'incrementUsedLeave', employeeName })
  } catch {}
}
