import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
