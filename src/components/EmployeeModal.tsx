import { useState } from 'react'
import { X } from 'lucide-react'
import { Employee } from '../types'

interface Props {
  employee: Employee | null
  onSave: (emp: Employee) => void
  onClose: () => void
  saving: boolean
}

const ROLES = ['院長', '副院長', 'セラピスト']
const LOCATIONS = ['草加院', 'イオン八潮南院', '上尾院', '前橋院', '伊勢崎宮子院', '取手院']

export default function EmployeeModal({ employee, onSave, onClose, saving }: Props) {
  const isNew = !employee
  const [form, setForm] = useState<Omit<Employee, 'id'>>({
    name: employee?.name || '',
    role: employee?.role || 'セラピスト',
    location: employee?.location || '草加院',
    paidLeaveAllotted: employee?.paidLeaveAllotted ?? 10,
    paidLeaveUsed: employee?.paidLeaveUsed ?? 0,
  })

  const handleSave = () => {
    if (!form.name.trim()) return
    onSave({ id: employee?.id || '', ...form })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white/85 backdrop-blur-2xl border border-white/40 rounded-t-3xl w-full max-w-[430px] p-6 shadow-2xl overflow-y-auto"
        style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">
            {isNew ? '従業員を追加' : '従業員を編集'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>

        {saving ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-gray-500">保存中...</span>
          </div>
        ) : (
          <div className="space-y-4">
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
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

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
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* 有給管理 */}
            <div className="bg-green-50 rounded-2xl p-4">
              <label className="text-xs font-semibold text-green-700 mb-3 block">有給休暇</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 mb-1 block">年間付与日数</label>
                  <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
                    <button
                      onClick={() => setForm(f => ({ ...f, paidLeaveAllotted: Math.max(0, (f.paidLeaveAllotted ?? 10) - 1) }))}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-bold active:opacity-60"
                    >−</button>
                    <span className="flex-1 text-center text-sm font-semibold text-gray-800">
                      {form.paidLeaveAllotted ?? 10}日
                    </span>
                    <button
                      onClick={() => setForm(f => ({ ...f, paidLeaveAllotted: (f.paidLeaveAllotted ?? 10) + 1 }))}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-bold active:opacity-60"
                    >＋</button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 mb-1 block">使用済み日数</label>
                  <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
                    <button
                      onClick={() => setForm(f => ({ ...f, paidLeaveUsed: Math.max(0, (f.paidLeaveUsed ?? 0) - 1) }))}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-bold active:opacity-60"
                    >−</button>
                    <span className="flex-1 text-center text-sm font-semibold text-gray-800">
                      {form.paidLeaveUsed ?? 0}日
                    </span>
                    <button
                      onClick={() => setForm(f => ({ ...f, paidLeaveUsed: Math.min(f.paidLeaveAllotted ?? 10, (f.paidLeaveUsed ?? 0) + 1) }))}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-bold active:opacity-60"
                    >＋</button>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">残日数</span>
                <span className={`text-sm font-bold ${
                  ((form.paidLeaveAllotted ?? 10) - (form.paidLeaveUsed ?? 0)) <= 2
                    ? 'text-red-500'
                    : 'text-green-600'
                }`}>
                  {(form.paidLeaveAllotted ?? 10) - (form.paidLeaveUsed ?? 0)}日
                </span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="w-full py-3 bg-navy-700 text-white text-sm font-semibold rounded-2xl mt-2 disabled:opacity-40 active:opacity-80 transition-opacity shadow-sm"
            >
              保存する
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
