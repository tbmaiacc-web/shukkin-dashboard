import { useState } from 'react'
import { format, addWeeks, subWeeks, startOfWeek, eachDayOfInterval, addDays, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { Employee, Shift, SHIFT_DISPLAY, WORKING, NON_WORKING_TYPES } from '../types'

interface Props {
  employees: Employee[]
  shifts: Shift[]
  onReload: () => void
}

const DOW = ['日', '月', '火', '水', '木', '金', '土']

function getShiftDisplay(emp: Employee, date: Date, shifts: Shift[]) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const entry = shifts.find(s => s.date === dateStr && s.employeeName === emp.name)
  if (!entry) return WORKING
  return SHIFT_DISPLAY[entry.shiftType] || { label: entry.shiftType[0], className: 'text-gray-600' }
}

export default function ShiftTable({ employees, shifts, onReload }: Props) {
  const [baseDate, setBaseDate] = useState(new Date())
  const [locationFilter, setLocationFilter] = useState('全院')

  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 }) // 月曜始まり
  // 日〜土の7日間（日曜から）
  const weekStartSun = startOfWeek(baseDate, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: weekStartSun, end: addDays(weekStartSun, 6) })

  const today = new Date()
  const locations = ['全院', ...Array.from(new Set(employees.map(e => e.location))).sort()]

  const filteredEmployees = locationFilter === '全院'
    ? employees
    : employees.filter(e => e.location === locationFilter)

  const grouped = Array.from(new Set(filteredEmployees.map(e => e.location))).map(loc => ({
    location: loc,
    staff: filteredEmployees.filter(e => e.location === loc),
  }))

  const rangeLabel = `${format(days[0], 'M/d')} – ${format(days[6], 'M/d')}`

  return (
    <div className="pb-20">
      {/* ヘッダー */}
      <div className="bg-white px-4 pt-12 pb-3">
        <h1 className="text-2xl font-bold text-gray-900">勤務早見表</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {format(today, 'yyyy年M月d日 (E)', { locale: ja })}
        </p>
      </div>

      {/* ナビゲーション */}
      <div className="bg-white px-3 py-2 border-b border-gray-100 flex items-center gap-2">
        <div className="flex items-center bg-gray-100 rounded-xl px-2 py-1.5 gap-1 flex-1">
          <button onClick={() => setBaseDate(d => subWeeks(d, 1))} className="p-1 text-gray-500">
            <ChevronLeft size={16} />
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-gray-800">{rangeLabel}</span>
          <button onClick={() => setBaseDate(d => addWeeks(d, 1))} className="p-1 text-gray-500">
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          onClick={() => setBaseDate(new Date())}
          className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-xl"
        >
          今日
        </button>
        <button onClick={onReload} className="p-1.5 text-gray-500">
          <RefreshCw size={16} />
        </button>
        <select
          value={locationFilter}
          onChange={e => setLocationFilter(e.target.value)}
          className="text-sm bg-gray-100 border-none rounded-xl px-2 py-1.5 text-gray-700 outline-none"
        >
          {locations.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '520px' }}>
          <thead>
            <tr className="bg-white">
              <th className="text-left px-3 py-2 text-xs text-gray-400 font-normal w-20 border-b border-gray-100 sticky left-0 bg-white z-10">
                名前
              </th>
              {days.map((d, i) => {
                const isToday = isSameDay(d, today)
                const dow = d.getDay()
                return (
                  <th
                    key={i}
                    className={`py-2 text-center text-xs font-medium w-11 border-b border-gray-100 ${
                      isToday ? 'bg-gray-100' : 'bg-white'
                    } ${dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-gray-500'}`}
                  >
                    <div>{format(d, 'M/d')}</div>
                    <div>{DOW[dow]}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ location, staff }) => (
              <>
                <tr key={`loc-${location}`}>
                  <td
                    colSpan={8}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 sticky left-0"
                  >
                    {location}
                  </td>
                </tr>
                {staff.map(emp => (
                  <tr key={emp.id} className="border-b border-gray-50">
                    <td className="px-3 py-2 text-sm text-gray-800 font-medium sticky left-0 bg-white z-10 border-r border-gray-100 w-20">
                      {emp.name}
                    </td>
                    {days.map((d, i) => {
                      const isToday = isSameDay(d, today)
                      const disp = getShiftDisplay(emp, d, shifts)
                      return (
                        <td
                          key={i}
                          className={`text-center py-2 text-sm font-bold ${disp.className} ${
                            isToday ? 'bg-gray-100' : ''
                          }`}
                        >
                          {disp.label}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
