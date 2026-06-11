import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { locales, type Locale } from '@/i18n'
import { createClient } from '@/lib/supabase/server'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  // Must be authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  // If profile already exists, skip onboarding
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) redirect(`/${locale}/home`)

  return <OnboardingFlow locale={locale} />
}
