import { useState, useRef, useEffect, useCallback } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
}

export default function CustomSelect({ value, onChange, options, placeholder = 'Selecione...', className = '' }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, close])

  const selected = options.find((o) => o.value === value)

  const toggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setOpen((o) => !o)
  }, [])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen((o) => !o)
    }
  }, [])

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onMouseDown={toggle}
        onKeyDown={onKeyDown}
        className="w-full flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface3)] px-3 py-2.5 text-[13px] text-left cursor-pointer hover:border-[var(--border2)] focus:border-[var(--green)] outline-none transition-colors duration-75"
      >
        <span className={selected ? 'text-foreground' : 'text-[var(--text3)]'}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 16 16" fill="var(--text3)"
          className={`shrink-0 ml-2 transition-transform duration-75 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M8 11L3 6h10l-5 5z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-[var(--surface)] border border-[var(--border2)] rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-[200px] overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); close() }}
                className={`w-full text-left px-3 py-2 text-[13px] cursor-pointer transition-colors ${
                  value === opt.value
                    ? 'bg-[var(--green)]/10 text-[var(--green)] font-medium'
                    : 'text-foreground hover:bg-[var(--surface2)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
