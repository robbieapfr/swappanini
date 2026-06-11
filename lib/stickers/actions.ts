'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Upsert a user sticker row.
 * - quantity=0, priority=null  → delete row
 * - quantity=0, priority>0     → keep row (missing but pinned as priority want)
 * - quantity>0                 → upsert normally
 */
export async function upsertSticker(
  stickerId: number,
  quantity: number,
  priority: number | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  // Delete if nothing to track
  if (quantity <= 0 && !priority) {
    const { error } = await supabase
      .from('user_stickers')
      .delete()
      .eq('user_id', user.id)
      .eq('sticker_id', stickerId)
    return error ? { error: error.message } : { success: true }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('user_stickers') as any).upsert({
    user_id: user.id,
    sticker_id: stickerId,
    quantity: Math.max(0, quantity),
    priority: priority ?? null,
    wanted: quantity === 0 && !!priority, // true when missing but pinned
  })

  return error ? { error: error.message } : { success: true }
}
