import { useState } from 'react'
import { X, AlertOctagon, Check, Loader2 } from 'lucide-react'
import { cancelLeaveRequest, LeaveType } from '../api/leave'
import { refreshLeaveBalances } from '../hooks/useLeaveBalances'

interface Props {
  name: string
  date: string          // yyyy-MM-dd
  leaveType: LeaveType  // '有給' | 'アニバーサリー'
  fromShift: string     // 元シフト（有休/AM有休 等）
  toShift: string       // 変更後シフト
  onClose: () => void
  onConfirmed: () => void // 「取消する」を実行完了した時 → シフト側の下書きを維持
  onKeep: () => void      // 「取消しない」= シフト変更自体を巻き戻し
}

export default function LeaveCancelModal({
  name, date, leaveType, fromShift, toShift, onClose, onConfirmed, onKeep,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const typeLabel = leaveType === 'アニバーサリー' ? 'アニバーサリー休暇' : '有給'

  const cancel = async () => {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await cancelLeaveRequest({ name, startDate: date, leaveType })
      if (res.ok) {
        setDone(true)
        refreshLeaveBalances()
        onConfirmed()
      } else {
        setError(res.error || '取消に失敗しました')
      }
    } catch (e: any) {
      setError(e?.message || '通信エラー')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-end lg:items-center justify-center bg-black/40 p-0 lg:p-4">
      <div
        className="bg-white w-full lg:max-w-md rounded-t-3xl lg:rounded-3xl shadow-xl max-h-[92dvh] overflow-y-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AlertOctagon size={20} className="text-red-500" />
            <h2 className="text-base font-bold text-gray-800">{typeLabel}の取消確認</h2>
          </div>
          <button onClick={onClose} className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="px-5 py-8 text-center space-y-4">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <Check size={28} className="text-green-500" />
            </div>
            <p className="text-base font-bold text-gray-800">取消を送信しました</p>
            <p className="text-xs text-gray-400">本部（唐澤）へ取消通知され、残日数が戻りました</p>
            <button onClick={onClose} className="w-full py-3 bg-navy-700 text-white text-sm font-bold rounded-xl">
              閉じる
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-400">氏名</span><span className="font-semibold text-gray-800">{name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">対象日</span><span className="font-semibold text-gray-800">{date}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">シフト変更</span><span className="font-semibold text-gray-800">{fromShift} → {toShift}</span></div>
            </div>

            <div className="bg-amber-50 rounded-2xl px-4 py-3 text-xs text-amber-700 leading-relaxed">
              シフトを {fromShift} 以外に変更しました。<br />
              <span className="font-bold">{typeLabel}の申請を取り消しますか？</span><br />
              取消すると: 唐澤さんへ取消通知が送信され、残日数が戻ります。<br />
              取消しない場合: シフト変更を巻き戻し（{fromShift} のまま）にします。
            </div>

            {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={onKeep}
                disabled={submitting}
                className="flex-1 py-3 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl disabled:opacity-40"
              >
                取消しない
              </button>
              <button
                onClick={cancel}
                disabled={submitting}
                className="flex-1 py-3 bg-red-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {submitting ? <><Loader2 size={16} className="animate-spin" />送信中…</> : '取消する'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
