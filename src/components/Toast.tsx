import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2 } from 'lucide-react'

interface Props {
  message: string
  onDone: () => void
  duration?: number
}

export default function Toast({ message, onDone, duration = 2500 }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const hideAt = setTimeout(() => setVisible(false), duration - 350)
    const doneAt = setTimeout(onDone, duration)
    return () => { clearTimeout(hideAt); clearTimeout(doneAt) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div
      className="fixed left-0 right-0 z-[300] flex justify-center pointer-events-none"
      style={{
        bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
        transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.2,0.64,1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
      }}
    >
      <div className="flex items-center gap-2.5 bg-gray-900/92 backdrop-blur-md text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl whitespace-nowrap">
        <CheckCircle2 size={17} className="text-green-400 shrink-0" />
        {message}
      </div>
    </div>,
    document.body
  )
}
