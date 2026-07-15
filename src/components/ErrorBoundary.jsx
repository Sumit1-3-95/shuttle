import { Component } from 'react'
import { formatBugReport } from '../utils/formatBugReport'

/**
 * Catches React render crashes and offers a one-click AI paste blob.
 */
export default class ErrorBoundary extends Component {
  state = { error: null, copied: false }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
    this._componentStack = info?.componentStack
  }

  handleCopy = async () => {
    const { error } = this.state
    const text = formatBugReport({
      message: error?.message || String(error),
      stack: error?.stack,
      source: 'React ErrorBoundary',
      extra: this._componentStack
        ? { 'Component stack': this._componentStack }
        : undefined,
    })
    try {
      await navigator.clipboard.writeText(text)
      this.setState({ copied: true })
      setTimeout(() => this.setState({ copied: false }), 2000)
    } catch {
      // Fallback for older browsers / denied clipboard
      window.prompt('Copy this error for AI chat:', text)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    const { error, copied } = this.state
    if (!error) return this.props.children

    return (
      <div style={styles.wrap}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@500;600&display=swap');
        `}</style>
        <div style={styles.card}>
          <div style={styles.eyebrow}>Something broke</div>
          <h1 style={styles.title}>Shuttle hit an error</h1>
          <p style={styles.body}>
            You can copy the details below and paste them into an AI chat to get a fix suggestion.
          </p>
          <pre style={styles.pre}>{error?.message || String(error)}</pre>
          <div style={styles.row}>
            <button type="button" style={styles.primary} onClick={this.handleCopy}>
              {copied ? 'Copied' : 'Copy for AI'}
            </button>
            <button type="button" style={styles.secondary} onClick={this.handleReload}>
              Reload app
            </button>
          </div>
        </div>
      </div>
    )
  }
}

const styles = {
  wrap: {
    minHeight: '100vh',
    background: '#060d14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    boxSizing: 'border-box',
  },
  card: {
    maxWidth: 420,
    width: '100%',
  },
  eyebrow: {
    fontFamily: "'Rajdhani', sans-serif",
    color: '#f87171',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    color: '#f1f5f9',
    fontSize: 36,
    letterSpacing: 2,
    margin: '0 0 12px',
    fontWeight: 400,
  },
  body: {
    fontFamily: "'Rajdhani', sans-serif",
    color: '#94a3b8',
    fontSize: 16,
    lineHeight: 1.45,
    margin: '0 0 16px',
  },
  pre: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
    color: '#fca5a5',
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: 8,
    padding: 12,
    overflow: 'auto',
    maxHeight: 160,
    margin: '0 0 20px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  row: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  primary: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 600,
    fontSize: 15,
    letterSpacing: 1,
    textTransform: 'uppercase',
    background: '#4ade80',
    color: '#060d14',
    border: 'none',
    borderRadius: 8,
    padding: '12px 18px',
    cursor: 'pointer',
  },
  secondary: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 600,
    fontSize: 15,
    letterSpacing: 1,
    textTransform: 'uppercase',
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: '12px 18px',
    cursor: 'pointer',
  },
}
