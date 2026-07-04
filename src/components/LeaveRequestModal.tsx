import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { X, CalendarDays, Check, Loader2 } from 'lucide-react'
import {
  fetchStaffOptions,
  submitLeaveRequest,
  StaffOptions,
  LeaveBalance,
  LeaveType,
} from '../api/leave'
import { refreshLeaveBalances } from '../hooks/useLeaveBalances'

interface Props {
  onClose: () => void
  onSubmitted?: () => void
  /** 初期値（シフト由来なら氏名・日付・種別は固定表示） */
  defaultName?: string
  defaultDept?: string
  defaultDate?: string // 'yyyy-MM-dd'
  defaultKind?: string // 全日 / 午前半休 / 午後半休
  /** 休暇種別（既定: 有給） */
  leaveType?: LeaveType
  /** true: 氏名・日付・種別を編集不可（シフトで確定済み） */
  locked?: boolean
}

const KINDS = ['全日', '午前半休', '午後半休']

export default function LeaveRequestModal({
  onClose, onSubmitted, defaultName, defaultDept, defaultDate, defaultKind, leaveType = '有給', locked,
}: Props) {
  const isAnniv = leaveType === 'アニバーサリー'
  const typeLabel = isAnniv ? 'アニバーサリー休暇' : '有給'
  const [opts, setOpts] = useState<StaffOptions>({ names: [], depts: [], kinds: KINDS })
  const [name, setName] = useState(defaultName || '')
  const [dept, setDept] = useState(defaultDept || '')
  const [startDate, setStartDate] = useState(defaultDate || format(new Date(), 'yyyy-MM-dd'))
  const [kind, setKind] = useState(defaultKind || '全日')
  const [days, setDays] = useState(defaultKind && defaultKind !== '全日' ? 0.5 : 1)
  const [reason, setReason] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<LeaveBalance | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStaffOptions().then(setOpts).catch(() => {})
  }, [])

  // 種別が半休なら日数0.5固定、全日なら1へ
  useEffect(() => {
    if (kind === '午前半休' || kind === '午後半休') setDays(0.5)
    else if (days === 0.5) setDays(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind])

  const isHalf = kind !== '全日'
  const valid = name && dept && startDate && days > 0

  const submit = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await submitLeaveRequest({ name, dept, startDate, kind, days, reason, leaveType })
      if (res.ok) {
        setDone(res.balance ?? { name, remaining: null })
        refreshLeaveBalances() // 申請で残が変わるのでキャッシュ更新
        onSubmitted?.()
      } else {
        setError(res.error || '送信に失敗しました')
      }
    } catch (e: any) {
      setError(e?.message || '通信エラー')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end lg:items-center justify-center bg-black/40 p-0 lg:p-4"
         onClick={onClose}>
      <div
        className="bg-white w-full lg:max-w-md rounded-t-3xl lg:rounded-3xl shadow-xl max-h-[92dvh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CalendarDays size={20} className="text-navy-700" />
            <h2 className="text-base font-bold text-gray-800">{typeLabel}申請</h2>
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
            <div>
              <p className="text-base font-bold text-gray-800">申請を送信しました</p>
              <p className="text-xs text-gray-400 mt-1">本部（唐澤）へ通知されました</p>
            </div>
            <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-600 space-y-1 text-left">
              <div className="flex justify-between"><span>氏名</span><span className="font-medium text-gray-800">{name}</span></div>
              <div className="flex justify-between"><span>取得日</span><span className="font-medium text-gray-800">{startDate}（{kind}）</span></div>
              <div className="flex justify-between"><span>日数</span><span className="font-medium text-gray-800">{days}日</span></div>
              {done.remaining != null ? (
                <div className="flex justify-between pt-1 border-t border-gray-200 mt-1">
                  <span>{typeLabel}残</span><span className="font-bold text-navy-700">{done.remaining}日</span>
                </div>
              ) : (
                <div className="pt-1 border-t border-gray-200 mt-1 text-amber-600 text-xs">
                  残日数: {done.note || '要確認（マスター未登録/入社日未入力）'}
                </div>
              )}
            </div>
            <button onClick={onClose} className="w-full py-3 bg-navy-700 text-white text-sm font-bold rounded-xl">
              閉じる
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {locked ? (
              /* シフト由来: 氏名・日付・種別は確定済み表示 */
              <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-400">氏名</span><span className="font-semibold text-gray-800">{name}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">取得日</span><span className="font-semibold text-gray-800">{startDate}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">種別</span><span className="font-semibold text-gray-800">{kind}（{days}日）</span></div>
              </div>
            ) : (
              <>
                <Field label="氏名">
                  <select value={name} onChange={e => setName(e.target.value)} className={selectCls}>
                    <option value="">選択してください</option>
                    {opts.names.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Field>
                <Field label="取得日（開始日）">
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={selectCls} />
                </Field>
                <Field label="種別">
                  <div className="grid grid-cols-3 gap-2">
                    {(opts.kinds || KINDS).map(k => (
                      <button key={k} onClick={() => setKind(k)}
                        className={`py-2.5 rounded-xl text-xs font-semibold border transition ${
                          kind === k ? 'bg-navy-700 text-white border-navy-700' : 'bg-white text-gray-500 border-gray-200'
                        }`}>{k}</button>
                    ))}
                  </div>
                </Field>
                <Field label={isHalf ? '日数（半休=0.5固定）' : '日数（連続取得日数）'}>
                  <input type="number" min={0.5} step={0.5} value={days} disabled={isHalf}
                    onChange={e => setDays(Number(e.target.value))}
                    className={`${selectCls} ${isHalf ? 'bg-gray-100 text-gray-400' : ''}`} />
                </Field>
              </>
            )}

            {/* 所属院は常に編集可（prefill） */}
            <Field label="所属院">
              <select value={dept} onChange={e => setDept(e.target.value)} className={selectCls}>
                <option value="">選択してください</option>
                {opts.depts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>

            <Field label="理由（任意）">
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                placeholder="私用のため 等" className={`${selectCls} resize-none`} />
            </Field>

            {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button onClick={submit} disabled={!valid || submitting}
              className="w-full py-3 bg-navy-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40">
              {submitting ? <><Loader2 size={16} className="animate-spin" />送信中…</> : '申請する'}
            </button>
            <p className="text-[11px] text-gray-400 text-center">
              送信すると本部（唐澤）へ即時通知され、残日数が更新されます
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const selectCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-navy-700 bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      {children}
    </div>
  )
}
