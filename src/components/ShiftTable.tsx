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
  onReload: () => Promise<void>
  onUpdateShift: (date: string, employeeName: string, shiftType: string, location: string, notes: string) => void
  onToast: (msg: string) => void
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

export default function ShiftTable({ employees, shifts: initialShifts, onReload, onUpdateShift, onToast }: Props) {
  const [baseDate, setBaseDate] = useState(new Date())
  const [locationFilter, setLocationFilter] = useState('全院')
  const [modal, setModal] = useState<ModalState | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLTableCellElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

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

    // GASがスプレッドシートへ反映するまで待機してからリロード
    // await onReload() でデータ取得完了までモーダルのローディングを継続
    await new Promise(r => setTimeout(r, 4000))
    onUpdateShift(dateStr, empName, shiftType, loc, notes)
    await onReload()

    setModal(null)
    onToast('シフトを保存しました')
  }

  // Swipe gesture handlers (on nav bar, not scroll area)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 60) {
      if (dx < 0) setBaseDate(d => addWeeks(d, 1))
      else setBaseDate(d => subWeeks(d, 1))
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 64px)' }}>
      {/* 固定ヘッダー */}
      <div className="bg-white px-4 pt-10 pb-2 flex-none flex items-center gap-3">
        <img src="/logo.png" alt="Total Body Make" className="h-8 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">勤務早見表</h1>
          <p className="text-xs text-gray-400">
            {format(today, 'yyyy年M月d日 (E)', { locale: ja })}
          </p>
        </div>
      </div>

      {/* 週ナビ（スワイプ対応） */}
      <div
        className="bg-white px-3 py-2 border-b border-gray-100 flex items-center gap-2 flex-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center bg-gray-100 rounded-xl px-2 py-1.5 gap-1 flex-1">
          <button onClick={() => setBaseDate(d => subWeeks(d, 1))} className="p-1 text-gray-500 active:opacity-50">
            <ChevronLeft size={16} />
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-gray-800">{rangeLabel}</span>
          <button onClick={() => setBaseDate(d => addWeeks(d, 1))} className="p-1 text-gray-500 active:opacity-50">
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          onClick={() => setBaseDate(new Date())}
          className="px-3 py-1.5 text-xs font-semibold text-navy-700 bg-navy-50 rounded-xl"
        >
          今日
        </button>
        <button onClick={onReload} className="p-1.5 text-gray-400 active:opacity-50">
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

      {/* スクロール領域（縦横） */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <table className="border-collapse" style={{ minWidth: '520px' }}>
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 bg-white text-left px-3 py-2 text-xs text-gray-400 font-normal w-20 border-b border-gray-100">
                名前
              </th>
              {days.map((d, i) => {
                const isTodayCol = isSameDay(d, today)
                const dow = d.getDay()
                return (
                  <th
                    key={i}
                    ref={isTodayCol ? todayRef : undefined}
                    className={`sticky top-0 z-20 py-2 text-center text-xs font-medium w-12 border-b border-gray-100 ${
                      isTodayCol ? 'bg-navy-50' : 'bg-white'
                    } ${dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-gray-500'}`}
                  >
                    <div>{format(d, 'M/d')}</div>
                    <div>{DOW[dow]}</div>
                    {isTodayCol && (
                      <div className="w-1 h-1 bg-navy-700 rounded-full mx-auto mt-0.5" />
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ location, staff }) => (
              <>
                <tr key={`loc-${location}`}>
                  <td colSpan={8} className="px-3 py-1.5 text-xs font-semibold text-navy-700 bg-navy-50 sticky left-0 z-10">
                    {location}
                  </td>
                </tr>
                {staff.map(emp => (
                  <tr key={emp.id} className="border-b border-gray-50">
                    <td className="px-2 py-1.5 sticky left-0 z-10 bg-white border-r border-gray-100 w-20">
                      <div className="text-sm text-gray-800 font-medium leading-tight">{emp.name}</div>
                      <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{emp.location.replace('院', '')}</div>
                    </td>
                    {days.map((d, i) => {
                      const isTodayCol = isSameDay(d, today)
                      const { display, shiftType } = getShiftInfo(emp, d, initialShifts)
                      return (
                        <td
                          key={i}
                          onClick={() => handleCellClick(emp, d, shiftType)}
                          className={`text-center py-2 text-sm font-bold cursor-pointer active:opacity-50 transition-opacity ${display.className} ${
                            isTodayCol ? 'bg-navy-50/60' : ''
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
