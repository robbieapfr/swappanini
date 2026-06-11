'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserEmail } from '@/lib/supabase/admin'
import { sendFriendRequestEmail } from '@/lib/email'

export async function sendFriendRequest(
  addresseeId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }
  if (user.id === addresseeId) return { error: 'Cannot add yourself' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('friendships') as any).insert({
    requester_id: user.id,
    addressee_id: addresseeId,
    status: 'pending',
  })

  if (error) return { error: 'Already sent or already friends' }
  revalidatePath('/profile/community')

  // Send notification email to addressee (fire-and-forget)
  void (async () => {
    try {
      const [addresseeEmail, addresseeProfile, requesterProfile] = await Promise.all([
        getUserEmail(addresseeId),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('users') as any)
          .select('pseudo, first_name')
          .eq('id', addresseeId)
          .single() as Promise<{ data: { pseudo: string; first_name: string | null } | null }>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('users') as any)
          .select('pseudo')
          .eq('id', user.id)
          .single() as Promise<{ data: { pseudo: string } | null }>,
      ])
      if (addresseeEmail && addresseeProfile.data && requesterProfile.data) {
        await sendFriendRequestEmail({
          toEmail: addresseeEmail,
          toName: addresseeProfile.data.first_name ?? addresseeProfile.data.pseudo,
          fromPseudo: requesterProfile.data.pseudo,
        })
      }
    } catch (e) {
      console.error('[email] sendFriendRequestEmail failed:', e)
    }
  })()

  return { error: null }
}

export async function acceptFriendRequest(
  requesterId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('friendships') as any)
    .update({ status: 'accepted' })
    .eq('requester_id', requesterId)
    .eq('addressee_id', user.id)
    .eq('status', 'pending')

  if (error) return { error: 'Could not accept' }
  revalidatePath('/profile/community')
  return { error: null }
}

export async function declineFriendRequest(
  requesterId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('friendships') as any)
    .delete()
    .eq('requester_id', requesterId)
    .eq('addressee_id', user.id)

  revalidatePath('/profile/community')
  return { error: null }
}

export async function removeFriend(
  friendId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  // Delete in either direction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('friendships') as any)
    .delete()
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`
    )

  revalidatePath('/profile/community')
  return { error: null }
}
