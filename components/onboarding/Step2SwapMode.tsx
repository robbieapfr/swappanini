'use client'

import { useTranslations } from 'next-intl'

export type SwapPreference = 'mail' | 'inperson' | 'both'

interface Step2Props {
  value: SwapPreference
  onChange: (v: SwapPreference) => void
  onNext: () => void
  onBack: () => void
}

const OPTIONS: { value: SwapPreference; emoji: string; labelKey: string }[] = [
  { value: 'mail',     emoji: '✉️',  labelKey: 'swap_mail' },
  { value: 'inperson', emoji: '🤝',  labelKey: 'swap_inperson' },
  { value: 'both',     emoji: '🌍',  labelKey: 'swap_both' },
]

export function Step2SwapMode({ value, onChange, onNext, onBack }: Step2Props) {
  const t = useTranslations('onboarding')
  const tc = useTranslations('common')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        {OPTIONS.map((opt) => {
          const selected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl border-2 text-left
                transition-all active:scale-[0.98]"
              style={{
                borderColor: selected ? '#1B3B1A' : 'transparent',
                background: selected ? 'rgba(27,59,26,0.06)' : '#F4F6F8',
              }}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span
                className="font-black text-base"
                style={{ color: selected ? '#1B3B1A' : '#374151' }}
              >
                {t(opt.labelKey as Parameters<typeof t>[0])}
              </span>
              {selected && (
                <span className="ml-auto text-[#1B3B1A] font-black">✓</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Mail info tip */}
      {(value === 'mail' || value === 'both') && (
        <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 font-medium">
          💡 {t('mail_info')}
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl font-black text-sm border border-gray-200
            text-gray-500 hover:bg-gray-50 transition-colors"
        >
          ← {tc('back')}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-[2] py-3 rounded-xl font-black text-sm transition-all active:scale-[0.98]"
          style={{ background: '#AAFF00', color: '#1B3B1A' }}
        >
          {t('cta_next')} →
        </button>
      </div>
    </div>
  )
}
