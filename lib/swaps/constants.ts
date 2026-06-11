// Shared swap constants/types. Kept out of actions.ts because a 'use server'
// module may only export async functions.

/** Max allowed difference between the number of cards each side trades. */
export const MAX_SWAP_DIFFERENTIAL = 5

export interface SwapItemInput {
  sticker_id: number
  quantity: number
}
