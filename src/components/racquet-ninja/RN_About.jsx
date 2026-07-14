// src/components/racquet-ninja/RN_About.jsx
import { useState } from 'react'

const COACHES = [
  { name:'Coach Arjun', role:'Head Coach', exp:'8 years', spec:'Footwork & Defense', emoji:'🥷' },
  { name:'Coach Priya', role:'Assistant Coach', exp:'5 years', spec:'Smash & Attack', emoji:'⚡' },
]

const PROGRAMS = [
  { name:'Beginner Bootcamp', duration:'4 weeks', sessions:'2x/week', level:'Beginner', desc:'Foundation skills — grip, footwork, basic shots and court awareness.' },
  { name:'Intermediate Academy', duration:'8 weeks', sessions:'3x/week', level:'Intermediate', desc:'Rally consistency, smash power, net play and match tactics.' },
  { name:'Advanced Training', duration:'Ongoing', sessions:'4x/week', level:'Advanced', desc:'Match analysis, advanced deception, tournament preparation and fitness.' },
  { name:'Drop-In Sessions', duration:'Per session', sessions:'Flexible', level:'All Levels', desc:'Pay-per-session casual training. No commitment, just good badminton.' },
]

const LEVEL_STYLE = {
  Beginner:     { c:'#4ade80', bg:'rgba(74,222,128,0.1)',  b:'rgba(74,222,128,0.25)' },
  Intermediate: { c:'#60a5fa', bg:'rgba(96,165,250,0.1)', b:'rgba(96,165,250,0.25)' },
  Advanced:     { c:'#f87171', bg:'rgba(248,113,113,0.1)',b:'rgba(248,113,113,0.25)' },
  'All Levels': { c:'#c084fc', bg:'rgba(192,132,252,0.1)',b:'rgba(192,132,252,0.25)' },
}

export default function RN_About({ onBack }) {
  const [tab, setTab] = useState('coaches')

  return (
    <div style={{ position:'fixed', inset:0, zIndex:210, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');`}</style>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderBottom:'1px solid rgba(251,146,60,0.1)', flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>← Back</button>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, color:'#fb923c', letterSpacing:3 }}>ABOUT RACQUET NINJA</div>
      </div>

      {/* Sub tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        {[{id:'coaches',l:'Coaches'},{id:'programs',l:'Programs'},{id:'about',l:'Academy'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, padding:'11px', background:'none', border:'none', borderBottom:`2px solid ${tab===t.id?'#fb923c':'transparent'}`, color:tab===t.id?'#fb923c':'#475569', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, cursor:'pointer' }}>{t.l}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 32px' }}>

        {tab==='coaches' && (
          <div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:16, lineHeight:1.6 }}>Meet the coaches behind Racquet Ninja's training programs.</div>
            {COACHES.map((c,i)=>(
              <div key={i} style={{ display:'flex', gap:14, padding:'16px', marginBottom:12, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16 }}>
                <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(251,146,60,0.1)', border:'2px solid rgba(251,146,60,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>{c.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#f1f5f9', letterSpacing:1, marginBottom:2 }}>{c.name}</div>
                  <div style={{ fontSize:11, color:'#fb923c', fontWeight:700, marginBottom:6 }}>{c.role}</div>
                  <div style={{ display:'flex', gap:10 }}>
                    <span style={{ fontSize:11, color:'#475569' }}>🏸 {c.exp} experience</span>
                    <span style={{ fontSize:11, color:'#475569' }}>⚡ {c.spec}</span>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ background:'rgba(251,146,60,0.06)', border:'1px solid rgba(251,146,60,0.15)', borderRadius:14, padding:'14px 16px', textAlign:'center', marginTop:8 }}>
              <div style={{ fontSize:12, color:'#fb923c', fontWeight:700, marginBottom:4 }}>JOIN THE COACHING TEAM</div>
              <div style={{ fontSize:11, color:'#475569' }}>Experienced coach? We're always looking for talent. Reach out to us.</div>
            </div>
          </div>
        )}

        {tab==='programs' && (
          <div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:16, lineHeight:1.6 }}>Structured training programs for every level.</div>
            {PROGRAMS.map((p,i)=>{
              const ls = LEVEL_STYLE[p.level]||LEVEL_STYLE['All Levels']
              return (
                <div key={i} style={{ padding:'14px', marginBottom:10, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, color:'#f1f5f9', letterSpacing:1 }}>{p.name}</div>
                    <span style={{ fontSize:9, padding:'2px 7px', borderRadius:20, background:ls.bg, color:ls.c, border:`1px solid ${ls.b}`, fontWeight:700, flexShrink:0, marginLeft:8 }}>{p.level}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5, marginBottom:10 }}>{p.desc}</div>
                  <div style={{ display:'flex', gap:12 }}>
                    <span style={{ fontSize:11, color:'#475569' }}>📅 {p.duration}</span>
                    <span style={{ fontSize:11, color:'#475569' }}>🕐 {p.sessions}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab==='about' && (
          <div>
            <div style={{ background:'linear-gradient(135deg,rgba(251,146,60,0.08),transparent)', border:'1px solid rgba(251,146,60,0.15)', borderRadius:20, padding:'18px 16px', marginBottom:16 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#fb923c', letterSpacing:2, marginBottom:8 }}>OUR PHILOSOPHY</div>
              <div style={{ fontSize:13, color:'#64748b', lineHeight:1.7 }}>
                Racquet Ninja was founded on one belief — every badminton player deserves structured coaching and measurable progress. We blend structured drill work with competitive match play to develop complete players.
              </div>
            </div>
            {[
              { icon:'🥷', title:'Expert Coaching', desc:'Certified coaches with national-level playing experience and structured teaching methodology.' },
              { icon:'📊', title:'Progress Tracking', desc:'Your drills, sessions and match rating all tracked in one place through Shuttle.' },
              { icon:'🏟️', title:'Premium Courts', desc:'Well-maintained courts with professional lighting, flooring and shuttle supply.' },
              { icon:'🤝', title:'Strong Community', desc:'A tight-knit group of serious and recreational players who push each other to improve.' },
            ].map((item,i)=>(
              <div key={i} style={{ display:'flex', gap:12, padding:'12px 14px', marginBottom:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14 }}>
                <div style={{ fontSize:24, flexShrink:0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:'#f1f5f9', letterSpacing:1, marginBottom:3 }}>{item.title}</div>
                  <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop:16, background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:14, padding:'14px 16px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#4ade80', letterSpacing:2, marginBottom:6 }}>GET IN TOUCH</div>
              <div style={{ fontSize:12, color:'#475569' }}>DM us on Instagram or WhatsApp to enroll</div>
              <div style={{ fontSize:11, color:'#334155', marginTop:6 }}>@racquetninja · Contact coming soon</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}