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

  const allStickers = allStickersRaw ?? []

  // Stickers the current user already owns — excluded from both tops, since
  // this is the "wishes" page (only cards still to get are relevant here).
  const myOwnedIds = new Set(
    (userStickersRaw ?? []).filter((r) => r.quantity >= 1).map((r) => r.sticker_id)
  )

  // How many collectors own each sticker (0 when nobody owns it yet).
  const ownerCountMap = new Map<number, number>()
  for (const row of allOwned ?? []) {
    ownerCountMap.set(row.sticker_id, (ownerCountMap.get(row.sticker_id) ?? 0) + 1)
  }

  // How many collectors pinned each sticker as a priority.
  const priorityCountMap = new Map<number, number>()
  for (const row of allPriorities ?? []) {
    priorityCountMap.set(row.sticker_id, (priorityCountMap.get(row.sticker_id) ?? 0) + 1)
  }

  const missingForMe = allStickers.filter((s) => !myOwnedIds.has(s.id))

  // ── Top 10 most wanted: missing cards most pinned by the community ──
  const topWanted = [...missingForMe]
    .sort(
      (a, b) =>
        (priorityCountMap.get(b.id) ?? 0) - (priorityCountMap.get(a.id) ?? 0) ||
        a.number - b.number
    )
    .filter((s) => (priorityCountMap.get(s.id) ?? 0) > 0)
    .slice(0, 10)

  // ── Top 10 rarest: missing cards the fewest collectors own (0 owners first) ──
  const topRare = [...missingForMe]
    .sort(
      (a, b) =>
        (ownerCountMap.get(a.id) ?? 0) - (ownerCountMap.get(b.id) ?? 0) ||
        a.number - b.number
    )
    .slice(0, 10)

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
