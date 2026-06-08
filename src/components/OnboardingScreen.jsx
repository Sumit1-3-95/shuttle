// src/components/OnboardingScreen.jsx
// Single page onboarding — phone, name, PIN, photo, skill level, group
import { useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import bcrypt from 'bcryptjs'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');`

const SKILL_LEVELS = [
  { id:'beginner',     label:'Beginner',     icon:'🎯', desc:'Just starting out' },
  { id:'intermediate', label:'Intermediate', icon:'⚔️', desc:'Playing regularly'  },
  { id:'expert',       label:'Expert',       icon:'🔥', desc:'Competitive player'  },
]

function Field({ label, children, error }) {
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:'block', fontSize:11, color:'#64748b', letterSpacing:1.5, fontWeight:700, textTransform:'uppercase', fontFamily:"'Rajdhani',sans-serif", marginBottom:7 }}>
        {label}
      </label>
      {children}
      {error && <div style={{ fontSize:11, color:'#f87171', marginTop:4, fontFamily:"'Rajdhani',sans-serif" }}>⚠ {error}</div>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type='text', inputMode, maxLength, style={} }) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      style={{
        width:'100%', boxSizing:'border-box',
        background:'rgba(255,255,255,0.05)',
        border:'1.5px solid rgba(255,255,255,0.1)',
        borderRadius:12, padding:'13px 16px',
        color:'#f1f5f9', fontSize:16,
        fontFamily:"'Rajdhani',sans-serif", fontWeight:500,
        outline:'none', transition:'border 0.2s',
        ...style,
      }}
      onFocus={e => e.target.style.borderColor='#4ade80'}
      onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
    />
  )
}

export default function OnboardingScreen({ groups = [], onComplete }) {
  const [phone,      setPhone]      = useState('')
  const [name,       setName]       = useState('')
  const [pin,        setPin]        = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [skillLevel, setSkillLevel] = useState('')
  const [selGroups,  setSelGroups]  = useState([])
  const [photoFile,  setPhotoFile]  = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [errors,     setErrors]     = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const fileRef = useRef()

  function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setErrors(p=>({...p, photo:'Max 5MB'})); return }
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  function toggleGroup(id) {
    setSelGroups(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  function validate() {
    const e = {}
    if (!/^[0-9]{10}$/.test(phone))            e.phone      = 'Enter a valid 10-digit phone number'
    if (!name.trim() || name.trim().length < 2) e.name       = 'Name must be at least 2 characters'
    if (!/^\d{4}$/.test(pin))                   e.pin        = 'PIN must be exactly 4 digits'
    if (pin !== pinConfirm)                      e.pinConfirm = 'PINs do not match'
    if (!skillLevel)                             e.skillLevel = 'Select your skill level'
    if (!selGroups.length)                       e.groups     = 'Select at least one court'
    return e
  }

  async function handleSubmit() {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setSubmitting(true)

    try {
      // 1. Check username not taken
      const username = name.trim().toLowerCase().replace(/\s+/g, '_')
      const { data: existing } = await supabase
        .from('players')
        .select('id')
        .eq('username', username)
        .single()

      if (existing) {
        setErrors({ name: 'This name is already taken — try a variation' })
        setSubmitting(false)
        return
      }

      // 2. Upload profile picture
      let profilePicUrl = null
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `${username}_${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, photoFile, { upsert: true })

        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
          profilePicUrl = urlData?.publicUrl
        }
      }

      // 3. Hash PIN
      const pin_hash = await bcrypt.hash(pin, 10)

      // 4. Insert player
      const { data: newPlayer, error: insertErr } = await supabase
        .from('players')
        .insert({
          username,
          display_name: name.trim(),
          pin_hash,
          role: 'player',
          phone,
          skill_level: skillLevel,
          profile_pic: profilePicUrl,
          avatar_style: 'custom',
        })
        .select()
        .single()

      if (insertErr) throw insertErr

      // 5. Add to selected groups
      if (selGroups.length > 0) {
        await supabase.from('group_members').insert(
          selGroups.map(gid => ({ group_id: gid, player_id: newPlayer.id }))
        )
      }

      setDone(true)
      setTimeout(() => onComplete && onComplete(username), 2000)

    } catch (err) {
      setErrors({ submit: err.message || 'Something went wrong. Try again.' })
    }

    setSubmitting(false)
  }

  // ── Success screen ─────────────────────────────────────────
  if (done) return (
    <div style={{ minHeight:'100vh', background:'#060d14', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Rajdhani',sans-serif", padding:20 }}>
      <style>{FONTS}</style>
      <div style={{ textAlign:'center', animation:'celebrate-in 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🏸</div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:40, color:'#4ade80', letterSpacing:4, lineHeight:1, marginBottom:8 }}>
          YOU'RE IN!
        </div>
        <div style={{ fontSize:16, color:'#94a3b8' }}>
          Welcome to the court, {name}
        </div>
        <div style={{ fontSize:13, color:'#475569', marginTop:8 }}>Redirecting to login...</div>
      </div>
    </div>
  )

  // ── Onboarding form ────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'#060d14', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', position:'relative', overflow:'hidden' }}>
      <style>{`
        ${FONTS}
        @keyframes celebrate-in { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes slide-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        input::placeholder { color: #334155; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
      `}</style>

      {/* Court lines bg */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', opacity:0.06 }}>
        <svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice">
          <rect x="20" y="20" width="360" height="860" fill="none" stroke="#4ade80" strokeWidth="1.5"/>
          <line x1="200" y1="20" x2="200" y2="880" stroke="#4ade80" strokeWidth="2"/>
          <line x1="20" y1="450" x2="380" y2="450" stroke="#4ade80" strokeWidth="2"/>
          <line x1="20" y1="200" x2="380" y2="200" stroke="#4ade80" strokeWidth="1"/>
          <line x1="20" y1="700" x2="380" y2="700" stroke="#4ade80" strokeWidth="1"/>
        </svg>
      </div>

      <div style={{ position:'relative', zIndex:1, maxWidth:480, margin:'0 auto', padding:'32px 20px 80px', animation:'slide-up 0.4s ease-out' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:36, marginBottom:8 }}>🏸</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:'#4ade80', letterSpacing:5, lineHeight:1 }}>JOIN SHUTTLE</div>
          <div style={{ fontSize:13, color:'#475569', marginTop:6, fontWeight:600, letterSpacing:0.5 }}>Create your player profile</div>
        </div>


        {/* ── Name ── */}
        <Field label="Your Name · becomes your Player ID" error={errors.name}>
          <Input value={name} onChange={setName} placeholder="e.g. Arjun"/>
          {name.trim().length >= 2 && (
            <div style={{ fontSize:11, color:'#4ade80', marginTop:4, fontFamily:"'Rajdhani',sans-serif" }}>
              Player ID: @{name.trim().toLowerCase().replace(/\s+/g,'_')}
            </div>
          )}
        </Field>

        {/* ── Phone ── */}
        <Field label="Phone Number" error={errors.phone}>
          <Input value={phone} onChange={v => { if(/^\d{0,10}$/.test(v)) setPhone(v) }} placeholder="10-digit mobile number" type="tel" inputMode="numeric" maxLength={10}/>
        </Field>

        {/* ── PIN ── */}
        <Field label="Set Your 4-Digit PIN" error={errors.pin}>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1 }}>
              <Input value={pin} onChange={v => { if(/^\d{0,4}$/.test(v)) setPin(v) }} placeholder="····" type="password" inputMode="numeric" maxLength={4}
                style={{ textAlign:'center', fontSize:28, letterSpacing:8, fontFamily:"'Bebas Neue',sans-serif", color:'#4ade80' }}/>
              <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:6 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:i<pin.length?'#4ade80':'rgba(255,255,255,0.1)', boxShadow:i<pin.length?'0 0 6px #4ade80':'none', transition:'all 0.2s' }}/>
                ))}
              </div>
            </div>
            <div style={{ flex:1 }}>
              <Input value={pinConfirm} onChange={v => { if(/^\d{0,4}/.test(v)) setPinConfirm(v) }} placeholder="····" type="password" inputMode="numeric" maxLength={4}
                style={{ textAlign:'center', fontSize:28, letterSpacing:8, fontFamily:"'Bebas Neue',sans-serif", color: pinConfirm.length===4?(pin===pinConfirm?'#4ade80':'#f87171'):'#4ade80', borderColor: pinConfirm.length===4?(pin===pinConfirm?'rgba(74,222,128,0.5)':'rgba(248,113,113,0.5)'):'rgba(255,255,255,0.1)' }}/>
              {errors.pinConfirm && <div style={{ fontSize:10, color:'#f87171', marginTop:4, textAlign:'center', fontFamily:"'Rajdhani',sans-serif" }}>No match</div>}
              {pinConfirm.length===4 && pin===pinConfirm && <div style={{ fontSize:10, color:'#4ade80', marginTop:4, textAlign:'center', fontFamily:"'Rajdhani',sans-serif" }}>✓ Match</div>}
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            <span style={{ fontSize:10, color:'#334155', fontFamily:"'Rajdhani',sans-serif" }}>New PIN</span>
            <span style={{ fontSize:10, color:'#334155', fontFamily:"'Rajdhani',sans-serif" }}>Confirm PIN</span>
          </div>
        </Field>

        {/* ── Skill Level ── */}
        <Field label="Your Skill Level" error={errors.skillLevel}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {SKILL_LEVELS.map(s => (
              <div key={s.id} onClick={() => setSkillLevel(s.id)} style={{
                padding:'12px 8px', borderRadius:14, textAlign:'center', cursor:'pointer', transition:'all 0.2s',
                background: skillLevel===s.id?'rgba(74,222,128,0.12)':'rgba(255,255,255,0.03)',
                border: `1.5px solid ${skillLevel===s.id?'rgba(74,222,128,0.5)':'rgba(255,255,255,0.08)'}`,
                boxShadow: skillLevel===s.id?'0 0 16px rgba(74,222,128,0.15)':'none',
              }}>
                <div style={{ fontSize:24, marginBottom:4 }}>{s.icon}</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:1, color:skillLevel===s.id?'#4ade80':'#94a3b8', lineHeight:1, marginBottom:3 }}>{s.label}</div>
                <div style={{ fontSize:10, color:'#475569', fontFamily:"'Rajdhani',sans-serif" }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </Field>

        {/* ── Groups ── */}
        <Field label="Select Your Courts" error={errors.groups}>
          {groups.length === 0
            ? <div style={{ fontSize:13, color:'#334155', fontFamily:"'Rajdhani',sans-serif", padding:'12px', background:'rgba(255,255,255,0.02)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)' }}>No courts available — admin will add you after registration</div>
            : (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {groups.map(g => (
                  <div key={g.id} onClick={() => toggleGroup(g.id)} style={{
                    padding:'9px 18px', borderRadius:20, cursor:'pointer', transition:'all 0.2s',
                    background: selGroups.includes(g.id)?'rgba(74,222,128,0.12)':'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${selGroups.includes(g.id)?'rgba(74,222,128,0.5)':'rgba(255,255,255,0.1)'}`,
                    color: selGroups.includes(g.id)?'#4ade80':'#64748b',
                    fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700, letterSpacing:0.5,
                    display:'flex', alignItems:'center', gap:6,
                  }}>
                    {selGroups.includes(g.id) && <span style={{ fontSize:12 }}>✓</span>}
                    🏸 {g.name}
                  </div>
                ))}
              </div>
            )
          }
        </Field>

        {/* Global error */}
        {errors.submit && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:12, padding:'12px 16px', marginBottom:16, fontSize:13, color:'#fca5a5', fontFamily:"'Rajdhani',sans-serif" }}>
            ❌ {errors.submit}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width:'100%',
            background: submitting?'rgba(255,255,255,0.05)':'linear-gradient(135deg,#14532d,#166534)',
            border:`1.5px solid ${submitting?'rgba(255,255,255,0.1)':'#4ade80'}`,
            color: submitting?'#475569':'#4ade80',
            fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:4,
            padding:'17px', borderRadius:50, cursor:submitting?'not-allowed':'pointer',
            transition:'all 0.2s', marginBottom:16,
          }}>
          {submitting ? 'CREATING YOUR PROFILE...' : 'JOIN THE COURT 🏸'}
        </button>

        <div style={{ textAlign:'center', fontSize:13, color:'#334155', fontFamily:"'Rajdhani',sans-serif" }}>
          Already have an account?{' '}
          <span onClick={() => onComplete && onComplete(null)} style={{ color:'#4ade80', cursor:'pointer', fontWeight:700 }}>
            Sign in
          </span>
        </div>
      </div>
    </div>
  )
}