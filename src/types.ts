export interface Employee {
  id: string
  name: string
  role: string
  location: string
  paidLeaveAllotted?: number          // 有給：年間付与日数
  paidLeaveUsed?: number              // 有給：使用済み日数
  anniversaryLeaveAllotted?: number   // アニバーサリー：年間付与日数（デフォルト5）
  anniversaryLeaveUsed?: number       // アニバーサリー：使用済み日数
}

export interface HistoryEntry {
  id: string
  date: string           // 'yyyy-MM-dd' (シフト対象日)
  employeeName: string
  oldShift: string
  newShift: string
  changedAt: string      // ISO timestamp
}

export interface Shift {
  date: string        // 'yyyy-MM-dd'
  employeeName: string
  shiftType: string
  notes: string
  location: string
}

export type TabName = 'dashboard' | 'schedule' | 'employees'

export const LOCATIONS = ['草加院', 'イオン八潮南院', '上尾院', '前橋院', '伊勢崎宮子院', '取手院'] as const

export const SHIFT_DISPLAY: Record<string, { label: string; className: string }> = {
  '公休':    { label: '公',   className: 'text-red-500 bg-red-50' },
  'AM公休':  { label: 'AM公', className: 'text-red-400 bg-red-50' },
  'PM公休':  { label: 'PM公', className: 'text-red-400 bg-red-50' },
  '有休':    { label: '有',   className: 'text-green-600 bg-green-50' },
  'AM有休':  { label: 'AM有', className: 'text-green-500 bg-green-50' },
  'PM有休':  { label: 'PM有', className: 'text-green-500 bg-green-50' },
  '育休':    { label: '育',   className: 'text-teal-600 bg-teal-50' },
  '産休':    { label: '産',   className: 'text-pink-500 bg-pink-50' },
  'アニ休':  { label: 'アニバ', className: 'text-orange-500 bg-orange-50' },
  'AMアニ休':{ label: 'AMアニバ', className: 'text-orange-400 bg-orange-50' },
  'PMアニ休':{ label: 'PMアニバ', className: 'text-orange-400 bg-orange-50' },
  '特別休暇':{ label: '特休', className: 'text-violet-500 bg-violet-50' },
  '研修':    { label: '研修', className: 'text-purple-600 bg-purple-50' },
  '出張':    { label: '出張', className: 'text-yellow-700 bg-yellow-50' },
  'バイト':  { label: 'バイ', className: 'text-gray-500 bg-gray-100' },
}

export const WORKING = { label: '出', className: 'text-blue-500' }

export const NON_WORKING_TYPES = new Set([
  '公休', 'AM公休', 'PM公休', '有休', 'AM有休', 'PM有休', '育休', '産休',
  'アニ休', 'AMアニ休', 'PMアニ休', '特別休暇',
])
