import { setRequestLocale } from 'next-intl/server'
import { locales, type Locale } from '@/i18n'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center px-6">
        <h1
          className="font-display text-5xl mb-4"
          style={{ color: '#1B3B1A' }}
        >
          Swappanini
        </h1>
        <p className="text-gray-500 font-semibold">
          Coming soon — infrastructure ready.
        </p>
      </div>
    </main>
  )
}
