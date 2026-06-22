// src/components/LoginScreen.jsx — v3
// Clean phone/username + PIN login
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen({ onRegister }) {
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [pin, setPin]               = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)

  async function handleLogin() {
    if (!identifier.trim()) { setError('Enter your phone number or username'); return }
    if (pin.length !== 4)   { setError('Enter your 4-digit PIN'); return }
    setLoading(true); setError('')
    const result = await login(identifier, pin)
    setLoading(false)
    if (!result.success) setError(result.message)
  }

  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(0,0,0,0.4)',
    border: '1.5px solid rgba(255,255,255,0.1)',
    borderRadius: 14, padding: '14px 16px',
    color: '#f1f5f9', fontSize: 16,
    fontFamily: "'Rajdhani',sans-serif",
    outline: 'none', transition: 'border-color 0.2s',
  }

  return (
    <div style={{ minHeight:'100vh', background:'#060d14', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', fontFamily:"'Rajdhani',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        input:focus { border-color: #4ade80 !important; }
        input::placeholder { color: #334155; }
      `}</style>

      {/* Logo */}
      <div style={{ textAlign:'center', marginBottom:40 }}>
        <img src="/icon-192.png" alt="Shuttle" style={{ width:80, height:80, borderRadius:20, marginBottom:12, boxShadow:'0 0 24px rgba(74,222,128,0.3)' }} onError={e=>{ e.target.style.display='none'; e.target.nextSibling.style.display='block' }}/>
        <div style={{ fontSize:48, marginBottom:12, display:'none' }}>🏸</div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:36, color:'#4ade80', letterSpacing:6 }}>SHUTTLE</div>
        <div style={{ fontSize:13, color:'#475569', marginTop:4 }}>Badminton Match Tracker</div>
      </div>

      {/* Form */}
      <div style={{ width:'100%', maxWidth:360 }}>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:'#64748b', letterSpacing:1.5, fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Username or Phone Number</div>
          <input
            value={identifier}
            onChange={e => { setIdentifier(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="e.g. 9876543210 or sumit"
            type="text"
            inputMode="text"
            style={inp}
          />
        </div>

        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:'#64748b', letterSpacing:1.5, fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>PIN</div>
          <input
            value={pin}
            onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) { setPin(e.target.value); setError('') } }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••"
            type="password"
            inputMode="numeric"
            maxLength={4}
            onFocus={e => e.target.select()}
            style={{ ...inp, letterSpacing: pin ? 8 : 0, fontSize: pin ? 22 : 16 }}
          />
        </div>

        {error && (
          <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.25)', borderRadius:12, padding:'11px 14px', marginBottom:16, fontSize:13, color:'#f87171' }}>
            ⚠ {error}
          </div>
        )}

        <button onClick={handleLogin} disabled={loading}
          style={{ width:'100%', background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', borderRadius:50, padding:'15px', fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:3, cursor:'pointer', opacity:loading?0.6:1, marginBottom:16 }}>
          {loading ? 'LOGGING IN...' : 'LOGIN'}
        </button>

        <div style={{ textAlign:'center' }}>
          <span style={{ fontSize:13, color:'#475569' }}>New player? </span>
          <button onClick={onRegister} style={{ background:'none', border:'none', color:'#4ade80', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif" }}>
            Create Account →
          </button>
        </div>
      </div>
    </div>
  )
}