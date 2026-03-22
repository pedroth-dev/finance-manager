import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const inputClassName =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 pr-10 text-[13px] text-foreground placeholder:text-[var(--text3)] focus:border-[var(--green)] focus:outline-none transition-colors'

type PasswordFieldProps = {
  id: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  minLength?: number
  placeholder?: string
  autoComplete?: string
}

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  required,
  minLength,
  placeholder,
  autoComplete,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11.5px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={inputClassName}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={showPassword}
          className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-[var(--text3)] hover:text-foreground rounded-r-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
        >
          {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
        </button>
      </div>
    </div>
  )
}
