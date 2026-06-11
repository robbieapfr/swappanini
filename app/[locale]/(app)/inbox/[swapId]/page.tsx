import { setRequestLocale, getTranslations } from 'next-intl/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { locales, type Locale } from '@/i18n'
import { createClient } from '@/lib/supabase/server'
import { SwapThread } from '@/components/inbox/SwapThread'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function SwapPage({
  params,
}: {
  params: Promise<{ locale: string; swapId: string }>
}) {
  const { locale, swapId } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('swap')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  // Fetch swap with participants
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: swap } = await (supabase.from('swaps') as any)
    .select(`
      id,
      status,
      created_at,
      updated_at,
      initiator_id,
      receiver_id,
      initiator:users!swaps_initiator_id_fkey(pseudo, country),
      receiver:users!swaps_receiver_id_fkey(pseudo, country)
    `)
    .eq('id', swapId)
    .single() as {
    data: {
      id: string
      status: string
      created_at: string
      initiator_id: string
      receiver_id: string
      initiator: { pseudo: string; country: string } | null
      receiver: { pseudo: string; country: string } | null
    } | null
  }

  if (!swap) notFound()

  // Must be a participant
  if (swap.initiator_id !== user.id && swap.receiver_id !== user.id) {
    redirect(`/${locale}/inbox`)
  }

  // Fetch messages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: messages } = await (supabase.from('swap_messages') as any)
    .select('id, sender_id, content, created_at')
    .eq('swap_id', swapId)
    .order('created_at', { ascending: true }) as {
    data: {
      id: string
      sender_id: string
      content: string
      created_at: string
    }[] | null
  }

  // Fetch the cards being exchanged
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: itemsRaw } = await (supabase.from('swap_items') as any)
    .select('sticker_id, from_user_id, quantity, stickers(id, number, name, code, country)')
    .eq('swap_id', swapId) as {
    data: {
      sticker_id: number
      from_user_id: string
      quantity: number
      stickers: { id: number; number: number; name: string | null; code: string; country: string } | null
    }[] | null
  }

  const isInitiator = swap.initiator_id === user.id
  const otherUser = isInitiator ? swap.receiver : swap.initiator

  // Split into what I give (from me) and what I receive (from the other party).
  const items = (itemsRaw ?? []).filter((i) => i.stickers)
  const iGive = items
    .filter((i) => i.from_user_id === user.id)
    .map((i) => ({ ...i.stickers!, quantity: i.quantity }))
  const iReceive = items
    .filter((i) => i.from_user_id !== user.id)
    .map((i) => ({ ...i.stickers!, quantity: i.quantity }))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-5 pb-4" style={{ background: '#00C241' }}>
        <Link
          href={`/${locale}/inbox`}
          className="text-white/80 hover:text-white text-lg font-black w-8 flex-shrink-0"
        >
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg text-white truncate">
            {otherUser?.pseudo ?? '?'}
          </p>
          <StatusBadge status={swap.status} t={t} />
        </div>
      </div>

      {/* ── Thread ── */}
      <SwapThread
        swapId={swapId}
        swap={swap}
        messages={messages ?? []}
        currentUserId={user.id}
        locale={locale}
        isInitiator={isInitiator}
        iGive={iGive}
        iReceive={iReceive}
      />
    </div>
  )
}

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const key = `status_${status}` as Parameters<typeof t>[0]
  const colors: Record<string, string> = {
    pending: 'text-amber-300',
    accepted: 'text-green-300',
    initiator_sent: 'text-blue-300',
    receiver_sent: 'text-blue-300',
    completed: 'text-lime-300',
    refused: 'text-red-300',
    cancelled: 'text-gray-400',
  }
  return (
    <p className={`text-xs font-bold ${colors[status] ?? 'text-white/60'}`}>
      {t(key)}
    </p>
  )
}
