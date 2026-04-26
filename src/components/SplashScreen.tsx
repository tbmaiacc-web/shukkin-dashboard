import { useEffect, useState } from 'react'

interface Props {
  dataReady: boolean
  onDone: () => void
}

// r=80 の円周
const RING_C = 2 * Math.PI * 80 // ≈ 502.65

// 背景に漂う小さなパーティクル
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 4,
  dur: 5 + Math.random() * 5,
  size: 1.5 + Math.random() * 2.5,
  opacity: 0.08 + Math.random() * 0.18,
}))

export default function SplashScreen({ dataReady, onDone }: Props) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')
  const [animDone, setAnimDone] = useState(false)
  const [textVisible, setTextVisible] = useState(false)

  useEffect(() => {
    const t0 = setTimeout(() => setTextVisible(true), 500)
    const t1 = setTimeout(() => { setPhase('hold'); setAnimDone(true) }, 1500)
    return () => { clearTimeout(t0); clearTimeout(t1) }
  }, [])

  useEffect(() => {
    if (!animDone || !dataReady) return
    const t1 = setTimeout(() => setPhase('out'), 200)
    const t2 = setTimeout(onDone, 1000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [animDone, dataReady])

  const isIn  = phase === 'in'
  const isOut = phase === 'out'

  return (
    <div
      className="fixed inset-0 z-[999] overflow-hidden flex flex-col items-center justify-center select-none"
      style={{
        background: 'linear-gradient(145deg, #08192e 0%, #1a3a5c 50%, #0c2140 100%)',
        opacity:    isOut ? 0 : 1,
        transform:  isOut ? 'scale(1.06)' : 'scale(1)',
        transition: isOut
          ? 'opacity 0.75s cubic-bezier(0.4, 0, 0.6, 1), transform 0.75s cubic-bezier(0.4, 0, 0.6, 1)'
          : 'none',
      }}
    >
      {/* ── 背景: グリッドライン ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── 背景: 放射状グロー ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(26,58,92,0.9) 0%, transparent 70%)',
          animation: 'glowPulse 4s ease-in-out infinite',
        }}
      />

      {/* ── 背景: 大きな装飾リング ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 560, height: 560,
          border: '1px solid rgba(245,158,11,0.07)',
          animation: 'slowSpin 24s linear infinite',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 420, height: 420,
          border: '1px solid rgba(255,255,255,0.04)',
          animation: 'slowSpin 18s linear infinite reverse',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 280, height: 280,
          border: '1px solid rgba(245,158,11,0.05)',
          animation: 'slowSpin 12s linear infinite',
        }}
      />

      {/* ── 背景: 浮遊パーティクル ── */}
      {PARTICLES.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            bottom: '-8px',
            width: p.size,
            height: p.size,
            background: 'rgba(245,158,11,0.9)',
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 2}px rgba(245,158,11,0.5)`,
            animation: `floatUp ${p.dur}s ${p.delay}s linear infinite`,
          }}
        />
      ))}

      {/* ── メインコンテンツ ── */}
      <div
        className="relative flex flex-col items-center"
        style={{
          opacity:   isIn ? 0 : 1,
          transform: isIn  ? 'translateY(24px) scale(0.92)'
                   : isOut ? 'translateY(-14px) scale(1.04)'
                   : 'translateY(0) scale(1)',
          transition: isIn
            ? 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.34, 1.4, 0.64, 1)'
            : 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        {/* ロゴエリア */}
        <div className="relative" style={{ width: 188, height: 188 }}>

          {/* 外枠のガイドリング（薄） */}
          <svg width="188" height="188" className="absolute inset-0">
            <circle cx="94" cy="94" r="88" fill="none"
                    stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          </svg>

          {/* アンバーのアークリング（描画アニメ） */}
          <svg width="188" height="188" className="absolute inset-0"
               style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* グロー用（太めの影） */}
            <circle cx="94" cy="94" r="88" fill="none"
                    stroke="rgba(245,158,11,0.25)" strokeWidth="6"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: 2 * Math.PI * 88,
                      strokeDashoffset: isIn ? 2 * Math.PI * 88 : 0,
                      transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s',
                    }} />
            {/* メインのアーク */}
            <circle cx="94" cy="94" r="88" fill="none"
                    stroke="rgba(245,158,11,0.95)" strokeWidth="1.8"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: 2 * Math.PI * 88,
                      strokeDashoffset: isIn ? 2 * Math.PI * 88 : 0,
                      transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s',
                      filter: 'drop-shadow(0 0 5px rgba(245,158,11,0.9))',
                    }} />
          </svg>

          {/* 回転する輝点 */}
          <div
            className="absolute inset-0"
            style={{ animation: 'slowSpin 3s linear infinite' }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: 8, height: 8,
                top: '50%', left: '50%',
                marginTop: -4 - 88,
                marginLeft: -4,
                background: '#f59e0b',
                boxShadow: '0 0 10px 3px rgba(245,158,11,0.8)',
                opacity: isIn ? 0 : 1,
                transition: 'opacity 0.4s ease 0.8s',
              }}
            />
          </div>

          {/* ロゴ画像 */}
          <div className="absolute inset-0 flex items-center justify-center p-11">
            <img
              src="/logo.png"
              alt="Total Body Make"
              className="w-full object-contain"
              style={{
                filter: 'brightness(0) invert(1) drop-shadow(0 0 16px rgba(255,255,255,0.25))',
              }}
            />
          </div>
        </div>

        {/* テキスト */}
        <div
          className="mt-7 text-center"
          style={{
            opacity:   textVisible && !isOut ? 1 : 0,
            transform: textVisible && !isOut ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          {/* ブランド名 */}
          <p
            className="text-white font-bold tracking-[0.22em] text-[15px]"
            style={{ letterSpacing: '0.22em' }}
          >
            TOTAL BODY MAKE
          </p>

          {/* 区切りライン */}
          <div
            className="mx-auto mt-2.5 mb-2.5"
            style={{
              height: 1,
              width: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.8) 40%, rgba(245,158,11,0.8) 60%, transparent 100%)',
            }}
          />

          {/* サブタイトル */}
          <p
            className="text-[11px] font-medium tracking-[0.35em]"
            style={{ color: 'rgba(245,158,11,0.9)', letterSpacing: '0.35em' }}
          >
            勤 務 管 理 シ ス テ ム
          </p>
        </div>
      </div>

      {/* ── ボトムプログレスバー ── */}
      <div
        className="absolute overflow-hidden rounded-full"
        style={{
          bottom: 56,
          width: 120,
          height: 2,
          background: 'rgba(255,255,255,0.08)',
          opacity: isIn ? 0 : isOut ? 0 : 1,
          transition: 'opacity 0.3s ease 0.6s',
        }}
      >
        <div
          style={{
            height: '100%',
            width: isIn ? '0%' : '100%',
            background: 'linear-gradient(90deg, rgba(245,158,11,0.5), rgba(245,158,11,1))',
            boxShadow: '0 0 8px rgba(245,158,11,0.8)',
            transition: 'width 1.4s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
            borderRadius: 999,
          }}
        />
        {/* シマーエフェクト */}
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
            animation: 'shimmer 2s ease-in-out infinite 1s',
          }}
        />
      </div>

      {/* ── バージョン表示 ── */}
      <p
        className="absolute text-[10px] tracking-widest"
        style={{
          bottom: 32,
          color: 'rgba(255,255,255,0.2)',
          opacity: textVisible && !isOut ? 1 : 0,
          transition: 'opacity 0.6s ease 0.8s',
        }}
      >
        Ver. 2.0
      </p>

      <style>{`
        @keyframes slowSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes floatUp {
          0%   { transform: translateY(0)    scale(1);   opacity: inherit; }
          80%  { transform: translateY(-90vh) scale(0.6); opacity: inherit; }
          100% { transform: translateY(-100vh) scale(0); opacity: 0; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}
