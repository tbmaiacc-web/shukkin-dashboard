import { useState } from 'react'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Props {
  date: Date
  employeeName: string
  currentShift: string
  onSave: (shiftType: string, notes: string) => Promise<void> | void
  onClose: () => void
  saving: boolean
}

const SHIFT_OPTIONS = [
  { value: '出勤',     label: '出勤',             color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { value: '公休',     label: '公休',             color: 'bg-red-50 text-red-500 border-red-200' },
  { value: 'AM公休',   label: 'AM公休',           color: 'bg-red-50 text-red-400 border-red-100' },
  { value: 'PM公休',   label: 'PM公休',           color: 'bg-red-50 text-red-400 border-red-100' },
  { value: '有休',     label: '有休',             color: 'bg-green-50 text-green-600 border-green-200' },
  { value: '育休',     label: '育休',             color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { value: '産休',     label: '産休',             color: 'bg-pink-50 text-pink-500 border-pink-200' },
  { value: 'アニ休',   label: 'アニバーサリー休暇',   color: 'bg-orange-50 text-orange-500 border-orange-200' },
  { value: 'AMアニ休', label: 'AMアニバーサリー', color: 'bg-orange-50 text-orange-400 border-orange-100' },
  { value: 'PMアニ休', label: 'PMアニバーサリー', color: 'bg-orange-50 text-orange-400 border-orange-100' },
  { value: '特別休暇', label: '特別休暇',         color: 'bg-violet-50 text-violet-500 border-violet-200' },
  { value: '研修',     label: '研修',             color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { value: '出張',     label: '出張',             color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  { value: 'バイト',   label: 'バイト',           color: 'bg-gray-50 text-gray-500 border-gray-200' },
]

export default function ShiftModal({ date, employeeName, currentShift, onSave, onClose, saving }: Props) {
  const [selected, setSelected] = useState(currentShift)
  const [confirming, setConfirming] = useState(false)
  const [closing, setClosing] = useState(false)

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 240)
  }

  const handleConfirm = async () => {
    if ('vibrate' in navigator) navigator.vibrate([10])
    setConfirming(true)
    await onSave(selected, '')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={handleClose}>
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm ${closing ? 'backdrop-out' : 'backdrop-in'}`} />
      <div
        className={`relative bg-white/85 backdrop-blur-2xl border border-white/40 rounded-t-3xl w-full max-w-[430px] p-6 pb-safe overflow-y-auto shadow-2xl ${closing ? 'modal-slide-down' : 'modal-slide-up'}`}
        style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))', maxHeight: '75vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900">{employeeName}</h3>
          <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-5">
          {format(date, 'M月d日 (E)', { locale: ja })}
        </p>

        {confirming || saving ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-8 h-8 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500 font-medium">保存中...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {SHIFT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelected(opt.value)}
                  className={`py-3 rounded-2xl text-sm font-semibold border-2 transition-all active:scale-95 ${opt.color} ${
                    selected === opt.value
                      ? 'ring-2 ring-offset-1 ring-navy-700 scale-95 shadow-sm'
                      : 'hover:opacity-80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleConfirm}
              disabled={selected === currentShift}
              className="w-full py-3.5 bg-navy-700 text-white text-sm font-semibold rounded-2xl mt-5 disabled:opacity-30 active:opacity-80 transition-opacity shadow-sm"
            >
              確定する
            </button>
          </>
        )}
      </div>
    </div>
  )
}
