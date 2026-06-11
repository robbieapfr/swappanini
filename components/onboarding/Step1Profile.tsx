'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { COUNTRIES } from '@/lib/countries'
import { CLUB_LEAGUES } from '@/lib/clubs'
import { AuthInput } from '@/components/ui/AuthInput'

export type ProfileData = {
  pseudo: string
  first_name: string
  country: string
  city: string
  supported_club: string
}

type PseudoStatus = 'idle' | 'checking' | 'available' | 'taken'

interface Step1Props {
  data: ProfileData
  onChange: (data: ProfileData) => void
  onNext: () => void
}

export function Step1Profile({ data, onChange, onNext }: Step1Props) {
  const t = useTranslations('onboarding')
  const [pseudoStatus, setPseudoStatus] = useState<PseudoStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const set = (key: keyof ProfileData, value: string) =>
    onChange({ ...data, [key]: value })

  // Real-time pseudo check with 600ms debounce
  useEffect(() => {
    if (!data.pseudo || data.pseudo.length < 3) {
      setPseudoStatus('idle')
      return
    }
    setPseudoStatus('checking')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/check-pseudo?pseudo=${encodeURIComponent(data.pseudo)}`)
      const json = await res.json()
      setPseudoStatus(json.available ? 'available' : 'taken')
    }, 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [data.pseudo])

  const canProceed =
    data.pseudo.length >= 3 &&
    pseudoStatus === 'available' &&
    data.country !== ''

  const pseudoHint =
    pseudoStatus === 'checking' ? '…'
    : pseudoStatus === 'available' ? t('pseudo_available')
    : pseudoStatus === 'taken' ? t('pseudo_taken')
    : undefined

  const pseudoError = pseudoStatus === 'taken' ? t('pseudo_taken') : undefined

  return (
    <div className="flex flex-col gap-5">
      {/* Pseudo */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-gray-700">{t('pseudo_label')}</label>
        <div className="relative">
          <input
            type="text"
            value={data.pseudo}
            onChange={(e) => set('pseudo', e.target.value.toLowerCase().replace(/\s/g, ''))}
            placeholder={t('pseudo_placeholder')}
            maxLength={24}
            className={`w-full bg-gray-50 border rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-900
              placeholder:text-gray-400 outline-none transition-colors focus:bg-white
              ${pseudoStatus === 'taken' ? 'border-red-400 bg-red-50' : ''}
              ${pseudoStatus === 'available' ? 'border-[#00C241]' : 'border-gray-200'}
              focus:border-[#00C241]`}
          />
          {/* Status icon */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
            {pseudoStatus === 'checking' && <span className="text-gray-400">⋯</span>}
            {pseudoStatus === 'available' && <span className="text-[#00C241]">✓</span>}
            {pseudoStatus === 'taken' && <span className="text-red-500">✗</span>}
          </span>
        </div>
        {pseudoHint && pseudoStatus !== 'idle' && (
          <p className={`text-xs font-medium ${pseudoStatus === 'taken' ? 'text-red-500' : pseudoStatus === 'available' ? 'text-[#00C241]' : 'text-gray-400'}`}>
            {pseudoHint}
          </p>
        )}
      </div>

      {/* First name */}
      <AuthInput
        id="first_name"
        label={t('firstname_label')}
        value={data.first_name}
        onChange={(e) => set('first_name', e.target.value)}
        placeholder="Alex"
      />

      {/* Country */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="country" className="text-sm font-bold text-gray-700">
          {t('country_label')}
        </label>
        <select
          id="country"
          value={data.country}
          onChange={(e) => set('country', e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium
            text-gray-900 outline-none transition-colors focus:border-[#00C241] focus:bg-white"
        >
          <option value="">—</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* City */}
      <AuthInput
        id="city"
        label={t('city_label')}
        value={data.city}
        onChange={(e) => set('city', e.target.value)}
        placeholder="Paris"
      />

      {/* Club */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="club" className="text-sm font-bold text-gray-700">
          {t('club_label')} <span className="text-gray-400 font-normal">(optionnel)</span>
        </label>
        <select
          id="club"
          value={data.supported_club}
          onChange={(e) => set('supported_club', e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium
            text-gray-900 outline-none transition-colors focus:border-[#00C241] focus:bg-white"
        >
          <option value="">— Aucun / Autre</option>
          {CLUB_LEAGUES.map(({ league, country, clubs }) => (
            <optgroup key={league} label={`${country} — ${league}`}>
              {clubs.map((club) => (
                <option key={club} value={club}>{club}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full py-3 rounded-xl font-black text-sm tracking-wide transition-all
          disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] mt-2"
        style={{ background: '#AAFF00', color: '#1B3B1A' }}
      >
        {t('cta_next')} →
      </button>
    </div>
  )
}
