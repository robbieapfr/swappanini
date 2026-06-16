'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { saveProfile } from '@/lib/onboarding/actions'
import { Step1Profile, type ProfileData } from './Step1Profile'
import { Step2SwapMode, type SwapPreference } from './Step2SwapMode'
import { Step3Collection } from './Step3Collection'

type Step = 1 | 2 | 3

interface OnboardingFlowProps {
  locale: string
}

const STEPS = [1, 2, 3] as const

export function OnboardingFlow({ locale }: OnboardingFlowProps) {
  const router = useRouter()
  const t = useTranslations('onboarding')

  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<ProfileData>({
    pseudo: '',
    first_name: '',
    last_name: '',
    age: '',
    country: '',
    city: '',
    supported_club: '',
  })
  const [swapPreference, setSwapPreference] = useState<SwapPreference>('both')

  const STEP_TITLES: Record<Step, string> = {
    1: t('step1_title'),
    2: t('step2_title'),
    3: t('step3_title'),
  }
  const STEP_SUBTITLES: Record<Step, string> = {
    1: t('step1_subtitle'),
    2: t('step2_subtitle'),
    3: t('step3_subtitle'),
  }

  async function handleStep3(redirectTo: string) {
    setLoading(true)
    setError(null)

    const result = await saveProfile({
      ...profile,
      swap_preference: swapPreference,
      locale,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push(`/${locale}/${redirectTo}`)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s) => (
          <div
            key={s}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{
              background: s <= step ? '#1B3B1A' : '#E5E7EB',
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
          {step} / 3
        </p>
        <h1 className="font-display text-2xl text-gray-900">
          {STEP_TITLES[step]}
        </h1>
        <p className="text-sm text-gray-400 font-medium mt-1">
          {STEP_SUBTITLES[step]}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Steps */}
      {step === 1 && (
        <Step1Profile
          data={profile}
          onChange={setProfile}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <Step2SwapMode
          value={swapPreference}
          onChange={setSwapPreference}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <Step3Collection
          loading={loading}
          onStartFromZero={() => handleStep3('album')}
          onAlreadyHave={() => handleStep3('album')}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  )
}
