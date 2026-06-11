'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { MatchCard } from './MatchCard'
import type { MatchWithStickers } from '@/lib/matching/queries'

interface Props {
  matches: MatchWithStickers[]
  locale: string
}

export function PlaygroundClient({ matches, locale }: Props) {
  const t = useTranslations('playground')

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-8">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-5"
          style={{ background: '#AAFF00' }}
        >
          🔍
        </div>
        <h2 className="font-display text-2xl mb-2" style={{ color: '#00C241' }}>
          {t('empty_title')}
        </h2>
        <p className="text-sm text-gray-400 font-medium max-w-xs">
          {t('empty_body')}
        </p>
        <Link
          href={`/${locale}/album`}
          className="mt-5 px-6 py-3 rounded-full font-black text-sm
            transition-all active:scale-[0.98]"
          style={{ background: '#00C241', color: 'white' }}
        >
          Gérer mon album →
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} locale={locale} />
      ))}
    </div>
  )
}
