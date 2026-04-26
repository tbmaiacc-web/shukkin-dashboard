import { X } from 'lucide-react'
import { SHIFT_DISPLAY, WORKING } from '../types'

interface Props {
  employeeName: string
  date: string          // 'M月d日 (曜)'
  currentShift: string  // 現在の下書き or 保存済みシフト
  originalShift: string // 保存済みシフト（元に戻す用）
  onSelect: (shiftType: string) => void
  onClose: () => void
}

// 表示順・グループ定義
const SHIFT_GROUPS = [
  {
    label: '出勤・休日',
    items: ['出勤', '公休', 'AM公休', 'PM公休'],
  },
  {
    label: '各種休暇',
    items: ['有休', 'アニ休', 'AMアニ休', 'PMアニ休', '育休', '産休', '特別休暇'],
  },
  {
    label: 'その他',
    items: ['研修', '出張', 'バイト'],
  },
]

const SHIFT_COLORS: Record<string, string> = {
  '出勤':    'bg-blue-50  text-blue-600  border-blue-100',
  '公休':    'bg-red-50   text-red-500   border-red-100',
  'AM公休':  'bg-red-50   text-red-400   border-red-100',
  'PM公休':  'bg-red-50   text-red-400   border-red-100',
  '有休':    'bg-green-50 text-green-600 border-green-100',
  'アニ休':  'bg-orange-50 text-orange-500 border-orange-100',
  'AMアニ休':'bg-orange-50 text-orange-400 border-orange-100',
  'PMアニ休':'bg-orange-50 text-orange-400 border-orange-100',
  '育休':    'bg-teal-50  text-teal-600  border-teal-100',
  '産休':    'bg-pink-50  text-pink-500  border-pink-100',
  '特別休暇':'bg-violet-50 text-violet-500 border-violet-100',
  '研修':    'bg-purple-50 text-purple-600 border-purple-100',
  '出張':    'bg-yellow-50 text-yellow-700 border-yellow-100',
  'バイト':  'bg-gray-100  text-gray-500  border-gray-200',
}

export default function DraftShiftPicker({
  employeeName, date, currentShift, originalShift, onSelect, onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      {/* 背景 */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] backdrop-in" />

      {/* モーダル本体 */}
      <div
        className="relative bg-white rounded-t-3xl w-full max-w-[430px] shadow-2xl modal-slide-up"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ハンドル */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-3" />

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-gray-900">{employeeName}</p>
            <p className="text-xs text-gray-400">{date}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 active:opacity-50">
            <X size={18} />
          </button>
        </div>

        {/* シフト選択グリッド */}
        <div className="px-4 pt-3 space-y-3">
          {SHIFT_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                {group.label}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {group.items.map(shift => {
                  const isCurrent = currentShift === shift
                  const color = SHIFT_COLORS[shift] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                  return (
                    <button
                      key={shift}
                      onClick={() => onSelect(shift)}
                      className={`relative py-2.5 px-1 rounded-xl border text-xs font-semibold text-center transition-all active:scale-95 ${
                        isCurrent
                          ? 'ring-2 ring-navy-700 ring-offset-1 ' + color
                          : color
                      }`}
                    >
                      {shift}
                      {isCurrent && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-navy-700 rounded-full flex items-center justify-center">
                          <span className="text-white text-[8px] font-black">✓</span>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 元に戻す（変更がある場合のみ） */}
        {currentShift !== originalShift && (
          <div className="px-4 mt-3">
            <button
              onClick={() => onSelect(originalShift)}
              className="w-full py-2.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl active:opacity-60"
            >
              元に戻す（{originalShift}）
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
