/** Ethiopian calendar months (1-indexed, including Pagumen) */
export const ETHIOPIAN_MONTHS = [
  'Meskerem',
  'Tikimt',
  'Hidar',
  'Tahsas',
  'Tir',
  'Yekatit',
  'Megabit',
  'Miazia',
  'Ginbot',
  'Sene',
  'Hamle',
  'Nehase',
  'Pagumen',
] as const

export type EthiopianDate = {
  year: number
  /** 1–13 (13 = Pagumen) */
  month: number
  day: number
}

/** Gregorian date (Y/M/D) → Julian Day Number (proleptic Gregorian). */
function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  )
}

/** Julian Day Number → Ethiopian calendar date. */
function jdnToEthiopian(jdn: number): EthiopianDate {
  const r = (jdn - 1723856) % 1461
  const n = (r % 365) + 365 * Math.floor(r / 1460)
  const year =
    4 * Math.floor((jdn - 1723856) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460)
  const month = Math.floor(n / 30) + 1
  const day = (n % 30) + 1
  return { year, month, day }
}

/** Parse API timestamps safely (date-only for calendar buckets). */
export function parseBusinessDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input
  }
  const d = new Date(input)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Convert a Gregorian Date to Ethiopian calendar (local date components). */
export function toEthiopian(date: Date): EthiopianDate {
  return jdnToEthiopian(
    gregorianToJdn(date.getFullYear(), date.getMonth() + 1, date.getDate())
  )
}

export function ethiopianMonthName(month: number): string {
  if (month < 1 || month > 13) return `Month ${month}`
  return ETHIOPIAN_MONTHS[month - 1]
}

/** Sort key: year * 100 + month (stable chronological order). */
export function ethiopianPeriodKey(eth: EthiopianDate): string {
  return `${eth.year}-${String(eth.month).padStart(2, '0')}`
}

export function formatEthiopianPeriod(eth: EthiopianDate): string {
  return `${ethiopianMonthName(eth.month)} ${eth.year}`
}

export function formatEthiopianDate(date: Date): string {
  const eth = toEthiopian(date)
  return `${eth.day} ${ethiopianMonthName(eth.month)} ${eth.year}`
}

export function ethiopianFromInput(input: string | Date | null | undefined): EthiopianDate | null {
  const d = parseBusinessDate(input)
  return d ? toEthiopian(d) : null
}
