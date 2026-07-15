/**
 * Build a paste-friendly bug report for AI chat (non-agent).
 * @param {{ message: string, stack?: string, source?: string, extra?: Record<string, string> }} err
 * @returns {string}
 */
export function formatBugReport(err) {
  const lines = [
    '## Shuttle bug report',
    `Time: ${new Date().toISOString()}`,
    `URL: ${typeof window !== 'undefined' ? window.location.href : '(unknown)'}`,
    `Mode: ${import.meta.env.DEV ? 'development' : 'production'}`,
    '',
    '### Error',
    err.message || '(no message)',
  ]

  if (err.source) {
    lines.push('', '### Source', err.source)
  }

  if (err.stack) {
    lines.push('', '### Stack', err.stack)
  }

  if (err.extra) {
    for (const [key, value] of Object.entries(err.extra)) {
      if (value) lines.push('', `### ${key}`, value)
    }
  }

  lines.push(
    '',
    '### What I was doing',
    '(describe the last tap/click if you remember)',
    '',
    'Please suggest the minimal fix for this Shuttle app (React + Vite + Supabase).',
  )

  return lines.join('\n')
}
