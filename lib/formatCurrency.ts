export function formatEtb(value: number, decimals = 2) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return `0.${'0'.repeat(decimals)} ETB`

  return `${amount.toLocaleString('en-ET', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })} ETB`
}

export function formatEtbPlain(value: number, decimals = 2) {
  return formatEtb(value, decimals).replace(' ETB', '')
}
