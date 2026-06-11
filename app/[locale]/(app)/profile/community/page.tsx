import { setRequestLocale, getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { locales, type Locale } from '@/i18n'
import { createClient } from '@/lib/supabase/server'
import { CommunityClient } from '@/components/community/CommunityClient'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export interface LeaderboardUser {
  id: string
  pseudo: string
  city: string | null
  country: string
  collection_pct: number
  swap_count: number
  badge_count: number
  friendship_status: 'none' | 'pending' | 'accepted' | 'declined'
  /** absolute leaderboard rank (1-based) */
  rank: number
  /** true for the current user's own row */
  is_me?: boolean
  /** true if I sent the request (pending outgoing) */
  i_requested?: boolean
}

export interface FriendRequest {
  id: string
  pseudo: string
  city: string | null
  country: string
  collection_pct: number
  requested_at: string
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('community')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  // Get leaderboard + pending requests in parallel
  const [leaderboardResult, requestsResult, outgoingResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.rpc as any)('get_leaderboard', { me: user.id }) as Promise<{
      data: LeaderboardUser[] | null
    }>,
    // Incoming friend requests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('friendships') as any)
      .select(`
        requester_id, created_at,
        requester:users!friendships_requester_id_fkey(id, pseudo, city, country)
      `)
      .eq('addressee_id', user.id)
      .eq('status', 'pending') as Promise<{
      data: {
        requester_id: string
        created_at: string
        requester: { id: string; pseudo: string; city: string | null; country: string } | null
      }[] | null
    }>,
    // Outgoing pending requests (to know which "Ajouter" to show as "Demande envoyée")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('friendships') as any)
      .select('addressee_id')
      .eq('requester_id', user.id)
      .eq('status', 'pending') as Promise<{
      data: { addressee_id: string }[] | null
    }>,
  ])

  const leaderboard = leaderboardResult.data ?? []
  const outgoingIds = new Set((outgoingResult.data ?? []).map((r) => r.addressee_id))

  // Mark who I requested
  const enrichedLeaderboard: LeaderboardUser[] = leaderboard.map((u) => ({
    ...u,
    i_requested: outgoingIds.has(u.id),
  }))

  // Build requests list with collection stats
  const requests: FriendRequest[] = await Promise.all(
    (requestsResult.data ?? []).map(async (req) => {
      if (!req.requester) return null
      // Get their collection %
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: stickers } = await (supabase.from('user_stickers') as any)
        .select('quantity')
        .eq('user_id', req.requester_id)
        .gte('quantity', 1) as { data: { quantity: number }[] | null }
      const pct = Math.round(((stickers?.length ?? 0) / 980) * 100)
      return {
        id: req.requester.id,
        pseudo: req.requester.pseudo,
        city: req.requester.city,
        country: req.requester.country,
        collection_pct: pct,
        requested_at: req.created_at,
      } satisfies FriendRequest
    })
  ).then((r) => r.filter(Boolean) as FriendRequest[])

  const friends = enrichedLeaderboard.filter((u) => u.friendship_status === 'accepted')
  const pendingCount = requests.length

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 bg-white">
        <Link href={`/${locale}/profile`} className="text-gray-400 font-black text-lg w-8">
          ←
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-black" style={{ color: '#00C241' }}>
            {t('title')}
          </h1>
          <p className="text-xs text-gray-400 font-medium">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <CommunityClient
        leaderboard={enrichedLeaderboard}
        friends={friends}
        requests={requests}
        currentUserId={user.id}
        pendingCount={pendingCount}
        locale={locale}
      />
    </div>
  )
}
