import Link from 'next/link'
import { LanguageToggle } from '@/components/layout/LanguageToggle'

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Language toggle top-right */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle locale={locale} variant="pill" />
      </div>

      {/* Header minimal */}
      <header className="pt-8 pb-2 text-center">
        <Link href="/" className="font-display text-3xl font-black tracking-tight">
          <span style={{ color: '#AAFF00' }}>SWAP</span>
          <span style={{ color: '#00C241' }}>&apos;WC26</span>
        </Link>
      </header>

      {/* Card */}
      <main className="flex-1 flex items-start justify-center px-4 pt-8 pb-16">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
