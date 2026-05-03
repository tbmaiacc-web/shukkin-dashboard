import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { format, addWeeks, subWeeks, startOfWeek, eachDayOfInterval, addDays, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, RefreshCw, X, Check, Clock, CalendarDays, Pencil } from 'lucide-react'
import { Employee, Shift, SHIFT_DISPLAY, WORKING } from '../types'
import { upsertShift, deleteShift, addHistory, incrementUsedLeave, incrementUsedAnniversaryLeave } from '../hooks/useMutation'
import DraftShiftPicker from './DraftShiftPicker'
import HistoryDrawer from './HistoryDrawer'

interface Props {
  employees: Employee[]
  shifts: Shift[]
  onReload: () => Promise<void>
  onUpdateShift: (date: string, employeeName: string, shiftType: string, location: string, notes: string) => void
  onToast: (msg: string) => void
}

interface DraftChange {
  employeeName: string
  dateStr: string
  shiftType: string
  location: string
  originalShift: string
}

interface PickerState {
  emp: Employee
  date: Date
  currentShift: string
  originalShift: string
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
  const [viewWeeks, setViewWeeks] = useState<1 | 2>(1)
  const [draftMode, setDraftMode] = useState(false)
  const [draftChanges, setDraftChanges] = useState<Map<string, DraftChange>>(new Map())
  const [picker, setPicker] = useState<PickerState | null>(null)
  const [confirming, setConfirming] = useState(false)
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

  const weekStartSun = startOfWeek(baseDate, { weekStartsOn: 0 })
  const days = eachDayOfInterval({
    start: weekStartSun,
    end: addDays(weekStartSun, viewWeeks * 7 - 1),
  })
  const today = new Date()
  const locations = ['全院', ...Array.from(new Set(employees.map(e => e.location))).sort()]

  const filteredEmployees = locationFilter === '全院'
    ? employees
    : employees.filter(e => e.location === locationFilter)

  const grouped = Array.from(new Set(filteredEmployees.map(e => e.location))).map(loc => ({
    location: loc,
    staff: filteredEmployees.filter(e => e.location === loc),
  }))

  const rangeLabel = `${format(days[0], 'M/d')} – ${format(days[days.length - 1], 'M/d')}`

  // ──────────────────────────────
  // 下書きモード: セルタップでピッカー表示
  // ──────────────────────────────
  const handleCellClick = (emp: Employee, date: Date) => {
    if (!draftMode) return
    const dateStr = format(date, 'yyyy-MM-dd')
    const key = cellKey(emp.name, dateStr)
    const { shiftType: originalShift } = getShiftInfo(emp, date, initialShifts)
    const currentDraft = draftChanges.get(key)
    const currentShift = currentDraft ? currentDraft.shiftType : originalShift
    setPicker({ emp, date, currentShift, originalShift })
  }

  const handlePickerSelect = (shiftType: string) => {
    if (!picker) return
    const dateStr = format(picker.date, 'yyyy-MM-dd')
    const key = cellKey(picker.emp.name, dateStr)

    setDraftChanges(prev => {
      const next = new Map(prev)
      if (shiftType === picker.originalShift) {
        next.delete(key) // 元に戻した → 下書き削除
      } else {
        next.set(key, {
          employeeName: picker.emp.name,
          dateStr,
          shiftType,
          location: picker.emp.location,
          originalShift: picker.originalShift,
        })
      }
      return next
    })
    setPicker(null)
  }

  const exitDraftMode = () => {
    setDraftMode(false)
    setDraftChanges(new Map())
  }

  // ──────────────────────────────
  // 変更確定: 一括送信
  // ──────────────────────────────
  const handleConfirm = async () => {
    if (draftChanges.size === 0 || confirming) return
    setConfirming(true)

    const changes = Array.from(draftChanges.values())

    // 1. ローカル即時反映
    changes.forEach(c => onUpdateShift(c.dateStr, c.employeeName, c.shiftType, c.location, ''))

    // 2. 下書きモード終了（UIをすぐ通常に戻す）
    setDraftMode(false)
    setDraftChanges(new Map())

    // 3. GAS にシフト並列送信（全て完了を待つ）
    await Promise.allSettled(
      changes.map(c =>
        c.shiftType === '出勤'
          ? deleteShift(c.dateStr, c.employeeName)
          : upsertShift(c.dateStr, c.employeeName, c.shiftType, c.location, '')
      )
    )

    // 4. 履歴・有給残処理（全て完了を待つ）
    await Promise.allSettled(
      changes
        .filter(c => c.shiftType !== c.originalShift)
        .flatMap(c => [
          addHistory(c.dateStr, c.employeeName, c.originalShift, c.shiftType),
          c.shiftType === '有休'
            ? incrementUsedLeave(c.employeeName, 1)
            : c.shiftType === 'AM有休' || c.shiftType === 'PM有休'
            ? incrementUsedLeave(c.employeeName, 0.5)
            : c.shiftType === 'アニ休'
            ? incrementUsedAnniversaryLeave(c.employeeName, 1)
            : ['AMアニ休', 'PMアニ休'].includes(c.shiftType)
            ? incrementUsedAnniversaryLeave(c.employeeName, 0.5)
            : Promise.resolve(),
        ])
    )

    // 5. サイレントリロード（全処理完了後）
    await onReload()
    setConfirming(false)
    onToast(`${changes.length}件のシフトを更新しました`)
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
      if (dx < 0) setBaseDate(d => addWeeks(d, viewWeeks))
      else setBaseDate(d => subWeeks(d, viewWeeks))
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const draftCount = draftChanges.size

  return (
    <>
    <div className="flex flex-col lg:h-dvh" style={{ height: 'calc(100dvh - 4rem - env(safe-area-inset-bottom, 0px))' }}>

      {/* 固定ヘッダー */}
      <div className="bg-white px-4 pt-10 pb-2 lg:pt-4 flex-none flex items-center gap-3">
        <img src="/logo.png" alt="Total Body Make" className="h-8 shrink-0" />
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">勤務早見表</h1>
          <p className="text-xs text-gray-400">
            {format(today, 'yyyy年M月d日 (E)', { locale: ja })}
          </p>
        </div>

        {/* 履歴ボタン（変更モード外のみ） */}
        {!draftMode && (
          <button
            onClick={() => setHistoryOpen(true)}
            className="p-1.5 text-gray-400 hover:text-navy-700 active:opacity-50 transition-colors"
            title="変更履歴"
          >
            <Clock size={18} />
          </button>
        )}

        {/* シフト変更ボタン */}
        <button
          onClick={() => draftMode ? exitDraftMode() : setDraftMode(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            draftMode
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {draftMode ? <X size={13} /> : <Pencil size={13} />}
          {draftMode ? 'キャンセル' : 'シフト変更'}
        </button>
      </div>

      {/* 変更モードヒントバー */}
      {draftMode && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex-none flex items-center justify-between">
          <p className="text-xs text-amber-700 font-medium">
            セルをタップするたびにシフト種類が切り替わります
          </p>
          {draftCount > 0 && (
            <span className="text-xs font-bold text-amber-600">{draftCount}件変更中</span>
          )}
        </div>
      )}

      {/* 週ナビ */}
      <div
        className="bg-white px-3 py-2 border-b border-gray-100 flex items-center gap-2 flex-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center bg-gray-100 rounded-xl px-2 py-1.5 gap-1 flex-1">
          <button onClick={() => setBaseDate(d => subWeeks(d, viewWeeks))} className="p-1 text-gray-500 active:opacity-50">
            <ChevronLeft size={16} />
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-gray-800">{rangeLabel}</span>
          <button onClick={() => setBaseDate(d => addWeeks(d, viewWeeks))} className="p-1 text-gray-500 active:opacity-50">
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

      {/* 表示週数切り替えバー */}
      <div className="bg-white px-3 pb-2 flex-none flex items-center gap-2">
        <CalendarDays size={13} className="text-gray-400 shrink-0" />
        <span className="text-xs text-gray-400 mr-1">表示期間</span>
        <div className="flex bg-gray-100 rounded-xl p-0.5">
          {([1, 2] as const).map(w => (
            <button
              key={w}
              onClick={() => setViewWeeks(w)}
              className={`px-3 py-1 rounded-[10px] text-xs font-semibold transition-colors ${
                viewWeeks === w
                  ? 'bg-white text-navy-700 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {w}週
            </button>
          ))}
        </div>
      </div>

      {/* スクロール領域 */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <table className="border-collapse" style={{ minWidth: `${80 + days.length * 48}px` }}>
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 bg-white text-left px-3 py-2 text-xs text-gray-400 font-normal w-20 border-b border-gray-100">
                名前
              </th>
              {days.map((d, i) => {
                const isTodayCol = isSameDay(d, today)
                const dow = d.getDay()
                const isWeekBoundary = viewWeeks === 2 && i === 7
                return (
                  <th
                    key={i}
                    ref={isTodayCol ? todayRef : undefined}
                    className={`sticky top-0 z-20 py-2 text-center text-xs font-medium w-12 border-b border-gray-100 ${
                      isWeekBoundary ? 'border-l-2 border-l-navy-200' : ''
                    } ${
                      isTodayCol ? 'bg-navy-50' : 'bg-white'
                    } ${
                      dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-gray-500'
                    }`}
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
                  <td colSpan={days.length + 1} className="px-3 py-1.5 text-xs font-semibold text-navy-700 bg-navy-50 sticky left-0 z-10">
                    {location}
                  </td>
                </tr>

                {staff.map(emp => (
                  <tr key={emp.id} className="border-b border-gray-50">
                    {/* 名前セル */}
                    <td className="px-2 py-1.5 sticky left-0 z-10 bg-white border-r border-gray-100 w-20">
                      <div className="text-sm font-medium leading-tight text-gray-800">{emp.name}</div>
                      <div className="text-[10px] leading-tight mt-0.5 text-gray-400">
                        {emp.location.replace('院', '')}
                      </div>
                    </td>

                    {/* シフトセル */}
                    {days.map((d, i) => {
                      const isTodayCol = isSameDay(d, today)
                      const dateStr = format(d, 'yyyy-MM-dd')
                      const key = cellKey(emp.name, dateStr)
                      const draft = draftChanges.get(key)
                      const { display: savedDisplay, shiftType: savedShift } = getShiftInfo(emp, d, initialShifts)

                      // 下書きがあれば下書きを表示、なければ保存済みを表示
                      const display = draft
                        ? (SHIFT_DISPLAY[draft.shiftType] || WORKING)
                        : savedDisplay
                      const isDraft = !!draft
                      const isWeekBoundary = viewWeeks === 2 && i === 7

                      return (
                        <td
                          key={i}
                          onClick={() => handleCellClick(emp, d)}
                          className={`relative text-center py-2 text-sm font-bold transition-all ${
                            isWeekBoundary ? 'border-l-2 border-l-navy-200' : ''
                          } ${
                            draftMode ? 'cursor-pointer active:scale-90' : ''
                          } ${
                            isDraft
                              ? 'ring-2 ring-inset ring-amber-400 bg-amber-50'
                              : `${display.className} ${isTodayCol ? 'bg-navy-50/60' : ''}`
                          }`}
                        >
                          <span className={isDraft ? 'text-amber-700' : ''}>
                            {isDraft
                              ? (SHIFT_DISPLAY[draft!.shiftType]?.label ?? draft!.shiftType[0])
                              : display.label}
                          </span>
                          {/* 下書きインジケーター（右下の小ドット） */}
                          {isDraft && (
                            <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                          )}
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

      {/* 変更確定フローティングボタン */}
      {draftMode && draftCount > 0 && (
        <div className="fixed bottom-20 right-4 z-40 lg:bottom-8 lg:right-8">
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex items-center gap-2 bg-navy-700 text-white px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm active:opacity-80 disabled:opacity-60 transition-opacity"
          >
            {confirming ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={16} strokeWidth={3} />
            )}
            変更確定 {draftCount}件
          </button>
        </div>
      )}

      {/* シフト種類ピッカー（下書きモード） */}
      {picker && (
        <DraftShiftPicker
          employeeName={picker.emp.name}
          date={format(picker.date, 'M月d日 (E)', { locale: ja })}
          currentShift={picker.currentShift}
          originalShift={picker.originalShift}
          onSelect={handlePickerSelect}
          onClose={() => setPicker(null)}
        />
      )}

      {/* 変更履歴ドロワー */}
      {historyOpen && (
        <HistoryDrawer onClose={() => setHistoryOpen(false)} />
      )}
    </div>

    {/* ── 確定処理中ブロッキングモーダル ── */}
    {confirming && createPortal(
      <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center"
           style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
        <div className="bg-white rounded-3xl px-10 py-9 flex flex-col items-center gap-4 shadow-2xl mx-6"
             style={{ maxWidth: 320 }}>
          {/* スピナー */}
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
            <div className="absolute inset-0 rounded-full border-4 border-navy-700 border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-gray-900">保存中...</p>
            <p className="text-xs text-gray-400 mt-1">完了までそのままお待ちください</p>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  )
}
