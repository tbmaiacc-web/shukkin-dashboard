import { useState } from 'react'
import { X } from 'lucide-react'
import { Employee } from '../types'

interface Props {
  employee: Employee | null
  isAdmin: boolean
  onSave: (emp: Employee) => void
  onClose: () => void
  saving: boolean
}

const ROLES = ['院長', '副院長', 'セラピスト']
const LOCATIONS = ['草加院', 'イオン八潮南院', '上尾院', '前橋院', '伊勢崎宮子院', '取手院']

function StepCounter({
  value, onChange, disabled, min = 0, max = 99,
}: { value: number; onChange: (v: number) => void; disabled?: boolean; min?: number; max?: number }) {
  const num = Number(value) // GASから文字列で来る場合に備えてNumber変換
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${disabled ? 'bg-gray-50' : 'bg-white'}`}>
      <button
        onClick={() => onChange(Math.max(min, num - 1))}
        disabled={disabled || num <= min}
        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-bold active:opacity-60 disabled:opacity-30"
      >−</button>
      <span className={`flex-1 text-center text-sm font-semibold ${disabled ? 'text-gray-400' : 'text-gray-800'}`}>
        {num}日
      </span>
      <button
        onClick={() => onChange(Math.min(max, num + 1))}
        disabled={disabled || num >= max}
        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-bold active:opacity-60 disabled:opacity-30"
      >＋</button>
    </div>
  )
}

export default function EmployeeModal({ employee, isAdmin, onSave, onClose, saving }: Props) {
  const isNew = !employee
  const [closing, setClosing] = useState(false)
  const [form, setForm] = useState<Omit<Employee, 'id'>>({
    name: employee?.name || '',
    role: employee?.role || 'セラピスト',
    location: employee?.location || '草加院',
    paidLeaveAllotted: employee?.paidLeaveAllotted ?? 10,
    paidLeaveUsed: employee?.paidLeaveUsed ?? 0,
    anniversaryLeaveAllotted: employee?.anniversaryLeaveAllotted ?? 5,
    anniversaryLeaveUsed: employee?.anniversaryLeaveUsed ?? 0,
  })

  const handleClose = () => {
    if (saving) return
    setClosing(true)
    setTimeout(onClose, 240)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    onSave({ id: employee?.id || '', ...form })
  }

  const paidRemaining = (form.paidLeaveAllotted ?? 10) - (form.paidLeaveUsed ?? 0)
  const anniversaryRemaining = (form.anniversaryLeaveAllotted ?? 5) - (form.anniversaryLeaveUsed ?? 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={handleClose}>
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm ${closing ? 'backdrop-out' : 'backdrop-in'}`} />
      <div
        className={`relative bg-white/85 backdrop-blur-2xl border border-white/40 rounded-t-3xl w-full max-w-[430px] shadow-2xl flex flex-col ${closing ? 'modal-slide-down' : 'modal-slide-up'}`}
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── ヘッダー（固定） ── */}
        <div className="px-6 pt-5 pb-4 flex-none">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {isNew ? '従業員を追加' : '従業員を編集'}
              </h3>
              {isAdmin && (
                <span className="text-[10px] font-semibold text-navy-700 bg-navy-50 px-2 py-0.5 rounded-full">
                  管理者モード
                </span>
              )}
            </div>
            <button onClick={handleClose} className="p-1 text-gray-400"><X size={20} /></button>
          </div>
        </div>

        {/* ── スクロール可能なコンテンツ ── */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">
          {saving ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-gray-500">保存中...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 氏名 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">氏名</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none"
                  placeholder="例: 山田"
                />
              </div>

              {/* 役職 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">役職</label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r}
                      onClick={() => setForm(f => ({ ...f, role: r }))}
                      className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                        form.role === r
                          ? 'bg-navy-700 text-white border-navy-700'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >{r}</button>
                  ))}
                </div>
              </div>

              {/* 勤務地 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">勤務地</label>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map(l => (
                    <button
                      key={l}
                      onClick={() => setForm(f => ({ ...f, location: l }))}
                      className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                        form.location === l
                          ? 'bg-navy-700 text-white border-navy-700'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >{l}</button>
                  ))}
                </div>
              </div>

              {/* 有給休暇 */}
              <div className="bg-green-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-green-700">有給休暇</label>
                  <span className={`text-xs font-bold ${paidRemaining <= 2 ? 'text-red-500' : 'text-green-600'}`}>
                    残 {paidRemaining}日
                  </span>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-500 mb-1">
                      年間付与日数{!isAdmin && <span className="text-gray-400">（管理者のみ変更可）</span>}
                    </p>
                    <StepCounter
                      value={form.paidLeaveAllotted ?? 10}
                      onChange={v => setForm(f => ({ ...f, paidLeaveAllotted: v }))}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-500 mb-1">
                      使用済み日数{!isAdmin && <span className="text-gray-400">（管理者のみ変更可）</span>}
                    </p>
                    <StepCounter
                      value={form.paidLeaveUsed ?? 0}
                      onChange={v => setForm(f => ({ ...f, paidLeaveUsed: v }))}
                      disabled={!isAdmin}
                      max={form.paidLeaveAllotted ?? 10}
                    />
                  </div>
                </div>
              </div>

              {/* アニバーサリー休暇 */}
              <div className="bg-orange-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-orange-600">アニバーサリー休暇</label>
                  <span className={`text-xs font-bold ${anniversaryRemaining <= 1 ? 'text-red-500' : 'text-orange-500'}`}>
                    残 {anniversaryRemaining}日
                  </span>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-500 mb-1">
                      年間付与日数{!isAdmin && <span className="text-gray-400">（管理者のみ変更可）</span>}
                    </p>
                    <StepCounter
                      value={form.anniversaryLeaveAllotted ?? 5}
                      onChange={v => setForm(f => ({ ...f, anniversaryLeaveAllotted: v }))}
                      disabled={!isAdmin}
                      max={30}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-500 mb-1">
                      使用済み日数{!isAdmin && <span className="text-gray-400">（管理者のみ変更可）</span>}
                    </p>
                    <StepCounter
                      value={form.anniversaryLeaveUsed ?? 0}
                      onChange={v => setForm(f => ({ ...f, anniversaryLeaveUsed: v }))}
                      disabled={!isAdmin}
                      max={form.anniversaryLeaveAllotted ?? 5}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 保存ボタン（常に下部に固定） ── */}
        {!saving && (
          <div
            className="flex-none px-6 pt-3 border-t border-gray-100"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="w-full py-3.5 bg-navy-700 text-white text-sm font-semibold rounded-2xl disabled:opacity-40 active:opacity-80 transition-opacity shadow-sm"
            >
              保存する
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
