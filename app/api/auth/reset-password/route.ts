import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultLocale } from '@/i18n'

// Supabase redirects here after the user clicks the reset link in their email.
// It contains a `code` query param that we exchange for a session,
// then redirect to the update-password page.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const locale = searchParams.get('locale') ?? defaultLocale
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to the update-password page (user is now logged in with a recovery session)
  return NextResponse.redirect(`${appUrl}/${locale}/update-password`)
}
