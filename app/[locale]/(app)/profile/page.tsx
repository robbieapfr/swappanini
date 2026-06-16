import { setRequestLocale, getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { locales, type Locale } from '@/i18n'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/layout/AppHeader'
import { ProfileClient } from '@/components/profile/ProfileClient'
import type { LeaderboardUser, FriendRequest } from './community/page'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export interface Badge {
  id: number
  name: string
  description: string | null
  condition_type: string
  image_url: string | null
  earned: boolean
  earned_at: string | null
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const tp = await getTranslations('profile')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const [{ data: profile }, { data: allBadges }, { data: earnedBadges }, leaderboardResult, requestsResult, outgoingResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('users') as any)
      .select('pseudo, first_name, last_name, birth_year, country, city, swap_preference, supported_club, avatar_url')
      .eq('id', user.id)
      .single() as Promise<{
      data: {
        pseudo: string; first_name: string | null; last_name: string | null; birth_year: number | null
        country: string; city: string | null; swap_preference: string
        supported_club: string | null; avatar_url: string | null
      } | null
    }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('badges') as any)
      .select('id, name, description, condition_type, image_url')
      .order('id') as Promise<{
      data: Omit<Badge, 'earned' | 'earned_at'>[] | null
    }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('user_badges') as any)
      .select('badge_id, earned_at')
      .eq('user_id', user.id) as Promise<{
      data: { badge_id: number; earned_at: string }[] | null
    }>,
    // Leaderboard
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.rpc as any)('get_leaderboard', { me: user.id }) as Promise<{ data: LeaderboardUser[] | null }>,
    // Incoming friend requests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('friendships') as any)
      .select('requester_id, created_at, requester:users!friendships_requester_id_fkey(id, pseudo, city, country)')
      .eq('addressee_id', user.id)
      .eq('status', 'pending') as Promise<{
      data: { requester_id: string; created_at: string; requester: { id: string; pseudo: string; city: string | null; country: string } | null }[] | null
    }>,
    // Outgoing pending
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('friendships') as any)
      .select('addressee_id')
      .eq('requester_id', user.id)
      .eq('status', 'pending') as Promise<{ data: { addressee_id: string }[] | null }>,
  ])

  const earnedMap = new Map((earnedBadges ?? []).map((b) => [b.badge_id, b.earned_at]))

  const badges: Badge[] = (allBadges ?? []).map((b) => ({
    ...b,
    earned: earnedMap.has(b.id),
    earned_at: earnedMap.get(b.id) ?? null,
  }))

  const outgoingIds = new Set((outgoingResult.data ?? []).map((r) => r.addressee_id))
  const leaderboard: LeaderboardUser[] = (leaderboardResult.data ?? []).map((u) => ({
    ...u,
    i_requested: outgoingIds.has(u.id),
  }))

  const friendRequests: FriendRequest[] = (requestsResult.data ?? [])
    .filter((r) => r.requester != null)
    .map((r) => ({
      id: r.requester!.id,
      pseudo: r.requester!.pseudo,
      city: r.requester!.city,
      country: r.requester!.country,
      collection_pct: 0,
      requested_at: r.created_at,
    }))

  const friends = leaderboard.filter((u) => u.friendship_status === 'accepted')

  return (
    <div className="min-h-screen bg-white">
      <AppHeader locale={locale} pseudo={profile?.pseudo} avatarUrl={profile?.avatar_url} title={tp('header_title')} />
      <ProfileClient
        email={user.email ?? ''}
        profile={profile}
        badges={badges}
        locale={locale}
        leaderboard={leaderboard}
        friends={friends}
        friendRequests={friendRequests}
        pendingCount={friendRequests.length}
        currentUserId={user.id}
      />
    </div>
  )
}
