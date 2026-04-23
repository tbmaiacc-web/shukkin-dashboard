import { GAS_URL } from '../config'

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

export async function updateEmployee(employee: Record<string, string>) {
  await gasGet({ action: 'updateEmployee', ...employee })
}

export async function addEmployee(employee: Record<string, string>) {
  await gasGet({ action: 'addEmployee', ...employee })
}
