'use client'

import { useTranslations } from 'next-intl'

interface Step3Props {
  onStartFromZero: () => void
  onAlreadyHave: () => void
  onBack: () => void
  loading: boolean
}

export function Step3Collection({ onStartFromZero, onAlreadyHave, onBack, loading }: Step3Props) {
  const t = useTranslations('onboarding')
  const tc = useTranslations('common')

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onStartFromZero}
        disabled={loading}
        className="flex items-center gap-4 w-full px-5 py-5 rounded-2xl border-2 border-transparent
          bg-gray-50 text-left transition-all active:scale-[0.98] hover:border-[#1B3B1A]
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className="text-3xl">🆕</span>
        <div>
          <p className="font-black text-base text-gray-900">{t('start_from_zero')}</p>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">
            Tu ajouteras tes vignettes au fur et à mesure
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={onAlreadyHave}
        disabled={loading}
        className="flex items-center gap-4 w-full px-5 py-5 rounded-2xl border-2 border-transparent
          bg-gray-50 text-left transition-all active:scale-[0.98] hover:border-[#1B3B1A]
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className="text-3xl">📚</span>
        <div>
          <p className="font-black text-base text-gray-900">{t('already_have')}</p>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">
            Commence à renseigner ta collection maintenant
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        className="w-full py-3 rounded-xl font-black text-sm border border-gray-200
          text-gray-500 hover:bg-gray-50 transition-colors mt-1"
      >
        ← {tc('back')}
      </button>

      {loading && (
        <p className="text-center text-xs text-gray-400 font-medium animate-pulse">
          {tc('loading')}
        </p>
      )}
    </div>
  )
}
