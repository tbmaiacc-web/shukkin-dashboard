import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

interface Props {
  message: string
  onDone: () => void
}

export default function Toast({ message, onDone }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 bg-gray-900 text-white text-sm px-5 py-3 rounded-full shadow-lg transition-all duration-300 whitespace-nowrap ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <Check size={14} className="text-green-400 shrink-0" />
      {message}
    </div>
  )
}
