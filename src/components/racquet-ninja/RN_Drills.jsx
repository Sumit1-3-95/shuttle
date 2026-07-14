// src/components/racquet-ninja/RN_Drills.jsx — v2
// Academy Training — drill cards with detail pages
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

const SEED_DRILLS = [
  // Warmups
  { id:'w1', title:'Dynamic Warm-Up', category:'Warm-Up', level:'beginner', duration_mins:10, reps:null, calories:50, tags:['Warm-Up','Mobility'], improves:'Blood flow, joint mobility, injury prevention', description:'A full-body dynamic warm-up sequence: leg swings, arm circles, hip rotations, light jogging and lunges. Essential before any badminton session.' },
  { id:'w2', title:'Jump Rope Activation', category:'Warm-Up', level:'beginner', duration_mins:5, reps:'100 jumps', calories:40, tags:['Warm-Up','Footwork'], improves:'Coordination, calf strength, rhythm', description:'Fast-paced jump rope to get the heart rate up and activate the feet. Focus on light landings and staying on your toes — the same way you should move on court.' },
  // Footwork
  { id:'f1', title:'6-Corner Shadow Footwork', category:'Footwork', level:'beginner', duration_mins:15, reps:'3 sets × 90s', calories:120, tags:['Footwork','Endurance'], improves:'Court coverage, agility, muscle memory', description:'Shadow movement to all 6 corners of the court — front two, mid two, back two. No shuttle needed. Focus on returning to the center base after each move. Start slow, build speed.' },
  { id:'f2', title:'T-Step Side Shuffle', category:'Footwork', level:'intermediate', duration_mins:12, reps:'4 sets × 45s', calories:100, tags:['Footwork','Speed'], improves:'Lateral speed, defensive positioning', description:'Side-to-side shuffle along the baseline using a T-step pattern. Touch the line on each side. Explosive push-off from outside foot. Critical for doubles defense.' },
  // Badminton Drills
  { id:'b1', title:'Multi-Feed Smash Drill', category:'Attack', level:'intermediate', duration_mins:20, reps:'5 sets × 10 smashes', calories:160, tags:['Smash','Attack','Power'], improves:'Smash power, wrist snap, angle control', description:'Stand at rear court. Feeder sends high clears continuously. Smash each one focusing on wrist snap at point of contact. Alternate straight and cross-court angles.' },
  { id:'b2', title:'Net Kill Reflex Drill', category:'Net Play', level:'intermediate', duration_mins:15, reps:'4 sets × 12 reps', calories:110, tags:['Net Play','Reflexes'], improves:'Net reflexes, kill shot accuracy, positioning', description:'Stand at the net. Feeder pushes shuttle just above net level. React and kill it downward with a short stabbing motion. Stay on toes, racquet up at all times.' },
  { id:'b3', title:'Clear & Drop Rally', category:'Rally', level:'beginner', duration_mins:20, reps:'3 sets × 3 minutes', calories:130, tags:['Rally','Control'], improves:'Shot consistency, rally stamina, shot selection', description:'Player A hits a clear to the back, Player B hits a drop shot to the front, Player A lifts, repeat. Builds the fundamental clear-drop-lift cycle that makes up most rally patterns.' },
  { id:'b4', title:'Defense to Attack Drill', category:'Defense', level:'advanced', duration_mins:25, reps:'4 sets × 5 transitions', calories:190, tags:['Defense','Attack','Transition'], improves:'Defensive instinct, attack transition, anticipation', description:'Start in full defensive posture (wide stance, racquet down). Feeder smashes 3 times, you block. On the 4th, feeder lifts — you transition to attack and smash. Builds combat instincts.' },
  { id:'b5', title:'Drive Rally (Flat Shots)', category:'Attack', level:'intermediate', duration_mins:15, reps:'3 sets × 2 minutes', calories:140, tags:['Rally','Speed','Attack'], improves:'Flat drive speed, reaction time, wrist strength', description:'Face-to-face drive exchange with a partner. Fast, flat shots down the center. No lifting, no drops. Pure speed and control. Excellent for mixed doubles mid-court game.' },
  // Cooldown
  { id:'c1', title:'Cool-Down Stretch Routine', category:'Cool-Down', level:'beginner', duration_mins:10, reps:null, calories:20, tags:['Cool-Down','Recovery'], improves:'Flexibility, recovery, injury prevention', description:'Static stretching of all major muscle groups used in badminton: calves, hamstrings, hip flexors, shoulder rotator cuff, forearm flexors. Hold each stretch 30 seconds. Never skip this.' },
]

const CATEGORY_COLORS = {
  'Warm-Up':   { c:'#fbbf24', bg:'rgba(251,191,36,0.12)',  b:'rgba(251,191,36,0.3)' },
  'Footwork':  { c:'#60a5fa', bg:'rgba(96,165,250,0.12)', b:'rgba(96,165,250,0.3)' },
  'Attack':    { c:'#f87171', bg:'rgba(248,113,113,0.12)',b:'rgba(248,113,113,0.3)' },
  'Net Play':  { c:'#c084fc', bg:'rgba(192,132,252,0.12)',b:'rgba(192,132,252,0.3)' },
  'Rally':     { c:'#4ade80', bg:'rgba(74,222,128,0.12)', b:'rgba(74,222,128,0.3)' },
  'Defense':   { c:'#34d399', bg:'rgba(52,211,153,0.12)', b:'rgba(52,211,153,0.3)' },
  'Cool-Down': { c:'#94a3b8', bg:'rgba(148,163,184,0.12)',b:'rgba(148,163,184,0.3)' },
}

const LEVEL_COLORS = {
  beginner:     { c:'#4ade80', bg:'rgba(74,222,128,0.1)' },
  intermediate: { c:'#60a5fa', bg:'rgba(96,165,250,0.1)' },
  advanced:     { c:'#f87171', bg:'rgba(248,113,113,0.1)' },
}

// ── Drill Detail Page ──────────────────────────────────────────
function DrillDetail({ drill, onBack }) {
  const cs  = CATEGORY_COLORS[drill.category]||CATEGORY_COLORS['Rally']
  const ls  = LEVEL_COLORS[drill.level]||LEVEL_COLORS.beginner

  return (
    <div style={{ position:'fixed', inset:0, zIndex:220, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', overflowY:'auto' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');`}</style>

      {/* Hero */}
      <div style={{ background:'linear-gradient(160deg,#0a1420,#060d14)', padding:'50px 20px 24px', flexShrink:0, position:'relative' }}>
        <button onClick={onBack} style={{ position:'absolute', top:14, left:16, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>← Back</button>
        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, padding:'3px 9px', borderRadius:20, background:cs.bg, color:cs.c, border:`1px solid ${cs.b}`, fontWeight:700 }}>{drill.category}</span>
          <span style={{ fontSize:10, padding:'3px 9px', borderRadius:20, background:ls.bg, color:ls.c, fontWeight:700, textTransform:'capitalize' }}>{drill.level}</span>
        </div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:'#fff', letterSpacing:2, lineHeight:1, marginBottom:8 }}>{drill.title}</div>
        <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6 }}>{drill.description}</div>
      </div>

      <div style={{ padding:'16px 16px 40px' }}>
        {/* Quick stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:20 }}>
          {[
            { icon:'⏱', val:drill.duration_mins+'m', label:'DURATION' },
            { icon:'🔁', val:drill.reps||'Free', label:'REPS' },
            { icon:'🔥', val:drill.calories||'—', label:'CALORIES' },
          ].map(s=>(
            <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'14px 8px', textAlign:'center' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#f1f5f9', lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:9, color:'#475569', letterSpacing:1.5, marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* What it improves */}
        <div style={{ background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:16, padding:'14px 16px', marginBottom:16 }}>
          <div style={{ fontSize:9, color:'#4ade80', letterSpacing:2, fontWeight:700, marginBottom:6 }}>⚡ WHAT IT IMPROVES</div>
          <div style={{ fontSize:13, color:'#94a3b8', lineHeight:1.6 }}>{drill.improves}</div>
        </div>

        {/* Tags */}
        {drill.tags?.length>0 && (
          <div>
            <div style={{ fontSize:9, color:'#334155', letterSpacing:2, fontWeight:700, marginBottom:8 }}>TAGS</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {drill.tags.map(t=>(
                <span key={t} style={{ fontSize:11, padding:'4px 10px', borderRadius:20, background:'rgba(255,255,255,0.05)', color:'#64748b', border:'1px solid rgba(255,255,255,0.1)', fontWeight:600 }}>{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Drills Page ───────────────────────────────────────────
export default function RN_Drills({ onBack, currentUserId, isMember }) {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter]     = useState('All')
  const [drills, setDrills]     = useState(SEED_DRILLS)
  const [loading, setLoading]   = useState(false)

  // Try loading from Supabase, fall back to seed
  useEffect(() => {
    setLoading(true)
    supabase.from('rn_drills').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => {
        if (data && data.length > 0) setDrills(data)
        setLoading(false)
      })
  }, [])

  const categories = ['All', ...new Set(drills.map(d=>d.category))]
  const filtered   = filter==='All' ? drills : drills.filter(d=>d.category===filter)

  if (selected) return <DrillDetail drill={selected} onBack={()=>setSelected(null)}/>

  return (
    <div style={{ position:'fixed', inset:0, zIndex:210, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes card-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderBottom:'1px solid rgba(96,165,250,0.12)', flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>← Back</button>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, color:'#60a5fa', letterSpacing:3 }}>TRAINING</div>
          <div style={{ fontSize:10, color:'#334155' }}>{drills.length} drills · warm-up to cool-down</div>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display:'flex', gap:6, padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0, overflowX:'auto' }}>
        {categories.map(cat=>{
          const cs = CATEGORY_COLORS[cat]||{ c:'#4ade80', bg:'rgba(74,222,128,0.1)', b:'rgba(74,222,128,0.3)' }
          const active = filter===cat
          return (
            <button key={cat} onClick={()=>setFilter(cat)} style={{ flexShrink:0, padding:'5px 12px', borderRadius:20, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:11, fontWeight:700,
              background:active?cs.bg:'transparent',
              border:active?`1px solid ${cs.b}`:'1px solid rgba(255,255,255,0.07)',
              color:active?cs.c:'#475569' }}>{cat}</button>
          )
        })}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 32px' }}>
        {loading && <div style={{ textAlign:'center', color:'#475569', padding:40 }}>Loading drills...</div>}
        {filtered.map((d,i)=>{
          const cs = CATEGORY_COLORS[d.category]||CATEGORY_COLORS['Rally']
          const ls = LEVEL_COLORS[d.level]||LEVEL_COLORS.beginner
          return (
            <div key={d.id||i} onClick={()=>setSelected(d)}
              style={{ display:'flex', gap:12, padding:'14px', marginBottom:10, background:'rgba(255,255,255,0.02)', border:`1px solid rgba(255,255,255,0.07)`, borderLeft:`3px solid ${cs.c}`, borderRadius:14, cursor:'pointer', animation:`card-in 0.3s ease-out ${i*0.04}s both`, transition:'background 0.15s' }}>
              {/* Left: stats */}
              <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'center', justifyContent:'center', minWidth:44 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:cs.c, lineHeight:1 }}>{d.duration_mins}m</div>
                <div style={{ fontSize:9, color:'#334155', letterSpacing:1 }}>MINS</div>
                {d.calories && <>
                  <div style={{ fontSize:13, color:'#f87171', lineHeight:1, marginTop:4 }}>{d.calories}</div>
                  <div style={{ fontSize:9, color:'#334155', letterSpacing:1 }}>KCAL</div>
                </>}
              </div>
              <div style={{ width:1, background:'rgba(255,255,255,0.06)', flexShrink:0 }}/>
              {/* Right: info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, flexWrap:'wrap' }}>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#f1f5f9', letterSpacing:0.5 }}>{d.title}</span>
                  <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, background:cs.bg, color:cs.c, fontWeight:700, flexShrink:0 }}>{d.category}</span>
                  <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, background:ls.bg, color:ls.c, fontWeight:700, textTransform:'capitalize', flexShrink:0 }}>{d.level}</span>
                </div>
                <div style={{ fontSize:11, color:'#475569', lineHeight:1.4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{d.description}</div>
                {d.reps && <div style={{ fontSize:10, color:'#334155', marginTop:5 }}>🔁 {d.reps}</div>}
              </div>
              <div style={{ fontSize:16, color:'#1e293b', flexShrink:0, alignSelf:'center' }}>›</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}