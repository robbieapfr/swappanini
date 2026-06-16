'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { updateProfile } from '@/lib/profile/actions'
import { COUNTRIES } from '@/lib/countries'
import { CLUB_LEAGUES } from '@/lib/clubs'

import { CommunityClient } from '@/components/community/CommunityClient'
import { AvatarUploader } from './AvatarUploader'
import type { Badge } from '@/app/[locale]/(app)/profile/page'
import type { LeaderboardUser, FriendRequest } from '@/app/[locale]/(app)/profile/community/page'

interface ProfileData {
  pseudo: string
  first_name: string | null
  last_name: string | null
  birth_year: number | null
  country: string
  city: string | null
  swap_preference: string
  supported_club: string | null
  avatar_url: string | null
}

interface Props {
  email: string
  profile: ProfileData | null
  badges: Badge[]
  locale: string
  leaderboard: LeaderboardUser[]
  friends: LeaderboardUser[]
  friendRequests: FriendRequest[]
  pendingCount: number
  currentUserId: string
}

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
]

const SWAP_MODES = [
  { value: 'mail', key: 'swap_mail' },
  { value: 'inperson', key: 'swap_inperson' },
  { value: 'both', key: 'swap_both' },
] as const

type PseudoStatus = 'idle' | 'checking' | 'available' | 'taken' | 'same'

export function ProfileClient({ email, profile, badges, locale, leaderboard, friends, friendRequests, pendingCount, currentUserId }: Props) {
  const router = useRouter()
  const t = useTranslations('profile')
  const [isPending, startTransition] = useTransition()

  const handleLocaleChange = (newLocale: string) => {
    router.push(`/${newLocale}/profile`)
  }

  const handleLogout = () => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push(`/${locale}/login`)
    })
  }

  const earnedCount = badges.filter((b) => b.earned).length

  return (
    <div className="px-4 pb-8 space-y-4">
      {/* ── Profile info (editable) ── */}
      <ProfileInfoCard profile={profile} userId={currentUserId} />

      {/* ── Email card ── */}
      <div className="rounded-2xl border border-gray-100 px-4 py-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
          {t('logged_in_as')}
        </p>
        <p className="font-bold text-sm" style={{ color: '#1B3B1A' }}>{email}</p>
      </div>

      {/* ── Badges ── */}
      <div className="rounded-2xl border border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-black" style={{ color: '#00C241' }}>
            {t('badges')}
          </h2>
          <span className="text-sm font-bold text-gray-400">
            {earnedCount} / {badges.length}
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {badges.map((badge) => (
            <BadgeItem key={badge.id} badge={badge} />
          ))}
          {Array.from({ length: Math.max(0, 4 - badges.length) }).map((_, i) => (
            <LockedBadge key={`locked-${i}`} />
          ))}
        </div>
      </div>

      {/* ── Communauté inline ── */}
      <div className="rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3">
          <span className="text-lg">🌍</span>
          <h2 className="font-display text-lg font-black" style={{ color: '#00C241' }}>
            {t('community')}
          </h2>
          {pendingCount > 0 && (
            <span
              className="text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: '#AAFF00', color: '#1B3B1A' }}
            >
              {pendingCount}
            </span>
          )}
        </div>
        <CommunityClient
          leaderboard={leaderboard}
          friends={friends}
          requests={friendRequests}
          currentUserId={currentUserId}
          pendingCount={pendingCount}
          locale={locale}
        />
      </div>

      {/* ── Language switcher ── */}
      <div className="rounded-2xl border border-gray-100 px-4 py-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
          {t('language')}
        </p>
        <select
          value={locale}
          onChange={(e) => handleLocaleChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold
            text-gray-700 bg-white outline-none transition-colors focus:border-[#00C241]"
        >
          {LOCALES.map(({ code, label }) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      {/* ── Notifications ── */}
      <div className="rounded-2xl border border-gray-100 px-4 py-4 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          {t('notifications')}
        </p>
        <NotifToggle
          label={t('notif_proposal_label')}
          description={t('notif_proposal_desc')}
          storageKey="notif_swap_proposal"
          defaultOn={true}
        />
        <NotifToggle
          label={t('notif_status_label')}
          description={t('notif_status_desc')}
          storageKey="notif_swap_status"
          defaultOn={true}
        />
        <NotifToggle
          label={t('notif_completed_label')}
          description={t('notif_completed_desc')}
          storageKey="notif_swap_completed"
          defaultOn={true}
        />
        <NotifToggle
          label={t('notif_friend_label')}
          description={t('notif_friend_desc')}
          storageKey="notif_friend_request"
          defaultOn={true}
        />
      </div>

      {/* ── Logout ── */}
      <button
        onClick={handleLogout}
        disabled={isPending}
        className="w-full py-3 rounded-xl font-black text-sm
          border-2 transition-all active:scale-[0.98] disabled:opacity-50"
        style={{ borderColor: '#e5e7eb', color: '#6b7280', background: 'white' }}
      >
        {t('logout')}
      </button>
    </div>
  )
}

// ── Profile info card (with inline edit) ─────────────────────────────
function ProfileInfoCard({ profile, userId }: { profile: ProfileData | null; userId: string }) {
  const t = useTranslations('profile')
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const originalPseudo = profile?.pseudo ?? ''

  const [pseudo, setPseudo] = useState(originalPseudo)
  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')
  const [birthYear, setBirthYear] = useState(profile?.birth_year != null ? String(profile.birth_year) : '')
  const [country, setCountry] = useState(profile?.country ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [club, setClub] = useState(profile?.supported_club ?? '')
  const [swapMode, setSwapMode] = useState<'mail' | 'inperson' | 'both'>(
    (profile?.swap_preference as 'mail' | 'inperson' | 'both') ?? 'both'
  )
  const [pseudoStatus, setPseudoStatus] = useState<PseudoStatus>('same')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function cancelEdit() {
    setPseudo(originalPseudo)
    setFirstName(profile?.first_name ?? '')
    setLastName(profile?.last_name ?? '')
    setBirthYear(profile?.birth_year != null ? String(profile.birth_year) : '')
    setCountry(profile?.country ?? '')
    setCity(profile?.city ?? '')
    setClub(profile?.supported_club ?? '')
    setSwapMode((profile?.swap_preference as 'mail' | 'inperson' | 'both') ?? 'both')
    setPseudoStatus('same')
    setError(null)
    setSuccess(false)
    setEditing(false)
  }

  useEffect(() => {
    if (!editing) return
    const trimmed = pseudo.trim().toLowerCase()
    if (trimmed === originalPseudo.toLowerCase()) {
      setPseudoStatus('same')
      return
    }
    if (trimmed.length < 3) {
      setPseudoStatus('idle')
      return
    }
    setPseudoStatus('checking')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/check-pseudo?pseudo=${encodeURIComponent(trimmed)}`)
      const json = await res.json()
      setPseudoStatus(json.available ? 'available' : 'taken')
    }, 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [pseudo, editing, originalPseudo])

  const canSave =
    pseudo.trim().length >= 3 &&
    country !== '' &&
    (pseudoStatus === 'same' || pseudoStatus === 'available') &&
    !isPending

  function handleSave() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await updateProfile({
        pseudo: pseudo.trim().toLowerCase(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_year: birthYear,
        country,
        city: city.trim(),
        supported_club: club,
        swap_preference: swapMode,
      })
      if (result.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
      setEditing(false)
      router.refresh()
    })
  }

  if (!editing) {
    // Collapsed: only the photo + username are ever visible. Everything else
    // is revealed by tapping "Edit".
    return (
      <div className="rounded-2xl border border-gray-100 px-4 py-4">
        {success && (
          <p className="text-xs font-bold mb-3" style={{ color: '#00C241' }}>
            {t('updated')}
          </p>
        )}

        <div className="flex items-center gap-3">
          <AvatarUploader
            compact
            userId={userId}
            avatarUrl={profile?.avatar_url ?? null}
            pseudo={profile?.pseudo ?? '?'}
          />
          <p className="flex-1 min-w-0 font-black text-base truncate" style={{ color: '#1B3B1A' }}>
            @{profile?.pseudo ?? '—'}
          </p>
          <button
            onClick={() => { setSuccess(false); setEditing(true) }}
            className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full transition-all active:scale-[0.97] flex-shrink-0"
            style={{ background: '#f3f4f6', color: '#374151' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('edit')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-2 px-4 py-4 space-y-4" style={{ borderColor: '#00C241' }}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-black" style={{ color: '#00C241' }}>
          {t('edit_title')}
        </h2>
        <button
          onClick={cancelEdit}
          className="text-xs font-black text-gray-400 px-3 py-1.5 rounded-full bg-gray-100"
        >
          {t('cancel')}
        </button>
      </div>

      {/* Photo */}
      <AvatarUploader
        userId={userId}
        avatarUrl={profile?.avatar_url ?? null}
        pseudo={profile?.pseudo ?? '?'}
      />

      {/* Pseudo */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-black uppercase tracking-widest text-gray-500">{t('label_pseudo')}</label>
        <div className="relative">
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value.toLowerCase().replace(/\s/g, ''))}
            maxLength={24}
            className={`w-full bg-gray-50 border rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-900
              outline-none transition-colors focus:bg-white
              ${pseudoStatus === 'taken' ? 'border-red-400 bg-red-50' : ''}
              ${pseudoStatus === 'available' || pseudoStatus === 'same' ? 'border-[#00C241]' : 'border-gray-200'}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
            {pseudoStatus === 'checking' && <span className="text-gray-400">⋯</span>}
            {(pseudoStatus === 'available' || pseudoStatus === 'same') && <span style={{ color: '#00C241' }}>✓</span>}
            {pseudoStatus === 'taken' && <span className="text-red-500">✗</span>}
          </span>
        </div>
        {pseudoStatus === 'taken' && (
          <p className="text-xs font-medium text-red-500">{t('pseudo_taken')}</p>
        )}
        {pseudoStatus === 'available' && (
          <p className="text-xs font-medium" style={{ color: '#00C241' }}>{t('pseudo_available')}</p>
        )}
      </div>

      {/* Prénom */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-black uppercase tracking-widest text-gray-500">{t('label_firstname')}</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Alex"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm
            font-medium text-gray-900 outline-none transition-colors focus:border-[#00C241] focus:bg-white"
        />
      </div>

      {/* Nom */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-black uppercase tracking-widest text-gray-500">{t('label_lastname')}</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Martin"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm
            font-medium text-gray-900 outline-none transition-colors focus:border-[#00C241] focus:bg-white"
        />
      </div>

      {/* Année de naissance */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-black uppercase tracking-widest text-gray-500">{t('label_birthyear')}</label>
        <input
          type="number"
          inputMode="numeric"
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="1998"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm
            font-medium text-gray-900 outline-none transition-colors focus:border-[#00C241] focus:bg-white"
        />
      </div>

      {/* Pays */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-black uppercase tracking-widest text-gray-500">{t('label_country')}</label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm
            font-medium text-gray-900 outline-none transition-colors focus:border-[#00C241] focus:bg-white"
        >
          <option value="">—</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Ville */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-black uppercase tracking-widest text-gray-500">{t('label_city')}</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Paris"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm
            font-medium text-gray-900 outline-none transition-colors focus:border-[#00C241] focus:bg-white"
        />
      </div>

      {/* Club de cœur */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-black uppercase tracking-widest text-gray-500">
          {t('label_club')} <span className="text-gray-300 normal-case font-normal">{t('optional')}</span>
        </label>
        <select
          value={club}
          onChange={(e) => setClub(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm
            font-medium text-gray-900 outline-none transition-colors focus:border-[#00C241] focus:bg-white"
        >
          <option value="">{t('club_none')}</option>
          {CLUB_LEAGUES.map(({ league, country: leagueCountry, clubs }) => (
            <optgroup key={league} label={`${leagueCountry} — ${league}`}>
              {clubs.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Mode d'échange */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-black uppercase tracking-widest text-gray-500">{t('label_swapmode')}</label>
        <div className="flex rounded-2xl border border-gray-200 overflow-hidden" style={{ background: '#f9fafb' }}>
          {SWAP_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setSwapMode(m.value)}
              className="flex-1 py-2.5 text-xs font-black transition-all"
              style={
                swapMode === m.value
                  ? { background: '#00C241', color: 'white', borderRadius: '12px' }
                  : { background: 'transparent', color: '#6b7280' }
              }
            >
              {t(m.key)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm font-medium text-red-500">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={!canSave}
        className="w-full py-3.5 rounded-2xl font-black text-sm
          transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ background: '#00C241', color: 'white' }}
      >
        {isPending ? t('saving') : t('save')}
      </button>
    </div>
  )
}

// ── NotifToggle ───────────────────────────────────────────────
function NotifToggle({
  label,
  description,
  storageKey,
  defaultOn,
}: {
  label: string
  description: string
  storageKey: string
  defaultOn: boolean
}) {
  const [on, setOn] = useState(() => {
    if (typeof window === 'undefined') return defaultOn
    const stored = localStorage.getItem(storageKey)
    return stored === null ? defaultOn : stored === 'true'
  })

  const toggle = () => {
    const next = !on
    setOn(next)
    localStorage.setItem(storageKey, String(next))
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        onClick={toggle}
        className="flex-shrink-0 w-11 h-6 rounded-full relative transition-colors duration-200"
        style={{ background: on ? '#00C241' : '#e5e7eb' }}
        aria-label={label}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
          style={{ transform: on ? 'translateX(20px)' : 'translateX(0px)' }}
        />
      </button>
    </div>
  )
}

function BadgeItem({ badge }: { badge: Badge }) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center border-2"
        style={
          badge.earned
            ? { background: '#00C241', borderColor: '#00C241' }
            : { background: '#f3f4f6', borderColor: '#e5e7eb' }
        }
      >
        {badge.earned ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L9.19 8.62 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2Z"
              fill="white" stroke="white" strokeWidth="1.5" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#9ca3af" strokeWidth="1.8" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <span className="text-[9px] font-black text-center text-gray-400 leading-tight line-clamp-2">
        {badge.name}
      </span>
    </div>
  )
}

function LockedBadge() {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center border-2"
        style={{ background: '#f3f4f6', borderColor: '#e5e7eb' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="11" width="18" height="11" rx="2" stroke="#d1d5db" strokeWidth="1.8" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#d1d5db" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-[9px] font-black text-center text-gray-300">—</span>
    </div>
  )
}
