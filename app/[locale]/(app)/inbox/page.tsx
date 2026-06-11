import { setRequestLocale, getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { locales, type Locale } from '@/i18n'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/layout/AppHeader'
import { InboxClient } from '@/components/inbox/InboxClient'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export interface SwapRow {
  id: string
  status: string
  created_at: string
  updated_at: string
  initiator_id: string
  receiver_id: string
  initiator: { pseudo: string; city: string | null; country: string } | null
  receiver: { pseudo: string; city: string | null; country: string } | null
  i_give_count?: number
  i_get_count?: number
}

export default async function InboxPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('inbox')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const [profileResult, { data: swaps }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('users') as any).select('pseudo').eq('id', user.id).single() as Promise<{
      data: { pseudo: string } | null; error: unknown
    }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('swaps') as any)
      .select(`
        id, status, created_at, updated_at, initiator_id, receiver_id,
        initiator:users!swaps_initiator_id_fkey(pseudo, city, country),
        receiver:users!swaps_receiver_id_fkey(pseudo, city, country)
      `)
      .or(`initiator_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('updated_at', { ascending: false }) as Promise<{
      data: SwapRow[] | null
    }>,
  ])

  const allSwaps = swaps ?? []
  const pendingCount = allSwaps.filter(
    (s) => s.status === 'pending' && s.receiver_id === user.id
  ).length

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppHeader locale={locale} pseudo={profileResult.data?.pseudo} title={t('title')} />
      <InboxClient
        swaps={allSwaps}
        currentUserId={user.id}
        locale={locale}
        pendingCount={pendingCount}
      />
    </div>
  )
}
