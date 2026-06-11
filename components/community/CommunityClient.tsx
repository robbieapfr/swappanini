'use client'

import { useState, useTransition } from 'react'
import {
  sendFriendRequest,
  removeFriend,
  acceptFriendRequest,
  declineFriendRequest,
} from '@/lib/friends/actions'
import type { LeaderboardUser, FriendRequest } from '@/app/[locale]/(app)/profile/community/page'

type Tab = 'leaderboard' | 'friends' | 'requests'

interface Props {
  leaderboard: LeaderboardUser[]
  friends: LeaderboardUser[]
  requests: FriendRequest[]
  currentUserId: string
  pendingCount: number
  locale: string
}

export function CommunityClient({
  leaderboard,
  friends,
  requests,
  pendingCount,
}: Props) {
  const [tab, setTab] = useState<Tab>('leaderboard')

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'leaderboard', label: 'Classement' },
    { key: 'friends',     label: 'Amis', count: friends.length || undefined },
    { key: 'requests',    label: 'Demandes', count: pendingCount || undefined },
  ]

  return (
    <div>
      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 px-4 pb-3 border-b border-gray-100">
        {tabs.map(({ key, label, count }) => {
          const active = tab === key
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full
                text-sm font-semibold transition-all"
              style={
                active
                  ? { border: '2px solid #00C241', color: '#1B3B1A', background: 'white' }
                  : { border: '2px solid transparent', color: '#9ca3af', background: 'transparent' }
              }
            >
              {label}
              {count != null && (
                <span
                  className="text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: '#AAFF00', color: '#1B3B1A' }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-4 space-y-3">
        {tab === 'leaderboard' && leaderboard.map((u, i) => (
          <UserCard key={u.id} user={u} rank={i + 1} mode="leaderboard" />
        ))}

        {tab === 'friends' && (
          friends.length === 0 ? (
            <EmptyState
              emoji="👥"
              text="Aucun ami pour l'instant. Cherche des collectionneurs dans le Classement !"
            />
          ) : (
            friends.map((u, i) => (
              <UserCard key={u.id} user={u} rank={i + 1} mode="friends" />
            ))
          )
        )}

        {tab === 'requests' && (
          requests.length === 0 ? (
            <EmptyState
              emoji="📬"
              text="Aucune demande d'ami en attente."
            />
          ) : (
            requests.map((req) => (
              <RequestCard key={req.id} request={req} />
            ))
          )
        )}
      </div>
    </div>
  )
}

// ── UserCard ──────────────────────────────────────────────────
function UserCard({
  user,
  rank,
  mode,
}: {
  user: LeaderboardUser
  rank: number
  mode: 'leaderboard' | 'friends'
}) {
  const [isPending, startTransition] = useTransition()
  const [localStatus, setLocalStatus] = useState(user.friendship_status)
  const [iRequested, setIRequested] = useState(user.i_requested ?? false)

  const initial = user.pseudo[0].toUpperCase()
  const location = [user.city, user.country].filter(Boolean).join(', ')
  const pct = Number(user.collection_pct).toFixed(1)

  const handleAdd = () => {
    startTransition(async () => {
      const { error } = await sendFriendRequest(user.id)
      if (!error) { setLocalStatus('pending'); setIRequested(true) }
    })
  }

  const handleRemove = () => {
    startTransition(async () => {
      const { error } = await removeFriend(user.id)
      if (!error) setLocalStatus('none')
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        {/* Rank avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: rank === 1 ? '#AAFF00' : '#f3f4f6',
          }}
        >
          {rank <= 3 ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M2 7l3 9h14l3-9-6 4-4-7-4 7-6-4Z"
                fill={rank === 1 ? '#1B3B1A' : '#9ca3af'}
                stroke={rank === 1 ? '#1B3B1A' : '#9ca3af'}
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <span className="font-black text-sm text-gray-500">#{rank}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-black text-sm truncate" style={{ color: '#1B3B1A' }}>
                {user.pseudo}
              </p>
              {location && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <svg width="10" height="12" viewBox="0 0 24 24" fill="#9ca3af">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" />
                  </svg>
                  {location}
                </p>
              )}
            </div>

            {/* Action button */}
            <ActionButton
              mode={mode}
              status={localStatus}
              iRequested={iRequested}
              isPending={isPending}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          </div>

          {/* Progress bar + % */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Number(user.collection_pct))}%`, background: '#00C241' }}
              />
            </div>
            <span className="text-xs font-black text-gray-500 flex-shrink-0">{pct}%</span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M7 16H3l4-4M3 16h14a4 4 0 0 0 0-8h-1M17 8h4l-4 4M21 8H7a4 4 0 0 0 0 8h1"
                  stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {user.swap_count} échange{user.swap_count !== 1 ? 's' : ''}
            </span>
            {user.badge_count > 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#9ca3af">
                  <path d="M12 2L9.19 8.62 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2Z" />
                </svg>
                {user.badge_count} badge{user.badge_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActionButton({
  mode, status, iRequested, isPending, onAdd, onRemove
}: {
  mode: 'leaderboard' | 'friends'
  status: string
  iRequested: boolean
  isPending: boolean
  onAdd: () => void
  onRemove: () => void
}) {
  if (mode === 'friends' || status === 'accepted') {
    return (
      <button
        onClick={onRemove}
        disabled={isPending}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl
          text-xs font-black border transition-all active:scale-95 disabled:opacity-50"
        style={{ borderColor: '#e5e7eb', color: '#6b7280', background: 'white' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          <line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Retirer
      </button>
    )
  }

  if (status === 'pending' && iRequested) {
    return (
      <span className="flex-shrink-0 text-xs font-bold text-gray-400 px-2">
        Demande envoyée
      </span>
    )
  }

  return (
    <button
      onClick={onAdd}
      disabled={isPending}
      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl
        text-xs font-black border transition-all active:scale-95 disabled:opacity-50"
      style={{ borderColor: '#e5e7eb', color: '#1B3B1A', background: 'white' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
        <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="17" y1="11" x2="23" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      Ajouter
    </button>
  )
}

// ── RequestCard ───────────────────────────────────────────────
function RequestCard({ request }: { request: FriendRequest }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const initial = request.pseudo[0].toUpperCase()
  const location = [request.city, request.country].filter(Boolean).join(', ')

  const handleAccept = () => {
    startTransition(async () => {
      await acceptFriendRequest(request.id)
      setDone(true)
    })
  }

  const handleDecline = () => {
    startTransition(async () => {
      await declineFriendRequest(request.id)
      setDone(true)
    })
  }

  if (done) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center
            font-display text-xl font-black flex-shrink-0 border-2"
          style={{ background: 'white', borderColor: '#00C241', color: '#00C241' }}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm" style={{ color: '#1B3B1A' }}>{request.pseudo}</p>
          {location && <p className="text-xs text-gray-400">{location}</p>}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${request.collection_pct}%`, background: '#00C241' }}
              />
            </div>
            <span className="text-xs font-black text-gray-500">{request.collection_pct}%</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleAccept}
          disabled={isPending}
          className="flex-1 py-2.5 rounded-xl font-black text-sm
            transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: '#00C241', color: 'white' }}
        >
          Accepter
        </button>
        <button
          onClick={handleDecline}
          disabled={isPending}
          className="flex-1 py-2.5 rounded-xl font-black text-sm
            border transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ borderColor: '#e5e7eb', color: '#6b7280', background: 'white' }}
        >
          Refuser
        </button>
      </div>
    </div>
  )
}

function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-4xl mb-3">{emoji}</p>
      <p className="text-sm text-gray-400 font-medium max-w-xs">{text}</p>
    </div>
  )
}
