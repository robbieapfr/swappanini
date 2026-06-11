'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { sendMessage, transitionSwap } from '@/lib/swaps/actions'
import { getDisplayCode } from '@/lib/flags'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

interface SwapCard {
  id: number
  number: number
  name: string | null
  code: string
  country: string
  quantity: number
}

interface SwapData {
  id: string
  status: string
  initiator_id: string
  receiver_id: string
  initiator: { pseudo: string; country: string } | null
  receiver: { pseudo: string; country: string } | null
}

interface Props {
  swapId: string
  swap: SwapData
  messages: Message[]
  currentUserId: string
  locale: string
  isInitiator: boolean
  iGive: SwapCard[]
  iReceive: SwapCard[]
}

export function SwapThread({
  swapId,
  swap,
  messages: initialMessages,
  currentUserId,
  isInitiator,
  iGive,
  iReceive,
}: Props) {
  const t = useTranslations('swap')
  const [messages, setMessages] = useState(initialMessages)
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!body.trim() || isPending) return
    const msgBody = body.trim()
    setBody('')

    // Optimistic update
    setMessages((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        sender_id: currentUserId,
        content: msgBody,
        created_at: new Date().toISOString(),
      },
    ])

    startTransition(async () => {
      await sendMessage(swapId, msgBody)
    })
  }

  const handleAction = (action: Parameters<typeof transitionSwap>[1]) => {
    startTransition(async () => {
      await transitionSwap(swapId, action)
    })
  }

  const isActive = !['completed', 'refused', 'cancelled'].includes(swap.status)

  const giveTotal = iGive.reduce((n, c) => n + c.quantity, 0)
  const receiveTotal = iReceive.reduce((n, c) => n + c.quantity, 0)

  return (
    <div className="flex flex-col flex-1">
      {/* ── Exchanged cards summary ── */}
      {(iGive.length > 0 || iReceive.length > 0) && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-3">
          <SwapSide title={`${t('gives_label')} · ${giveTotal}`} cards={iGive} tint="#fee2e2" textColor="#991b1b" />
          <SwapSide title={`${t('gets_label')} · ${receiveTotal}`} cards={iReceive} tint="#dcfce7" textColor="#166534" />
        </div>
      )}

      {/* ── Action bar ── */}
      {isActive && (
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="flex gap-2 flex-wrap">
            {/* Receiver actions */}
            {!isInitiator && swap.status === 'pending' && (
              <>
                <ActionButton
                  label={t('accept')}
                  style={{ background: '#00C241', color: 'white' }}
                  onClick={() => handleAction('accept')}
                  disabled={isPending}
                />
                <ActionButton
                  label={t('refuse')}
                  style={{ background: '#fee2e2', color: '#991b1b' }}
                  onClick={() => handleAction('refuse')}
                  disabled={isPending}
                />
              </>
            )}

            {/* Mark sent */}
            {swap.status === 'accepted' && (
              <ActionButton
                label={t('mark_sent')}
                style={{ background: '#dbeafe', color: '#1e40af' }}
                onClick={() => handleAction('mark_sent')}
                disabled={isPending}
              />
            )}

            {/* Initiator sent → receiver clicks */}
            {swap.status === 'initiator_sent' && !isInitiator && (
              <ActionButton
                label={t('mark_sent')}
                style={{ background: '#dbeafe', color: '#1e40af' }}
                onClick={() => handleAction('mark_sent')}
                disabled={isPending}
              />
            )}

            {/* Receiver sent → initiator clicks */}
            {swap.status === 'receiver_sent' && isInitiator && (
              <ActionButton
                label={t('mark_sent')}
                style={{ background: '#dbeafe', color: '#1e40af' }}
                onClick={() => handleAction('mark_sent')}
                disabled={isPending}
              />
            )}

            {/* Cancel always available when active */}
            <ActionButton
              label={t('cancel')}
              style={{ background: '#f3f4f6', color: '#6b7280' }}
              onClick={() => handleAction('cancel')}
              disabled={isPending}
            />
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-400 font-medium py-8">
            Aucun message — commence la conversation !
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-medium"
                style={
                  isMe
                    ? { background: '#00C241', color: 'white' }
                    : { background: 'white', color: '#111827', border: '1px solid #e5e7eb' }
                }
              >
                {msg.content}
                <p className="text-[10px] mt-1 opacity-50">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      {isActive && (
        <div
          className="bg-white border-t border-gray-100 px-4 py-3 flex gap-3 items-end"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <textarea
            ref={inputRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={t('message_placeholder')}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200
              px-3 py-2.5 text-sm font-medium outline-none
              focus:border-[#1B3B1A] transition-colors"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!body.trim() || isPending}
            className="w-10 h-10 rounded-xl flex items-center justify-center
              font-black text-sm transition-all active:scale-95 flex-shrink-0
              disabled:opacity-40"
            style={{ background: '#00C241', color: 'white' }}
          >
            ↑
          </button>
        </div>
      )}
    </div>
  )
}

function SwapSide({
  title,
  cards,
  tint,
  textColor,
}: {
  title: string
  cards: SwapCard[]
  tint: string
  textColor: string
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
        {title}
      </p>
      {cards.length === 0 ? (
        <p className="text-xs text-gray-300 font-medium">—</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {cards.map((c) => (
            <span
              key={c.id}
              className="text-[11px] font-black px-2 py-1 rounded-lg"
              style={{ background: tint, color: textColor }}
            >
              {getDisplayCode(c.country, c.code)}·{c.number}
              {c.quantity > 1 && <span className="ml-1 opacity-70">×{c.quantity}</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function ActionButton({
  label,
  style,
  onClick,
  disabled,
}: {
  label: string
  style: React.CSSProperties
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 rounded-xl text-xs font-black
        transition-all active:scale-[0.97] disabled:opacity-50"
      style={style}
    >
      {label}
    </button>
  )
}
