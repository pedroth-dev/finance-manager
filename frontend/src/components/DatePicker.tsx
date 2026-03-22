import { useState, useRef, useEffect, useCallback } from 'react'

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DAY_NAMES = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function formatDisplay(dateStr: string) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return ''
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

/** dd/mm/aaaa → YYYY-MM-DD ou null se inválido */
function parseBrDate(s: string): string | null {
  const t = s.trim()
  const match = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  const d = parseInt(match[1], 10)
  const mo = parseInt(match[2], 10)
  const y = parseInt(match[3], 10)
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(y, mo - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function DatePicker({ value, onChange, className = '' }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [textDraft, setTextDraft] = useState(() => formatDisplay(value))
  const [invalid, setInvalid] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTextDraft(formatDisplay(value))
    setInvalid(false)
  }, [value])

  const parsed = value
    ? value.split('-').map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()]
  const [viewYear, setViewYear] = useState(parsed[0])
  const [viewMonth, setViewMonth] = useState(parsed[1] - 1)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, close])

  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number)
      setViewYear(y)
      setViewMonth(m - 1)
    }
  }, [value])

  function commitTextInput() {
    const trimmed = textDraft.trim()
    if (trimmed === '') {
      setTextDraft(value ? formatDisplay(value) : '')
      setInvalid(false)
      return
    }
    const iso = parseBrDate(trimmed)
    if (iso) {
      onChange(iso)
      setInvalid(false)
    } else {
      setTextDraft(value ? formatDisplay(value) : '')
      setInvalid(true)
    }
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else setViewMonth((m) => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else setViewMonth((m) => m + 1)
  }

  function selectDay(day: number) {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${viewYear}-${m}-${d}`)
    close()
  }

  function selectToday() {
    const now = new Date()
    onChange(now.toISOString().slice(0, 10))
    close()
  }

  const selectedYear = parsed[0]
  const selectedMonth = parsed[1] - 1
  const selectedDay = parsed[2]

  const totalDays = daysInMonth(viewYear, viewMonth)
  const startDay = firstDayOfMonth(viewYear, viewMonth)
  const prevDays = daysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1)

  const cells: { day: number; current: boolean }[] = []
  for (let i = startDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, current: false })
  for (let i = 1; i <= totalDays; i++) cells.push({ day: i, current: true })
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) cells.push({ day: i, current: false })
  }

  const openCalendar = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setOpen((o) => !o)
  }, [])

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div className="flex gap-2 items-stretch">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/aaaa"
          value={textDraft}
          aria-invalid={invalid}
          onChange={(e) => {
            setInvalid(false)
            setTextDraft(e.target.value)
          }}
          onBlur={commitTextInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              ;(e.target as HTMLInputElement).blur()
            }
          }}
          className={`flex-1 min-w-0 rounded-lg border bg-[var(--surface3)] px-3 py-2.5 text-[13px] text-foreground placeholder:text-[var(--text3)] focus:outline-none transition-colors duration-75 ${
            invalid ? 'border-[var(--red)] focus:border-[var(--red)]' : 'border-[var(--border)] focus:border-[var(--green)]'
          }`}
        />
        <button
          type="button"
          aria-label="Abrir calendário"
          title="Calendário"
          onMouseDown={openCalendar}
          className="shrink-0 w-11 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface3)] text-[var(--text3)] hover:border-[var(--border2)] hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] transition-colors duration-75"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1.5 w-[270px] bg-[var(--surface)] border border-[var(--border2)] rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text3)] hover:bg-[var(--surface2)] hover:text-foreground cursor-pointer transition-colors">
              ‹
            </button>
            <span className="text-[13px] font-medium text-foreground">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text3)] hover:bg-[var(--surface2)] hover:text-foreground cursor-pointer transition-colors">
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-[var(--text3)] py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              const isSelected =
                cell.current &&
                cell.day === selectedDay &&
                viewMonth === selectedMonth &&
                viewYear === selectedYear
              const isToday =
                cell.current &&
                cell.day === new Date().getDate() &&
                viewMonth === new Date().getMonth() &&
                viewYear === new Date().getFullYear()

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => cell.current && selectDay(cell.day)}
                  disabled={!cell.current}
                  className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs cursor-pointer transition-colors
                    ${!cell.current ? 'text-[var(--text3)]/40 cursor-default' : ''}
                    ${cell.current && !isSelected ? 'text-foreground hover:bg-[var(--surface2)]' : ''}
                    ${isSelected ? 'bg-[var(--green)] text-black font-semibold' : ''}
                    ${isToday && !isSelected ? 'ring-1 ring-[var(--green)]/40 font-medium' : ''}
                  `}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-[var(--border)] flex justify-center">
            <button
              type="button"
              onClick={selectToday}
              className="text-[12px] text-[var(--green)] font-medium cursor-pointer hover:underline"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
