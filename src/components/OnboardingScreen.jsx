// src/components/OnboardingScreen.jsx — v2
// New flow: name → PIN → court selection (search/code/create/browse) → done
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import bcrypt from 'bcryptjs'

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:'block', fontSize:11, color:'#64748b', letterSpacing:1.5, fontWeight:700, textTransform:'uppercase', marginBottom:8, fontFamily:"'Rajdhani',sans-serif" }}>{label}</label>
      {children}
      {error && <div style={{ fontSize:12, color:'#f87171', marginTop:5, fontFamily:"'Rajdhani',sans-serif" }}>⚠ {error}</div>}
    </div>
  )
}

export default function OnboardingScreen({ onComplete }) {
  const [step, setStep]             = useState(1) // 1=profile, 2=courts, 3=done
  const [name, setName]             = useState('')
  const [pin, setPin]               = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [photo, setPhoto]           = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [errors, setErrors]         = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Court step state
  const [allCourts, setAllCourts]   = useState([])
  const [courtsLoaded, setCourtsLoaded] = useState(false)
  const [courtSearch, setCourtSearch] = useState('')
  const [courtCode, setCourtCode]   = useState('')
  const [codeError, setCodeError]   = useState('')
  const [codeSuccess, setCodeSuccess] = useState('')
  const [selCourts, setSelCourts]   = useState([])
  const [courtMode, setCourtMode]   = useState('browse') // 'browse'|'code'|'create'
  // Create court
  const [newCourtName, setNewCourtName] = useState('')
  const [newCourtError, setNewCourtError] = useState('')
  const [newCourtCreated, setNewCourtCreated] = useState(null)

  // New player id stored after step 1
  const [newPlayerId, setNewPlayerId] = useState(null)

  function generateUsername(name) {
    return name.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'') + Math.floor(Math.random()*100)
  }

  function validateStep1() {
    const e = {}
    if (!name.trim())            e.name       = 'Enter your name'
    if (!/^\d{4}$/.test(pin))    e.pin        = 'PIN must be exactly 4 digits'
    if (pin !== pinConfirm)      e.pinConfirm = 'PINs do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleStep1() {
    if (!validateStep1()) return
    setSubmitting(true)
    try {
      const username = generateUsername(name)
      const pinHash  = await bcrypt.hash(pin, 10)
      let profilePic = null
      if (photo) {
        const ext  = photo.name.split('.').pop()
        const path = `avatars/${username}_${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, photo)
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
          profilePic = urlData.publicUrl
        }
      }
      const { data: newPlayer, error } = await supabase.from('players').insert({
        username, display_name: name.trim(),
        pin_hash: pinHash, profile_pic: profilePic,
        total_games:0, total_wins:0, total_losses:0,
        points_scored:0, points_conceded:0, level:1, role:'player',
      }).select().single()
      if (error) throw error
      setNewPlayerId(newPlayer.id)

      // Load courts
      const { data: courts } = await supabase.from('groups').select('*').order('name')
      setAllCourts(courts||[])
      setCourtsLoaded(true)
      setStep(2)
    } catch (err) {
      setErrors({ submit: err.message || 'Something went wrong' })
    }
    setSubmitting(false)
  }

  async function joinByCode() {
    const trimmed = courtCode.trim().toUpperCase()
    if (!trimmed) { setCodeError('Enter a court code'); return }
    setCodeError(''); setCodeSuccess('')
    const { data: court } = await supabase
      .from('groups').select('*').eq('court_code', trimmed).single()
    if (!court) { setCodeError('Court not found — check the code'); return }
    if (selCourts.find(c => c.id === court.id)) { setCodeError('Already added'); return }
    setSelCourts(prev => [...prev, court])
    setCourtCode('')
    setCodeSuccess('Added: ' + court.name)
  }

  async function createCourt() {
    const name = newCourtName.trim()
    if (!name) { setNewCourtError('Enter a court name'); return }
    const { data: existing } = await supabase.from('groups').select('id').ilike('name', name).single()
    if (existing) { setNewCourtError('A court with this name already exists'); return }
    const code = Math.random().toString(36).substring(2,8).toUpperCase()
    const { data: nc, error } = await supabase
      .from('groups').insert({ name, court_code: code, pin:'1234' }).select().single()
    if (error) { setNewCourtError(error.message); return }
    setNewCourtCreated(nc)
    setSelCourts(prev => [...prev, nc])
    setNewCourtName('')
  }

  function toggleCourt(court) {
    setSelCourts(prev =>
      prev.find(c => c.id === court.id)
        ? prev.filter(c => c.id !== court.id)
        : [...prev, court]
    )
  }

  async function handleStep2() {
    if (!selCourts.length && !window.confirm('Skip courts for now? You can join later.')) return
    setSubmitting(true)
    try {
      if (selCourts.length > 0) {
        await supabase.from('group_members').insert(
          selCourts.map(c => ({ group_id: c.id, player_id: newPlayerId }))
        )
      }
      // If user created a court, make them admin of it
      if (newCourtCreated) {
        await supabase.from('players').update({ role:'admin' }).eq('id', newPlayerId)
      }
      setStep(3)
    } catch (err) {
      setErrors({ courts: err.message })
    }
    setSubmitting(false)
  }

  const filteredCourts = allCourts.filter(c =>
    c.name.toLowerCase().includes(courtSearch.toLowerCase()) &&
    !selCourts.find(s => s.id === c.id)
  )

  // ── Step 3: Done ──
  if (step === 3) {
    return (
      <div style={{ minHeight:'100vh', background:'#060d14', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'Rajdhani',sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');`}</style>
        <div style={{ textAlign:'center', animation:'celebrate-in 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🏸</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:36, color:'#4ade80', letterSpacing:4, marginBottom:8 }}>YOU'RE IN!</div>
          <div style={{ fontSize:16, color:'#94a3b8', marginBottom:8 }}>Welcome, {name}</div>
          {selCourts.length > 0 && (
            <div style={{ fontSize:13, color:'#475569', marginBottom:24 }}>
              Joined: {selCourts.map(c=>c.name).join(', ')}
            </div>
          )}
          {newCourtCreated && (
            <div style={{ background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:12, padding:'12px 20px', marginBottom:20, fontSize:14, color:'#4ade80' }}>
              🏟️ Court created! Share code: <strong style={{ letterSpacing:2 }}>{newCourtCreated.court_code}</strong>
            </div>
          )}
          <button onClick={onComplete} style={{ background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', borderRadius:50, padding:'14px 40px', fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:3, cursor:'pointer' }}>
            GO TO LOGIN →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#060d14', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes celebrate-in{from{transform:scale(0.8);opacity:0}to{transform:scale(1);opacity:1}}
        input:focus{outline:none;border-color:#4ade80 !important;}
      `}</style>

      {/* Header */}
      <div style={{ padding:'20px 20px 0', display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize:22 }}>🏸</span>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#4ade80', letterSpacing:4 }}>SHUTTLE</span>
        <div style={{ marginLeft:'auto', fontSize:12, color:'#334155' }}>Step {step} of 2</div>
      </div>

      {/* Progress */}
      <div style={{ margin:'12px 20px', height:3, background:'rgba(255,255,255,0.06)', borderRadius:2 }}>
        <div style={{ height:'100%', width:step===1?'50%':'100%', background:'#4ade80', borderRadius:2, transition:'width 0.4s' }}/>
      </div>

      <div style={{ padding:'8px 20px 60px', maxWidth:480, margin:'0 auto' }}>

        {/* ── STEP 1: Profile ── */}
        {step === 1 && (
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:'#f1f5f9', letterSpacing:2, marginBottom:4 }}>Create Your Profile</div>
            <div style={{ fontSize:13, color:'#475569', marginBottom:24 }}>Set up your player identity</div>

            <Field label="Your Name" error={errors.name}>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Arjun Sharma"
                style={{ width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 14px', color:'#f1f5f9', fontSize:15, fontFamily:"'Rajdhani',sans-serif" }}/>
            </Field>

            <Field label="Set Your 4-Digit PIN" error={errors.pin}>
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))}
                  placeholder="••••" style={{ flex:1, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 14px', color:'#f1f5f9', fontSize:24, textAlign:'center', fontFamily:"'Bebas Neue',sans-serif", letterSpacing:8 }}/>
                <input type="password" inputMode="numeric" maxLength={4} value={pinConfirm} onChange={e=>setPinConfirm(e.target.value.replace(/\D/g,''))}
                  placeholder="••••" style={{ flex:1, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 14px', color:'#f1f5f9', fontSize:24, textAlign:'center', fontFamily:"'Bebas Neue',sans-serif", letterSpacing:8 }}/>
              </div>
              {errors.pinConfirm && <div style={{ fontSize:12, color:'#f87171' }}>⚠ {errors.pinConfirm}</div>}
            </Field>

            <Field label="Profile Photo (optional)">
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.2)', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {photoPreview ? <img src={photoPreview} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <span style={{ fontSize:24 }}>📷</span>}
                </div>
                <label style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:20, padding:'8px 16px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>
                  Choose Photo
                  <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>{
                    const f=e.target.files[0]; if(!f) return
                    setPhoto(f); const r=new FileReader(); r.onload=ev=>setPhotoPreview(ev.target.result); r.readAsDataURL(f)
                  }}/>
                </label>
              </div>
            </Field>

            {errors.submit && <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:10, padding:12, marginBottom:14, fontSize:13, color:'#f87171' }}>⚠ {errors.submit}</div>}

            <button onClick={handleStep1} disabled={submitting}
              style={{ width:'100%', background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', borderRadius:50, padding:'15px', fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:3, cursor:'pointer', opacity:submitting?0.6:1 }}>
              {submitting?'CREATING...':'NEXT: JOIN A COURT →'}
            </button>
          </div>
        )}

        {/* ── STEP 2: Courts ── */}
        {step === 2 && (
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:'#f1f5f9', letterSpacing:2, marginBottom:4 }}>Join Your Court</div>
            <div style={{ fontSize:13, color:'#475569', marginBottom:16 }}>Find your badminton group</div>

            {/* Selected courts */}
            {selCourts.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:'#4ade80', letterSpacing:1.5, fontWeight:700, marginBottom:8 }}>SELECTED COURTS</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {selCourts.map(c => (
                    <div key={c.id} onClick={()=>toggleCourt(c)} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(74,222,128,0.12)', border:'1px solid rgba(74,222,128,0.35)', borderRadius:20, padding:'5px 12px', cursor:'pointer' }}>
                      <span style={{ fontSize:13, color:'#4ade80', fontWeight:700 }}>{c.name}</span>
                      <span style={{ fontSize:11, color:'#4ade80' }}>✕</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mode tabs */}
            <div style={{ display:'flex', gap:6, marginBottom:16 }}>
              {[{id:'browse',label:'Browse'},{id:'code',label:'Enter Code'},{id:'create',label:'Create New'}].map(m => (
                <button key={m.id} onClick={()=>{ setCourtMode(m.id); setCodeError(''); setCodeSuccess('') }} style={{
                  flex:1, padding:'8px', borderRadius:10, cursor:'pointer',
                  border: courtMode===m.id?'1px solid rgba(74,222,128,0.4)':'1px solid rgba(255,255,255,0.08)',
                  background: courtMode===m.id?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.03)',
                  color: courtMode===m.id?'#4ade80':'#475569',
                  fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700,
                }}>{m.label}</button>
              ))}
            </div>

            {/* Browse */}
            {courtMode === 'browse' && (
              <div>
                <input value={courtSearch} onChange={e=>setCourtSearch(e.target.value)}
                  placeholder="Search courts..." style={{ width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', color:'#f1f5f9', fontSize:14, fontFamily:"'Rajdhani',sans-serif", marginBottom:10 }}/>
                {filteredCourts.length===0 && <div style={{ textAlign:'center', color:'#334155', padding:20, fontSize:13 }}>No courts found</div>}
                {filteredCourts.map(c => (
                  <div key={c.id} onClick={()=>toggleCourt(c)} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', marginBottom:7, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, cursor:'pointer' }}>
                    <span style={{ fontSize:18 }}>🏟️</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:'#f1f5f9' }}>{c.name}</div>
                      <div style={{ fontSize:11, color:'#475569' }}>Code: {c.court_code}</div>
                    </div>
                    <span style={{ fontSize:18, color:'#334155' }}>+</span>
                  </div>
                ))}
              </div>
            )}

            {/* Enter code */}
            {courtMode === 'code' && (
              <div>
                <input value={courtCode} onChange={e=>{ setCourtCode(e.target.value.toUpperCase()); setCodeError(''); setCodeSuccess('') }}
                  onKeyDown={e=>e.key==='Enter'&&joinByCode()}
                  placeholder="e.g. LOTUS1" maxLength={8}
                  style={{ width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:10, padding:'12px 14px', color:'#4ade80', fontSize:20, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:4, marginBottom:8 }}/>
                {codeError && <div style={{ fontSize:12, color:'#f87171', marginBottom:8 }}>⚠ {codeError}</div>}
                {codeSuccess && <div style={{ fontSize:12, color:'#4ade80', marginBottom:8 }}>✓ {codeSuccess}</div>}
                <button onClick={joinByCode} disabled={!courtCode.trim()}
                  style={{ width:'100%', background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', color:'#4ade80', borderRadius:50, padding:'12px', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2, cursor:'pointer' }}>
                  FIND COURT
                </button>
              </div>
            )}

            {/* Create new */}
            {courtMode === 'create' && (
              <div>
                <div style={{ fontSize:12, color:'#64748b', marginBottom:12, lineHeight:1.5 }}>You'll become the admin of this court. A unique code will be generated for inviting players.</div>
                <input value={newCourtName} onChange={e=>{ setNewCourtName(e.target.value); setNewCourtError('') }}
                  onKeyDown={e=>e.key==='Enter'&&createCourt()}
                  placeholder="Court name e.g. Lotus Court 3"
                  style={{ width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.4)', border:`1px solid ${newCourtError?'rgba(248,113,113,0.5)':'rgba(255,255,255,0.1)'}`, borderRadius:10, padding:'12px 14px', color:'#f1f5f9', fontSize:15, fontFamily:"'Rajdhani',sans-serif", marginBottom:8 }}/>
                {newCourtError && <div style={{ fontSize:12, color:'#f87171', marginBottom:8 }}>⚠ {newCourtError}</div>}
                {newCourtCreated && <div style={{ fontSize:12, color:'#4ade80', marginBottom:8 }}>✓ Created! Code: <strong>{newCourtCreated.court_code}</strong></div>}
                <button onClick={createCourt} disabled={!newCourtName.trim()||!!newCourtCreated}
                  style={{ width:'100%', background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', color:'#4ade80', borderRadius:50, padding:'12px', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2, cursor:'pointer' }}>
                  CREATE COURT
                </button>
              </div>
            )}

            {errors.courts && <div style={{ fontSize:12, color:'#f87171', margin:'10px 0' }}>⚠ {errors.courts}</div>}

            <button onClick={handleStep2} disabled={submitting}
              style={{ width:'100%', marginTop:20, background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', borderRadius:50, padding:'15px', fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:3, cursor:'pointer', opacity:submitting?0.6:1 }}>
              {submitting?'SAVING...':selCourts.length?'FINISH SETUP →':'SKIP FOR NOW →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}