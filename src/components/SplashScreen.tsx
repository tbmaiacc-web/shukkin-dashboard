import { useEffect, useState } from 'react'

interface Props {
  dataReady: boolean
  onDone: () => void
}

export default function SplashScreen({ dataReady, onDone }: Props) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')
  const [animDone, setAnimDone] = useState(false)
  const [textVisible, setTextVisible] = useState(false)

  useEffect(() => {
    const t0 = setTimeout(() => setTextVisible(true), 400)
    const t1 = setTimeout(() => { setPhase('hold'); setAnimDone(true) }, 1400)
    return () => { clearTimeout(t0); clearTimeout(t1) }
  }, [])

  useEffect(() => {
    if (!animDone || !dataReady) return
    const t1 = setTimeout(() => setPhase('out'), 150)
    const t2 = setTimeout(onDone, 800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [animDone, dataReady])

  const isIn  = phase === 'in'
  const isOut = phase === 'out'

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center select-none"
      style={{
        background: '#ffffff',
        opacity:    isOut ? 0 : 1,
        transition: isOut ? 'opacity 0.5s ease' : 'none',
      }}
    >
      {/* 上部の赤ライン */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: 3,
          background: '#DC2626',
          transform: isIn ? 'scaleX(0)' : 'scaleX(1)',
          transformOrigin: 'left',
          transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
        }}
      />

      {/* ロゴ */}
      <div
        style={{
          opacity:   isIn ? 0 : 1,
          transform: isIn ? 'translateY(16px)' : 'translateY(0)',
          transition: 'opacity 0.5s ease 0.2s, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
        }}
      >
        <img
          src="/logo.png"
          alt="Total Body Make"
          style={{ width: 220, objectFit: 'contain' }}
        />
      </div>

      {/* テキスト */}
      <div
        className="mt-8 text-center"
        style={{
          opacity:   textVisible && !isOut ? 1 : 0,
          transform: textVisible && !isOut ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        <p
          className="font-black tracking-[0.2em] text-gray-900"
          style={{ fontSize: 16 }}
        >
          TOTAL BODY MAKE
        </p>
        <div className="flex items-center gap-2 mt-2.5 mb-2.5">
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#DC2626' }} />
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>
        <p
          className="font-medium tracking-[0.28em] text-gray-400"
          style={{ fontSize: 10 }}
        >
          勤 務 管 理 シ ス テ ム
        </p>
      </div>

      {/* 下部の赤ライン */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: 3,
          background: '#DC2626',
          transform: isIn ? 'scaleX(0)' : 'scaleX(1)',
          transformOrigin: 'right',
          transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
        }}
      />
    </div>
  )
}
