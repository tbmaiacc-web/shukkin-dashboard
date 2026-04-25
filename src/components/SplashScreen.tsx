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
    const t = setTimeout(onDone, 700)
    return () => clearTimeout(t)
  }, [animDone, dataReady])

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
