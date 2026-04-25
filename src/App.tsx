import { useState } from 'react'
import { TabName } from './types'
import { useData } from './hooks/useData'
import Dashboard from './components/Dashboard'
import ShiftTable from './components/ShiftTable'
import EmployeeList from './components/EmployeeList'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'
import SplashScreen from './components/SplashScreen'

function SkeletonLoading() {
  return (
    <div className="flex flex-col h-dvh bg-gray-50 animate-pulse">
      <div className="bg-white px-4 pt-12 pb-3 flex-none">
        <div className="h-7 w-36 bg-gray-200 rounded-xl mb-2" />
        <div className="h-3.5 w-28 bg-gray-100 rounded-lg" />
      </div>
      <div className="bg-white px-3 py-2 border-b border-gray-100 flex gap-2 flex-none">
        <div className="h-9 flex-1 bg-gray-100 rounded-xl" />
        <div className="h-9 w-12 bg-gray-100 rounded-xl" />
        <div className="h-9 w-8 bg-gray-100 rounded-xl" />
        <div className="h-9 w-16 bg-gray-100 rounded-xl" />
      </div>
      <div className="flex-1 overflow-hidden px-2 pt-2">
        <div className="flex gap-1 mb-1">
          <div className="w-20 h-8 bg-gray-200 rounded" />
          {[...Array(7)].map((_, i) => <div key={i} className="flex-1 h-8 bg-gray-100 rounded" />)}
        </div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex gap-1 mb-1">
            <div className="w-20 h-9 bg-gray-100 rounded" />
            {[...Array(7)].map((_, j) => (
              <div key={j} className={`flex-1 h-9 rounded ${i % 3 === 1 ? 'bg-red-50' : 'bg-gray-50'}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="h-14 bg-white border-t border-gray-100 flex justify-around items-center px-6">
        {[...Array(3)].map((_, i) => <div key={i} className="w-12 h-8 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState<TabName>('schedule')
  const [toast, setToast] = useState<string | null>(null)
  const [splashDone, setSplashDone] = useState(false)
  const { employees, shifts, loading, error, reload, updateShiftLocal } = useData()

  const showToast = (msg: string) => setToast(msg)

  if (!splashDone) return <SplashScreen dataReady={!loading} onDone={() => setSplashDone(true)} />
  if (loading) return <SkeletonLoading />

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center space-y-3 max-w-sm w-full">
          <p className="text-sm font-semibold text-red-500">エラー</p>
          <p className="text-xs text-gray-500">{error}</p>
          <button onClick={reload} className="w-full py-2 bg-gray-900 text-white text-sm rounded-xl">
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      {tab === 'dashboard' && <Dashboard employees={employees} shifts={shifts} onTabChange={setTab} />}
      {tab === 'schedule' && (
        <ShiftTable
          employees={employees}
          shifts={shifts}
          onReload={reload}
          onUpdateShift={updateShiftLocal}
          onToast={showToast}
        />
      )}
      {tab === 'employees' && <EmployeeList employees={employees} onReload={reload} />}
      <BottomNav active={tab} onChange={setTab} />
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
