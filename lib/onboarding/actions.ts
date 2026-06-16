'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { defaultLocale } from '@/i18n'

export type OnboardingData = {
  pseudo: string
  first_name: string
  last_name: string
  age: string
  country: string
  city: string
  supported_club: string
  swap_preference: 'mail' | 'inperson' | 'both'
  locale: string
}

/** Parse a free-text age into a bounded int, or null if invalid/empty. */
function parseAge(raw: string): number | null {
  const n = parseInt(raw, 10)
  if (Number.isNaN(n) || n < 5 || n > 120) return null
  return n
}

export async function saveProfile(data: OnboardingData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect(`/${data.locale}/login`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('users') as any).upsert({
    id: user.id,
    pseudo: data.pseudo.trim(),
    first_name: data.first_name.trim() || null,
    last_name: data.last_name.trim() || null,
    age: parseAge(data.age),
    country: data.country,
    city: data.city.trim() || null,
    supported_club: data.supported_club.trim() || null,
    swap_preference: data.swap_preference,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
