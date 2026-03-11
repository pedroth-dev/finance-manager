import { useState, useRef, useEffect, useCallback } from 'react'

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: 'Finanças', emojis: ['💰', '💵', '💳', '🏦', '💸', '🪙', '📈', '📉', '🧾', '💎'] },
  { label: 'Alimentação', emojis: ['🍔', '🛒', '☕', '🍕', '🍎', '🥗', '🍺', '🧁', '🍽️', '🥤'] },
  { label: 'Transporte', emojis: ['🚗', '🚌', '✈️', '🚲', '⛽', '🚕', '🏍️', '🚇', '🛻', '🚢'] },
  { label: 'Casa', emojis: ['🏠', '🔑', '💡', '🛋️', '🧹', '🪴', '🛁', '🔧', '📦', '🏗️'] },
  { label: 'Saúde', emojis: ['💊', '🏥', '🏋️', '🧘', '❤️', '🩺', '🦷', '👓', '💆', '🧴'] },
  { label: 'Educação', emojis: ['📚', '💻', '🎓', '✏️', '📱', '🖨️', '📊', '🗂️', '📝', '🔬'] },
  { label: 'Lazer', emojis: ['🎬', '🎮', '🎵', '⚽', '🎨', '📷', '🧳', '🎭', '🎸', '🏖️'] },
  { label: 'Outros', emojis: ['🐶', '🐱', '👶', '🎁', '🌟', '🔔', '⭐', '🏆', '🎯', '❓'] },
]

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
}

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

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

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, close])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={toggle}
        onKeyDown={onKeyDown}
        className="w-11 h-11 rounded-[10px] border border-[var(--border)] bg-[var(--surface3)] flex items-center justify-center text-xl hover:border-[var(--border2)] cursor-pointer"
      >
        {value || '❓'}
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-2 w-[260px] max-h-[300px] overflow-y-auto bg-[var(--surface)] border border-[var(--border2)] rounded-xl shadow-lg p-2.5">
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label} className="mb-2 last:mb-0">
              <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-[var(--text3)] mb-1 px-1">
                {group.label}
              </p>
              <div className="grid grid-cols-5 gap-px">
                {group.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => { onChange(emoji); close() }}
                    className="w-full aspect-square rounded-lg flex items-center justify-center text-lg cursor-pointer hover:bg-[var(--surface3)]"
                    style={value === emoji ? { background: 'var(--green)', opacity: 0.15 } : undefined}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
