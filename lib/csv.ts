// Minimal CSV serializer. Handles commas, quotes, newlines by quoting.
export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return columns ? columns.join(',') + '\n' : ''
  const cols = columns ?? Array.from(new Set(rows.flatMap((r) => Object.keys(r))))
  const escape = (v: unknown): string => {
    if (v == null) return ''
    const s = typeof v === 'string' ? v : JSON.stringify(v)
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const header = cols.join(',')
  const body = rows.map((r) => cols.map((c) => escape(r[c])).join(',')).join('\n')
  return `${header}\n${body}\n`
}
