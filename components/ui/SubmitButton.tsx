'use client'

import { useFormStatus } from 'react-dom'

interface SubmitButtonProps {
  label: string
  loadingLabel?: string
}

export function SubmitButton({ label, loadingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-xl font-black text-sm tracking-wide transition-all
        disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
      style={{
        background: pending ? '#88CC00' : '#AAFF00',
        color: '#1B3B1A',
      }}
    >
      {pending ? (loadingLabel ?? '…') : label}
    </button>
  )
}
