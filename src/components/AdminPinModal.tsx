import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ShieldCheck, Lock } from 'lucide-react'

interface Props {
  onVerify: (pin: string) => Promise<boolean>
  verifying: boolean
  error: string
  onClose: () => void
  onClearError: () => void
}

export default function AdminPinModal({ onVerify, verifying, error, onClose, onClearError }: Props) {
  const [pin, setPin] = useState(['', '', '', ''])
  const [closing, setClosing] = useState(false)
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    refs[0].current?.focus()
  }, [])

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 240)
  }

  const handleInput = async (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    onClearError()
    const next = [...pin]
    next[index] = digit
    setPin(next)

    if (digit && index < 3) {
      refs[index + 1].current?.focus()
    }

    if (digit && index === 3) {
      const fullPin = [...next.slice(0, 3), digit].join('')
      if (fullPin.length === 4) {
        const ok = await onVerify(fullPin)
        if (!ok) {
          setPin(['', '', '', ''])
          refs[0].current?.focus()
        }
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      refs[index - 1].current?.focus()
    }
  }

  const content = (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={handleClose}>
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm ${closing ? 'backdrop-out' : 'backdrop-in'}`} />
      <div
        className={`relative bg-white/90 backdrop-blur-2xl border border-white/40 rounded-t-3xl w-full max-w-[430px] p-6 shadow-2xl ${closing ? 'modal-slide-down' : 'modal-slide-up'}`}
        style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-navy-50 rounded-xl flex items-center justify-center">
              <Lock size={16} className="text-navy-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">管理者認証</h3>
              <p className="text-xs text-gray-400">4桁のPINを入力してください</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1 text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* PIN 入力 */}
        <div className="flex justify-center gap-3 mb-4">
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={verifying}
              className={`w-14 h-14 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-colors bg-gray-50 ${
                error ? 'border-red-300 bg-red-50' : digit ? 'border-navy-700 bg-navy-50' : 'border-gray-200'
              }`}
            />
          ))}
        </div>

        {/* エラー or ローディング */}
        <div className="text-center h-6 mb-4">
          {verifying && (
            <div className="flex items-center justify-center gap-2 text-navy-700">
              <div className="w-4 h-4 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">認証中...</span>
            </div>
          )}
          {error && !verifying && (
            <p className="text-sm text-red-500 font-medium">{error}</p>
          )}
        </div>

        <div className="flex items-center gap-2 bg-navy-50 rounded-xl px-3 py-2.5">
          <ShieldCheck size={14} className="text-navy-700 shrink-0" />
          <p className="text-xs text-navy-700">管理者モードでは付与日数の編集が可能です</p>
        </div>
      </div>
    </div>
  )
  return createPortal(content, document.body)
}
