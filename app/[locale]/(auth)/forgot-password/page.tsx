import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { locales, type Locale } from '@/i18n'
import { createClient } from '@/lib/supabase/server'
import { AuthInput } from '@/components/ui/AuthInput'
import { SubmitButton } from '@/components/ui/SubmitButton'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string; sent?: string }>
}) {
  const { locale } = await params
  const { error, sent } = await searchParams
  setRequestLocale(locale as Locale)

  const resetPassword = async (formData: FormData) => {
    'use server'
    const supabase = await createClient()
    const email = formData.get('email') as string
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/api/auth/reset-password?locale=${locale}`,
    })

    if (error) {
      redirect(`/${locale}/forgot-password?error=${encodeURIComponent(error.message)}`)
    }

    redirect(`/${locale}/forgot-password?sent=1`)
  }

  return (
    <>
      <h1 className="font-display text-2xl text-gray-900 mb-2">Mot de passe oublié</h1>
      <p className="text-sm text-gray-400 mb-6">
        Entre ton adresse email — on t'envoie un lien pour réinitialiser ton mot de passe.
      </p>

      {/* Success */}
      {sent && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
          ✅ Email envoyé ! Vérifie ta boîte (et tes spams).
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
          {decodeURIComponent(error)}
        </div>
      )}

      {!sent && (
        <form action={resetPassword} className="flex flex-col gap-4">
          <AuthInput
            id="email"
            name="email"
            type="email"
            label="Adresse email"
            placeholder="toi@email.com"
            required
            autoComplete="email"
          />
          <SubmitButton label="Envoyer le lien" loadingLabel="Envoi…" />
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-400">
        <Link
          href={`/${locale}/login`}
          className="font-black hover:underline"
          style={{ color: '#1B3B1A' }}
        >
          ← Retour à la connexion
        </Link>
      </p>
    </>
  )
}
