'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { updateAvatar } from '@/lib/profile/actions'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

interface Props {
  userId: string
  avatarUrl: string | null
  pseudo: string
  /** Compact = just the tappable avatar (no text button), for the collapsed header */
  compact?: boolean
}

export function AvatarUploader({ userId, avatarUrl, pseudo, compact = false }: Props) {
  const t = useTranslations('profile')
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(avatarUrl)
  const [error, setError] = useState<string | null>(null)

  const initial = pseudo?.[0]?.toUpperCase() ?? '?'

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('Choisis une image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Image trop lourde (max 5 Mo).')
      return
    }

    setUploading(true)
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    try {
      const supabase = createClient()
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' })
      if (upErr) throw upErr

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const res = await updateAvatar(data.publicUrl)
      if (res.error) throw new Error(res.error)

      setPreview(data.publicUrl)
      router.refresh()
    } catch {
      setError('Échec de l’envoi. Réessaie.')
      setPreview(avatarUrl)
    } finally {
      setUploading(false)
      URL.revokeObjectURL(localUrl)
    }
  }

  const size = compact ? 56 : 72

  return (
    <div className={compact ? 'flex flex-col items-center gap-1' : 'flex items-center gap-4'}>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="relative flex-shrink-0 rounded-full overflow-hidden active:scale-[0.97] transition-transform"
        style={{ width: size, height: size, border: '2px solid #00C241' }}
        aria-label={t('change_photo')}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={pseudo} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-display text-2xl font-black"
            style={{ background: '#f3f4f6', color: '#00C241' }}
          >
            {initial}
          </div>
        )}
        {/* Camera badge */}
        <span
          className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: '#00C241', border: '2px solid white' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z"
              stroke="white" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="3.5" stroke="white" strokeWidth="2" />
          </svg>
        </span>
      </button>

      {!compact && (
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-sm font-black px-3 py-1.5 rounded-full transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: '#f3f4f6', color: '#374151' }}
          >
            {uploading ? t('photo_uploading') : avatarUrl || preview ? t('change_photo') : t('add_photo')}
          </button>
          {error && <p className="text-xs font-medium text-red-500 mt-1.5">{error}</p>}
        </div>
      )}

      {compact && error && <p className="text-[10px] font-medium text-red-500 text-center">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
      />
    </div>
  )
}
