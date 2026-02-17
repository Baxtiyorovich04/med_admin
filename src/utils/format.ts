export function normalizeUzPhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  const withoutCode = digits.startsWith('998') ? digits.slice(3) : digits
  const trimmed = withoutCode.slice(0, 9)
  return trimmed.length ? `+998${trimmed}` : ''
}

export function formatUzPhoneDisplay(normalized: string): string {
  const digits = normalized.replace(/\D/g, '').slice(0, 12)
  if (!digits.startsWith('998')) return normalized
  const d = digits.slice(3)
  const p1 = d.slice(0, 2)
  const p2 = d.slice(2, 5)
  const p3 = d.slice(5, 7)
  const p4 = d.slice(7, 9)
  return `+998 (${p1.padEnd(2, '_')}) ${p2.padEnd(3, '_')}-${p3.padEnd(
    2,
    '_',
  )}-${p4.padEnd(2, '_')}`
}

export function formatCurrencyUZS(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(value)
}

