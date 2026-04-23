import { GAS_URL } from '../config'

async function gasPost(body: object): Promise<void> {
  await fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify(body),
  })
}

export async function upsertShift(
  date: string,
  employeeName: string,
  shiftType: string,
  location: string,
  notes = ''
) {
  await gasPost({ action: 'upsertShift', date, employeeName, shiftType, location, notes })
}

export async function deleteShift(date: string, employeeName: string) {
  await gasPost({ action: 'deleteShift', date, employeeName })
}

export async function updateEmployee(employee: object) {
  await gasPost({ action: 'updateEmployee', ...employee })
}

export async function addEmployee(employee: object) {
  await gasPost({ action: 'addEmployee', ...employee })
}
