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

  // Stats for selected date (all employees, no location filter)
  const workingCount = employees.filter(e => getStatus(e, shifts, dateStr).working).length
  const absentCount = employees.length - workingCount

  return (
    <div className="pb-20 lg:pb-8">
      {/* ヘッダー */}
      <div className="bg-white px-4 pt-10 pb-4 lg:pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Total Body Make" className="h-8 shrink-0" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">ダッシュボード</h1>
              <p className="text-xs text-gray-400">
                {format(selectedDate, 'yyyy年M月d日 (E)', { locale: ja })}
                {!isToday && <span className="ml-2 text-navy-600 font-medium">選択中</span>}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCalendarOpen(true)}
            className="w-10 h-10 bg-navy-700 rounded-xl flex items-center justify-center active:opacity-70 shadow-sm"
          >
            <Calendar size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* 月次サマリー */}
      <div className="px-4 pb-3 bg-white border-b border-gray-100">
        <div className="grid grid-cols-3 gap-2 lg:max-w-md">
          <div className="bg-navy-50 rounded-2xl px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-navy-700">{workingCount}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">出勤中</p>
          </div>
          <div className="bg-red-50 rounded-2xl px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-red-500">{absentCount}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">休暇</p>
          </div>
          <div className="bg-gray-50 rounded-2xl px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-gray-700">{employees.length}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">総スタッフ</p>
          </div>
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
                  ? 'bg-navy-700 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* スタッフリスト */}
      <div className="px-4 py-3 space-y-4 lg:max-w-5xl lg:mx-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Search size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">見つかりませんでした</p>
            <p className="text-xs text-gray-400 mt-1">検索条件を変えてみてください</p>
          </div>
        ) : (
          grouped.map(({ location, staff }) => {
            const wCount = staff.filter(e => getStatus(e, shifts, dateStr).working).length
            return (
              <div key={location}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-navy-600" />
                    <span className="text-sm font-semibold text-gray-700">{location}</span>
                  </div>
                  <span className={`text-xs font-medium ${wCount < staff.length ? 'text-red-400' : 'text-gray-400'}`}>
                    出勤中 {wCount}/{staff.length}名
                  </span>
                </div>
                <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
                  {staff.map(emp => {
                    const status = getStatus(emp, shifts, dateStr)
                    const shift = SHIFT_DISPLAY[status.label]
                    return (
                      <div key={emp.id} className="bg-white rounded-2xl px-4 py-3 flex items-center shadow-sm">
                        <div className="w-10 h-10 bg-navy-50 rounded-full flex items-center justify-center mr-3 shrink-0">
                          <span className="text-sm font-semibold text-navy-700">{emp.name[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                          <p className="text-xs text-gray-400">{emp.role}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {status.working ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold text-navy-700 border border-navy-200 bg-navy-50">
                              出勤中
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
          })
        )}
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
