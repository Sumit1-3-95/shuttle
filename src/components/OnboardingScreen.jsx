// src/components/OnboardingScreen.jsx — v4
// Clean 3-field signup: Name, Phone, PIN + confirm
// Then court selection
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import bcrypt from 'bcryptjs'

export default function OnboardingScreen({ onComplete }) {
  const { login } = useAuth()
  const [step, setStep]       = useState(1) // 1=profile, 2=courts
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [pin, setPin]         = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [errors, setErrors]   = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [newPlayerId, setNewPlayerId] = useState(null)
  const [savedPhone, setSavedPhone]  = useState('')

  // Courts
  const [allCourts, setAllCourts]     = useState([])
  const [courtSearch, setCourtSearch] = useState('')
  const [courtCode, setCourtCode]     = useState('')
  const [codeMsg, setCodeMsg]         = useState({ type:'', text:'' })
  const [selCourts, setSelCourts]     = useState([])
  const [courtMode, setCourtMode]     = useState('browse')
  const [newCourtName, setNewCourtName] = useState('')
  const [newCourtMsg, setNewCourtMsg]   = useState({ type:'', text:'' })
  const [newCourtCreated, setNewCourtCreated] = useState(null)

  const inp = {
    width:'100%', boxSizing:'border-box',
    background:'rgba(0,0,0,0.4)',
    border:'1.5px solid rgba(255,255,255,0.1)',
    borderRadius:14, padding:'14px 16px',
    color:'#f1f5f9', fontSize:16,
    fontFamily:"'Rajdhani',sans-serif",
    outline:'none', transition:'border-color 0.2s',
  }

  function generateUsername(name, phone) {
    const base = name.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'') || 'player'
    const suffix = phone ? phone.slice(-3) : Math.floor(Math.random()*900+100)
    return base + suffix
  }

  async function validateAndSubmit() {
    const e = {}
    if (!name.trim())               e.name = 'Enter your name'
    if (!/^\d{10}$/.test(phone))    e.phone = 'Enter a valid 10-digit phone number'
    if (!/^\d{4}$/.test(pin))       e.pin = 'PIN must be exactly 4 digits'
    if (pin !== pinConfirm)         e.pinConfirm = 'PINs do not match'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setSubmitting(true)
    try {
      // Check phone uniqueness
      const { data: existing } = await supabase
        .from('players').select('id').eq('phone', phone).single()
      if (existing) {
        setErrors({ phone: 'This phone number is already registered' })
        setSubmitting(false); return
      }

      const username = generateUsername(name, phone)
      const pinHash  = await bcrypt.hash(pin, 10)

      const { data: newPlayer, error } = await supabase.from('players').insert({
        username,
        display_name: name.trim(),
        phone,
        pin_hash: pinHash,
        total_games:0, total_wins:0, total_losses:0,
        points_scored:0, points_conceded:0, level:1, role:'player',
      }).select().single()

      if (error) throw error

      setNewPlayerId(newPlayer.id)
      setSavedPhone(phone)

      const { data: courts } = await supabase.from('groups').select('*').order('name')
      setAllCourts(courts||[])
      setStep(2)
    } catch (err) {
      setErrors({ submit: err.message || 'Something went wrong. Try again.' })
    }
    setSubmitting(false)
  }

  async function joinByCode() {
    const trimmed = courtCode.trim().toUpperCase()
    if (!trimmed) { setCodeMsg({ type:'error', text:'Enter a court code' }); return }
    setCodeMsg({ type:'', text:'' })
    const { data: court } = await supabase.from('groups').select('*').eq('court_code', trimmed).single()
    if (!court) { setCodeMsg({ type:'error', text:'Court not found — check the code' }); return }
    if (selCourts.find(c => c.id === court.id)) { setCodeMsg({ type:'error', text:'Already added' }); return }
    setSelCourts(prev => [...prev, court])
    setCourtCode('')
    setCodeMsg({ type:'success', text:'Added: ' + court.name })
  }

  async function createCourt() {
    const cname = newCourtName.trim()
    if (!cname) { setNewCourtMsg({ type:'error', text:'Enter a court name' }); return }
    const { data: existing } = await supabase.from('groups').select('id').ilike('name', cname).single()
    if (existing) { setNewCourtMsg({ type:'error', text:'A court with this name already exists' }); return }
    const code = Math.random().toString(36).substring(2,8).toUpperCase()
    const { data: nc, error } = await supabase.from('groups').insert({ name:cname, court_code:code, pin:'1234' }).select().single()
    if (error) { setNewCourtMsg({ type:'error', text:error.message }); return }
    setNewCourtCreated(nc)
    setSelCourts(prev => [...prev, nc])
    setNewCourtName('')
    setNewCourtMsg({ type:'success', text:`Created! Share code: ${code}` })
  }

  function toggleCourt(court) {
    setSelCourts(prev =>
      prev.find(c => c.id === court.id) ? prev.filter(c => c.id !== court.id) : [...prev, court]
    )
  }

  async function finishSetup() {
    setSubmitting(true)
    try {
      if (selCourts.length > 0) {
        await supabase.from('group_members').insert(
          selCourts.map(c => ({ group_id: c.id, player_id: newPlayerId }))
        )
      }
      if (newCourtCreated) {
        await supabase.from('players').update({ role:'admin' }).eq('id', newPlayerId)
      }
      // Auto-login with phone + PIN
      await login(savedPhone, pin)
      onComplete()
    } catch (err) {
      setErrors({ courts: err.message })
    }
    setSubmitting(false)
  }

  const filteredCourts = allCourts.filter(c =>
    c.name.toLowerCase().includes(courtSearch.toLowerCase()) &&
    !selCourts.find(s => s.id === c.id)
  )

  return (
    <div style={{ minHeight:'100vh', background:'#060d14', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        input:focus { border-color: #4ade80 !important; }
        input::placeholder { color: #334155; }
      `}</style>

      {/* Header */}
      <div style={{ padding:'20px 20px 0', display:'flex', alignItems:'center', gap:10 }}>
        <img src="/icon-192.png" alt="Shuttle" style={{ width:32, height:32, borderRadius:8 }} onError={e=>{ e.target.style.display='none' }}/>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#4ade80', letterSpacing:4 }}>SHUTTLE</span>
        <div style={{ marginLeft:'auto', fontSize:12, color:'#334155' }}>Step {step} of 2</div>
      </div>
      <div style={{ margin:'10px 20px', height:3, background:'rgba(255,255,255,0.06)', borderRadius:2 }}>
        <div style={{ height:'100%', width:step===1?'50%':'100%', background:'#4ade80', borderRadius:2, transition:'width 0.4s' }}/>
      </div>

      <div style={{ padding:'16px 20px 80px', maxWidth:420, margin:'0 auto' }}>

        {/* ── STEP 1: Profile ── */}
        {step === 1 && (
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:'#f1f5f9', letterSpacing:2, marginBottom:4 }}>Create Account</div>
            <div style={{ fontSize:13, color:'#475569', marginBottom:28 }}>3 quick steps to get started</div>

            {/* Name */}
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:11, color:'#64748b', letterSpacing:1.5, fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Your Name</div>
              <input value={name} onChange={e=>{ setName(e.target.value); setErrors(p=>({...p,name:''})) }}
                placeholder="e.g. Arjun Sharma" style={inp}/>
              {errors.name && <div style={{ fontSize:12, color:'#f87171', marginTop:5 }}>⚠ {errors.name}</div>}
            </div>

            {/* Phone */}
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:11, color:'#64748b', letterSpacing:1.5, fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Phone Number</div>
              <input value={phone} onChange={e=>{ if(/^\d{0,10}$/.test(e.target.value)) { setPhone(e.target.value); setErrors(p=>({...p,phone:''})) } }}
                placeholder="10-digit mobile number" type="tel" inputMode="numeric" maxLength={10}
                style={inp}/>
              {errors.phone
                ? <div style={{ fontSize:12, color:'#f87171', marginTop:5 }}>⚠ {errors.phone}</div>
                : <div style={{ fontSize:11, color:'#334155', marginTop:5 }}>Used to log in — no OTP required</div>
              }
            </div>

            {/* PIN */}
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:11, color:'#64748b', letterSpacing:1.5, fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Set PIN</div>
              <div style={{ display:'flex', gap:10 }}>
                <div style={{ flex:1 }}>
                  <input value={pin} onChange={e=>{ if(/^\d{0,4}$/.test(e.target.value)) { setPin(e.target.value); setErrors(p=>({...p,pin:''})) } }}
                    onFocus={e=>e.target.select()}
                    placeholder="••••" type="password" inputMode="numeric" maxLength={4}
                    style={{ ...inp, letterSpacing:pin?8:0, fontSize:pin?22:16, textAlign:'center' }}/>
                  <div style={{ fontSize:10, color:'#334155', marginTop:4, textAlign:'center' }}>New PIN</div>
                </div>
                <div style={{ flex:1 }}>
                  <input value={pinConfirm} onChange={e=>{ if(/^\d{0,4}$/.test(e.target.value)) { setPinConfirm(e.target.value); setErrors(p=>({...p,pinConfirm:''})) } }}
                    onFocus={e=>e.target.select()}
                    placeholder="••••" type="password" inputMode="numeric" maxLength={4}
                    style={{ ...inp, letterSpacing:pinConfirm?8:0, fontSize:pinConfirm?22:16, textAlign:'center',
                      borderColor: pinConfirm.length===4 ? (pin===pinConfirm?'rgba(74,222,128,0.6)':'rgba(248,113,113,0.6)') : 'rgba(255,255,255,0.1)' }}/>
                  <div style={{ fontSize:10, color: pinConfirm.length===4?(pin===pinConfirm?'#4ade80':'#f87171'):'#334155', marginTop:4, textAlign:'center' }}>
                    {pinConfirm.length===4 ? (pin===pinConfirm?'✓ Match':'✗ No match') : 'Confirm PIN'}
                  </div>
                </div>
              </div>
              {errors.pin && <div style={{ fontSize:12, color:'#f87171', marginTop:5 }}>⚠ {errors.pin}</div>}
              {errors.pinConfirm && <div style={{ fontSize:12, color:'#f87171', marginTop:5 }}>⚠ {errors.pinConfirm}</div>}
            </div>

            {errors.submit && (
              <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.25)', borderRadius:12, padding:'11px 14px', marginBottom:16, fontSize:13, color:'#f87171' }}>
                ⚠ {errors.submit}
              </div>
            )}

            <button onClick={validateAndSubmit} disabled={submitting}
              style={{ width:'100%', background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', borderRadius:50, padding:'15px', fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:3, cursor:'pointer', opacity:submitting?0.6:1, marginBottom:16 }}>
              {submitting ? 'CREATING...' : 'NEXT →'}
            </button>

            <div style={{ textAlign:'center', fontSize:13, color:'#334155' }}>
              Already have an account?{' '}
              <button onClick={onComplete} style={{ background:'none', border:'none', color:'#4ade80', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif" }}>Login</button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Courts ── */}
        {step === 2 && (
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:'#f1f5f9', letterSpacing:2, marginBottom:4 }}>Join Your Court</div>
            <div style={{ fontSize:13, color:'#475569', marginBottom:16 }}>Optional — you can join courts later too</div>

            {/* Selected */}
            {selCourts.length > 0 && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:'#4ade80', letterSpacing:1.5, fontWeight:700, marginBottom:8 }}>SELECTED</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {selCourts.map(c => (
                    <div key={c.id} onClick={()=>toggleCourt(c)} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:20, padding:'5px 12px', cursor:'pointer' }}>
                      <span style={{ fontSize:13, color:'#4ade80', fontWeight:700 }}>{c.name}</span>
                      <span style={{ fontSize:11, color:'#4ade80' }}>✕</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mode tabs */}
            <div style={{ display:'flex', gap:6, marginBottom:14 }}>
              {[{id:'browse',label:'Browse'},{id:'code',label:'Enter Code'},{id:'create',label:'Create'}].map(m => (
                <button key={m.id} onClick={()=>setCourtMode(m.id)} style={{
                  flex:1, padding:'9px', borderRadius:10, cursor:'pointer',
                  border: courtMode===m.id?'1px solid rgba(74,222,128,0.4)':'1px solid rgba(255,255,255,0.08)',
                  background: courtMode===m.id?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.03)',
                  color: courtMode===m.id?'#4ade80':'#475569',
                  fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700,
                }}>{m.label}</button>
              ))}
            </div>

            {/* Browse */}
            {courtMode==='browse' && (
              <div>
                <input value={courtSearch} onChange={e=>setCourtSearch(e.target.value)}
                  placeholder="Search courts..." style={{ ...inp, marginBottom:10 }}/>
                {filteredCourts.length===0 && (
                  <div style={{ textAlign:'center', color:'#334155', padding:24, fontSize:13 }}>No courts found</div>
                )}
                {filteredCourts.map(c => (
                  <div key={c.id} onClick={()=>toggleCourt(c)} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', marginBottom:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, cursor:'pointer' }}>
                    <span style={{ fontSize:18 }}>🏟️</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:'#f1f5f9' }}>{c.name}</div>
                      <div style={{ fontSize:11, color:'#475569' }}>Code: <span style={{ color:'#60a5fa' }}>{c.court_code||'—'}</span></div>
                    </div>
                    <span style={{ color:'#4ade80', fontSize:18 }}>+</span>
                  </div>
                ))}
              </div>
            )}

            {/* Code */}
            {courtMode==='code' && (
              <div>
                <input value={courtCode} onChange={e=>{ setCourtCode(e.target.value.toUpperCase()); setCodeMsg({type:'',text:''}) }}
                  onKeyDown={e=>e.key==='Enter'&&joinByCode()}
                  placeholder="e.g. LOTUS1" maxLength={8}
                  style={{ ...inp, color:'#4ade80', fontSize:20, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:4, marginBottom:8 }}/>
                {codeMsg.text && <div style={{ fontSize:12, color:codeMsg.type==='error'?'#f87171':'#4ade80', marginBottom:8 }}>{codeMsg.type==='error'?'⚠':' ✓'} {codeMsg.text}</div>}
                <button onClick={joinByCode} style={{ width:'100%', background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', color:'#4ade80', borderRadius:50, padding:'12px', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2, cursor:'pointer' }}>
                  FIND COURT
                </button>
              </div>
            )}

            {/* Create */}
            {courtMode==='create' && (
              <div>
                <div style={{ fontSize:12, color:'#64748b', marginBottom:10, lineHeight:1.5 }}>You'll become the admin. A shareable code is auto-generated.</div>
                <input value={newCourtName} onChange={e=>{ setNewCourtName(e.target.value); setNewCourtMsg({type:'',text:''}) }}
                  onKeyDown={e=>e.key==='Enter'&&createCourt()}
                  placeholder="e.g. Lotus Court 3"
                  style={{ ...inp, marginBottom:8 }}/>
                {newCourtMsg.text && <div style={{ fontSize:12, color:newCourtMsg.type==='error'?'#f87171':'#4ade80', marginBottom:8 }}>{newCourtMsg.type==='error'?'⚠':'✓'} {newCourtMsg.text}</div>}
                <button onClick={createCourt} disabled={!newCourtName.trim()||!!newCourtCreated}
                  style={{ width:'100%', background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', color:'#4ade80', borderRadius:50, padding:'12px', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2, cursor:'pointer' }}>
                  CREATE COURT
                </button>
              </div>
            )}

            {errors.courts && <div style={{ fontSize:12, color:'#f87171', margin:'10px 0' }}>⚠ {errors.courts}</div>}

            <button onClick={finishSetup} disabled={submitting}
              style={{ width:'100%', marginTop:20, background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', borderRadius:50, padding:'15px', fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:3, cursor:'pointer', opacity:submitting?0.6:1 }}>
              {submitting ? 'SETTING UP...' : selCourts.length ? "LET'S PLAY! →" : 'SKIP FOR NOW →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}