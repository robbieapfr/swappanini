import { setRequestLocale, getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { locales, type Locale } from '@/i18n'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AppHeader } from '@/components/layout/AppHeader'
import { WantsClient } from '@/components/stickers/WantsClient'
import type { StickerMap } from '@/hooks/useUserStickers'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function WantsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('wants')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const admin = createAdminClient()

  // Parallel fetch: profile + all stickers + this user's sticker states + community data
  const [
    { data: profile },
    { data: allStickersRaw },
    { data: userStickersRaw },
    { data: allPriorities },
    { data: allOwned },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('users') as any).select('pseudo').eq('id', user.id).single() as Promise<{
      data: { pseudo: string } | null; error: unknown
    }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from('stickers') as any)
      .select('id, code, country, number, name, type, club, image_url')
      .order('number') as Promise<{
      data: { id: number; code: string; country: string; number: number; name: string | null; type: import('@/lib/supabase/types').StickerType; club: string | null; image_url: string | null }[] | null
      error: unknown
    }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from('user_stickers') as any)
      .select('sticker_id, quantity, priority')
      .eq('user_id', user.id) as Promise<{
      data: { sticker_id: number; quantity: number; priority: number | null }[] | null
      error: unknown
    }>,
    // Community: all priorities across all users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from('user_stickers') as any)
      .select('sticker_id')
      .gt('priority', 0) as Promise<{
      data: { sticker_id: number }[] | null; error: unknown
    }>,
    // Community: all owned stickers across all users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from('user_stickers') as any)
      .select('sticker_id')
      .gte('quantity', 1) as Promise<{
      data: { sticker_id: number }[] | null; error: unknown
    }>,
  ])

  // ── Build StickerMap for client ──
  const initialUserStickers: StickerMap = {}
  for (const row of userStickersRaw ?? []) {
    initialUserStickers[row.sticker_id] = { quantity: row.quantity, priority: row.priority }
  }

  // ── Top 10 plus recherchés (most prioritized community-wide) ──
  const priorityCountMap = new Map<number, number>()
  for (const row of allPriorities ?? []) {
    priorityCountMap.set(row.sticker_id, (priorityCountMap.get(row.sticker_id) ?? 0) + 1)
  }
  const topWantedIds = new Set(
    Array.from(priorityCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id)
  )

  // ── Top 10 plus rares (fewest owners, at least 1) ──
  const ownerCountMap = new Map<number, number>()
  for (const row of allOwned ?? []) {
    ownerCountMap.set(row.sticker_id, (ownerCountMap.get(row.sticker_id) ?? 0) + 1)
  }
  const topRareIds = new Set(
    Array.from(ownerCountMap.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, 10)
      .map(([id]) => id)
  )

  const allStickers = allStickersRaw ?? []
  const topWanted = allStickers.filter((s) => topWantedIds.has(s.id))
  const topRare = allStickers.filter((s) => topRareIds.has(s.id))

  return (
    <div className="min-h-screen bg-white">
      <AppHeader locale={locale} pseudo={profile?.pseudo} title={t('title')} />
      <WantsClient
        allStickers={allStickers}
        initialUserStickers={initialUserStickers}
        topWanted={topWanted}
        topRare={topRare}
        locale={locale}
      />
    </div>
  )
}
