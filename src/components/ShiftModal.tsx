import { X } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Props {
  date: Date
  employeeName: string
  currentShift: string
  onSave: (shiftType: string, notes: string) => void
  onClose: () => void
  saving: boolean
}

const SHIFT_OPTIONS = [
  { value: '出勤',    label: '出勤',    color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { value: '公休',    label: '公休',    color: 'bg-red-50 text-red-500 border-red-200' },
  { value: 'AM公休',  label: 'AM公休',  color: 'bg-red-50 text-red-400 border-red-100' },
  { value: 'PM公休',  label: 'PM公休',  color: 'bg-red-50 text-red-400 border-red-100' },
  { value: '有休',    label: '有休',    color: 'bg-green-50 text-green-600 border-green-200' },
  { value: '育休',    label: '育休',    color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { value: '産休',    label: '産休',    color: 'bg-pink-50 text-pink-500 border-pink-200' },
  { value: 'アニ休',  label: 'アニ休',  color: 'bg-orange-50 text-orange-500 border-orange-200' },
  { value: 'AMアニ休', label: 'AMアニ休', color: 'bg-orange-50 text-orange-400 border-orange-100' },
  { value: 'PMアニ休', label: 'PMアニ休', color: 'bg-orange-50 text-orange-400 border-orange-100' },
  { value: '特別休暇', label: '特別休暇', color: 'bg-violet-50 text-violet-500 border-violet-200' },
  { value: '研修',    label: '研修',    color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { value: '出張',    label: '出張',    color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  { value: 'バイト',  label: 'バイト',  color: 'bg-gray-50 text-gray-500 border-gray-200' },
]

export default function ShiftModal({ date, employeeName, currentShift, onSave, onClose, saving }: Props) {
  const handleSelect = (val: string) => {
    onSave(val, '')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-t-3xl w-full max-w-[430px] p-6 pb-safe overflow-y-auto"
        style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))', maxHeight: '75vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900">{employeeName}</h3>
          <button onClick={onClose} className="p-1 text-gray-400">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-5">
          {format(date, 'M月d日 (E)', { locale: ja })}
        </p>

        {saving ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-gray-500">保存中...</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {SHIFT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`py-3 rounded-2xl text-sm font-semibold border-2 transition-all ${opt.color} ${
                  currentShift === opt.value ? 'ring-2 ring-offset-1 ring-gray-400 scale-95' : ''
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
