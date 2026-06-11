'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { proposeSwap } from '@/lib/swaps/actions'
import { getDisplayCode } from '@/lib/flags'
import type { SwapItem, MatchReceiver } from '@/lib/matching/queries'

const MAX_CHARS = 280

interface Props {
  receiverId: string
  receiver: MatchReceiver
  initialGive: SwapItem[]
  initialReceive: SwapItem[]
  locale: string
}

export function ProposePageClient({
  receiverId,
  receiver,
  initialGive,
  initialReceive,
  locale,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [giveList, setGiveList] = useState<SwapItem[]>(initialGive)
  const [receiveList, setReceiveList] = useState<SwapItem[]>(initialReceive)
  const [removedGive, setRemovedGive] = useState<SwapItem[]>([])
  const [removedReceive, setRemovedReceive] = useState<SwapItem[]>([])
  const [showGivePicker, setShowGivePicker] = useState(false)
  const [showReceivePicker, setShowReceivePicker] = useState(false)
  const [mode, setMode] = useState<'mail' | 'inperson'>('mail')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  // ── Give list handlers ──
  function removeGive(id: number) {
    const item = giveList.find((s) => s.id === id)
    if (item) setRemovedGive((prev) => [...prev, item])
    setGiveList((prev) => prev.filter((s) => s.id !== id))
  }
  function addGive(item: SwapItem) {
    setGiveList((prev) => [...prev, { ...item, selectedQty: 1 }])
    setRemovedGive((prev) => prev.filter((s) => s.id !== item.id))
    setShowGivePicker(false)
  }
  function changeGiveQty(id: number, delta: number) {
    setGiveList((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, selectedQty: Math.max(1, Math.min(s.availableQty, s.selectedQty + delta)) }
          : s
      )
    )
  }

  // ── Receive list handlers ──
  function removeReceive(id: number) {
    const item = receiveList.find((s) => s.id === id)
    if (item) setRemovedReceive((prev) => [...prev, item])
    setReceiveList((prev) => prev.filter((s) => s.id !== id))
  }
  function addReceive(item: SwapItem) {
    setReceiveList((prev) => [...prev, { ...item, selectedQty: 1 }])
    setRemovedReceive((prev) => prev.filter((s) => s.id !== item.id))
    setShowReceivePicker(false)
  }
  function changeReceiveQty(id: number, delta: number) {
    setReceiveList((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, selectedQty: Math.max(1, Math.min(s.availableQty, s.selectedQty + delta)) }
          : s
      )
    )
  }

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await proposeSwap(receiverId, message || undefined, mode)
      if (result.error) {
        setError(result.error)
        return
      }
      router.push(`/${locale}/inbox/${result.swapId}`)
    })
  }

  const codeOf = (s: SwapItem) => getDisplayCode(s.country, s.code)

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-4 border-b border-gray-100">
        <Link
          href={`/${locale}/playground`}
          className="flex items-center gap-1 text-sm font-semibold text-gray-400 mb-3"
        >
          <span>‹</span> Playground
        </Link>
        <h1 className="font-display text-2xl font-black leading-tight" style={{ color: '#00C241' }}>
          Nouvel échange avec {receiver.pseudo}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Nous avons pré-rempli les meilleurs matchs. Ajuste avant d&apos;envoyer.
        </p>
      </div>

      <div className="px-4 pb-32 space-y-6 pt-5">

        {/* ── Tu donnes ── */}
        <section>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">
            Tu donnes
          </h2>
          <div className="space-y-2">
            {giveList.map((s) => (
              <StickerRow
                key={s.id}
                sticker={s}
                codeLabel={codeOf(s)}
                onRemove={() => removeGive(s.id)}
                onQtyChange={(d) => changeGiveQty(s.id, d)}
              />
            ))}
          </div>
          <AddButton onClick={() => setShowGivePicker(true)} disabled={removedGive.length === 0} />
        </section>

        {/* ── Tu reçois ── */}
        <section>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">
            Tu reçois
          </h2>
          <div className="space-y-2">
            {receiveList.map((s) => (
              <StickerRow
                key={s.id}
                sticker={s}
                codeLabel={codeOf(s)}
                onRemove={() => removeReceive(s.id)}
                onQtyChange={(d) => changeReceiveQty(s.id, d)}
              />
            ))}
          </div>
          <AddButton onClick={() => setShowReceivePicker(true)} disabled={removedReceive.length === 0} />
        </section>

        {/* ── Mode d'échange ── */}
        <section>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">
            Mode d&apos;échange
          </h2>
          <div
            className="flex rounded-2xl border border-gray-200 overflow-hidden"
            style={{ background: '#f9fafb' }}
          >
            {(['mail', 'inperson'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-3 text-sm font-black transition-all"
                style={
                  mode === m
                    ? { background: '#00C241', color: 'white', borderRadius: '12px' }
                    : { background: 'transparent', color: '#6b7280' }
                }
              >
                {m === 'mail' ? 'Par courrier' : 'En personne'}
              </button>
            ))}
          </div>
        </section>

        {/* ── Message ── */}
        <section>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">
            Message (optionnel)
          </h2>
          <div
            className="rounded-2xl border border-gray-200 overflow-hidden"
            style={{ background: '#fafafa' }}
          >
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Un petit mot..."
              rows={4}
              className="w-full px-4 pt-3 pb-1 text-sm font-medium bg-transparent
                outline-none resize-none text-gray-700 placeholder-gray-300"
            />
            <div className="text-right px-3 pb-2 text-xs text-gray-400">
              {message.length}/{MAX_CHARS}
            </div>
          </div>
        </section>

        {error && (
          <p className="text-red-500 text-sm font-medium">{error}</p>
        )}
      </div>

      {/* ── Sticky submit ── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white"
        style={{ borderTop: '1px solid #f3f4f6' }}
      >
        <button
          onClick={handleSubmit}
          disabled={isPending || (giveList.length === 0 && receiveList.length === 0)}
          className="w-full py-4 rounded-2xl font-black text-base
            transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: '#00C241', color: 'white' }}
        >
          {isPending ? '…' : 'Envoyer la proposition'}
        </button>
      </div>

      {/* ── Picker : give ── */}
      {showGivePicker && (
        <StickerPicker
          items={removedGive}
          title="Ajouter un sticker à donner"
          onSelect={addGive}
          onClose={() => setShowGivePicker(false)}
        />
      )}

      {/* ── Picker : receive ── */}
      {showReceivePicker && (
        <StickerPicker
          items={removedReceive}
          title="Ajouter un sticker à recevoir"
          onSelect={addReceive}
          onClose={() => setShowReceivePicker(false)}
        />
      )}
    </div>
  )
}

// ── Sticker row ──────────────────────────────────────────────

function StickerRow({
  sticker,
  codeLabel,
  onRemove,
  onQtyChange,
}: {
  sticker: SwapItem
  codeLabel: string
  onRemove: () => void
  onQtyChange: (delta: number) => void
}) {
  return (
    <div
      className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3"
      style={{ border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      {/* Code badge */}
      <span
        className="text-xs font-black w-8 text-center flex-shrink-0 py-1 rounded-lg"
        style={{ background: '#f3f4f6', color: '#374151' }}
      >
        {codeLabel}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: '#1B3B1A' }}>
          {sticker.name ?? `#${sticker.number}`}
        </p>
        <p className="text-xs text-gray-400 font-medium">
          #{sticker.number} · {sticker.country}
        </p>
      </div>

      {/* Qty stepper */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onQtyChange(-1)}
          disabled={sticker.selectedQty <= 1}
          className="w-7 h-7 rounded-full flex items-center justify-center
            text-gray-400 bg-gray-100 text-sm font-black disabled:opacity-30"
        >
          −
        </button>
        <span className="w-4 text-center text-sm font-black" style={{ color: '#1B3B1A' }}>
          {sticker.selectedQty}
        </span>
        <button
          onClick={() => onQtyChange(1)}
          disabled={sticker.selectedQty >= sticker.availableQty}
          className="w-7 h-7 rounded-full flex items-center justify-center
            text-gray-400 bg-gray-100 text-sm font-black disabled:opacity-30"
        >
          +
        </button>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="text-gray-300 hover:text-gray-500 text-lg leading-none flex-shrink-0 ml-1"
      >
        ×
      </button>
    </div>
  )
}

// ── Add button ───────────────────────────────────────────────

function AddButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full mt-2 py-3 rounded-2xl border border-gray-200 text-sm font-black
        text-gray-400 bg-gray-50 flex items-center justify-center gap-2
        transition-opacity disabled:opacity-40"
    >
      <span className="text-base leading-none">+</span> Ajouter un sticker
    </button>
  )
}

// ── Sticker picker sheet ─────────────────────────────────────

function StickerPicker({
  items,
  title,
  onSelect,
  onClose,
}: {
  items: SwapItem[]
  title: string
  onSelect: (item: SwapItem) => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-5"
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
      >
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <h3 className="font-display font-black text-lg mb-4" style={{ color: '#1B3B1A' }}>
          {title}
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <span
                className="text-xs font-black w-8 text-center py-1 rounded-lg flex-shrink-0"
                style={{ background: '#e5e7eb', color: '#374151' }}
              >
                {getDisplayCode(s.country, s.code)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: '#1B3B1A' }}>
                  {s.name ?? `#${s.number}`}
                </p>
                <p className="text-xs text-gray-400">#{s.number} · {s.country}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
