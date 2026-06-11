'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { defaultLocale } from '@/i18n'

export type OnboardingData = {
  pseudo: string
  first_name: string
  country: string
  city: string
  supported_club: string
  swap_preference: 'mail' | 'inperson' | 'both'
  locale: string
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
