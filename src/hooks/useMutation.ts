import { GAS_URL } from '../config'
import { Employee } from '../types'

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
  await gasGet({ action: 'updateEmployee', id: employee.id, name: employee.name, role: employee.role, location: employee.location })
}

export async function addEmployee(employee: Employee) {
  await gasGet({ action: 'addEmployee', name: employee.name, role: employee.role, location: employee.location })
}
