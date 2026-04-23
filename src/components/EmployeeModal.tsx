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
  })

  const handleSave = () => {
    if (!form.name.trim()) return
    onSave({ id: employee?.id || '', ...form })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-t-3xl w-full max-w-[430px] p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">
            {isNew ? '従業員を追加' : '従業員を編集'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>

        {saving ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
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
                        ? 'bg-gray-900 text-white border-gray-900'
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
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-2xl mt-2 disabled:opacity-40"
            >
              保存する
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
