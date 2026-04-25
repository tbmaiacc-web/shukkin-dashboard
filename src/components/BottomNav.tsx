import { Home, ClipboardList, Users } from 'lucide-react'
import { TabName } from '../types'

interface Props {
  active: TabName
  onChange: (tab: TabName) => void
  badge?: number
}

const TABS: { name: TabName; label: string; Icon: typeof Home }[] = [
  { name: 'dashboard', label: '概要',   Icon: Home },
  { name: 'schedule',  label: '早見表', Icon: ClipboardList },
  { name: 'employees', label: '従業員', Icon: Users },
]

export default function BottomNav({ active, onChange, badge }: Props) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 flex items-stretch h-16 z-50">
      {TABS.map(({ name, label, Icon }) => {
        const isActive = active === name
        return (
          <button
            key={name}
            onClick={() => onChange(name)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
          >
            {/* Active indicator */}
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-navy-700 rounded-full" />
            )}

            {/* Badge (dashboard only) */}
            {name === 'dashboard' && badge != null && badge > 0 && (
              <span className="absolute top-2 left-1/2 ml-2 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                {badge > 9 ? '9+' : badge}
              </span>
            )}

            <Icon
              size={22}
              className={isActive ? 'text-navy-700' : 'text-gray-400'}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <span
              className={`text-[11px] font-medium ${isActive ? 'text-navy-700' : 'text-gray-400'}`}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
