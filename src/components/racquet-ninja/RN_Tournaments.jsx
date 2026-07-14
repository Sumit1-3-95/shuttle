// src/components/racquet-ninja/RN_Tournaments.jsx — v2
import { useState } from 'react'

const TOURNAMENTS = [
  {
    id:1, name:'Ninja Open 2025', type:'Doubles', format:'Round Robin + Knockout',
    date:'Q4 2025', prize:'🥇 Trophy + Academy Merchandise', spots:16, filled:4,
    status:'upcoming', accent:'#fbbf24',
    desc:'Racquet Ninja\'s flagship open tournament. All skill levels. Round-robin group stage followed by knockout finals. First edition — be a founding champion.',
    perks:['Free shuttle pack for all participants','Certificate of participation','Photo coverage','Rating points on Shuttle'],
  },
  {
    id:2, name:'Internal League', type:'Singles & Doubles', format:'League (4 weekends)',
    date:'Quarterly', prize:'⭐ Rating Boost + Exclusive Badge', spots:12, filled:0,
    status:'planned', accent:'#60a5fa',
    desc:'Members-only league played across 4 consecutive weekends. Best way to build your official ELO rating within the RN community.',
    perks:['Members only','Serious rating points','Leaderboard feature on Shuttle','Quarterly cycle'],
  },
  {
    id:3, name:'Beginner Cup', type:'Doubles', format:'Round Robin',
    date:'TBD', prize:'🎓 Certificate + Free Session', spots:8, filled:0,
    status:'planned', accent:'#4ade80',
    desc:'Designed for players under 1 year of experience. Low pressure, high fun. Perfect entry point into competitive badminton.',
    perks:['New players only','Friendly environment','Coach-supervised','Free coaching session for winner'],
  },
  {
    id:4, name:'Coach Challenge', type:'Doubles', format:'Special Event',
    date:'Special Event', prize:'🏆 Bragging rights', spots:8, filled:0,
    status:'planned', accent:'#f87171',
    desc:'Community members vs Racquet Ninja coaches. Who takes home the trophy? A fun, high-energy event open to all RN members.',
    perks:['All members welcome','Coaches participate','High energy format','Post-match celebration'],
  },
]

export default function RN_Tournaments({ onBack }) {
  const [interested, setInterested] = useState(new Set())
  const [expanded, setExpanded]     = useState(null)

  function toggleInterest(id) {
    setInterested(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n })
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:210, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes card-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderBottom:'1px solid rgba(251,191,36,0.12)', flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>← Back</button>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, color:'#fbbf24', letterSpacing:3 }}>TOURNAMENTS</div>
          <div style={{ fontSize:10, color:'#334155' }}>Compete. Climb. Conquer.</div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 32px' }}>
        {/* Hero banner */}
        <div style={{ position:'relative', borderRadius:20, overflow:'hidden', marginBottom:20, background:'linear-gradient(135deg,#0d1a0d,#0a0d1a)', border:'1px solid rgba(251,191,36,0.15)', padding:'20px 16px' }}>
          <div style={{ position:'absolute', top:-20, right:-20, fontSize:80, opacity:0.07 }}>🏆</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, color:'#fbbf24', letterSpacing:4, marginBottom:6 }}>RACQUET NINJA · 2025 SEASON</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:'#fff', letterSpacing:3, lineHeight:1, marginBottom:10 }}>YOUR ARENA<br/>AWAITS</div>
          <div style={{ fontSize:12, color:'#475569', lineHeight:1.6 }}>Official tournament series launching Q4 2025. Register your interest now to be first in line.</div>
          <div style={{ display:'flex', gap:12, marginTop:14 }}>
            {[{v:interested.size,l:'INTERESTED'},{v:'4',l:'EVENTS'},{v:'~40',l:'SPOTS'}].map(s=>(
              <div key={s.l} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#fbbf24' }}>{s.v}</div>
                <div style={{ fontSize:9, color:'#475569', letterSpacing:1 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tournament cards */}
        {TOURNAMENTS.map((t,i)=>{
          const isOpen     = expanded===t.id
          const isInterested = interested.has(t.id)
          const fillPct    = Math.round(t.filled/t.spots*100)
          return (
            <div key={t.id} style={{ marginBottom:12, background:'rgba(255,255,255,0.02)', border:`1px solid ${isOpen?t.accent+'44':'rgba(255,255,255,0.07)'}`, borderRadius:18, overflow:'hidden', animation:`card-in 0.3s ease-out ${i*0.06}s both` }}>
              {/* Card header */}
              <div onClick={()=>setExpanded(isOpen?null:t.id)} style={{ padding:'14px 16px', cursor:'pointer' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#f1f5f9', letterSpacing:1.5 }}>{t.name}</div>
                    <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{t.type} · {t.format}</div>
                  </div>
                  <span style={{ fontSize:9, padding:'2px 8px', borderRadius:20, background:`${t.accent}15`, color:t.accent, border:`1px solid ${t.accent}30`, fontWeight:700, flexShrink:0, marginLeft:8 }}>
                    {t.status==='upcoming'?'UPCOMING':'PLANNED'}
                  </span>
                </div>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:8 }}>
                  <span style={{ fontSize:11, color:'#64748b' }}>📅 {t.date}</span>
                  <span style={{ fontSize:11, color:t.accent }}>🏆 {t.prize}</span>
                </div>
                {/* Spots bar */}
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ flex:1, height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${fillPct}%`, background:t.accent, borderRadius:2 }}/>
                  </div>
                  <span style={{ fontSize:10, color:'#475569', flexShrink:0 }}>{t.filled}/{t.spots} spots</span>
                </div>
              </div>

              {/* Expanded details */}
              {isOpen && (
                <div style={{ padding:'0 16px 16px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize:12, color:'#64748b', lineHeight:1.6, marginTop:12, marginBottom:12 }}>{t.desc}</div>
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:9, color:'#334155', letterSpacing:2, fontWeight:700, marginBottom:8 }}>WHAT'S INCLUDED</div>
                    {t.perks.map((p,pi)=>(
                      <div key={pi} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, fontSize:12, color:'#64748b' }}>
                        <span style={{ color:t.accent, flexShrink:0 }}>✓</span> {p}
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>toggleInterest(t.id)}
                    style={{ width:'100%', padding:'11px', borderRadius:12, cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:1,
                      background:isInterested?`${t.accent}15`:'rgba(255,255,255,0.04)',
                      border:`1px solid ${isInterested?t.accent+'44':'rgba(255,255,255,0.1)'}`,
                      color:isInterested?t.accent:'#64748b' }}>
                    {isInterested ? `✓ INTERESTED — WE'LL NOTIFY YOU` : 'REGISTER INTEREST →'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}