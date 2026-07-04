import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Trash2 } from 'lucide-react'
import { Employee } from '../types'

interface Props {
  employee: Employee | null
  isAdmin: boolean
  onSave: (emp: Employee) => void
  onDelete?: (emp: Employee) => void
  onClose: () => void
  saving: boolean
}

const ROLES = ['院長', '副院長', 'セラピスト']
const LOCATIONS = ['草加院', 'イオン八潮南院', '上尾院', '前橋院', '伊勢崎宮子院', '取手院']

export default function EmployeeModal({ employee, isAdmin, onSave, onDelete, onClose, saving }: Props) {
  const isNew = !employee
  const [closing, setClosing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState<Omit<Employee, 'id'>>({
    name: employee?.name || '',
    role: employee?.role || 'セラピスト',
    location: employee?.location || '草加院',
    hireDate: employee?.hireDate || '',
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

  const content = (
    <div className="fixed inset-x-0 top-0 z-[100] flex items-end justify-center overflow-hidden" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }} onClick={handleClose}>
      {/* バックドロップ：画面全体をカバー */}
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm ${closing ? 'backdrop-out' : 'backdrop-in'}`} />
      <div
        className={`relative bg-white/85 backdrop-blur-2xl border border-white/40 rounded-t-3xl w-full max-w-[430px] shadow-2xl flex flex-col ${closing ? 'modal-slide-down' : 'modal-slide-up'}`}
        style={{ maxHeight: '100%' }}
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

              {/* 入社年月日 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">入社年月日</label>
                <input
                  type="date"
                  value={form.hireDate || ''}
                  onChange={e => setForm(f => ({ ...f, hireDate: e.target.value }))}
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>

              {/* 有給・アニバーサリーの残日数は有給申請システム（スプレッドシート）で管理 */}
              <div className="bg-gray-50 rounded-2xl px-4 py-3 text-[11px] text-gray-400 leading-relaxed">
                有給・アニバーサリー休暇の残日数は有給申請システムで管理しています。
                数値の調整はスプレッドシートの「残日数マスター」で行ってください。
              </div>
            </div>
          )}
        </div>

        {/* ── 下部ボタン（固定） ── */}
        {!saving && (
          <div className="flex-none px-6 pt-3 border-t border-gray-100" style={{ paddingBottom: '1.5rem' }}>
            {/* 削除確認 */}
            {confirmDelete ? (
              <div className="bg-red-50 rounded-2xl p-4 mb-3">
                <p className="text-sm font-semibold text-red-700 text-center mb-3">
                  {form.name} を削除しますか？<br />
                  <span className="text-xs font-normal text-red-500">この操作は取り消せません</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl active:opacity-70"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => employee && onDelete?.(employee)}
                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl active:opacity-70"
                  >
                    削除する
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                {!isNew && isAdmin && onDelete && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="p-3.5 bg-red-50 text-red-400 rounded-2xl active:opacity-70 transition-opacity shrink-0"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!form.name.trim()}
                  className="flex-1 py-3.5 bg-navy-700 text-white text-sm font-semibold rounded-2xl disabled:opacity-40 active:opacity-80 transition-opacity shadow-sm"
                >
                  保存する
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
  return createPortal(content, document.body)
}
