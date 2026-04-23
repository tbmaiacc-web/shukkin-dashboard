import { format, subDays, addDays } from 'date-fns'
import { Employee, Shift } from './types'

export const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', name: '鈴木', role: '院長', location: '草加院' },
  { id: '2', name: '安積', role: 'セラピスト', location: '草加院' },
  { id: '3', name: '平川', role: 'セラピスト', location: '草加院' },
  { id: '4', name: '門田', role: 'セラピスト', location: '草加院' },
  { id: '5', name: '横田', role: '院長', location: 'イオン八潮南院' },
  { id: '6', name: '小林', role: '院長', location: '上尾院' },
  { id: '7', name: '米澤', role: 'セラピスト', location: '上尾院' },
  { id: '8', name: '廣岡', role: '院長', location: '前橋院' },
  { id: '9', name: '小林', role: '副院長', location: '前橋院' },
  { id: '10', name: '平川', role: 'セラピスト', location: '前橋院' },
  { id: '11', name: '立花', role: 'セラピスト', location: '前橋院' },
  { id: '12', name: '清家', role: '院長', location: '伊勢崎宮子院' },
  { id: '13', name: '富澤', role: 'セラピスト', location: '伊勢崎宮子院' },
  { id: '14', name: '武田', role: '院長', location: '取手院' },
]

const today = new Date()
const d = (offset: number) => format(addDays(today, offset), 'yyyy-MM-dd')

export const MOCK_SHIFTS: Shift[] = [
  { date: d(-5), employeeName: '鈴木', shiftType: '有休', notes: '', location: '草加院' },
  { date: d(-3), employeeName: '鈴木', shiftType: '公休', notes: '', location: '草加院' },
  { date: d(-2), employeeName: '鈴木', shiftType: '公休', notes: '', location: '草加院' },
  { date: d(0),  employeeName: '門田', shiftType: '公休', notes: '', location: '草加院' },
  { date: d(-4), employeeName: '安積', shiftType: '公休', notes: '', location: '草加院' },
  { date: d(2),  employeeName: '安積', shiftType: '公休', notes: '', location: '草加院' },
  { date: d(-5), employeeName: '平川', shiftType: '公休', notes: '', location: '草加院' },
  { date: d(2),  employeeName: '平川', shiftType: '公休', notes: '', location: '草加院' },
  { date: d(-5), employeeName: '門田', shiftType: '公休', notes: '', location: '草加院' },
  { date: d(-1), employeeName: '横田', shiftType: '公休', notes: '', location: 'イオン八潮南院' },
  { date: d(0),  employeeName: '横田', shiftType: '有休', notes: '', location: 'イオン八潮南院' },
  { date: d(-4), employeeName: '小林', shiftType: '公休', notes: '', location: '上尾院' },
  { date: d(-4), employeeName: '米澤', shiftType: '公休', notes: '', location: '上尾院' },
  { date: d(-2), employeeName: '米澤', shiftType: '公休', notes: '', location: '上尾院' },
  { date: d(-4), employeeName: '廣岡', shiftType: '公休', notes: '', location: '前橋院' },
  { date: d(-3), employeeName: '立花', shiftType: '育休', notes: '', location: '前橋院' },
  { date: d(-2), employeeName: '平川', shiftType: '公休', notes: '', location: '前橋院' },
  { date: d(-5), employeeName: '清家', shiftType: '公休', notes: '', location: '伊勢崎宮子院' },
  { date: d(-4), employeeName: '清家', shiftType: '公休', notes: '', location: '伊勢崎宮子院' },
  { date: d(-3), employeeName: '清家', shiftType: '公休', notes: '', location: '伊勢崎宮子院' },
  { date: d(0),  employeeName: '清家', shiftType: '公休', notes: '', location: '伊勢崎宮子院' },
  { date: d(-2), employeeName: '富澤', shiftType: '公休', notes: '', location: '伊勢崎宮子院' },
  { date: d(2),  employeeName: '富澤', shiftType: '公休', notes: '', location: '伊勢崎宮子院' },
  { date: d(-5), employeeName: '武田', shiftType: '公休', notes: '', location: '取手院' },
  { date: d(-1), employeeName: '武田', shiftType: '公休', notes: '', location: '取手院' },
]
