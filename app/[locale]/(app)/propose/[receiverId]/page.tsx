import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { type Locale } from '@/i18n'
import { createClient } from '@/lib/supabase/server'
import { getMatchStickers } from '@/lib/matching/queries'
import { ProposePageClient } from '@/components/matches/ProposePageClient'

export default async function ProposePage({
  params,
}: {
  params: Promise<{ locale: string; receiverId: string }>
}) {
  const { locale, receiverId } = await params
  setRequestLocale(locale as Locale)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { stickers_i_give, stickers_i_receive, receiver } =
    await getMatchStickers(user.id, receiverId)

  if (!receiver) redirect(`/${locale}/playground`)

  return (
    <ProposePageClient
      receiverId={receiverId}
      receiver={receiver}
      initialGive={stickers_i_give}
      initialReceive={stickers_i_receive}
      locale={locale}
    />
  )
}
