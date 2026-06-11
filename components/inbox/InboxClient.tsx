'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { SwapRow } from '@/app/[locale]/(app)/inbox/page'

type Tab = 'received' | 'sent' | 'ongoing' | 'archived'

const ACTIVE_STATUSES = ['pending', 'accepted', 'initiator_sent', 'receiver_sent']
const ARCHIVED_STATUSES = ['completed', 'refused', 'cancelled']

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  pending:          { label: 'EN ATTENTE',  bg: '#AAFF00', color: '#1B3B1A' },
  accepted:         { label: 'ACCEPTÉ',     bg: '#d1fae5', color: '#065f46' },
  initiator_sent:   { label: 'EN TRANSIT',  bg: '#dbeafe', color: '#1e40af' },
  receiver_sent:    { label: 'EN TRANSIT',  bg: '#dbeafe', color: '#1e40af' },
  completed:        { label: 'TERMINÉ',     bg: '#f0fdf4', color: '#166534' },
  refused:          { label: 'REFUSÉ',      bg: '#fee2e2', color: '#991b1b' },
  cancelled:        { label: 'ANNULÉ',      bg: '#f3f4f6', color: '#6b7280' },
}

interface Props {
  swaps: SwapRow[]
  currentUserId: string
  locale: string
  pendingCount: number
}

export function InboxClient({ swaps, currentUserId, locale, pendingCount }: Props) {
  const t = useTranslations('inbox')
  const [tab, setTab] = useState<Tab>('received')

  const received = swaps.filter(
    (s) => s.receiver_id === currentUserId && s.status === 'pending'
  )
  const sent = swaps.filter(
    (s) => s.initiator_id === currentUserId && s.status === 'pending'
  )
  const ongoing = swaps.filter((s) => ACTIVE_STATUSES.includes(s.status) && s.status !== 'pending')
  const archived = swaps.filter((s) => ARCHIVED_STATUSES.includes(s.status))

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'received', label: t('tab_received'), count: received.length || undefined },
    { key: 'sent',     label: t('tab_sent') },
    { key: 'ongoing',  label: t('tab_ongoing'), count: ongoing.length || undefined },
    { key: 'archived', label: t('tab_archived'), count: archived.length || undefined },
  ]

  const currentSwaps =
    tab === 'received' ? received :
    tab === 'sent'     ? sent :
    tab === 'ongoing'  ? ongoing :
    archived

  return (
    <div className="flex flex-col flex-1">
      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-100 overflow-x-auto">
        {tabs.map(({ key, label, count }) => {
          const active = tab === key
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-shrink-0 flex items-center gap-1 px-4 py-2 rounded-full
                text-sm font-semibold transition-all whitespace-nowrap border-2"
              style={
                active
                  ? { borderColor: '#00C241', color: '#00C241', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }
                  : { borderColor: 'transparent', color: '#9ca3af', background: '#f3f4f6' }
              }
            >
              {label}
              {count != null && (
                <span className="font-black">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Swap list ── */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {currentSwaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm text-gray-400 font-medium">{t(`empty_${tab}`)}</p>
          </div>
        ) : (
          currentSwaps.map((swap) => (
            <SwapCard
              key={swap.id}
              swap={swap}
              currentUserId={currentUserId}
              locale={locale}
            />
          ))
        )}
      </div>
    </div>
  )
}

function SwapCard({
  swap,
  currentUserId,
  locale,
}: {
  swap: SwapRow
  currentUserId: string
  locale: string
}) {
  const isInitiator = swap.initiator_id === currentUserId
  const other = isInitiator ? swap.receiver : swap.initiator
  const pseudo = other?.pseudo ?? '?'
  const location = [other?.city, other?.country].filter(Boolean).join(', ')
  const initial = pseudo[0].toUpperCase()
  const statusCfg = STATUS_LABELS[swap.status] ?? STATUS_LABELS.pending
  const isMailMode = true // TODO: swap.swap_mode

  // Relative time
  const relTime = formatRelTime(swap.updated_at)

  return (
    <Link
      href={`/${locale}/inbox/${swap.id}`}
      className="block bg-white rounded-2xl p-4 transition-all active:scale-[0.99]"
      style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center
            font-display text-xl font-black flex-shrink-0 border-2"
          style={{ background: 'white', borderColor: '#00C241', color: '#00C241' }}
        >
          {initial}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-black text-sm" style={{ color: '#1B3B1A' }}>
                {pseudo}
                {location && (
                  <span className="font-medium text-gray-400"> — {location}</span>
                )}
              </p>
              {(swap.i_give_count != null || swap.i_get_count != null) && (
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  tu donnes <strong>{swap.i_give_count ?? '?'}</strong>
                  {' · '}
                  tu reçois <strong>{swap.i_get_count ?? '?'}</strong>
                </p>
              )}
            </div>
            {/* Mail / in-person icon */}
            <svg
              className="flex-shrink-0 text-gray-300 mt-0.5"
              width="18" height="18" viewBox="0 0 24 24" fill="none"
            >
              {isMailMode ? (
                <>
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="m2 7 10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="15" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M3 21v-2a6 6 0 0 1 12 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </>
              )}
            </svg>
          </div>

          {/* Status badge + time */}
          <div className="flex items-center justify-between mt-2">
            <span
              className="text-[11px] font-black px-2.5 py-1 rounded-lg"
              style={{ background: statusCfg.bg, color: statusCfg.color }}
            >
              {statusCfg.label}
            </span>
            <span className="text-xs text-gray-400">{relTime}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function formatRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `il y a ${hrs} h`
  const days = Math.floor(hrs / 24)
  return `il y a ${days} j`
}
