import { useState, useEffect, useRef } from 'react'
import { format, addWeeks, subWeeks, startOfWeek, eachDayOfInterval, addDays, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { Employee, Shift, SHIFT_DISPLAY, WORKING } from '../types'
import { upsertShift, deleteShift } from '../hooks/useMutation'
import ShiftModal from './ShiftModal'

interface Props {
  employees: Employee[]
  shifts: Shift[]
  onReload: () => void
  onUpdateShift: (date: string, employeeName: string, shiftType: string, location: string, notes: string) => void
}

interface ModalState {
  date: Date
  employee: Employee
  currentShift: string
}

const DOW = ['日', '月', '火', '水', '木', '金', '土']

function getShiftInfo(emp: Employee, date: Date, shifts: Shift[]) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const entry = shifts.find(s => s.date === dateStr && s.employeeName === emp.name)
  if (!entry) return { display: WORKING, shiftType: '出勤' }
  return {
    display: SHIFT_DISPLAY[entry.shiftType] || { label: entry.shiftType[0], className: 'text-gray-600' },
    shiftType: entry.shiftType,
  }
}

export default function ShiftTable({ employees, shifts: initialShifts, onReload, onUpdateShift }: Props) {
  const [baseDate, setBaseDate] = useState(new Date())
  const [locationFilter, setLocationFilter] = useState('全院')
  const [modal, setModal] = useState<ModalState | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLTableCellElement>(null)

  useEffect(() => {
    const container = scrollRef.current
    const cell = todayRef.current
    if (!container || !cell) return
    const nameColWidth = 80
    const target = cell.offsetLeft - nameColWidth - 8
    container.scrollTo({ left: Math.max(0, target), behavior: 'auto' })
  }, [])

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

  const handleCellClick = (emp: Employee, date: Date, shiftType: string) => {
    setModal({ date, employee: emp, currentShift: shiftType })
  }

  const handleSave = async (shiftType: string, notes: string) => {
    if (!modal) return
    const dateStr = format(modal.date, 'yyyy-MM-dd')
    const empName = modal.employee.name
    const loc = modal.employee.location

    try {
      if (shiftType === '出勤') {
        await deleteShift(dateStr, empName)
      } else {
        await upsertShift(dateStr, empName, shiftType, loc, notes)
      }
    } catch {}

    // GASがスプレッドシートへ反映するまで待機
    await new Promise(r => setTimeout(r, 4000))

    onUpdateShift(dateStr, empName, shiftType, loc, notes)
    onReload()
    setModal(null)
  }

  return (
    <div className="pb-20">
      <div className="bg-white px-4 pt-12 pb-3">
        <h1 className="text-2xl font-bold text-gray-900">勤務早見表</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {format(today, 'yyyy年M月d日 (E)', { locale: ja })}
        </p>
      </div>

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
        <button onClick={() => setBaseDate(new Date())} className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-xl">
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

      <div ref={scrollRef} className="overflow-x-auto">
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
                  <th key={i} ref={isToday ? todayRef : undefined} className={`py-2 text-center text-xs font-medium w-11 border-b border-gray-100 ${
                    isToday ? 'bg-gray-100' : 'bg-white'
                  } ${dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-gray-500'}`}>
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
                  <td colSpan={8} className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 sticky left-0">
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
                      const { display, shiftType } = getShiftInfo(emp, d, initialShifts)
                      return (
                        <td
                          key={i}
                          onClick={() => handleCellClick(emp, d, shiftType)}
                          className={`text-center py-2 text-sm font-bold cursor-pointer active:opacity-50 transition-opacity ${display.className} ${
                            isToday ? 'bg-gray-100' : ''
                          }`}
                        >
                          {display.label}
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

      {modal && (
        <ShiftModal
          date={modal.date}
          employeeName={modal.employee.name}
          currentShift={modal.currentShift}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={false}
        />
      )}
    </div>
  )
}
