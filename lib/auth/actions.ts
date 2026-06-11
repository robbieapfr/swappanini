'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { defaultLocale } from '@/i18n'

function getLocaleFromHeader(): string {
  // Server actions don't have access to route params — use cookie or default
  return defaultLocale
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = (formData.get('redirectTo') as string) || `/${defaultLocale}/home`
  const locale = (formData.get('locale') as string) || defaultLocale

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/${locale}/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect(redirectTo)
}

export async function register(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const locale = (formData.get('locale') as string) || defaultLocale

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  })

  if (error) {
    redirect(`/${locale}/register?error=${encodeURIComponent(error.message)}`)
  }

  // When email confirmation is enabled, signUp returns no session — the user
  // must click the link in their inbox before they can log in. Send them to
  // login with a notice instead of onboarding (which would bounce them).
  if (!data.session) {
    redirect(`/${locale}/login?notice=verify-email`)
  }

  // Auto-confirm enabled → proceed straight to onboarding.
  redirect(`/${locale}/onboarding`)
}

export async function loginWithGoogle(locale: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?locale=${locale}`,
    },
  })

  if (error || !data.url) {
    redirect(`/${locale}/login?error=${encodeURIComponent(error?.message ?? 'OAuth error')}`)
  }

  redirect(data.url)
}

export async function logout(locale: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`/${locale}/login`)
}
