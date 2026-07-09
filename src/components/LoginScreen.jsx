// src/components/LoginScreen.jsx — v4
// Prominent new account CTA, animated logo, clean layout
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen({ onRegister }) {
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [pin, setPin]               = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [shuttlePos, setShuttlePos] = useState(0)

  // Shuttlecock animation — bounces once on load
  useEffect(() => {
    let frame = 0
    const total = 40
    const anim = setInterval(() => {
      frame++
      setShuttlePos(Math.sin((frame / total) * Math.PI) * 18)
      if (frame >= total) clearInterval(anim)
    }, 20)
    return () => clearInterval(anim)
  }, [])

  async function handleLogin() {
    if (!identifier.trim()) { setError('Enter your phone number or username'); return }
    if (pin.length !== 4)   { setError('Enter your 4-digit PIN'); return }
    setLoading(true); setError('')
    const result = await login(identifier, pin)
    setLoading(false)
    if (!result.success) setError(result.message)
  }

  const inp = {
    width:'100%', boxSizing:'border-box',
    background:'rgba(0,0,0,0.4)',
    border:'1.5px solid rgba(255,255,255,0.1)',
    borderRadius:14, padding:'14px 16px',
    color:'#f1f5f9', fontSize:16,
    fontFamily:"'Rajdhani',sans-serif",
    outline:'none', transition:'border-color 0.2s',
  }

  return (
    <div style={{ minHeight:'100vh', background:'#060d14', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', fontFamily:"'Rajdhani',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        input:focus { border-color: #4ade80 !important; }
        input::placeholder { color: #334155; }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 24px rgba(74,222,128,0.3)} 50%{box-shadow:0 0 40px rgba(74,222,128,0.6)} }
        @keyframes new-cta-glow { 0%,100%{box-shadow:0 0 0 0 rgba(251,146,60,0)} 50%{box-shadow:0 0 0 6px rgba(251,146,60,0.15)} }
      `}</style>

      {/* Logo + animation */}
      <div style={{ textAlign:'center', marginBottom:36 }}>
        <div style={{ position:'relative', display:'inline-block', marginBottom:14 }}>
          <img src="/icon-192.png" alt="Shuttle"
            style={{ width:80, height:80, borderRadius:20, display:'block', animation:'glow-pulse 3s ease-in-out infinite', transform:`translateY(${-shuttlePos}px)`, transition:'transform 0.02s linear' }}
            onError={e=>{ e.target.style.display='none' }}/>
          {/* Shuttlecock emoji as overlay accent */}
          <div style={{ position:'absolute', top:-8, right:-12, fontSize:22, transform:`rotate(${shuttlePos * 2}deg) translateY(${-shuttlePos * 0.3}px)`, transition:'transform 0.02s linear' }}>🏸</div>
        </div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:38, color:'#4ade80', letterSpacing:7, lineHeight:1 }}>SHUTTLE</div>
      </div>

      {/* Form */}
      <div style={{ width:'100%', maxWidth:360 }}>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, color:'#64748b', letterSpacing:1.5, fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Phone Number or Username</div>
          <input value={identifier} onChange={e=>{ setIdentifier(e.target.value); setError('') }}
            onKeyDown={e=>e.key==='Enter'&&handleLogin()}
            placeholder="e.g. 9876543210 or sumit"
            type="text" inputMode="text" style={inp}/>
        </div>

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:'#64748b', letterSpacing:1.5, fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>PIN</div>
          <input value={pin} onChange={e=>{ if(/^\d{0,4}$/.test(e.target.value)){ setPin(e.target.value); setError('') } }}
            onKeyDown={e=>e.key==='Enter'&&handleLogin()}
            placeholder="••••" type="password" inputMode="numeric" maxLength={4}
            onFocus={e=>e.target.select()}
            style={{ ...inp, letterSpacing:pin?8:0, fontSize:pin?22:16 }}/>
        </div>

        {error && (
          <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.25)', borderRadius:12, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#f87171' }}>
            ⚠ {error}
          </div>
        )}

        {/* Login CTA */}
        <button onClick={handleLogin} disabled={loading}
          style={{ width:'100%', background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', borderRadius:50, padding:'14px', fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:3, cursor:'pointer', opacity:loading?0.6:1, marginBottom:14 }}>
          {loading ? 'LOGGING IN...' : 'LOGIN'}
        </button>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }}/>
          <span style={{ fontSize:11, color:'#334155', fontWeight:700, letterSpacing:1 }}>NEW TO SHUTTLE?</span>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }}/>
        </div>

        {/* New account CTA — prominent, orange */}
        <button onClick={onRegister}
          style={{ width:'100%', background:'linear-gradient(135deg,#431407,#7c2d12)', border:'1.5px solid #fb923c', color:'#fb923c', borderRadius:50, padding:'14px', fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:3, cursor:'pointer', animation:'new-cta-glow 2.5s ease-in-out infinite' }}>
          🏸 CREATE YOUR ACCOUNT
        </button>
        <div style={{ textAlign:'center', marginTop:8, fontSize:11, color:'#334155' }}>Free · Join your court · Start tracking</div>
      </div>
    </div>
  )
}