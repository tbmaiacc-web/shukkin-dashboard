import { useState, useEffect } from 'react'
import { X, Clock, ArrowRight, Loader } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { HistoryEntry } from '../types'
import { getHistory } from '../hooks/useMutation'

interface Props {
  onClose: () => void
}

const SHIFT_COLOR: Record<string, string> = {
  '出勤':   'bg-blue-50 text-blue-600',
  '公休':   'bg-red-50 text-red-500',
  'AM公休': 'bg-red-50 text-red-400',
  'PM公休': 'bg-red-50 text-red-400',
  '有休':   'bg-green-50 text-green-600',
  '育休':   'bg-teal-50 text-teal-600',
  '産休':   'bg-pink-50 text-pink-500',
  'アニ休':   'bg-orange-50 text-orange-500',
  'AMアニ休': 'bg-orange-50 text-orange-400',
  'PMアニ休': 'bg-orange-50 text-orange-400',
  '特別休暇':'bg-violet-50 text-violet-500',
  '研修':   'bg-purple-50 text-purple-600',
  '出張':   'bg-yellow-50 text-yellow-700',
  'バイト': 'bg-gray-100 text-gray-500',
}

const SHIFT_LABEL: Record<string, string> = {
  'アニ休':   'アニバーサリー休暇',
  'AMアニ休': 'AMアニバーサリー',
  'PMアニ休': 'PMアニバーサリー',
}

function ShiftBadge({ type }: { type: string }) {
  const cls = SHIFT_COLOR[type] || 'bg-gray-100 text-gray-600'
  const label = SHIFT_LABEL[type] || type
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${cls}`}>{label}</span>
  )
}

export default function HistoryDrawer({ onClose }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHistory(60).then(h => {
      setHistory(h)
      setLoading(false)
    })
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white/85 backdrop-blur-2xl border border-white/40 rounded-t-3xl w-full max-w-[430px] shadow-2xl flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="pt-4 pb-1 flex-none">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 flex-none border-b border-gray-100/80">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-navy-700" />
            <h3 className="text-base font-bold text-gray-900">変更履歴</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 py-3"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader size={24} className="text-navy-700 animate-spin" />
              <span className="text-sm text-gray-400">読み込み中...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Clock size={20} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500">履歴がありません</p>
              <p className="text-xs text-gray-400 mt-1">シフト変更後に履歴が記録されます</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((entry, i) => {
                let dateLabel = ''
                let timeLabel = ''
                try {
                  const ts = parseISO(entry.changedAt)
                  dateLabel = format(ts, 'M/d (E)', { locale: ja })
                  timeLabel = format(ts, 'HH:mm')
                } catch {
                  dateLabel = entry.changedAt
                }
                const shiftDate = entry.date
                  ? (() => {
                    try { return format(parseISO(entry.date), 'M/d', { locale: ja }) } catch { return entry.date }
                  })()
                  : ''

                return (
                  <div key={entry.id || i} className="bg-white/70 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-gray-900">{entry.employeeName}</span>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <span>{dateLabel}</span>
                        <span>{timeLabel}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {shiftDate && (
                        <span className="text-xs text-gray-400 mr-0.5">{shiftDate}：</span>
                      )}
                      <ShiftBadge type={entry.oldShift || '出勤'} />
                      <ArrowRight size={12} className="text-gray-400 shrink-0" />
                      <ShiftBadge type={entry.newShift} />
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
}
