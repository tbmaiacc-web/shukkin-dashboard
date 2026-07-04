import { useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Search, Pencil, Plus, Users, ShieldCheck, ShieldOff, History, AlertTriangle } from 'lucide-react'
import { Employee } from '../types'
import { updateEmployee, addEmployee, deleteEmployee } from '../hooks/useMutation'
import { useLeaveBalances } from '../hooks/useLeaveBalances'
import { useAdminAuth } from '../hooks/useAdminAuth'
import EmployeeModal from './EmployeeModal'
import AdminPinModal from './AdminPinModal'
import LeaveHistoryModal from './LeaveHistoryModal'
import Toast from './Toast'

interface Props {
  employees: Employee[]
  onReload: () => Promise<void>
}

export default function EmployeeList({ employees, onReload }: Props) {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<Employee | null | 'new'>()
  const [saving, setSaving] = useState(false)
  const [pinModal, setPinModal] = useState(false)
  const [historyEmployee, setHistoryEmployee] = useState<Employee | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const { isAdmin, verifying, error, login, logout, clearError } = useAdminAuth()

  // 残日数の「正」は有給申請GAS。キャッシュ付きフックで取得（タブ切替で取り直さない）
  const { balances } = useLeaveBalances()

  const filtered = employees.filter(emp =>
    !search || emp.name.includes(search) || emp.location.includes(search) || emp.role.includes(search)
  )

  const handleDelete = async (emp: Employee) => {
    setSaving(true)
    try {
      await deleteEmployee(emp)
      setToast(`${emp.name} を削除しました`)
    } finally {
      setSaving(false)
      setModal(undefined)
      setTimeout(onReload, 1500)
    }
  }

  const handleSave = async (emp: Employee) => {
    setSaving(true)
    try {
      if (modal === 'new') {
        await addEmployee(emp)
        setToast(`${emp.name} を追加しました`)
      } else {
        await updateEmployee(emp)
        setToast(`${emp.name} の情報を保存しました`)
      }
    } finally {
      setSaving(false)
      setModal(undefined)
      setTimeout(onReload, 1500)
    }
  }

  return (
    <div className="lg:pb-8" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* ヘッダー */}
      <div className="bg-white px-4 pt-10 pb-4 lg:pt-5 flex items-center gap-3">
        <img src="/logo.png" alt="Total Body Make" className="h-8 shrink-0" />
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">従業員管理</h1>
          <p className="text-xs text-gray-400">
            {format(new Date(), 'yyyy年M月d日 (E)', { locale: ja })}
          </p>
        </div>
        {/* 管理者モードトグル */}
        <button
          onClick={() => isAdmin ? logout() : setPinModal(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            isAdmin
              ? 'bg-navy-700 text-white'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {isAdmin ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
          {isAdmin ? '管理者' : '一般'}
        </button>
      </div>

      {/* 検索バー */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="名前・院で検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="px-4 py-3 lg:max-w-5xl lg:mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">
            従業員一覧
            <span className="ml-2 text-sm font-normal text-gray-400">{filtered.length}名</span>
          </h2>
          <button
            onClick={() => setModal('new')}
            className="flex items-center gap-1 bg-navy-700 text-white text-sm font-semibold px-3 py-1.5 rounded-xl shadow-sm active:opacity-75"
          >
            <Plus size={14} />
            追加
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              {search ? <Search size={22} className="text-gray-300" /> : <Users size={22} className="text-gray-300" />}
            </div>
            <p className="text-sm font-semibold text-gray-500">
              {search ? '見つかりませんでした' : '従業員がいません'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? '検索条件を変えてみてください' : '右上の「追加」から登録してください'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3 lg:space-y-0">
            {filtered.map(emp => {
              // 残は有給申請GASの値を優先（姓キー）。未取得時はダッシュボード自前値にフォールバック
              const gb = balances[emp.name]
              const gPaid = gb?.paid
              const gAnniv = gb?.anniv
              const paidRemaining = gPaid ? gPaid.remaining : (emp.paidLeaveAllotted ?? 10) - (emp.paidLeaveUsed ?? 0)
              const paidTotal = gPaid ? gPaid.granted : emp.paidLeaveAllotted
              const annivRemaining = gAnniv ? gAnniv.remaining : (emp.anniversaryLeaveAllotted ?? 5) - (emp.anniversaryLeaveUsed ?? 0)
              const annivTotal = gAnniv ? gAnniv.allot : emp.anniversaryLeaveAllotted
              const hasPaid = gPaid != null || emp.paidLeaveAllotted !== undefined
              const hasAnniv = gAnniv != null || emp.anniversaryLeaveAllotted !== undefined
              // GASに登録があり、かつ未確認（入社日/有給/アニ調整が未完）
              const needsReview = gb != null && gb.verified === false

              return (
                <div key={emp.id} className={`bg-white rounded-2xl px-4 py-3 shadow-sm ${needsReview ? 'ring-1 ring-amber-300' : ''}`}>
                  {/* 上段：名前・役職・編集ボタン */}
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-navy-50 rounded-full flex items-center justify-center mr-3 shrink-0">
                      <span className="text-sm font-semibold text-navy-700">{emp.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                        {needsReview && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold">
                            <AlertTriangle size={10} />未調整
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{emp.role}・{emp.location}</p>
                    </div>
                    {/* 履歴ボタン */}
                    <button
                      onClick={() => setHistoryEmployee(emp)}
                      className="p-1.5 text-gray-300 hover:text-orange-500 active:opacity-50 transition-colors mr-0.5"
                      title="休暇消化履歴"
                    >
                      <History size={15} />
                    </button>
                    {/* 編集ボタン */}
                    <button
                      onClick={() => setModal(emp)}
                      className="p-1.5 text-gray-300 hover:text-navy-700 active:opacity-50 transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>

                  {/* 下段：残日数バッジ */}
                  {(hasPaid || hasAnniv) && (
                    <div className="flex gap-2 mt-2.5">
                      {hasPaid && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl flex-1 ${
                          paidRemaining <= 2 ? 'bg-red-50' : 'bg-green-50'
                        }`}>
                          <span className="text-[10px] font-medium text-gray-500">有給残</span>
                          <span className={`text-sm font-bold ${paidRemaining <= 2 ? 'text-red-500' : 'text-green-600'}`}>
                            {paidRemaining}日
                          </span>
                          {paidTotal != null && <span className="text-[10px] text-gray-400">/ {paidTotal}日</span>}
                        </div>
                      )}
                      {hasAnniv && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl flex-1 ${
                          annivRemaining <= 1 ? 'bg-red-50' : 'bg-orange-50'
                        }`}>
                          <span className="text-[10px] font-medium text-gray-500">アニバ残</span>
                          <span className={`text-sm font-bold ${annivRemaining <= 1 ? 'text-red-500' : 'text-orange-500'}`}>
                            {annivRemaining}日
                          </span>
                          {annivTotal != null && <span className="text-[10px] text-gray-400">/ {annivTotal}日</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 従業員編集モーダル */}
      {modal !== undefined && (
        <EmployeeModal
          employee={modal === 'new' ? null : modal}
          isAdmin={isAdmin}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal(undefined)}
          saving={saving}
        />
      )}

      {/* 管理者 PIN 入力モーダル */}
      {pinModal && (
        <AdminPinModal
          onVerify={async (pin) => {
            const ok = await login(pin)
            if (ok) setPinModal(false)
            return ok
          }}
          verifying={verifying}
          error={error}
          onClose={() => { setPinModal(false); clearError() }}
          onClearError={clearError}
        />
      )}

      {/* 休暇消化履歴モーダル */}
      {historyEmployee && (
        <LeaveHistoryModal
          employee={historyEmployee}
          onClose={() => setHistoryEmployee(null)}
        />
      )}

      {/* 保存完了トースト */}
      {toast && (
        <Toast message={toast} onDone={() => setToast(null)} />
      )}
    </div>
  )
}
