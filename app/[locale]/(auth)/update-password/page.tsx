'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function UpdatePasswordPage({
  params,
}: {
  params: { locale: string }
}) {
  const locale = params.locale ?? 'fr'
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionReady(!!session)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/${locale}/home`)
  }

  if (sessionReady === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-gray-400">Chargement…</p>
      </div>
    )
  }

  if (sessionReady === false) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl text-gray-900 mb-2">Lien expiré</h1>
        <p className="text-sm text-gray-400">
          Ce lien de réinitialisation a expiré ou a déjà été utilisé.
        </p>
        <Link
          href={`/${locale}/forgot-password`}
          className="w-full py-3.5 rounded-xl font-black text-sm text-center text-white transition-all active:scale-[0.98]"
          style={{ background: '#00C241' }}
        >
          Demander un nouveau lien
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl text-gray-900 mb-2">
        Nouveau mot de passe
      </h1>
      <p className="text-sm text-gray-400 mb-2">
        Choisis un nouveau mot de passe pour ton compte.
      </p>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-gray-500">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
              focus:outline-none focus:border-green-400 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-gray-500">
            Confirmer
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
              focus:outline-none focus:border-green-400 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-black text-sm text-white
            transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
          style={{ background: '#00C241' }}
        >
          {loading ? 'Mise à jour…' : 'Mettre à jour'}
        </button>
      </form>
    </div>
  )
}
