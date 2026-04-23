import { Home, ClipboardList, Users, Plus } from 'lucide-react'
import { TabName } from '../types'

interface Props {
  active: TabName
  onChange: (tab: TabName) => void
}

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 flex items-center h-16 z-50">
      <button
        onClick={() => onChange('dashboard')}
        className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs ${active === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}
      >
        <Home size={22} />
        <span>概要</span>
      </button>

      <button
        onClick={() => onChange('schedule')}
        className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs ${active === 'schedule' ? 'text-blue-600' : 'text-gray-400'}`}
      >
        <ClipboardList size={22} />
        <span>早見表</span>
      </button>

      <div className="flex-1 flex justify-center">
        <button className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-lg">
          <Plus size={24} className="text-white" />
        </button>
      </div>

      <button
        onClick={() => onChange('employees')}
        className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs ${active === 'employees' ? 'text-blue-600' : 'text-gray-400'}`}
      >
        <Users size={22} />
        <span>従業員</span>
      </button>

      {/* 右端スペーサー */}
      <div className="flex-1" />
    </nav>
  )
}
