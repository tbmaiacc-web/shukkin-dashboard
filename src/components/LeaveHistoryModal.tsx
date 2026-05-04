import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader, Calendar, CalendarDays } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Employee, HistoryEntry } from '../types'
import { getHistory } from '../hooks/useMutation'
import { getPaidLeaveGrantInfo, getAnniversaryLeaveGrantInfo, formatShortDate } from '../utils/leaveCalc'

interface Props {
  employee: Employee
  onClose: () => void
}

const LEAVE_TYPES = new Set(['有休', 'AM有休', 'PM有休', 'アニ休', 'AMアニ休', 'PMアニ休'])

const LEAVE_LABEL: Record<string, string> = {
  '有休':     '有給休暇',
  'AM有休':   'AM有給休暇',
  'PM有休':   'PM有給休暇',
  'アニ休':   'アニバーサリー',
  'AMアニ休': 'AMアニバーサリー',
  'PMアニ休': 'PMアニバーサリー',
}

const LEAVE_COLOR: Record<string, string> = {
  '有休':     'bg-green-50 text-green-600',
  'AM有休':   'bg-green-50 text-green-500',
  'PM有休':   'bg-green-50 text-green-500',
  'アニ休':   'bg-orange-50 text-orange-500',
  'AMアニ休': 'bg-orange-50 text-orange-400',
  'PMアニ休': 'bg-orange-50 text-orange-400',
}

export default function LeaveHistoryModal({ employee, onClose }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const [tab, setTab] = useState<'paid' | 'anniversary' | 'all'>('all')

  useEffect(() => {
    getHistory(200, employee.name).then(h => {
      setHistory(h.filter(e => LEAVE_TYPES.has(e.newShift)))
      setLoading(false)
    })
  }, [employee.name])

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 240)
  }

  const filtered = history.filter(e => {
    if (tab === 'paid') return ['有休', 'AM有休', 'PM有休'].includes(e.newShift)
    if (tab === 'anniversary') return ['アニ休', 'AMアニ休', 'PMアニ休'].includes(e.newShift)
    return true
  })

  const grantInfo = employee.hireDate ? getPaidLeaveGrantInfo(employee.hireDate) : null
  const anniversaryGrantInfo = employee.hireDate ? getAnniversaryLeaveGrantInfo(employee.hireDate) : null

  const paidRemaining = (employee.paidLeaveAllotted ?? 10) - (employee.paidLeaveUsed ?? 0)
  const anniversaryRemaining = (employee.anniversaryLeaveAllotted ?? 5) - (employee.anniversaryLeaveUsed ?? 0)
  const showPaidLeaveWarning = (employee.paidLeaveAllotted ?? 0) > 0 && (employee.paidLeaveUsed ?? 0) === 0

  const content = (
    <div className="fixed inset-0 z-[150] flex items-end justify-center" onClick={handleClose}>
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm ${closing ? 'backdrop-out' : 'backdrop-in'}`} />
      <div
        className={`relative bg-white/90 backdrop-blur-2xl border border-white/40 rounded-t-3xl w-full max-w-[430px] shadow-2xl flex flex-col ${closing ? 'modal-slide-down' : 'modal-slide-up'}`}
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="pt-4 pb-1 flex-none">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-2 flex-none">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-navy-50 rounded-full flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-navy-700">{employee.name[0]}</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">{employee.name}</h3>
                <p className="text-xs text-gray-400">休暇消化履歴</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-1 text-gray-400"><X size={20} /></button>
          </div>

          {/* 残日数サマリ */}
          <div className="flex gap-2 mb-3">
            <div className={`flex-1 rounded-2xl px-3 py-2.5 ${paidRemaining <= 2 ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className="text-[10px] font-medium text-gray-500 mb-0.5">有給残日数</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-bold ${paidRemaining <= 2 ? 'text-red-500' : 'text-green-600'}`}>
                  {paidRemaining}
                </span>
                <span className="text-xs text-gray-400">/ {employee.paidLeaveAllotted ?? 10}日</span>
              </div>
            </div>
            <div className={`flex-1 rounded-2xl px-3 py-2.5 ${anniversaryRemaining <= 1 ? 'bg-red-50' : 'bg-orange-50'}`}>
              <p className="text-[10px] font-medium text-gray-500 mb-0.5">アニバーサリー残</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-bold ${anniversaryRemaining <= 1 ? 'text-red-500' : 'text-orange-500'}`}>
                  {anniversaryRemaining}
                </span>
                <span className="text-xs text-gray-400">/ {employee.anniversaryLeaveAllotted ?? 5}日</span>
              </div>
            </div>
          </div>

          {/* 有給 / アニバーサリー付与情報 */}
          {(grantInfo || anniversaryGrantInfo) && (
            <div className="flex gap-2 mb-3">
              {/* 有給付与 */}
              {grantInfo && (
                <div className="flex-1 bg-blue-50 rounded-2xl px-3 py-2.5 flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 mb-0.5">
                    <CalendarDays size={10} />
                    有給付与
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500">次回</span>
                    <span className="text-[11px] font-bold text-blue-700">
                      {formatShortDate(grantInfo.nextGrantDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500">日数</span>
                    <span className="text-[10px] text-blue-600 font-semibold">{grantInfo.nextGrantDays}日</span>
                  </div>
                  {grantInfo.lastGrantDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400">前回</span>
                      <span className="text-[10px] text-gray-400">{formatShortDate(grantInfo.lastGrantDate)}</span>
                    </div>
                  )}
                </div>
              )}
              {/* アニバーサリー付与 */}
              {anniversaryGrantInfo && (
                <div className="flex-1 bg-orange-50 rounded-2xl px-3 py-2.5 flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-orange-600 mb-0.5">
                    <CalendarDays size={10} />
                    アニバ付与
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500">次回</span>
                    <span className="text-[11px] font-bold text-orange-700">
                      {formatShortDate(anniversaryGrantInfo.nextGrantDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500">勤続</span>
                    <span className="text-[10px] text-orange-600 font-semibold">{anniversaryGrantInfo.yearsOfService}年目</span>
                  </div>
                  {anniversaryGrantInfo.lastGrantDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400">前回</span>
                      <span className="text-[10px] text-gray-400">{formatShortDate(anniversaryGrantInfo.lastGrantDate)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 有給未消化警告 */}
          {showPaidLeaveWarning && (
            <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2">
              <span className="text-amber-500 text-sm shrink-0">⚠️</span>
              <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                今年度の有給休暇がまだ消化されていません。計画的な取得を促してください。
              </p>
            </div>
          )}

          {/* タブ */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {([['all', '全て'], ['paid', '有給'], ['anniversary', 'アニバーサリー']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                  tab === key ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 履歴リスト */}
        <div className="flex-1 overflow-y-auto px-4 pb-4"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader size={22} className="text-navy-700 animate-spin" />
              <span className="text-sm text-gray-400">読み込み中...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar size={24} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">履歴がありません</p>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              {filtered.map((entry, i) => {
                let shiftDateLabel = ''
                let changedLabel = ''
                try {
                  shiftDateLabel = format(parseISO(entry.date), 'M月d日 (E)', { locale: ja })
                } catch { shiftDateLabel = entry.date }
                try {
                  changedLabel = format(parseISO(entry.changedAt), 'M/d HH:mm', { locale: ja })
                } catch { changedLabel = entry.changedAt }

                return (
                  <div key={entry.id || i} className="bg-white/70 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-xl shrink-0 ${LEAVE_COLOR[entry.newShift] || 'bg-gray-100 text-gray-500'}`}>
                      {LEAVE_LABEL[entry.newShift] || entry.newShift}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{shiftDateLabel}</p>
                      <p className="text-[10px] text-gray-400">登録: {changedLabel}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
  return createPortal(content, document.body)
}
