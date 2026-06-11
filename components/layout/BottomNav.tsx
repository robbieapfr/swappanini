'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface BottomNavProps {
  locale: string
}

const NAV_ITEMS = [
  { key: 'home',       href: (l: string) => `/${l}/home`,       icon: HomeIcon },
  { key: 'collection', href: (l: string) => `/${l}/album`,       icon: CollectionIcon },
  { key: 'wants',      href: (l: string) => `/${l}/wishes`,      icon: WantsIcon },
  { key: 'playground', href: (l: string) => `/${l}/playground`,  icon: SwapIcon },
  { key: 'inbox',      href: (l: string) => `/${l}/inbox`,       icon: InboxIcon },
  { key: 'profile',    href: (l: string) => `/${l}/profile`,     icon: ProfileIcon },
] as const

const ACTIVE_COLOR = '#00C241'
const INACTIVE_COLOR = '#9CA3AF'

export function BottomNav({ locale }: BottomNavProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-stretch h-16"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
        const to = href(locale)
        const active = pathname === to || (key !== 'home' && pathname.startsWith(to))
        return (
          <Link
            key={key}
            href={to}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
          >
            <Icon active={active} />
            <span
              className="text-[10px] font-semibold transition-colors"
              style={{ color: active ? ACTIVE_COLOR : INACTIVE_COLOR }}
            >
              {t(key as Parameters<typeof t>[0])}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

// ── Icons ──────────────────────────────────────────────────

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE_COLOR : INACTIVE_COLOR
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H15v-6H9v6H4a1 1 0 0 1-1-1V10.5Z"
        fill={active ? c : 'none'} stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function CollectionIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE_COLOR : INACTIVE_COLOR
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="14" rx="2" fill={active ? c : 'none'} stroke={c} strokeWidth="1.8" />
      <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M2 12h20" stroke={active ? 'white' : c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function WantsIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE_COLOR : INACTIVE_COLOR
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35Z"
        fill={active ? c : 'none'} stroke={c} strokeWidth="1.8"
      />
    </svg>
  )
}

function SwapIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE_COLOR : INACTIVE_COLOR
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {/* Arrow right (top) */}
      <path d="M5 8h14M14 4l5 4-5 4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Arrow left (bottom) */}
      <path d="M19 16H5M10 12l-5 4 5 4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InboxIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE_COLOR : INACTIVE_COLOR
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" fill={active ? c : 'none'} stroke={c} strokeWidth="1.8" />
      <path d="M2 9h20" stroke={active ? 'white' : c} strokeWidth="1.5" />
      <path d="M7 4v5M17 4v5" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE_COLOR : INACTIVE_COLOR
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill={active ? c : 'none'} stroke={c} strokeWidth="1.8" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
