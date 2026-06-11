'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface UpdateProfileInput {
  pseudo: string
  first_name: string
  country: string
  city: string
  supported_club: string
  swap_preference: 'mail' | 'inperson' | 'both'
}

export async function updateProfile(input: UpdateProfileInput): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('users') as any)
    .update({
      pseudo: input.pseudo.trim().toLowerCase(),
      first_name: input.first_name.trim() || null,
      country: input.country,
      city: input.city.trim() || null,
      supported_club: input.supported_club || null,
      swap_preference: input.swap_preference,
    })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') return { error: 'Ce pseudo est déjà pris.' }
    return { error: 'Une erreur est survenue. Réessaie.' }
  }

  revalidatePath('/', 'layout')
  return {}
}
