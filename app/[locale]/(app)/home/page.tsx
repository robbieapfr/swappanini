import { setRequestLocale, getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { locales, type Locale } from '@/i18n'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/layout/AppHeader'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('home')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const [
    { data: profile },
    { data: collectionStats },
    { count: total },
    { data: matches },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('users') as any)
      .select('pseudo, swap_preference')
      .eq('id', user.id)
      .single() as Promise<{ data: { pseudo: string; swap_preference: string } | null; error: unknown }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('user_stickers') as any)
      .select('quantity')
      .eq('user_id', user.id) as Promise<{ data: { quantity: number }[] | null; error: unknown }>,
    // Canonical catalogue size — same base the album uses, so percentages match
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('stickers') as any)
      .select('id', { count: 'exact', head: true }) as Promise<{ count: number | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.rpc as any)('get_matches', { me: user.id }) as Promise<{
      data: {
        id: string; pseudo: string; city: string | null; country: string
        i_give_count: number; i_get_count: number; priority_match_count: number; match_score: number
      }[] | null; error: unknown
    }>,
  ])

  const rows = collectionStats ?? []
  const owned = rows.filter((r) => r.quantity >= 1).length
  const doubles = rows.filter((r) => r.quantity >= 2).length
  const totalStickers = total ?? 980
  const pct = totalStickers > 0 ? Math.round((owned / totalStickers) * 100) : 0
  const topMatches = matches?.slice(0, 5) ?? []

  return (
    <div className="min-h-screen bg-white">
      <AppHeader locale={locale} pseudo={profile?.pseudo} />

      <div className="px-4 pb-6 space-y-5">
        {/* ── Stat pills ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Collection % */}
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-4"
            style={{ background: '#00C241' }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.25)' }}
            >
              <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'white' }} />
            </div>
            <div>
              <p className="font-display text-xl font-black text-white leading-none">{pct}%</p>
              <p className="text-xs text-white/60 font-medium mt-0.5">{t('stat_complete')}</p>
            </div>
          </div>

          {/* Doubles */}
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-4 border border-gray-100"
            style={{ background: '#f9fafb' }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#AAFF00' }}
            >
              <div className="w-3.5 h-3.5 rounded-full" style={{ background: '#88CC00' }} />
            </div>
            <div>
              <p className="font-display text-xl font-black leading-none" style={{ color: '#1B3B1A' }}>
                {doubles}
              </p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{t('stat_doubles')}</p>
            </div>
          </div>
        </div>

        {/* ── Top matches ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-black" style={{ color: '#00C241' }}>
              {t('top_matches')}
            </h2>
            <Link
              href={`/${locale}/playground`}
              className="text-sm font-semibold underline"
              style={{ color: '#00C241' }}
            >
              {t('see_all')}
            </Link>
          </div>

          {topMatches.length === 0 ? (
            <div
              className="rounded-2xl px-5 py-6 text-center"
              style={{ background: '#f3f4f6' }}
            >
              <p className="text-sm text-gray-400 font-medium">
                {t('no_matches')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {topMatches.map((match) => (
                <Link
                  key={match.id}
                  href={`/${locale}/playground`}
                  className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3
                    border border-gray-100 active:scale-[0.99] transition-transform"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center
                      font-black text-base flex-shrink-0"
                    style={{ background: '#AAFF00', color: '#1B3B1A' }}
                  >
                    {match.pseudo[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{match.pseudo}</p>
                    <p className="text-xs text-gray-400">{match.country}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <span
                      className="text-[11px] font-black px-2 py-0.5 rounded-lg"
                      style={{ background: '#00C241', color: 'white' }}
                    >
                      +{match.i_give_count} 🎁
                    </span>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-gray-200 text-gray-600">
                      +{match.i_get_count} ✨
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
