'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserEmail } from '@/lib/supabase/admin'
import {
  sendSwapProposalEmail,
  sendSwapAcceptedEmail,
  sendSwapRefusedEmail,
  sendSwapCompletedEmail,
} from '@/lib/email'

export type SwapStatus =
  | 'pending'
  | 'accepted'
  | 'initiator_sent'
  | 'receiver_sent'
  | 'completed'
  | 'refused'
  | 'cancelled'

/**
 * Propose a new swap between current user (initiator) and another user (receiver)
 */
export async function proposeSwap(
  receiverId: string,
  message?: string,
  swapMode: 'mail' | 'inperson' = 'mail'
): Promise<{ swapId: string | null; error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { swapId: null, error: 'Unauthenticated' }

  // Create swap
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: swap, error: swapError } = await (supabase.from('swaps') as any)
    .insert({ initiator_id: user.id, receiver_id: receiverId, status: 'pending', swap_mode: swapMode })
    .select('id')
    .single() as { data: { id: string } | null; error: unknown }

  if (swapError || !swap) {
    console.error(swapError)
    return { swapId: null, error: 'Failed to create swap' }
  }

  // Send optional message
  if (message?.trim()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('swap_messages') as any).insert({
      swap_id: swap.id,
      sender_id: user.id,
      content: message.trim(),
    })
  }

  revalidatePath('/inbox')

  // Send notification email to receiver (fire-and-forget — don't block on it)
  void (async () => {
    try {
      const [receiverEmail, receiverProfile, initiatorProfile] = await Promise.all([
        getUserEmail(receiverId),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('users') as any)
          .select('pseudo, first_name')
          .eq('id', receiverId)
          .single() as Promise<{ data: { pseudo: string; first_name: string | null } | null }>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('users') as any)
          .select('pseudo')
          .eq('id', user.id)
          .single() as Promise<{ data: { pseudo: string } | null }>,
      ])

      if (receiverEmail && receiverProfile.data && initiatorProfile.data) {
        await sendSwapProposalEmail({
          toEmail: receiverEmail,
          toName: receiverProfile.data.first_name ?? receiverProfile.data.pseudo,
          fromPseudo: initiatorProfile.data.pseudo,
          swapId: swap.id,
        })
      }
    } catch (e) {
      console.error('[email] sendSwapProposalEmail failed:', e)
    }
  })()

  return { swapId: swap.id, error: null }
}

/**
 * Send a message in a swap thread
 */
export async function sendMessage(
  swapId: string,
  body: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  if (!body.trim()) return { error: 'Empty message' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('swap_messages') as any).insert({
    swap_id: swapId,
    sender_id: user.id,
    content: body.trim(),
  }) as { error: unknown }

  if (error) return { error: 'Failed to send message' }

  revalidatePath(`/inbox/${swapId}`)
  return { error: null }
}

/**
 * Transition swap status
 * Valid transitions:
 *   pending → accepted (by receiver)
 *   pending → refused (by receiver)
 *   accepted → initiator_sent (by initiator)
 *   accepted → receiver_sent (by receiver)
 *   initiator_sent → completed (when receiver_sent too)
 *   receiver_sent → completed (when initiator_sent too)
 *   * → cancelled (by either party, before completed)
 */
export async function transitionSwap(
  swapId: string,
  action: 'accept' | 'refuse' | 'mark_sent' | 'mark_received' | 'cancel'
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: swap } = await (supabase.from('swaps') as any)
    .select('id, status, initiator_id, receiver_id')
    .eq('id', swapId)
    .single() as {
    data: {
      id: string
      status: SwapStatus
      initiator_id: string
      receiver_id: string
    } | null
  }

  if (!swap) return { error: 'Swap not found' }

  const isInitiator = swap.initiator_id === user.id
  const isReceiver = swap.receiver_id === user.id

  let newStatus: SwapStatus | null = null

  switch (action) {
    case 'accept':
      if (isReceiver && swap.status === 'pending') newStatus = 'accepted'
      break
    case 'refuse':
      if (isReceiver && swap.status === 'pending') newStatus = 'refused'
      break
    case 'mark_sent':
      if (swap.status === 'accepted') {
        newStatus = isInitiator ? 'initiator_sent' : 'receiver_sent'
      } else if (swap.status === 'receiver_sent' && isInitiator) {
        newStatus = 'completed'
      } else if (swap.status === 'initiator_sent' && isReceiver) {
        newStatus = 'completed'
      }
      break
    case 'cancel':
      if (['pending', 'accepted', 'initiator_sent', 'receiver_sent'].includes(swap.status)) {
        newStatus = 'cancelled'
      }
      break
  }

  if (!newStatus) return { error: 'Invalid transition' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('swaps') as any)
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', swapId)

  revalidatePath(`/inbox/${swapId}`)
  revalidatePath('/inbox')

  // Send notification emails (fire-and-forget)
  void (async () => {
    try {
      // Fetch pseudos for both parties
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: initiatorProfile } = await (supabase.from('users') as any)
        .select('pseudo, first_name')
        .eq('id', swap.initiator_id)
        .single() as { data: { pseudo: string; first_name: string | null } | null }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: receiverProfile } = await (supabase.from('users') as any)
        .select('pseudo, first_name')
        .eq('id', swap.receiver_id)
        .single() as { data: { pseudo: string; first_name: string | null } | null }

      if (!initiatorProfile || !receiverProfile) return

      if (newStatus === 'accepted') {
        // Notify initiator that their proposal was accepted
        const initiatorEmail = await getUserEmail(swap.initiator_id)
        if (initiatorEmail) {
          await sendSwapAcceptedEmail({
            toEmail: initiatorEmail,
            toName: initiatorProfile.first_name ?? initiatorProfile.pseudo,
            acceptorPseudo: receiverProfile.pseudo,
            swapId,
          })
        }
      }

      if (newStatus === 'refused') {
        // Notify initiator that their proposal was refused
        const initiatorEmail = await getUserEmail(swap.initiator_id)
        if (initiatorEmail) {
          await sendSwapRefusedEmail({
            toEmail: initiatorEmail,
            toName: initiatorProfile.first_name ?? initiatorProfile.pseudo,
            refuserPseudo: receiverProfile.pseudo,
          })
        }
      }

      if (newStatus === 'completed') {
        // Notify both parties
        const [initiatorEmail, receiverEmail] = await Promise.all([
          getUserEmail(swap.initiator_id),
          getUserEmail(swap.receiver_id),
        ])
        if (initiatorEmail) {
          await sendSwapCompletedEmail({
            toEmail: initiatorEmail,
            toName: initiatorProfile.first_name ?? initiatorProfile.pseudo,
            otherPseudo: receiverProfile.pseudo,
          })
        }
        if (receiverEmail) {
          await sendSwapCompletedEmail({
            toEmail: receiverEmail,
            toName: receiverProfile.first_name ?? receiverProfile.pseudo,
            otherPseudo: initiatorProfile.pseudo,
          })
        }
      }
    } catch (e) {
      console.error('[email] transitionSwap email failed:', e)
    }
  })()

  return { error: null }
}
