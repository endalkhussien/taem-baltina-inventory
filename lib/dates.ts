/** Local calendar date as YYYY-MM-DD (not UTC). */
export function toLocalDateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayLocalKey() {
  return toLocalDateKey(new Date())
}

/** Parse YYYY-MM-DD as local midnight; invalid input returns null. */
export function parseLocalDate(value?: string): Date | null {
  if (!value) return new Date()

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) {
    const fallback = new Date(value)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)

  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null
  }

  return date
}

/** Monday 00:00:00 local time for the week containing `reference`. */
export function calendarWeekStart(reference: Date = new Date()) {
  const start = new Date(reference)
  start.setHours(0, 0, 0, 0)
  const daysFromMonday = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - daysFromMonday)
  return start
}

/** Sunday 23:59:59.999 local time for the week starting on `weekStart`. */
export function calendarWeekEnd(weekStart: Date) {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

export function isInCalendarWeek(value: string | Date, reference: Date = new Date()) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return false

  const start = calendarWeekStart(reference)
  const end = calendarWeekEnd(start)
  return date >= start && date <= end
}

export function formatWeekRange(weekStart: Date) {
  const end = calendarWeekEnd(weekStart)
  const sameMonth = weekStart.getMonth() === end.getMonth()
  const startLabel = weekStart.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
  const endLabel = end.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: sameMonth ? undefined : 'short',
    year: weekStart.getFullYear() === end.getFullYear() ? undefined : 'numeric'
  })
  return `${startLabel} – ${endLabel}`
}

export function weekKeyForDate(value: string | Date) {
  return toLocalDateKey(calendarWeekStart(typeof value === 'string' ? new Date(value) : value))
}
