import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { locales, type Locale } from '@/i18n'
import { login, loginWithGoogle } from '@/lib/auth/actions'
import { AuthInput } from '@/components/ui/AuthInput'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { GoogleIcon } from '@/components/ui/GoogleIcon'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string; redirectTo?: string; notice?: string }>
}) {
  const { locale } = await params
  const { error, redirectTo, notice } = await searchParams
  setRequestLocale(locale as Locale)

  const t = await getTranslations('auth')

  return (
    <>
      <h1 className="font-display text-2xl text-gray-900 mb-6">{t('login_title')}</h1>

      {/* Success notice (e.g. after sign-up) */}
      {notice === 'verify-email' && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm font-medium" style={{ color: '#1B7A2E' }}>
          {t('verify_email_notice')}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
          {decodeURIComponent(error)}
        </div>
      )}

      {/* Email/password form */}
      <form action={login} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

        <AuthInput
          id="email"
          name="email"
          type="email"
          label={t('email_label')}
          placeholder={t('email_placeholder')}
          required
          autoComplete="email"
        />

        <AuthInput
          id="password"
          name="password"
          type="password"
          label={t('password_label')}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />

        <div className="text-right -mt-2">
          <Link
            href={`/${locale}/forgot-password`}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t('forgot_password')}
          </Link>
        </div>

        <SubmitButton label={t('login_cta')} loadingLabel="…" />
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400 font-bold">{t('or')}</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Google OAuth */}
      <form
        action={async () => {
          'use server'
          await loginWithGoogle(locale)
        }}
      >
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200
            bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.98]"
        >
          <GoogleIcon />
          {t('continue_google')}
        </button>
      </form>

      {/* Switch to register */}
      <p className="mt-6 text-center text-sm text-gray-400">
        {t('no_account')}{' '}
        <Link
          href={`/${locale}/register`}
          className="font-black hover:underline"
          style={{ color: '#1B3B1A' }}
        >
          {t('register_cta')}
        </Link>
      </p>
    </>
  )
}

