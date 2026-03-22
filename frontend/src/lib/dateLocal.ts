const YMD_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/

/** Data local a partir de YYYY-MM-DD (sem deslocamento UTC do `new Date(iso)`). */
export function parseDateOnlyLocal(iso: string): Date | null {
  const m = YMD_PREFIX.exec(iso)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  return new Date(y, mo, d)
}

export function dateToYMD(d: Date): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

export function localTodayYMD(): string {
  return dateToYMD(new Date())
}

export function formatDateOnlyPtBR(
  iso: string,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' },
): string {
  const dt = parseDateOnlyLocal(iso)
  if (!dt) return iso
  return dt.toLocaleDateString('pt-BR', options)
}
