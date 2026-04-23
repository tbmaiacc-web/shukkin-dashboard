export interface Employee {
  id: string
  name: string
  role: string
  location: string
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
  '公休': { label: '公', className: 'text-red-500' },
  '有休': { label: '有', className: 'text-green-500' },
  '育休': { label: '育', className: 'text-teal-500' },
  '産休': { label: '産', className: 'text-pink-500' },
  'アニ休': { label: 'ア', className: 'text-orange-500' },
  'PMアニ休': { label: 'ア', className: 'text-orange-400' },
  'AMアニ休': { label: 'ア', className: 'text-orange-400' },
  '研修': { label: '研', className: 'text-purple-500' },
  '出張': { label: '張', className: 'text-yellow-600' },
  'バイト': { label: 'バ', className: 'text-gray-500' },
}

export const WORKING = { label: '出', className: 'text-blue-500' }

export const NON_WORKING_TYPES = new Set(['公休', '有休', '育休', '産休', 'アニ休', 'PMアニ休', 'AMアニ休'])
