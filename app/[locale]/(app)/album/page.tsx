import { setRequestLocale, getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { locales, type Locale } from '@/i18n'
import { createClient } from '@/lib/supabase/server'
import { CollectionGrid } from '@/components/stickers/CollectionGrid'
import { AppHeader } from '@/components/layout/AppHeader'
import type { StickerMap } from '@/hooks/useUserStickers'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('collection')

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from('users') as any)
    .select('pseudo').eq('id', user.id).single() as { data: { pseudo: string } | null }

  const [{ data: allStickers }, { data: userStickers }] = await Promise.all([
    supabase
      .from('stickers')
      .select('*')
      .order('country')
      .order('number'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('user_stickers') as any)
      .select('sticker_id, quantity, priority')
      .eq('user_id', user.id) as Promise<{
        data: { sticker_id: number; quantity: number; priority: number | null }[] | null
        error: unknown
      }>,
  ])

  // Build lookup map: sticker_id → { quantity, priority }
  const initialMap: StickerMap = {}
  for (const row of userStickers ?? []) {
    initialMap[row.sticker_id] = {
      quantity: row.quantity,
      priority: row.priority,
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <AppHeader locale={locale} pseudo={profile?.pseudo} title={t('title')} />
      <CollectionGrid
        allStickers={allStickers ?? []}
        initialUserStickers={initialMap}
      />
    </div>
  )
}
