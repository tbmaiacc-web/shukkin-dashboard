import { useState } from 'react'
import { format, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Search, MapPin, Calendar } from 'lucide-react'
import { Employee, Shift, TabName, NON_WORKING_TYPES, SHIFT_DISPLAY } from '../types'
import DateModal from './DateModal'

interface Props {
  employees: Employee[]
  shifts: Shift[]
  onTabChange: (tab: TabName) => void
}

function getStatus(emp: Employee, shifts: Shift[], dateStr: string) {
  const entry = shifts.find(s => s.date === dateStr && s.employeeName === emp.name)
  if (!entry) return { label: '勤務中', working: true }
  if (NON_WORKING_TYPES.has(entry.shiftType)) return { label: entry.shiftType, working: false }
  return { label: '勤務中', working: true }
}

export default function Dashboard({ employees, shifts, onTabChange: _onTabChange }: Props) {
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('全院')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const isToday = isSameDay(selectedDate, new Date())

  const locations = ['全院', ...Array.from(new Set(employees.map(e => e.location))).sort()]

  const filtered = employees.filter(emp => {
    const matchSearch = !search || emp.name.includes(search) || emp.location.includes(search)
    const matchLoc = locationFilter === '全院' || emp.location === locationFilter
    return matchSearch && matchLoc
  })

  const grouped = Array.from(new Set(filtered.map(e => e.location))).map(loc => ({
    location: loc,
    staff: filtered.filter(e => e.location === loc),
  }))

  return (
    <div className="pb-20">
      {/* ヘッダー */}
      <div className="bg-white px-4 pt-12 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {format(selectedDate, 'yyyy年M月d日 (E)', { locale: ja })}
              {!isToday && <span className="ml-2 text-xs text-blue-500">選択中</span>}
            </p>
          </div>
          <button
            onClick={() => setCalendarOpen(true)}
            className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center active:opacity-70"
          >
            <Calendar size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* 検索 */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="名前・院で検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* 院フィルター */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {locations.map(loc => (
            <button
              key={loc}
              onClick={() => setLocationFilter(loc)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                locationFilter === loc
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* スタッフリスト */}
      <div className="px-4 py-3 space-y-4">
        {grouped.map(({ location, staff }) => {
          const workingCount = staff.filter(e => getStatus(e, shifts, dateStr).working).length
          return (
            <div key={location}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-red-400" />
                  <span className="text-sm font-semibold text-gray-700">{location}</span>
                </div>
                <span className={`text-xs font-medium ${workingCount < staff.length ? 'text-red-400' : 'text-gray-400'}`}>
                勤務中 {workingCount}/{staff.length}名
              </span>
              </div>
              <div className="space-y-2">
                {staff.map(emp => {
                  const status = getStatus(emp, shifts, dateStr)
                  const shift = SHIFT_DISPLAY[status.label]
                  return (
                    <div key={emp.id} className="bg-white rounded-2xl px-4 py-3 flex items-center shadow-sm">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3 shrink-0">
                        <span className="text-sm font-medium text-gray-500">{emp.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                        <p className="text-xs text-gray-400">{emp.role}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {status.working ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold text-blue-500 border border-blue-200 bg-blue-50">
                            勤務中
                          </span>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            shift
                              ? `${shift.className} border-current bg-opacity-10`
                              : 'text-red-500 border-red-200 bg-red-50'
                          }`}>
                            {status.label}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {calendarOpen && (
        <DateModal
          selected={selectedDate}
          onSelect={d => { setSelectedDate(d); setCalendarOpen(false) }}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </div>
  )
}
