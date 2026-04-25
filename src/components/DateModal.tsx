import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay,
} from 'date-fns'
import { ja } from 'date-fns/locale'

interface Props {
  selected: Date
  onSelect: (d: Date) => void
  onClose: () => void
}

const DOW = ['日', '月', '火', '水', '木', '金', '土']

export default function DateModal({ selected, onSelect, onClose }: Props) {
  const [base, setBase] = useState(selected)
  const today = new Date()

  const monthStart = startOfMonth(base)
  const monthEnd = endOfMonth(base)
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 0 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-t-3xl w-full max-w-[430px] p-6"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">日付を選択</h3>
          <button onClick={onClose} className="p-1 text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setBase(d => subMonths(d, 1))} className="p-2 text-gray-500">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-800">
            {format(base, 'yyyy年M月', { locale: ja })}
          </span>
          <button onClick={() => setBase(d => addMonths(d, 1))} className="p-2 text-gray-500">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DOW.map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-medium py-1 ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(d => {
            const inMonth = isSameMonth(d, base)
            const isSel = isSameDay(d, selected)
            const isToday = isSameDay(d, today)
            const dow = d.getDay()
            return (
              <button
                key={d.toISOString()}
                onClick={() => onSelect(d)}
                className={`aspect-square rounded-xl text-sm transition-colors ${
                  isSel
                    ? 'bg-navy-700 text-white font-bold'
                    : isToday
                    ? 'bg-navy-50 font-bold text-navy-700'
                    : ''
                } ${
                  !inMonth ? 'text-gray-300' : isSel ? '' :
                  dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-700'
                }`}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => onSelect(today)}
          className="w-full mt-5 py-2.5 text-sm font-semibold text-navy-700 bg-navy-50 rounded-xl"
        >
          今日に戻る
        </button>
      </div>
    </div>
  )
}
