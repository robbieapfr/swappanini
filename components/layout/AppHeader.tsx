import Link from 'next/link'

interface AppHeaderProps {
  locale: string
  pseudo?: string | null
  /** Optional left slot override (defaults to avatar) */
  leftSlot?: React.ReactNode
  /** Optional title override (defaults to page title) */
  title?: string
}

export function AppHeader({ locale, pseudo, title, leftSlot }: AppHeaderProps) {
  const initial = pseudo?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex items-center justify-between px-4 pt-5 pb-3 bg-white">
      {/* Left: avatar or custom slot */}
      {leftSlot ?? (
        <Link href={`/${locale}/profile`} className="relative flex-shrink-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center
              font-bold text-base border-2 border-gray-100"
            style={{ background: '#f3f4f6', color: '#374151' }}
          >
            {initial}
          </div>
          {/* Online dot */}
          <span
            className="absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-white"
            style={{ background: '#00C241' }}
          />
        </Link>
      )}

      {/* Optional title */}
      {title && (
        <h1 className="font-display text-xl font-bold" style={{ color: '#00C241' }}>
          {title}
        </h1>
      )}

      {/* Right: SWAP'WC26 logo */}
      <Link href={`/${locale}/home`} className="flex items-center gap-1.5">
        <span className="font-display text-xl font-black tracking-tight">
          <span style={{ color: '#AAFF00' }}>SWAP</span>
          <span style={{ color: '#00C241' }}>&apos;WC26</span>
        </span>
        <CoinIcon />
      </Link>
    </div>
  )
}

function CoinIcon() {
  return (
    <div
      className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black"
      style={{ borderColor: '#AAFF00', color: '#AAFF00', background: 'transparent' }}
    >
      ⬡
    </div>
  )
}
