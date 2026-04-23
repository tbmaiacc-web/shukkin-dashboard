import { useState } from 'react'
import { TabName } from './types'
import { useData } from './hooks/useData'
import Dashboard from './components/Dashboard'
import ShiftTable from './components/ShiftTable'
import EmployeeList from './components/EmployeeList'
import BottomNav from './components/BottomNav'

export default function App() {
  const [tab, setTab] = useState<TabName>('dashboard')
  const { employees, shifts, loading, error, reload } = useData()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center space-y-3 max-w-sm w-full">
          <p className="text-sm font-semibold text-red-500">エラー</p>
          <p className="text-xs text-gray-500">{error}</p>
          <button
            onClick={reload}
            className="w-full py-2 bg-gray-900 text-white text-sm rounded-xl"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      {tab === 'dashboard' && <Dashboard employees={employees} shifts={shifts} />}
      {tab === 'schedule' && <ShiftTable employees={employees} shifts={shifts} onReload={reload} />}
      {tab === 'employees' && <EmployeeList employees={employees} />}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
