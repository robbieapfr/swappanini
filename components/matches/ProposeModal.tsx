'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { proposeSwap } from '@/lib/swaps/actions'

interface ProposeModalProps {
  receiverId: string
  receiverPseudo: string
  locale: string
  onClose: () => void
}

export function ProposeModal({
  receiverId,
  receiverPseudo,
  locale,
  onClose,
}: ProposeModalProps) {
  const t = useTranslations('swap')
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await proposeSwap(receiverId, message || undefined)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.swapId) {
        router.push(`/${locale}/inbox/${result.swapId}`)
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-6 animate-slide-up"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        {/* Handle */}
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <h2 className="font-display text-2xl mb-1" style={{ color: '#00C241' }}>
          {t('propose_title')}
        </h2>
        <p className="text-sm text-gray-400 font-medium mb-5">
          avec <strong className="text-gray-700">{receiverPseudo}</strong>
        </p>

        {/* Optional message */}
        <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
          Message (optionnel)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('message_placeholder')}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium
            outline-none focus:border-[#00C241] transition-colors resize-none mb-5"
        />

        {error && (
          <p className="text-red-500 text-sm font-medium mb-4">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-black text-sm
              bg-gray-100 text-gray-600 transition-all active:scale-[0.98]"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 py-3 rounded-xl font-black text-sm
              transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: '#00C241', color: 'white' }}
          >
            {isPending ? '…' : t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
