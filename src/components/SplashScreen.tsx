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
    const t2 = setTimeout(onDone, 900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [animDone, dataReady])

  const isIn  = phase === 'in'
  const isOut = phase === 'out'

  return (
    <div
      className="fixed inset-0 z-[999] overflow-hidden flex flex-col items-center justify-center select-none"
      style={{
        background: '#111010',
        opacity:    isOut ? 0 : 1,
        transform:  isOut ? 'scale(1.04)' : 'scale(1)',
        transition: isOut
          ? 'opacity 0.6s ease-in, transform 0.6s ease-in'
          : 'none',
      }}
    >
      {/* ── 床板ライン（ハードウッドコート） ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            180deg,
            transparent 0px,
            transparent 38px,
            rgba(255,255,255,0.028) 38px,
            rgba(255,255,255,0.028) 39px
          )`,
        }}
      />

      {/* ── 赤いサイドライン（左右） ── */}
      <div className="absolute inset-y-0 left-0 w-[5px] pointer-events-none"
        style={{ background: 'linear-gradient(180deg, transparent 10%, #DC2626 40%, #DC2626 60%, transparent 90%)' }} />
      <div className="absolute inset-y-0 right-0 w-[5px] pointer-events-none"
        style={{ background: 'linear-gradient(180deg, transparent 10%, #DC2626 40%, #DC2626 60%, transparent 90%)' }} />

      {/* ── コートセンターサークル（大） ── */}
      <svg
        className="absolute pointer-events-none"
        width="480" height="480"
        style={{ opacity: 0.07 }}
      >
        <circle cx="240" cy="240" r="230" fill="none" stroke="white" strokeWidth="1.5" />
        <line x1="10" y1="240" x2="470" y2="240" stroke="white" strokeWidth="1.5" />
      </svg>

      {/* ── スピードライン（右下から左上） ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.06 }}>
        <line x1="0"   y1="80%"  x2="100%" y2="20%"  stroke="white" strokeWidth="1"/>
        <line x1="0"   y1="90%"  x2="100%" y2="30%"  stroke="white" strokeWidth="0.5"/>
        <line x1="0"   y1="70%"  x2="80%"  y2="10%"  stroke="white" strokeWidth="0.5"/>
      </svg>

      {/* ── オレンジのダイナミックバー（上部アクセント） ── */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: 4,
          background: 'linear-gradient(90deg, transparent 0%, #F47B20 30%, #F47B20 70%, transparent 100%)',
          transform: isIn ? 'scaleX(0)' : 'scaleX(1)',
          transformOrigin: 'center',
          transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
        }}
      />
      {/* 下部バー */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: 4,
          background: 'linear-gradient(90deg, transparent 0%, #DC2626 30%, #DC2626 70%, transparent 100%)',
          transform: isIn ? 'scaleX(0)' : 'scaleX(1)',
          transformOrigin: 'center',
          transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.3s',
        }}
      />

      {/* ── メインコンテンツ ── */}
      <div
        className="relative flex flex-col items-center"
        style={{
          opacity:   isIn ? 0 : 1,
          transform: isIn  ? 'translateY(32px)' : isOut ? 'translateY(-12px)' : 'translateY(0)',
          transition: isIn
            ? 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)'
            : 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        {/* バスケットボールリング＋ロゴ */}
        <div className="relative" style={{ width: 200, height: 200 }}>

          {/* オレンジのバスケットボール風リング */}
          <svg width="200" height="200" className="absolute inset-0"
            style={{ transform: 'rotate(-90deg)' }}>
            {/* 外周（太め・オレンジ） */}
            <circle
              cx="100" cy="100" r="92"
              fill="none"
              stroke="#F47B20"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 92 * 0.72} ${2 * Math.PI * 92 * 0.28}`}
              strokeDashoffset={2 * Math.PI * 92 * 0.07}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(244,123,32,0.8))',
                opacity: isIn ? 0 : 1,
                transition: 'opacity 0.4s ease 0.5s',
              }}
            />
            {/* 赤のアーク（下部） */}
            <circle
              cx="100" cy="100" r="92"
              fill="none"
              stroke="#DC2626"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 92 * 0.2} ${2 * Math.PI * 92 * 0.8}`}
              strokeDashoffset={2 * Math.PI * 92 * -0.65}
              style={{
                filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.6))',
                opacity: isIn ? 0 : 1,
                transition: 'opacity 0.4s ease 0.6s',
              }}
            />
            {/* バスケットボールの縫い目ライン（細い縦） */}
            <line x1="100" y1="8" x2="100" y2="192" stroke="rgba(244,123,32,0.15)" strokeWidth="1"/>
          </svg>

          {/* ロゴ画像 */}
          <div className="absolute inset-0 flex items-center justify-center p-10">
            <img
              src="/logo.png"
              alt="Total Body Make"
              className="w-full object-contain"
              style={{
                filter: 'brightness(0) invert(1) drop-shadow(0 2px 12px rgba(244,123,32,0.4))',
              }}
            />
          </div>

          {/* コーナードット（バスケットボール感） */}
          {[0, 90, 180, 270].map(deg => (
            <div
              key={deg}
              className="absolute rounded-full"
              style={{
                width: 6, height: 6,
                top: '50%', left: '50%',
                marginTop: -3 - 92,
                marginLeft: -3,
                background: deg === 0 || deg === 180 ? '#F47B20' : '#DC2626',
                boxShadow: `0 0 8px 2px ${deg === 0 || deg === 180 ? 'rgba(244,123,32,0.7)' : 'rgba(220,38,38,0.6)'}`,
                transform: `rotate(${deg}deg) translateY(92px)`,
                transformOrigin: '3px 95px',
                opacity: isIn ? 0 : 1,
                transition: `opacity 0.3s ease ${0.5 + deg / 1000}s`,
              }}
            />
          ))}
        </div>

        {/* テキストエリア */}
        <div
          className="mt-8 text-center"
          style={{
            opacity:   textVisible && !isOut ? 1 : 0,
            transform: textVisible && !isOut ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          {/* ブランド名 */}
          <p
            className="font-black tracking-[0.18em] text-white"
            style={{ fontSize: 20, letterSpacing: '0.18em', textShadow: '0 0 24px rgba(244,123,32,0.3)' }}
          >
            TOTAL BODY MAKE
          </p>

          {/* 赤いアンダーライン */}
          <div className="flex items-center gap-2 mt-3 mb-3">
            <div style={{ flex: 1, height: 2, background: 'rgba(220,38,38,0.5)' }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F47B20', boxShadow: '0 0 6px #F47B20' }} />
            <div style={{ flex: 1, height: 2, background: 'rgba(220,38,38,0.5)' }} />
          </div>

          {/* サブタイトル */}
          <p
            className="font-bold tracking-[0.3em]"
            style={{ fontSize: 11, color: 'rgba(244,123,32,0.9)', letterSpacing: '0.3em' }}
          >
            勤 務 管 理 シ ス テ ム
          </p>
        </div>
      </div>

      {/* ── ボトムプログレスバー ── */}
      <div
        className="absolute overflow-hidden"
        style={{
          bottom: 52,
          width: 100,
          height: 3,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 2,
          opacity: isIn ? 0 : isOut ? 0 : 1,
          transition: 'opacity 0.3s ease 0.5s',
        }}
      >
        <div
          style={{
            height: '100%',
            width: isIn ? '0%' : '100%',
            background: 'linear-gradient(90deg, #DC2626, #F47B20)',
            boxShadow: '0 0 8px rgba(244,123,32,0.8)',
            transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
            borderRadius: 2,
          }}
        />
      </div>

      {/* ── バージョン ── */}
      <p
        className="absolute text-[10px] tracking-widest font-medium"
        style={{
          bottom: 28,
          color: 'rgba(255,255,255,0.2)',
          opacity: textVisible && !isOut ? 1 : 0,
          transition: 'opacity 0.5s ease 0.8s',
        }}
      >
        Ver. 2.0
      </p>

      <style>{`
        @keyframes slowSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
