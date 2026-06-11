import { setRequestLocale, getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { locales, type Locale } from '@/i18n'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/layout/AppHeader'
import { PlaygroundClient } from '@/components/matches/PlaygroundClient'
import { getMatchesWithStickers } from '@/lib/matching/queries'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('playground')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const [profile, matches] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('users') as any)
      .select('pseudo').eq('id', user.id).single() as Promise<{
      data: { pseudo: string } | null
    }>,
    getMatchesWithStickers(user.id),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader locale={locale} pseudo={profile.data?.pseudo} title={t('title')} />
      <div className="px-4 pt-1 pb-2">
        <p className="text-sm text-gray-400 font-medium">
          {t('subtitle', { count: matches.length })}
        </p>
      </div>
      <PlaygroundClient matches={matches} locale={locale} />
    </div>
  )
}
