'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserEmail } from '@/lib/supabase/admin'
import { MAX_SWAP_DIFFERENTIAL, type SwapItemInput } from '@/lib/swaps/constants'
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
 * Propose a new swap between current user (initiator) and another user (receiver).
 * Only doubles can be offered, and the give/receive totals must stay within
 * MAX_SWAP_DIFFERENTIAL of each other.
 */
export async function proposeSwap(
  receiverId: string,
  give: SwapItemInput[],
  receive: SwapItemInput[],
  message?: string,
  swapMode: 'mail' | 'inperson' = 'mail'
): Promise<{ swapId: string | null; error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { swapId: null, error: 'Unauthenticated' }

  const cleanGive = give.filter((i) => i.quantity > 0)
  const cleanReceive = receive.filter((i) => i.quantity > 0)
  const giveTotal = cleanGive.reduce((n, i) => n + i.quantity, 0)
  const receiveTotal = cleanReceive.reduce((n, i) => n + i.quantity, 0)

  if (giveTotal === 0 || receiveTotal === 0) {
    return { swapId: null, error: 'Chaque côté doit contenir au moins une vignette.' }
  }
  if (Math.abs(giveTotal - receiveTotal) > MAX_SWAP_DIFFERENTIAL) {
    return {
      swapId: null,
      error: `L'écart entre les deux côtés ne peut pas dépasser ${MAX_SWAP_DIFFERENTIAL} vignettes.`,
    }
  }

  // Validate that the offered cards are really doubles owned by the right party.
  const giveIds = cleanGive.map((i) => i.sticker_id)
  const receiveIds = cleanReceive.map((i) => i.sticker_id)
  const [{ data: myRows }, { data: theirRows }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('user_stickers') as any)
      .select('sticker_id, quantity').eq('user_id', user.id).in('sticker_id', giveIds.length ? giveIds : [-1]) as Promise<{ data: { sticker_id: number; quantity: number }[] | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('user_stickers') as any)
      .select('sticker_id, quantity').eq('user_id', receiverId).in('sticker_id', receiveIds.length ? receiveIds : [-1]) as Promise<{ data: { sticker_id: number; quantity: number }[] | null }>,
  ])
  const myQty = new Map((myRows ?? []).map((r) => [r.sticker_id, r.quantity]))
  const theirQty = new Map((theirRows ?? []).map((r) => [r.sticker_id, r.quantity]))
  const validGive = cleanGive.every((i) => (myQty.get(i.sticker_id) ?? 0) - 1 >= i.quantity)
  const validReceive = cleanReceive.every((i) => (theirQty.get(i.sticker_id) ?? 0) - 1 >= i.quantity)
  if (!validGive || !validReceive) {
    return { swapId: null, error: 'Seuls les doublons peuvent être échangés.' }
  }

  // One conversation per pair: if an active swap already exists between these
  // two users (either direction), open it instead of creating a duplicate.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from('swaps') as any)
    .select('id')
    .or(`and(initiator_id.eq.${user.id},receiver_id.eq.${receiverId}),and(initiator_id.eq.${receiverId},receiver_id.eq.${user.id})`)
    .in('status', ['pending', 'accepted', 'initiator_sent', 'receiver_sent'])
    .limit(1)
    .maybeSingle() as { data: { id: string } | null }

  if (existing) {
    return { swapId: existing.id, error: null }
  }

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

  // Persist the items (give = from me, receive = from the other party).
  const itemRows = [
    ...cleanGive.map((i) => ({ swap_id: swap.id, sticker_id: i.sticker_id, from_user_id: user.id, quantity: i.quantity })),
    ...cleanReceive.map((i) => ({ swap_id: swap.id, sticker_id: i.sticker_id, from_user_id: receiverId, quantity: i.quantity })),
  ]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsError } = await (supabase.from('swap_items') as any).insert(itemRows)
  if (itemsError) {
    console.error(itemsError)
    // Roll back the empty swap so we don't leave a swap with no items.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('swaps') as any).delete().eq('id', swap.id)
    return { swapId: null, error: 'Failed to save swap items' }
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

  if (newStatus === 'completed') {
    // Atomically move the cards between both collections + mark completed.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: rpcError } = await (supabase.rpc as any)('apply_swap_completion', { p_swap_id: swapId })
    if (rpcError) {
      console.error('apply_swap_completion failed', rpcError)
      return { error: 'Failed to complete swap' }
    }
    // Both users' collections changed — refresh the relevant pages.
    revalidatePath('/album')
    revalidatePath('/wishes')
    revalidatePath('/home')
    revalidatePath('/playground')
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('swaps') as any)
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', swapId)
  }

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
