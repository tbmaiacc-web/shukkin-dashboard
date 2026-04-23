import { useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Search, Calendar, Pencil, Plus } from 'lucide-react'
import { Employee } from '../types'

interface Props {
  employees: Employee[]
}

export default function EmployeeList({ employees }: Props) {
  const [search, setSearch] = useState('')

  const filtered = employees.filter(emp =>
    !search || emp.name.includes(search) || emp.location.includes(search) || emp.role.includes(search)
  )

  return (
    <div className="pb-20">
      {/* ヘッダー */}
      <div className="bg-white px-4 pt-12 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">従業員管理</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {format(new Date(), 'yyyy年M月d日 (E)', { locale: ja })}
            </p>
          </div>
          <button className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <Calendar size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* 検索 */}
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

      {/* 一覧 */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">従業員一覧</h2>
          <button className="flex items-center gap-1 bg-gray-900 text-white text-sm font-medium px-3 py-1.5 rounded-xl">
            <Plus size={14} />
            追加
          </button>
        </div>
        <div className="space-y-2">
          {filtered.map(emp => (
            <div key={emp.id} className="bg-white rounded-2xl px-4 py-3 flex items-center shadow-sm">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3 shrink-0">
                <span className="text-sm font-medium text-gray-500">{emp.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                <p className="text-xs text-gray-400">{emp.role}・{emp.location}</p>
              </div>
              <button className="p-1.5 text-gray-300 hover:text-gray-500">
                <Pencil size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
