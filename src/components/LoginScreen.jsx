// src/components/LoginScreen.jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [pin, setPin]           = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin() {
    if (!username || pin.length !== 4) {
      setError('Enter your username and 4-digit PIN')
      return
    }
    setLoading(true)
    setError('')
    const result = await login(username, pin)
    if (!result.success) {
      setError(result.message)
    }
    setLoading(false)
  }

  function handlePinInput(val) {
    if (/^\d{0,4}$/.test(val)) setPin(val)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Rajdhani', 'Segoe UI', sans-serif",
      padding: 20,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Teko:wght@400;500;600&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes slide-up { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
        .pin-input:focus { border-color: #4ade80 !important; outline: none; }
        .login-btn:hover { background: #15803d !important; transform: translateY(-1px); }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
      `}</style>

      {/* Court lines background */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <svg width="100%" height="100%" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice">
          <rect width="600" height="800" fill="#0f172a"/>
          <rect x="40" y="40" width="520" height="720" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.08"/>
          <rect x="80" y="40" width="440" height="720" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.05"/>
          <line x1="300" y1="40" x2="300" y2="760" stroke="#4ade80" strokeWidth="1.5" opacity="0.1"/>
          <line x1="40" y1="400" x2="560" y2="400" stroke="#4ade80" strokeWidth="2" opacity="0.12"/>
          <line x1="40" y1="220" x2="560" y2="220" stroke="#4ade80" strokeWidth="1" opacity="0.06"/>
          <line x1="40" y1="580" x2="560" y2="580" stroke="#4ade80" strokeWidth="1" opacity="0.06"/>
        </svg>
      </div>

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'rgba(15,23,42,0.9)',
        border: '1px solid rgba(74,222,128,0.2)',
        borderRadius: 24,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 380,
        boxShadow: '0 0 60px rgba(74,222,128,0.08)',
        animation: 'slide-up 0.4s ease-out',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ animation: 'float 3s ease-in-out infinite', display: 'inline-block', marginBottom: 12 }}>
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="30" fill="#166534" stroke="#4ade80" strokeWidth="2"/>
              <ellipse cx="32" cy="32" rx="18" ry="12" fill="none" stroke="#4ade80" strokeWidth="2" transform="rotate(-35 32 32)"/>
              <circle cx="32" cy="14" r="5" fill="#f1f5f9"/>
              <line x1="32" y1="19" x2="32" y2="32" stroke="#4ade80" strokeWidth="2.5"/>
            </svg>
          </div>
          <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 36, fontWeight: 600, color: '#4ade80', letterSpacing: 4, lineHeight: 1 }}>
            SHUTTLE
          </div>
          <div style={{ fontSize: 13, color: '#475569', marginTop: 4, letterSpacing: 1 }}>
            BADMINTON TRACKER
          </div>
        </div>

        {/* Username */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Player ID
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase())}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="e.g. arjun"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: '14px 16px',
              color: '#f1f5f9',
              fontSize: 16,
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 500,
              boxSizing: 'border-box',
              transition: 'border 0.2s',
            }}
          />
        </div>

        {/* PIN */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            4-Digit PIN
          </label>
          <input
            className="pin-input"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={e => handlePinInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••"
            maxLength={4}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: '14px 16px',
              color: '#4ade80',
              fontSize: 28,
              fontFamily: "'Teko', sans-serif",
              letterSpacing: 8,
              textAlign: 'center',
              boxSizing: 'border-box',
              transition: 'border 0.2s',
            }}
          />
          {/* PIN dots indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 10 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: i < pin.length ? '#4ade80' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.2s',
                boxShadow: i < pin.length ? '0 0 8px #4ade80' : 'none',
              }}/>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            fontSize: 13, color: '#fca5a5', textAlign: 'center',
          }}>
            ❌ {error}
          </div>
        )}

        {/* Login Button */}
        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #166534, #15803d)',
            border: '1px solid #4ade80',
            color: '#4ade80',
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 3,
            padding: '14px',
            borderRadius: 28,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'CHECKING...' : 'ENTER COURT →'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#334155' }}>
          Default PIN is 1234 · Ask admin to change yours
        </div>
      </div>
    </div>
  )
}