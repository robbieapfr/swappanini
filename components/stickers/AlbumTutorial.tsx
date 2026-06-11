'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

const STORAGE_KEY = 'album_tutorial_seen_v1'

export function AlbumTutorial() {
  const t = useTranslations('tutorial')
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem(STORAGE_KEY)) setOpen(true)
  }, [])

  if (!open) return null

  const close = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setOpen(false)
  }

  const steps = [
    {
      demo: <DemoTap />,
      title: t('step1_title'),
      body: t('step1_body'),
    },
    {
      demo: <DemoDouble />,
      title: t('step2_title'),
      body: t('step2_body'),
    },
    {
      demo: <DemoLongPress />,
      title: t('step3_title'),
      body: t('step3_body'),
    },
  ]

  const isLast = step === steps.length - 1
  const current = steps[step]

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-t-3xl px-6 pt-5 pb-8"
        style={{ paddingBottom: 'max(28px, env(safe-area-inset-bottom))' }}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        {/* Skip */}
        <div className="flex justify-end -mt-2 mb-1">
          <button onClick={close} className="text-xs font-bold text-gray-400">
            {t('skip')}
          </button>
        </div>

        {/* Demo visual */}
        <div className="flex items-center justify-center h-28 mb-5">
          {current.demo}
        </div>

        <h2 className="font-display text-xl font-black text-center mb-2" style={{ color: '#1B3B1A' }}>
          {current.title}
        </h2>
        <p className="text-sm text-gray-500 font-medium text-center leading-relaxed mb-6">
          {current.body}
        </p>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {steps.map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === step ? 20 : 7,
                height: 7,
                background: i === step ? '#00C241' : '#e5e7eb',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => (isLast ? close() : setStep((s) => s + 1))}
          className="w-full py-3.5 rounded-2xl font-black text-sm transition-all active:scale-[0.98]"
          style={{ background: '#AAFF00', color: '#1B3B1A' }}
        >
          {isLast ? t('cta_done') : t('cta_next')}
        </button>
      </div>
    </div>
  )
}

// ── Demo cards ──────────────────────────────────────────────
function MiniCard({
  bg,
  border,
  dashed,
  textColor,
  badge,
  star,
}: {
  bg: string
  border: string
  dashed?: boolean
  textColor: string
  badge?: string
  star?: boolean
}) {
  return (
    <div
      className="relative rounded-xl flex flex-col items-center justify-center"
      style={{
        width: 64,
        height: 64,
        background: bg,
        border: `2px ${dashed ? 'dashed' : 'solid'} ${border}`,
      }}
    >
      {badge && (
        <span
          className="absolute -top-2 -right-2 text-[10px] font-black px-1.5 py-0.5 rounded-md"
          style={{ background: '#AAFF00', color: '#1B3B1A' }}
        >
          {badge}
        </span>
      )}
      {star && <span className="absolute -top-2 -right-2 text-sm">⭐</span>}
      <span className="font-black text-sm" style={{ color: textColor }}>FRA</span>
      <span className="text-[9px] font-bold" style={{ color: textColor, opacity: 0.6 }}>10</span>
    </div>
  )
}

function DemoTap() {
  return (
    <div className="flex items-center gap-4">
      <MiniCard bg="#F3F4F6" border="#E5E7EB" textColor="#9CA3AF" />
      <span className="text-2xl">👆</span>
      <MiniCard bg="#ffffff" border="#00C241" textColor="#1B3B1A" />
    </div>
  )
}

function DemoDouble() {
  return (
    <div className="flex items-center gap-4">
      <MiniCard bg="#ffffff" border="#00C241" textColor="#1B3B1A" />
      <span className="text-2xl">👆👆</span>
      <MiniCard bg="#00C241" border="#00C241" textColor="#ffffff" badge="+1" />
    </div>
  )
}

function DemoLongPress() {
  return (
    <div className="flex items-center gap-4">
      <span className="text-2xl">👆⏱️</span>
      <MiniCard bg="#FFFBEB" border="#F59E0B" dashed textColor="#B45309" star />
    </div>
  )
}
