// src/components/racquet-ninja/RN_Schedule.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

const TYPE_STYLE = {
  coach_session:  { label:'COACH SESSION', c:'#fbbf24', bg:'rgba(251,191,36,0.1)',  b:'rgba(251,191,36,0.25)' },
  open_challenge: { label:'OPEN CHALLENGE', c:'#c084fc', bg:'rgba(192,132,252,0.1)',b:'rgba(192,132,252,0.25)' },
}

export default function RN_Schedule({ onBack, currentUserId, isMember }) {
  const [sessions, setSessions] = useState([])
  const [myRegs, setMyRegs]     = useState(new Set())
  const [loading, setLoading]   = useState(true)
  const [joining, setJoining]   = useState(null)
  const [filter, setFilter]     = useState('all')

  async function loadAll() {
    const [{ data: s }, { data: r }] = await Promise.all([
      supabase.from('rn_sessions').select('*, rn_session_registrations(player_id)').eq('is_active', true).order('scheduled_at'),
      supabase.from('rn_session_registrations').select('session_id').eq('player_id', currentUserId),
    ])
    setSessions(s||[])
    setMyRegs(new Set((r||[]).map(x=>x.session_id)))
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch
    void loadAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, [])

  async function joinSession(sessionId) {
    if (!isMember) return
    setJoining(sessionId)
    await supabase.from('rn_session_registrations').upsert({ session_id: sessionId, player_id: currentUserId })
    setMyRegs(prev => new Set([...prev, sessionId]))
    setJoining(null)
  }

  const upcoming = sessions.filter(s => new Date(s.scheduled_at) >= new Date())
  const past     = sessions.filter(s => new Date(s.scheduled_at) < new Date())
  const show     = filter==='past' ? past : upcoming

  function formatDate(dt) {
    const d = new Date(dt)
    return d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' }) + ' · ' +
           d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:210, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');`}</style>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderBottom:'1px solid rgba(192,132,252,0.1)', flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>← Back</button>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, color:'#c084fc', letterSpacing:3 }}>SCHEDULE</div>
          <div style={{ fontSize:10, color:'#334155' }}>Court sessions & open challenges</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:6, padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
        {[{id:'all',l:'Upcoming'},{id:'past',l:'Past'}].map(f=>(
          <button key={f.id} onClick={()=>setFilter(f.id)} style={{ padding:'5px 16px', borderRadius:20, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700,
            background:filter===f.id?'rgba(192,132,252,0.1)':'transparent',
            border:filter===f.id?'1px solid rgba(192,132,252,0.3)':'1px solid rgba(255,255,255,0.08)',
            color:filter===f.id?'#c084fc':'#475569' }}>{f.l}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 32px' }}>
        {loading && <div style={{ textAlign:'center', color:'#475569', padding:40 }}>Loading...</div>}

        {!loading && show.length===0 && (
          <div style={{ textAlign:'center', padding:48 }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📅</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#334155', letterSpacing:2 }}>
              {filter==='past'?'NO PAST SESSIONS':'NO SESSIONS SCHEDULED'}
            </div>
            <div style={{ fontSize:12, color:'#1e293b', marginTop:8 }}>Check back soon — coaches add sessions regularly</div>
          </div>
        )}

        {show.map((s)=>{
          const ts   = TYPE_STYLE[s.type]||TYPE_STYLE.open_challenge
          const regs = s.rn_session_registrations?.length||0
          const full = regs >= (s.max_players||8)
          const joined = myRegs.has(s.id)
          const isPast = new Date(s.scheduled_at) < new Date()
          return (
            <div key={s.id} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${joined?'rgba(192,132,252,0.3)':'rgba(255,255,255,0.07)'}`, borderRadius:16, padding:'14px', marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:ts.bg, color:ts.c, border:`1px solid ${ts.b}`, fontWeight:700 }}>{ts.label}</span>
                <span style={{ fontSize:10, color:'#334155' }}>{regs}/{s.max_players||8} players</span>
              </div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#f1f5f9', letterSpacing:1, marginBottom:6 }}>{s.title}</div>
              {s.description && <div style={{ fontSize:12, color:'#475569', marginBottom:8, lineHeight:1.5 }}>{s.description}</div>}
              <div style={{ display:'flex', gap:12, marginBottom:12, fontSize:11, color:'#475569' }}>
                {s.scheduled_at && <span>📅 {formatDate(s.scheduled_at)}</span>}
                {s.court && <span>🏟️ {s.court}</span>}
                {s.duration_mins && <span>⏱ {s.duration_mins}m</span>}
              </div>
              {!isPast && isMember && (
                <button onClick={()=>!joined&&!full&&joinSession(s.id)} disabled={joined||full||joining===s.id}
                  style={{ width:'100%', background:joined?'rgba(74,222,128,0.1)':full?'rgba(255,255,255,0.04)':'rgba(192,132,252,0.1)', border:`1px solid ${joined?'rgba(74,222,128,0.3)':full?'rgba(255,255,255,0.08)':'rgba(192,132,252,0.3)'}`, color:joined?'#4ade80':full?'#334155':'#c084fc', borderRadius:10, padding:'10px', cursor:joined||full?'default':'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:13, letterSpacing:1 }}>
                  {joining===s.id?'JOINING...' : joined?'✓ REGISTERED' : full?'SESSION FULL':'REGISTER →'}
                </button>
              )}
              {!isMember && !isPast && (
                <div style={{ fontSize:11, color:'#334155', textAlign:'center', padding:'8px', background:'rgba(255,255,255,0.03)', borderRadius:8 }}>Join RN to register for sessions</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}