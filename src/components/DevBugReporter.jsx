import { useEffect, useState } from 'react'
import { formatBugReport } from '../utils/formatBugReport'

const MAX_ERRORS = 8

/**
 * Dev-only floating banner: captures runtime errors and offers Copy for AI.
 * Does not replace Vite's compile overlay — that already shows build/HMR failures.
 */
export default function DevBugReporter() {
  const [errors, setErrors] = useState([])
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined

    const push = (entry) => {
      setDismissed(false)
      setErrors((prev) => {
        const next = [entry, ...prev]
        return next.slice(0, MAX_ERRORS)
      })
    }

    const onError = (event) => {
      push({
        message: event.message || String(event.error || 'Unknown error'),
        stack: event.error?.stack,
        source: event.filename
          ? `${event.filename}:${event.lineno}:${event.colno}`
          : 'window.onerror',
      })
    }

    const onRejection = (event) => {
      const reason = event.reason
      push({
        message: reason?.message || String(reason || 'Unhandled promise rejection'),
        stack: reason?.stack,
        source: 'unhandledrejection',
      })
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  if (!import.meta.env.DEV || dismissed || errors.length === 0) return null

  const latest = errors[0]

  const handleCopy = async () => {
    const text = formatBugReport({
      message: latest.message,
      stack: latest.stack,
      source: latest.source,
      extra: errors.length > 1
        ? {
            'Recent errors': errors
              .slice(0, 5)
              .map((e, i) => `${i + 1}. ${e.message}`)
              .join('\n'),
          }
        : undefined,
    })
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this error for AI chat:', text)
    }
  }

  return (
    <div style={styles.banner} role="alert">
      <div style={styles.text}>
        <div style={styles.label}>Something broke</div>
        <div style={styles.msg}>{latest.message}</div>
      </div>
      <div style={styles.actions}>
        <button type="button" style={styles.copy} onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy for AI'}
        </button>
        <button type="button" style={styles.dismiss} onClick={() => setDismissed(true)} aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  )
}

const styles = {
  banner: {
    position: 'fixed',
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 99999,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '12px 14px',
    background: '#1c1917',
    border: '1px solid #7f1d1d',
    borderRadius: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
    fontFamily: "'Rajdhani', sans-serif",
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  msg: {
    color: '#f1f5f9',
    fontSize: 14,
    lineHeight: 1.35,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  copy: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    background: '#4ade80',
    color: '#060d14',
    border: 'none',
    borderRadius: 6,
    padding: '8px 12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  dismiss: {
    background: 'transparent',
    color: '#94a3b8',
    border: 'none',
    fontSize: 22,
    lineHeight: 1,
    cursor: 'pointer',
    padding: '4px 6px',
  },
}
