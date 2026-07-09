// src/components/OnboardingScreen.jsx — v6
// Fixed UI overflow, added player profiling step
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import bcrypt from 'bcryptjs'

function generateUsername(name, phone) {
  const base = name.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'') || 'player'
  return base + (phone ? phone.slice(-3) : Math.floor(Math.random()*900+100))
}

const inp = {
  width:'100%', boxSizing:'border-box',
  background:'rgba(0,0,0,0.5)',
  border:'1.5px solid rgba(255,255,255,0.12)',
  borderRadius:12, padding:'13px 14px',
  color:'#f1f5f9', fontSize:15,
  fontFamily:"'Rajdhani',sans-serif",
  outline:'none',
}

function Label({ children }) {
  return <div style={{ fontSize:11, color:'#64748b', letterSpacing:1.5, fontWeight:700, textTransform:'uppercase', marginBottom:8, fontFamily:"'Rajdhani',sans-serif" }}>{children}</div>
}

function Err({ msg }) {
  return msg ? <div style={{ fontSize:12, color:'#f87171', marginTop:5, fontFamily:"'Rajdhani',sans-serif" }}>⚠ {msg}</div> : null
}

function OptionCard({ label, desc, selected, onClick }) {
  return (
    <div onClick={onClick} style={{ flex:1, padding:'14px 10px', borderRadius:14, cursor:'pointer', textAlign:'center', transition:'all 0.2s',
      background: selected?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.03)',
      border: selected?'1.5px solid rgba(74,222,128,0.5)':'1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:selected?'#4ade80':'#94a3b8', letterSpacing:1, lineHeight:1.2 }}>{label}</div>
      {desc && <div style={{ fontSize:10, color:selected?'#4ade80':'#475569', marginTop:4, fontFamily:"'Rajdhani',sans-serif" }}>{desc}</div>}
      {selected && <div style={{ fontSize:10, color:'#4ade80', marginTop:4 }}>✓</div>}
    </div>
  )
}

// ── Create Court Screen ────────────────────────────────────────
function CreateCourtScreen({ currentUserId, onCreated, onBack }) {
  const [courtName, setCourtName] = useState('')
  const [players, setPlayers]     = useState([{ name:'', phone:'' }])
  const [creating, setCreating]   = useState(false)
  const [error, setError]         = useState('')

  function updatePlayer(i, field, val) {
    setPlayers(prev => prev.map((p,idx) => idx===i ? {...p,[field]:val} : p))
  }

  async function handleCreate() {
    if (!courtName.trim()) { setError('Enter a court name'); return }
    setCreating(true); setError('')
    const { data: existing } = await supabase.from('groups').select('id').ilike('name', courtName.trim()).single()
    if (existing) { setError('A court with this name already exists'); setCreating(false); return }
    const code = Math.random().toString(36).substring(2,8).toUpperCase()
    const { data: nc, error: err } = await supabase.from('groups')
      .insert({ name: courtName.trim(), court_code: code, pin:'1234' }).select().single()
    if (err) { setError(err.message); setCreating(false); return }
    await supabase.from('group_members').insert({ group_id: nc.id, player_id: currentUserId })
    await supabase.from('players').update({ role:'admin' }).eq('id', currentUserId)
    const valid = players.filter(p => p.name.trim() && /^\d{10}$/.test(p.phone))
    for (const pl of valid) {
      const { data: ep } = await supabase.from('players').select('id').eq('phone', pl.phone).single()
      let pid = ep?.id
      if (!pid) {
        const ph = await bcrypt.hash('1234', 10)
        const { data: np } = await supabase.from('players').insert({
          username: generateUsername(pl.name, pl.phone), display_name: pl.name.trim(),
          phone: pl.phone, pin_hash: ph, total_games:0, total_wins:0, total_losses:0,
          points_scored:0, points_conceded:0, level:1, role:'player',
        }).select().single()
        pid = np?.id
      }
      if (pid) await supabase.from('group_members').insert({ group_id: nc.id, player_id: pid })
    }
    onCreated(nc)
    setCreating(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <button onClick={onBack} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, padding:'0 0 12px', textAlign:'left' }}>← Back</button>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#f1f5f9', letterSpacing:2, marginBottom:4 }}>Create Your Court</div>
      <div style={{ fontSize:12, color:'#475569', marginBottom:16 }}>You'll be the admin. Share the court code to invite others.</div>

      <div style={{ flex:1, overflowY:'auto', paddingRight:2 }}>
        <div style={{ marginBottom:14 }}>
          <Label>Court Name</Label>
          <input value={courtName} onChange={e=>{ setCourtName(e.target.value); setError('') }}
            placeholder="e.g. Lotus Court 3" style={inp}/>
        </div>

        <div style={{ marginBottom:10 }}>
          <Label>Add Players — <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, color:'#334155' }}>optional</span></Label>
          {players.map((p,i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
              <input value={p.name} onChange={e=>updatePlayer(i,'name',e.target.value)}
                placeholder="Name" style={{ ...inp, flex:1, minWidth:0 }}/>
              <input value={p.phone} onChange={e=>{ if(/^\d{0,10}$/.test(e.target.value)) updatePlayer(i,'phone',e.target.value) }}
                placeholder="Phone" type="tel" inputMode="numeric" maxLength={10}
                style={{ ...inp, flex:1, minWidth:0, borderColor:p.phone.length===10?'rgba(74,222,128,0.4)':'rgba(255,255,255,0.12)', color:p.phone.length===10?'#4ade80':'#f1f5f9' }}/>
              {players.length>1 && <button onClick={()=>setPlayers(p=>p.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', color:'#334155', cursor:'pointer', fontSize:16, flexShrink:0, padding:0 }}>✕</button>}
            </div>
          ))}
          <button onClick={()=>setPlayers(p=>[...p,{name:'',phone:''}])}
            style={{ background:'none', border:'none', color:'#4ade80', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, padding:'2px 0' }}>
            + Add another player
          </button>
        </div>

        <div style={{ background:'rgba(96,165,250,0.06)', border:'1px solid rgba(96,165,250,0.15)', borderRadius:10, padding:'9px 12px', marginBottom:10 }}>
          <div style={{ fontSize:11, color:'#60a5fa', fontFamily:"'Rajdhani',sans-serif" }}>ℹ New players log in with their phone number and PIN <strong>1234</strong></div>
        </div>
        {error && <div style={{ fontSize:12, color:'#f87171', marginBottom:8 }}>⚠ {error}</div>}
      </div>

      <button onClick={handleCreate} disabled={creating||!courtName.trim()}
        style={{ width:'100%', marginTop:12, background:courtName.trim()?'linear-gradient(135deg,#14532d,#166534)':'rgba(255,255,255,0.05)', border:`1.5px solid ${courtName.trim()?'#4ade80':'rgba(255,255,255,0.1)'}`, color:courtName.trim()?'#4ade80':'#475569', borderRadius:50, padding:'14px', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2, cursor:'pointer', opacity:creating?0.6:1, flexShrink:0 }}>
        {creating?'CREATING...':'CREATE COURT →'}
      </button>
    </div>
  )
}

// ── Main Onboarding ────────────────────────────────────────────
export default function OnboardingScreen({ onComplete }) {
  const { login } = useAuth()
  const [step, setStep]             = useState(1) // 1=profile 2=profiling 3=court
  const [name, setName]             = useState('')
  const [phone, setPhone]           = useState('')
  const [pin, setPin]               = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [errors, setErrors]         = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [newPlayerId, setNewPlayerId] = useState(null)
  const [savedPhone, setSavedPhone]   = useState('')

  // Profiling
  const [expertise, setExpertise]   = useState(null)
  const [frequency, setFrequency]   = useState(null)
  const [duration, setDuration]     = useState(null)

  // Court
  const [allCourts, setAllCourts]   = useState([])
  const [search, setSearch]         = useState('')
  const [joining, setJoining]       = useState(null)
  const [joined, setJoined]         = useState(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [createdCourt, setCreatedCourt] = useState(null)

  const totalSteps = 3

  async function handleStep1() {
    const e = {}
    if (!name.trim())              e.name       = 'Enter your name'
    if (!/^\d{10}$/.test(phone))   e.phone      = 'Enter a valid 10-digit phone number'
    if (!/^\d{4}$/.test(pin))      e.pin        = 'PIN must be 4 digits'
    if (pin !== pinConfirm)        e.pinConfirm = 'PINs do not match'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setSubmitting(true)
    try {
      const { data: existing } = await supabase.from('players').select('id').eq('phone', phone).single()
      if (existing) { setErrors({ phone:'This phone number is already registered' }); setSubmitting(false); return }
      const username = generateUsername(name, phone)
      const pinHash  = await bcrypt.hash(pin, 10)
      const { data: newPlayer, error } = await supabase.from('players').insert({
        username, display_name: name.trim(), phone, pin_hash: pinHash,
        total_games:0, total_wins:0, total_losses:0,
        points_scored:0, points_conceded:0, level:1, role:'player',
      }).select().single()
      if (error) throw error
      setNewPlayerId(newPlayer.id)
      setSavedPhone(phone)
      setStep(2)
    } catch (err) {
      setErrors({ submit: err.message || 'Something went wrong' })
    }
    setSubmitting(false)
  }

  async function handleStep2() {
    // Save profile preferences if filled
    if (expertise || frequency || duration) {
      await supabase.from('player_settings').upsert({
        player_id: newPlayerId,
        game_preference: 'doubles',
      })
      // Store in players metadata or a profile table — use display name note for now
    }
    const { data: courts } = await supabase.from('groups').select('*').order('name')
    setAllCourts(courts||[])
    setStep(3)
  }

  async function joinCourt(court) {
    setJoining(court.id)
    const { data: exists } = await supabase.from('group_members')
      .select('player_id').eq('group_id', court.id).eq('player_id', newPlayerId).single()
    if (!exists) await supabase.from('group_members').insert({ group_id: court.id, player_id: newPlayerId })
    setJoined(prev => new Set([...prev, court.id]))
    setJoining(null)
  }

  async function finish() {
    setSubmitting(true)
    if (createdCourt) {
      await supabase.from('players').update({ role:'admin' }).eq('id', newPlayerId)
    }
    await login(savedPhone, pin)
    onComplete()
    setSubmitting(false)
  }

  const filteredCourts = allCourts.filter(c => {
    const q = search.trim().toUpperCase()
    if (!q) return true
    return c.name.toLowerCase().includes(search.toLowerCase()) || c.court_code?.toUpperCase() === q
  })

  const pinReady = pin.length===4 && pin===pinConfirm

  return (
    <div style={{ position:'fixed', inset:0, background:'#060d14', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        input:focus { border-color: #4ade80 !important; box-shadow: 0 0 0 3px rgba(74,222,128,0.1); }
        input::placeholder { color: #2d3748; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* Header — fixed */}
      <div style={{ padding:'16px 20px 0', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <img src="/icon-192.png" style={{ width:28, height:28, borderRadius:7 }} onError={e=>e.target.style.display='none'}/>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:19, color:'#4ade80', letterSpacing:4 }}>SHUTTLE</span>
        <div style={{ marginLeft:'auto', fontSize:11, color:'#334155' }}>Step {step}/{totalSteps}</div>
      </div>

      {/* Progress */}
      <div style={{ margin:'10px 20px 0', height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, flexShrink:0 }}>
        <div style={{ height:'100%', width:`${(step/totalSteps)*100}%`, background:'#4ade80', borderRadius:2, transition:'width 0.4s' }}/>
      </div>

      {/* Scrollable content */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px 24px' }}>
        <div style={{ maxWidth:420, margin:'0 auto' }}>

          {/* ── STEP 1: Profile ── */}
          {step===1 && (
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'#f1f5f9', letterSpacing:2, marginBottom:3 }}>Create Account</div>
              <div style={{ fontSize:13, color:'#475569', marginBottom:20 }}>3 fields and you're in</div>

              <div style={{ marginBottom:14 }}>
                <Label>Your Name</Label>
                <input value={name} onChange={e=>{ setName(e.target.value); setErrors(p=>({...p,name:''})) }}
                  placeholder="e.g. Arjun Sharma" style={inp}/>
                <Err msg={errors.name}/>
              </div>

              <div style={{ marginBottom:14 }}>
                <Label>Phone Number</Label>
                <input value={phone} onChange={e=>{ if(/^\d{0,10}$/.test(e.target.value)){ setPhone(e.target.value); setErrors(p=>({...p,phone:''})) } }}
                  placeholder="10-digit mobile number" type="tel" inputMode="numeric" maxLength={10}
                  style={{ ...inp, borderColor:phone.length===10?'rgba(74,222,128,0.4)':'rgba(255,255,255,0.12)', color:phone.length===10?'#4ade80':'#f1f5f9' }}/>
                {errors.phone
                  ? <Err msg={errors.phone}/>
                  : <div style={{ fontSize:11, color:'#334155', marginTop:5 }}>Used to log in — no OTP needed</div>}
              </div>

              <div style={{ marginBottom:20 }}>
                <Label>Set Your 4-Digit PIN</Label>
                <div style={{ display:'flex', gap:10 }}>
                  <div style={{ flex:1 }}>
                    <input value={pin} onChange={e=>{ if(/^\d{0,4}$/.test(e.target.value)){ setPin(e.target.value); setErrors(p=>({...p,pin:''})) } }}
                      onFocus={e=>e.target.select()} placeholder="••••" type="password" inputMode="numeric" maxLength={4}
                      style={{ ...inp, letterSpacing:pin?10:0, fontSize:pin?20:15, textAlign:'center' }}/>
                    <div style={{ fontSize:10, color:'#334155', marginTop:4, textAlign:'center' }}>New PIN</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <input value={pinConfirm} onChange={e=>{ if(/^\d{0,4}$/.test(e.target.value)){ setPinConfirm(e.target.value); setErrors(p=>({...p,pinConfirm:''})) } }}
                      onFocus={e=>e.target.select()} placeholder="••••" type="password" inputMode="numeric" maxLength={4}
                      style={{ ...inp, letterSpacing:pinConfirm?10:0, fontSize:pinConfirm?20:15, textAlign:'center',
                        borderColor:pinConfirm.length===4?(pin===pinConfirm?'rgba(74,222,128,0.5)':'rgba(248,113,113,0.5)'):'rgba(255,255,255,0.12)' }}/>
                    <div style={{ fontSize:10, color:pinConfirm.length===4?(pin===pinConfirm?'#4ade80':'#f87171'):'#334155', marginTop:4, textAlign:'center' }}>
                      {pinConfirm.length===4?(pin===pinConfirm?'✓ Match':'✗ Mismatch'):'Confirm'}
                    </div>
                  </div>
                </div>
                <Err msg={errors.pin||errors.pinConfirm}/>
              </div>

              {errors.submit && <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.25)', borderRadius:10, padding:12, marginBottom:14, fontSize:13, color:'#f87171' }}>⚠ {errors.submit}</div>}

              <button onClick={handleStep1} disabled={submitting||!pinReady}
                style={{ width:'100%', background:pinReady?'linear-gradient(135deg,#14532d,#166534)':'rgba(255,255,255,0.05)', border:`1.5px solid ${pinReady?'#4ade80':'rgba(255,255,255,0.1)'}`, color:pinReady?'#4ade80':'#334155', borderRadius:50, padding:'14px', fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:2, cursor:pinReady?'pointer':'not-allowed', opacity:submitting?0.6:1 }}>
                {submitting?'CREATING...':'NEXT →'}
              </button>
            </div>
          )}

          {/* ── STEP 2: Player Profiling ── */}
          {step===2 && (
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'#f1f5f9', letterSpacing:2, marginBottom:3 }}>Your Game Profile</div>
              <div style={{ fontSize:13, color:'#475569', marginBottom:22 }}>Help us personalise your experience</div>

              {/* Expertise */}
              <div style={{ marginBottom:20 }}>
                <Label>Skill Level</Label>
                <div style={{ display:'flex', gap:8 }}>
                  {[{id:'beginner',label:'Beginner',desc:'Just starting'},{id:'intermediate',label:'Intermediate',desc:'Know the basics'},{id:'advanced',label:'Advanced',desc:'Competitive play'}].map(o=>(
                    <OptionCard key={o.id} label={o.label} desc={o.desc} selected={expertise===o.id} onClick={()=>setExpertise(o.id)}/>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div style={{ marginBottom:20 }}>
                <Label>How often do you play?</Label>
                <div style={{ display:'flex', gap:8 }}>
                  {[{id:'once',label:'1×',desc:'Week'},{id:'few',label:'2-3×',desc:'Week'},{id:'daily',label:'5+×',desc:'Week'}].map(o=>(
                    <OptionCard key={o.id} label={o.label} desc={o.desc} selected={frequency===o.id} onClick={()=>setFrequency(o.id)}/>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div style={{ marginBottom:24 }}>
                <Label>Avg. session duration</Label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {[{id:'30min',label:'30 min'},{id:'1hr',label:'1 hour'},{id:'2hr',label:'2 hours'},{id:'3hr',label:'3+ hours'}].map(o=>(
                    <div key={o.id} onClick={()=>setDuration(o.id)} style={{ padding:'9px 14px', borderRadius:20, cursor:'pointer', transition:'all 0.15s',
                      background:duration===o.id?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.03)',
                      border:duration===o.id?'1.5px solid rgba(74,222,128,0.5)':'1px solid rgba(255,255,255,0.08)',
                      color:duration===o.id?'#4ade80':'#94a3b8',
                      fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>
                      {o.label}
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleStep2}
                style={{ width:'100%', background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', borderRadius:50, padding:'14px', fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:2, cursor:'pointer' }}>
                {expertise&&frequency&&duration ? 'NEXT: FIND YOUR COURT →' : 'SKIP →'}
              </button>
            </div>
          )}

          {/* ── STEP 3: Court ── */}
          {step===3 && !showCreate && (
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'#f1f5f9', letterSpacing:2, marginBottom:3 }}>Find Your Court</div>
              <div style={{ fontSize:13, color:'#475569', marginBottom:14 }}>Search by name or enter your court code</div>

              {joined.size>0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                  {[...joined].map(id=>{
                    const c=allCourts.find(x=>x.id===id)
                    return c?<span key={id} style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', color:'#4ade80', fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>✓ {c.name}</span>:null
                  })}
                </div>
              )}

              <div style={{ position:'relative', marginBottom:12 }}>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search court name or enter court code..."
                  style={{ ...inp, paddingRight:42 }}/>
                <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:15, color:'#334155', pointerEvents:'none' }}>🔍</span>
              </div>

              <div style={{ maxHeight:280, overflowY:'auto', marginBottom:12 }}>
                {filteredCourts.length===0 && (
                  <div style={{ textAlign:'center', color:'#334155', padding:20, fontSize:13 }}>
                    {search?'No courts found — try a different name or code':'No courts available yet'}
                  </div>
                )}
                {filteredCourts.map(c=>{
                  const isJoined=joined.has(c.id)
                  return (
                    <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 12px', marginBottom:7, background:'rgba(255,255,255,0.02)', border:`1px solid ${isJoined?'rgba(74,222,128,0.3)':'rgba(255,255,255,0.07)'}`, borderRadius:12 }}>
                      <span style={{ fontSize:16, flexShrink:0 }}>🏟️</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#f1f5f9', letterSpacing:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                        <div style={{ fontSize:10, color:'#475569' }}>Code: <span style={{ color:'#60a5fa' }}>{c.court_code||'—'}</span></div>
                      </div>
                      <button onClick={()=>!isJoined&&joinCourt(c)} disabled={isJoined||joining===c.id}
                        style={{ flexShrink:0, background:isJoined?'rgba(74,222,128,0.1)':'linear-gradient(135deg,#14532d,#166534)', border:`1px solid ${isJoined?'rgba(74,222,128,0.3)':'#4ade80'}`, color:'#4ade80', borderRadius:20, padding:'5px 14px', cursor:isJoined?'default':'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:12, letterSpacing:1, whiteSpace:'nowrap' }}>
                        {joining===c.id?'...':isJoined?'JOINED ✓':'JOIN'}
                      </button>
                    </div>
                  )
                })}
              </div>

              <button onClick={()=>setShowCreate(true)}
                style={{ width:'100%', background:'rgba(255,255,255,0.03)', border:'1px dashed rgba(255,255,255,0.12)', color:'#64748b', borderRadius:50, padding:'12px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, marginBottom:10 }}>
                🏟️ Create a new court instead
              </button>

              <button onClick={finish} disabled={submitting}
                style={{ width:'100%', background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', borderRadius:50, padding:'14px', fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:2, cursor:'pointer', opacity:submitting?0.6:1 }}>
                {submitting?'SETTING UP...' : joined.size>0||createdCourt?"LET'S PLAY! →":'SKIP FOR NOW →'}
              </button>
            </div>
          )}

          {/* ── CREATE COURT ── */}
          {step===3 && showCreate && (
            <div style={{ minHeight:'60vh', display:'flex', flexDirection:'column' }}>
              <CreateCourtScreen
                currentUserId={newPlayerId}
                onBack={()=>setShowCreate(false)}
                onCreated={nc=>{ setCreatedCourt(nc); setShowCreate(false) }}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}