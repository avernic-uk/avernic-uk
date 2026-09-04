/** Formats an integer pence value as a GBP currency string, e.g. 1299 -> "£12.99". */
export function formatGBP(minor: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    currencyDisplay: 'symbol',
  }).format(minor / 100)
}

/** Formats an ISO date string as DD/MM/YYYY per UK convention. */
export function formatUKDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatUKDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
