interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function AuthInput({ label, error, id, ...props }: AuthInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-gray-700">
        {label}
      </label>
      <input
        id={id}
        className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm font-medium text-gray-900
          placeholder:text-gray-400 outline-none transition-colors
          focus:border-[#00C241] focus:bg-white
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}
