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
    <>
      {/* ── モバイル: 下部タブバー ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-stretch z-50"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        {TABS.map(({ name, label, Icon }) => {
          const isActive = active === name
          return (
            <button
              key={name}
              onClick={() => onChange(name)}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-navy-700 rounded-full" />
              )}
              {name === 'dashboard' && badge != null && badge > 0 && (
                <span className="absolute top-2 left-1/2 ml-2 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
              <Icon size={24} className={isActive ? 'text-navy-700' : 'text-gray-400'} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className={`text-[12px] font-medium ${isActive ? 'text-navy-700' : 'text-gray-400'}`}>{label}</span>
            </button>
          )
        })}
      </nav>

      {/* ── デスクトップ: 左サイドバー ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-navy-700 z-50 shadow-xl">
        {/* ロゴ */}
        <div className="px-5 pt-7 pb-6 border-b border-navy-600">
          <img src="/logo.png" alt="Total Body Make" className="h-7 brightness-0 invert opacity-90" />
          <p className="text-navy-300 text-[11px] mt-2 font-medium tracking-wide">勤務管理システム</p>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {TABS.map(({ name, label, Icon }) => {
            const isActive = active === name
            return (
              <button
                key={name}
                onClick={() => onChange(name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-navy-300 hover:bg-white/8 hover:text-white'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
                <span>{label}</span>
                {name === 'dashboard' && badge != null && badge > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* フッター */}
        <div className="px-5 py-4 border-t border-navy-600">
          <p className="text-navy-400 text-[10px]">Total Body Make © 2026</p>
        </div>
      </aside>
    </>
  )
}
