import { GAS_URL } from '../config'
import { Employee, HistoryEntry } from '../types'

async function gasGet(params: Record<string, string>): Promise<any> {
  const url = new URL(GAS_URL)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const r = await fetch(url.toString())
  return r.json().catch(() => ({}))
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
    hireDate: employee.hireDate || '',
    paidLeaveAllotted: String(employee.paidLeaveAllotted ?? 10),
    paidLeaveUsed: String(employee.paidLeaveUsed ?? 0),
    anniversaryLeaveAllotted: String(employee.anniversaryLeaveAllotted ?? 5),
    anniversaryLeaveUsed: String(employee.anniversaryLeaveUsed ?? 0),
  })
}

export async function deleteEmployee(employee: Employee) {
  await gasGet({ action: 'deleteEmployee', id: employee.id })
}

export async function addEmployee(employee: Employee) {
  await gasGet({
    action: 'addEmployee',
    name: employee.name,
    role: employee.role,
    location: employee.location,
    hireDate: employee.hireDate || '',
    paidLeaveAllotted: String(employee.paidLeaveAllotted ?? 10),
    paidLeaveUsed: String(employee.paidLeaveUsed ?? 0),
    anniversaryLeaveAllotted: String(employee.anniversaryLeaveAllotted ?? 5),
    anniversaryLeaveUsed: String(employee.anniversaryLeaveUsed ?? 0),
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
  } catch {}
}

export async function getHistory(limit = 60, employeeName = ''): Promise<HistoryEntry[]> {
  try {
    const params: Record<string, string> = { action: 'getHistory', limit: String(limit) }
    if (employeeName) params.employeeName = employeeName
    const url = new URL(GAS_URL)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    const r = await fetch(url.toString())
    const data = await r.json()
    return data.history || []
  } catch {
    return []
  }
}

// ─── 有給残日数更新 ───────────────────────────────────────

// amount: 1=全日, 0.5=半日（AM有休/PM有休）
export async function incrementUsedLeave(employeeName: string, amount: number = 1): Promise<void> {
  try {
    await gasGet({ action: 'incrementUsedLeave', employeeName, amount: String(amount) })
  } catch {}
}

// ─── アニバーサリー休暇残日数更新 ────────────────────────

// amount: 1=全日, 0.5=半日（AM/PM）
export async function incrementUsedAnniversaryLeave(employeeName: string, amount: number = 1): Promise<void> {
  try {
    await gasGet({ action: 'incrementUsedAnniversaryLeave', employeeName, amount: String(amount) })
  } catch {}
}

// ─── 管理者 PIN 認証 ──────────────────────────────────────

export async function verifyAdminPin(pin: string): Promise<boolean> {
  try {
    const data = await gasGet({ action: 'verifyAdminPin', pin })
    return data.ok === true
  } catch {
    return false
  }
}
