import { createClient } from '@/lib/supabase/server'

export interface SwapItem {
  id: number
  number: number
  name: string | null
  code: string
  country: string
  availableQty: number // doubles count (quantity - 1)
  selectedQty: number  // quantity chosen for this swap
}

export interface MatchReceiver {
  pseudo: string
  city: string | null
  country: string
  swap_preference: string | null
}

/** Full sticker data for the propose page */
export async function getMatchStickers(
  myUserId: string,
  receiverId: string
): Promise<{
  stickers_i_give: SwapItem[]
  stickers_i_receive: SwapItem[]
  receiver: MatchReceiver | null
}> {
  const supabase = await createClient()

  const [
    { data: myDoublesRaw },
    { data: theirStickersRaw },
    { data: theirDoublesRaw },
    { data: myOwnedRaw },
    { data: receiverProfile },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('user_stickers') as any)
      .select('sticker_id, quantity, stickers(id, number, name, code, country)')
      .eq('user_id', myUserId).gte('quantity', 2) as Promise<{ data: { sticker_id: number; quantity: number; stickers: { id: number; number: number; name: string | null; code: string; country: string } | null }[] | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('user_stickers') as any)
      .select('sticker_id, quantity').eq('user_id', receiverId) as Promise<{ data: { sticker_id: number; quantity: number }[] | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('user_stickers') as any)
      .select('sticker_id, quantity, stickers(id, number, name, code, country)')
      .eq('user_id', receiverId).gte('quantity', 2) as Promise<{ data: { sticker_id: number; quantity: number; stickers: { id: number; number: number; name: string | null; code: string; country: string } | null }[] | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('user_stickers') as any)
      .select('sticker_id').eq('user_id', myUserId).gte('quantity', 1) as Promise<{ data: { sticker_id: number }[] | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('users') as any)
      .select('pseudo, city, country, swap_preference').eq('id', receiverId).single() as Promise<{ data: MatchReceiver | null }>,
  ])

  const theirOwnedIds = new Set(
    (theirStickersRaw ?? []).filter((s) => s.quantity >= 1).map((s) => s.sticker_id)
  )
  const myOwnedIds = new Set((myOwnedRaw ?? []).map((s) => s.sticker_id))

  const stickers_i_give: SwapItem[] = (myDoublesRaw ?? [])
    .filter((d) => d.stickers && !theirOwnedIds.has(d.sticker_id))
    .map((d) => ({
      id: d.stickers!.id,
      number: d.stickers!.number,
      name: d.stickers!.name,
      code: d.stickers!.code,
      country: d.stickers!.country,
      availableQty: d.quantity - 1,
      selectedQty: 1,
    }))

  const stickers_i_receive: SwapItem[] = (theirDoublesRaw ?? [])
    .filter((d) => d.stickers && !myOwnedIds.has(d.sticker_id))
    .map((d) => ({
      id: d.stickers!.id,
      number: d.stickers!.number,
      name: d.stickers!.name,
      code: d.stickers!.code,
      country: d.stickers!.country,
      availableQty: d.quantity - 1,
      selectedQty: 1,
    }))

  return { stickers_i_give, stickers_i_receive, receiver: receiverProfile }
}

export interface MatchWithStickers {
  id: string
  pseudo: string
  city: string | null
  country: string
  i_give_count: number
  i_get_count: number
  priority_match_count: number
  match_score: number
  swap_preference: string | null
  stickers_i_receive: {
    id: number
    number: number
    name: string | null
    code: string
    country: string
  }[]
}

/**
 * Get top matches enriched with the actual stickers I'd receive.
 * "Stickers I'd receive" = stickers the other person has doubles of that I'm missing.
 */
export async function getMatchesWithStickers(
  userId: string,
  limit = 20
): Promise<MatchWithStickers[]> {
  const supabase = await createClient()

  // 1. Get matches
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: matches } = await (supabase.rpc as any)('get_matches', { me: userId }) as {
    data: {
      id: string
      pseudo: string
      city: string | null
      country: string
      i_give_count: number
      i_get_count: number
      priority_match_count: number
      match_score: number
      swap_preference: string | null
    }[] | null
  }

  if (!matches?.length) return []

  const topMatches = matches.slice(0, limit)

  // 2. Fetch my missing sticker IDs (quantity = 0 or no row)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: myStickers } = await (supabase.from('user_stickers') as any)
    .select('sticker_id, quantity')
    .eq('user_id', userId) as {
    data: { sticker_id: number; quantity: number }[] | null
  }

  const myOwnedIds = new Set(
    (myStickers ?? []).filter((s) => s.quantity >= 1).map((s) => s.sticker_id)
  )

  // 3. For each match, get their doubles that I'm missing (up to 5)
  const enriched = await Promise.all(
    topMatches.map(async (match) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: theirDoubles } = await (supabase.from('user_stickers') as any)
        .select('sticker_id, stickers(id, number, name, code, country)')
        .eq('user_id', match.id)
        .gte('quantity', 2)
        .limit(50) as {
        data: {
          sticker_id: number
          stickers: { id: number; number: number; name: string | null; code: string; country: string } | null
        }[] | null
      }

      const stickers_i_receive = (theirDoubles ?? [])
        .filter((d) => d.stickers && !myOwnedIds.has(d.sticker_id))
        .slice(0, 5)
        .map((d) => d.stickers!)

      return { ...match, stickers_i_receive }
    })
  )

  return enriched
}
