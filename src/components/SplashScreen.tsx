import { useEffect, useState } from 'react'

interface Props {
  dataReady: boolean
  onDone: () => void
}

export default function SplashScreen({ dataReady, onDone }: Props) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')
  const [animDone, setAnimDone] = useState(false)

  // フェードイン → ホールド
  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('hold')
      setAnimDone(true)
    }, 800)
    return () => clearTimeout(t)
  }, [])

  // アニメ完了 & データ準備完了 → フェードアウト
  useEffect(() => {
    if (!animDone || !dataReady) return
    setPhase('out')
    const t = setTimeout(onDone, 600)
    return () => clearTimeout(t)
  }, [animDone, dataReady])

  return (
    <div
      className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center"
      style={{
        opacity: phase === 'out' ? 0 : 1,
        transition: phase === 'out' ? 'opacity 0.55s ease' : 'opacity 0.6s ease',
      }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          opacity: phase === 'in' ? 0 : 1,
          transform: phase === 'in'
            ? 'scale(0.82)'
            : phase === 'out'
            ? 'scale(1.18)'
            : 'scale(1)',
          transition: phase === 'in'
            ? 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'opacity 0.55s ease, transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <img
          src="/logo.png"
          alt="Total Body Make"
          className="w-52"
        />
      </div>

      {/* Loading dots */}
      <div
        className="flex gap-1.5 mt-10"
        style={{
          opacity: phase === 'in' ? 0 : phase === 'out' ? 0 : 1,
          transition: 'opacity 0.4s ease 0.3s',
        }}
      >
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-navy-700"
            style={{
              animation: 'dotPulse 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
