import { useEffect, useState } from 'react'

interface Props {
  onDone: () => void
}

export default function SplashScreen({ onDone }: Props) {
  // phase: 'in' → 'hold' → 'out' → done
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 800)   // フェードイン完了
    const t2 = setTimeout(() => setPhase('out'), 1800)   // ホールド終了
    const t3 = setTimeout(() => onDone(), 2500)          // フェードアウト完了
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[999] bg-white flex items-center justify-center transition-opacity duration-700"
      style={{ opacity: phase === 'out' ? 0 : 1 }}
    >
      <img
        src="/logo.png"
        alt="Total Body Make"
        className="w-48 transition-opacity duration-700"
        style={{ opacity: phase === 'in' ? 0 : 1 }}
      />
    </div>
  )
}
