'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { locales } from '@/i18n'

const LABELS: Record<string, string> = {
  en: 'EN',
  fr: 'FR',
  es: 'ES',
  de: 'DE',
}

const FULL: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
}

interface Props {
  locale: string
  /** Visual variant: 'pill' (bordered, for headers) or 'ghost' (plain) */
  variant?: 'pill' | 'ghost'
}

export function LanguageToggle({ locale, variant = 'pill' }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const switchTo = (target: string) => {
    setOpen(false)
    if (target === locale) return
    // Replace the leading /<locale> segment with the target locale.
    const segments = pathname.split('/')
    if (locales.includes(segments[1] as never)) {
      segments[1] = target
    } else {
      segments.splice(1, 0, target)
    }
    router.push(segments.join('/') || `/${target}`)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-xs font-black transition-all active:scale-[0.97] ${
          variant === 'pill'
            ? 'px-3 py-1.5 rounded-full border-2'
            : 'px-2 py-1 rounded-lg'
        }`}
        style={
          variant === 'pill'
            ? { borderColor: '#e5e7eb', color: '#374151', background: 'white' }
            : { color: '#6b7280' }
        }
        aria-label="Change language"
      >
        <GlobeIcon />
        {LABELS[locale] ?? locale.toUpperCase()}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white py-1 z-50"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.14)', border: '1px solid #f3f4f6' }}
        >
          {locales.map((code) => (
            <button
              key={code}
              onClick={() => switchTo(code)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold
                hover:bg-gray-50 transition-colors text-left"
              style={{ color: code === locale ? '#00C241' : '#374151' }}
            >
              {FULL[code]}
              {code === locale && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}
