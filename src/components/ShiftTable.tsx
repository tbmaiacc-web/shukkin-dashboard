import { useState, useEffect, useRef, useCallback } from 'react'
import { format, addWeeks, subWeeks, startOfWeek, eachDayOfInterval, addDays, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, RefreshCw, Layers, X, Check, Clock } from 'lucide-react'
import { Employee, Shift, SHIFT_DISPLAY, WORKING } from '../types'
import { upsertShift, deleteShift, addHistory, incrementUsedLeave } from '../hooks/useMutation'
import ShiftModal from './ShiftModal'
import BulkShiftModal from './BulkShiftModal'
import HistoryDrawer from './HistoryDrawer'

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

const cellKey = (empName: string, dateStr: string) => `${empName}||${dateStr}`

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
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
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

  // 週が変わったら選択クリア
  useEffect(() => {
    setSelectedCells(new Set())
  }, [baseDate])

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

  // ──────────────────────────────
  // 通常入力
  // ──────────────────────────────
  const handleCellClick = (emp: Employee, date: Date, shiftType: string) => {
    if (bulkMode) {
      const key = cellKey(emp.name, format(date, 'yyyy-MM-dd'))
      setSelectedCells(prev => {
        const next = new Set(prev)
        next.has(key) ? next.delete(key) : next.add(key)
        return next
      })
      return
    }
    setModal({ date, employee: emp, currentShift: shiftType })
  }

  const handleSave = async (shiftType: string, notes: string) => {
    if (!modal) return
    const dateStr = format(modal.date, 'yyyy-MM-dd')
    const empName = modal.employee.name
    const loc = modal.employee.location
    const oldShift = modal.currentShift

    try {
      if (shiftType === '出勤') {
        await deleteShift(dateStr, empName)
      } else {
        await upsertShift(dateStr, empName, shiftType, loc, notes)
      }
      // 履歴記録（シフトが実際に変わった時のみ）
      if (oldShift !== shiftType) {
        addHistory(dateStr, empName, oldShift, shiftType)
        // 有休適用時は使用日数をインクリメント
        if (shiftType === '有休') {
          incrementUsedLeave(empName)
        }
      }
    } catch {}

    await new Promise(r => setTimeout(r, 4000))
    onUpdateShift(dateStr, empName, shiftType, loc, notes)
    await onReload()
    await new Promise(r => setTimeout(r, 400))

    setModal(null)
    onToast('シフトを保存しました')
  }

  // ──────────────────────────────
  // 一括入力
  // ──────────────────────────────

  // 列（日付）を全選択/解除
  const toggleColumn = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const keys = filteredEmployees.map(emp => cellKey(emp.name, dateStr))
    setSelectedCells(prev => {
      const next = new Set(prev)
      const allSelected = keys.every(k => next.has(k))
      if (allSelected) {
        keys.forEach(k => next.delete(k))
      } else {
        keys.forEach(k => next.add(k))
      }
      return next
    })
  }, [filteredEmployees])

  // 行（スタッフ）を全選択/解除
  const toggleRow = useCallback((emp: Employee) => {
    const keys = days.map(d => cellKey(emp.name, format(d, 'yyyy-MM-dd')))
    setSelectedCells(prev => {
      const next = new Set(prev)
      const allSelected = keys.every(k => next.has(k))
      if (allSelected) {
        keys.forEach(k => next.delete(k))
      } else {
        keys.forEach(k => next.add(k))
      }
      return next
    })
  }, [days])

  const exitBulkMode = () => {
    setBulkMode(false)
    setSelectedCells(new Set())
    setBulkModalOpen(false)
  }

  // 一括保存
  const handleBulkSave = async (shiftType: string) => {
    const cells = Array.from(selectedCells).map(key => {
      const [empName, dateStr] = key.split('||')
      const emp = employees.find(e => e.name === empName)
      return { empName, dateStr, loc: emp?.location ?? '' }
    })

    // ローカル即時反映
    cells.forEach(({ empName, dateStr, loc }) => {
      onUpdateShift(dateStr, empName, shiftType, loc, '')
    })

    // GAS 並列書き込み
    await Promise.allSettled(
      cells.map(({ empName, dateStr, loc }) =>
        shiftType === '出勤'
          ? deleteShift(dateStr, empName)
          : upsertShift(dateStr, empName, shiftType, loc, '')
      )
    )

    // GAS 反映待ち（並列書き込みでも GAS 側は順次処理のため余裕を持たせる）
    const gasWait = Math.max(4000, cells.length * 500)
    await new Promise(r => setTimeout(r, gasWait))
    await onReload()
    // React の再描画が完了するまでのバッファ
    await new Promise(r => setTimeout(r, 400))

    setBulkModalOpen(false)
    exitBulkMode()
    onToast(`${cells.length}件のシフトを保存しました`)
  }

  // ──────────────────────────────
  // スワイプ（週移動）
  // ──────────────────────────────
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

  const selectedCount = selectedCells.size

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 64px)' }}>

      {/* 固定ヘッダー */}
      <div className="bg-white px-4 pt-10 pb-2 flex-none flex items-center gap-3">
        <img src="/logo.png" alt="Total Body Make" className="h-8 shrink-0" />
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">勤務早見表</h1>
          <p className="text-xs text-gray-400">
            {format(today, 'yyyy年M月d日 (E)', { locale: ja })}
          </p>
        </div>
        {/* 履歴ボタン */}
        {!bulkMode && (
          <button
            onClick={() => setHistoryOpen(true)}
            className="p-1.5 text-gray-400 hover:text-navy-700 active:opacity-50 transition-colors"
            title="変更履歴"
          >
            <Clock size={18} />
          </button>
        )}
        {/* 一括モードトグル */}
        <button
          onClick={() => bulkMode ? exitBulkMode() : setBulkMode(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            bulkMode
              ? 'bg-navy-700 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {bulkMode ? <X size={13} /> : <Layers size={13} />}
          {bulkMode ? '完了' : '一括'}
        </button>
      </div>

      {/* 一括モードヒント */}
      {bulkMode && (
        <div className="bg-navy-50 border-b border-navy-100 px-4 py-1.5 flex-none">
          <p className="text-xs text-navy-700 font-medium">
            セルをタップして選択 ／ 日付ヘッダーで列一括 ／ 名前で行一括
          </p>
        </div>
      )}

      {/* 週ナビ */}
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

      {/* スクロール領域 */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <table className="border-collapse" style={{ minWidth: '520px' }}>
          <thead>
            <tr>
              {/* 名前列ヘッダー */}
              <th className="sticky top-0 left-0 z-30 bg-white text-left px-3 py-2 text-xs text-gray-400 font-normal w-20 border-b border-gray-100">
                名前
              </th>

              {/* 日付列ヘッダー */}
              {days.map((d, i) => {
                const isTodayCol = isSameDay(d, today)
                const dow = d.getDay()
                const dateStr = format(d, 'yyyy-MM-dd')
                const colKeys = filteredEmployees.map(emp => cellKey(emp.name, dateStr))
                const colAllSelected = bulkMode && colKeys.length > 0 && colKeys.every(k => selectedCells.has(k))

                return (
                  <th
                    key={i}
                    ref={isTodayCol ? todayRef : undefined}
                    onClick={bulkMode ? () => toggleColumn(d) : undefined}
                    className={`sticky top-0 z-20 py-2 text-center text-xs font-medium w-12 border-b border-gray-100 transition-colors ${
                      bulkMode ? 'cursor-pointer active:opacity-60' : ''
                    } ${
                      colAllSelected
                        ? 'bg-navy-700 text-white'
                        : isTodayCol
                        ? 'bg-navy-50'
                        : 'bg-white'
                    } ${
                      colAllSelected ? '' :
                      dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-gray-500'
                    }`}
                  >
                    <div>{format(d, 'M/d')}</div>
                    <div>{DOW[dow]}</div>
                    {isTodayCol && !colAllSelected && (
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

                {staff.map(emp => {
                  const rowKeys = days.map(d => cellKey(emp.name, format(d, 'yyyy-MM-dd')))
                  const rowAllSelected = bulkMode && rowKeys.every(k => selectedCells.has(k))

                  return (
                    <tr key={emp.id} className="border-b border-gray-50">
                      {/* 名前セル（一括モードで行選択） */}
                      <td
                        onClick={bulkMode ? () => toggleRow(emp) : undefined}
                        className={`px-2 py-1.5 sticky left-0 z-10 border-r w-20 transition-colors ${
                          bulkMode ? 'cursor-pointer active:opacity-60' : ''
                        } ${
                          rowAllSelected
                            ? 'bg-navy-700 border-navy-600'
                            : 'bg-white border-gray-100'
                        }`}
                      >
                        <div className={`text-sm font-medium leading-tight ${rowAllSelected ? 'text-white' : 'text-gray-800'}`}>
                          {emp.name}
                        </div>
                        <div className={`text-[10px] leading-tight mt-0.5 ${rowAllSelected ? 'text-navy-200' : 'text-gray-400'}`}>
                          {emp.location.replace('院', '')}
                        </div>
                      </td>

                      {/* シフトセル */}
                      {days.map((d, i) => {
                        const isTodayCol = isSameDay(d, today)
                        const dateStr = format(d, 'yyyy-MM-dd')
                        const { display, shiftType } = getShiftInfo(emp, d, initialShifts)
                        const key = cellKey(emp.name, dateStr)
                        const isSelected = selectedCells.has(key)

                        return (
                          <td
                            key={i}
                            onClick={() => handleCellClick(emp, d, shiftType)}
                            className={`relative text-center py-2 text-sm font-bold cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-navy-700 text-white'
                                : `${display.className} ${isTodayCol ? 'bg-navy-50/60' : ''}`
                            } ${bulkMode && !isSelected ? 'active:bg-navy-100' : 'active:opacity-50'}`}
                          >
                            {isSelected ? (
                              <Check size={14} className="mx-auto stroke-[3]" />
                            ) : (
                              display.label
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* 一括アクションバー */}
      {bulkMode && (
        <div
          className="flex-none bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={() => setSelectedCells(new Set())}
            className="text-xs text-gray-400 font-medium px-3 py-2 rounded-xl bg-gray-100 active:opacity-60"
            disabled={selectedCount === 0}
          >
            解除
          </button>
          <div className="flex-1 text-center">
            <span className="text-sm font-bold text-navy-700">
              {selectedCount > 0 ? `${selectedCount}件選択中` : 'セルを選択'}
            </span>
          </div>
          <button
            onClick={() => setBulkModalOpen(true)}
            disabled={selectedCount === 0}
            className="px-4 py-2 bg-navy-700 text-white text-sm font-semibold rounded-xl disabled:opacity-30 active:opacity-70 shadow-sm"
          >
            シフトを設定
          </button>
        </div>
      )}

      {/* 通常シフトモーダル */}
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

      {/* 一括シフトモーダル */}
      {bulkModalOpen && (
        <BulkShiftModal
          count={selectedCount}
          onSave={handleBulkSave}
          onClose={() => setBulkModalOpen(false)}
        />
      )}

      {/* 変更履歴ドロワー */}
      {historyOpen && (
        <HistoryDrawer onClose={() => setHistoryOpen(false)} />
      )}
    </div>
  )
}
