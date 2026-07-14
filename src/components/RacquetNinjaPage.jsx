// src/components/RacquetNinjaPage.jsx
// Racquet Ninja Academy page
import { useState } from 'react'

const DRILLS = [
  { id:1, name:'Shadow Footwork', level:'Beginner', duration:'20 min', icon:'👣', desc:'Court coverage patterns without shuttle — builds muscle memory and agility.', tag:'Footwork' },
  { id:2, name:'Multi-Feed Smash', level:'Intermediate', duration:'30 min', icon:'💥', desc:'Rapid smash repetition with feeder. Focus on wrist snap and angle variation.', tag:'Smash' },
  { id:3, name:'Net Kill Drill', level:'Intermediate', duration:'20 min', icon:'🎯', desc:'Quick reflexes at the net — tight kills and tumbling drops.', tag:'Net Play' },
  { id:4, name:'Clear & Drop Rally', level:'Beginner', duration:'25 min', icon:'🏸', desc:'Alternate rear-court clears with drop shots. Builds rally stamina.', tag:'Rally' },
  { id:5, name:'Defense to Attack', level:'Advanced', duration:'35 min', icon:'⚔️', desc:'Start in defensive position, transition to attack after 3 blocks.', tag:'Defense' },
  { id:6, name:'Serve & Return', level:'Beginner', duration:'15 min', icon:'🔁', desc:'Short serve into tight net return sequences. Develops service game.', tag:'Skills' },
]

const PLAYERS = [
  { name:'Arjun Sharma', level:'Advanced', since:'Jan 2024', sessions:42 },
  { name:'Priya Nair',   level:'Intermediate', since:'Mar 2024', sessions:28 },
  { name:'Rohit Verma',  level:'Beginner', since:'May 2024', sessions:14 },
  { name:'Anita Desai',  level:'Intermediate', since:'Feb 2024', sessions:35 },
  { name:'Karan Mehta',  level:'Advanced', since:'Nov 2023', sessions:61 },
]

const LEVEL_COLORS = {
  Beginner:    { c:'#4ade80', bg:'rgba(74,222,128,0.12)',  b:'rgba(74,222,128,0.25)' },
  Intermediate:{ c:'#60a5fa', bg:'rgba(96,165,250,0.12)', b:'rgba(96,165,250,0.25)' },
  Advanced:    { c:'#f87171', bg:'rgba(248,113,113,0.12)',b:'rgba(248,113,113,0.25)' },
}

const TAG_COLORS = {
  Footwork:  '#fbbf24', Smash:'#f87171', 'Net Play':'#c084fc',
  Rally:'#60a5fa', Defense:'#34d399', Skills:'#fb923c',
}

export default function RacquetNinjaPage({ onClose }) {
  const [activeTab, setActiveTab] = useState('drills')
  const [filterLevel, setFilterLevel] = useState('All')

  const filteredDrills = filterLevel === 'All' ? DRILLS : DRILLS.filter(d => d.level === filterLevel)

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', overflowY:'auto' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes ninja-glow { 0%,100%{box-shadow:0 0 20px rgba(74,222,128,0.3),0 0 40px rgba(74,222,128,0.1)} 50%{box-shadow:0 0 40px rgba(74,222,128,0.6),0 0 80px rgba(74,222,128,0.2)} }
        @keyframes card-in { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
      `}</style>

      {/* ── Hero Header ── */}
      <div style={{ position:'relative', overflow:'hidden', flexShrink:0 }}>
        {/* Background gradient */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,#0a1628 0%,#0d1f14 50%,#060d14 100%)', zIndex:0 }}/>
        {/* Subtle grid */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.07, zIndex:0 }} viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
          <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4ade80" strokeWidth="0.5"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>

        {/* Back button */}
        <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'flex-end', padding:'14px 16px 0' }}>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>✕ Close</button>
        </div>

        {/* Ninja logo + branding */}
        <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 20px 24px' }}>
          <div style={{ width:100, height:100, borderRadius:'50%', overflow:'hidden', border:'3px solid #4ade80', animation:'ninja-glow 3s ease-in-out infinite', marginBottom:14, background:'#0a1a0a', boxShadow:'0 0 0 6px rgba(74,222,128,0.08)' }}>
            <img src="/racquet-ninja.jpg" alt="Racquet Ninja"
              style={{ width:'100%', height:'100%', objectFit:'cover' }}
              onError={e=>{ e.target.style.display='none' }}/>
          </div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:30, color:'#f1f5f9', letterSpacing:5, lineHeight:1, marginBottom:4 }}>RACQUET NINJA</div>
          <div style={{ fontSize:12, color:'#4ade80', letterSpacing:3, fontWeight:700, marginBottom:8 }}>BADMINTON ACADEMY</div>
          <div style={{ fontSize:12, color:'#475569', textAlign:'center', maxWidth:280, lineHeight:1.6 }}>
            Train smart. Move fast. Master the game.
          </div>

          {/* Quick stats */}
          <div style={{ display:'flex', gap:0, marginTop:18, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, overflow:'hidden', width:'100%', maxWidth:340 }}>
            {[{v:'6',l:'DRILLS'},{v:'5',l:'PLAYERS'},{v:'3',l:'COURTS'},{v:'Soon',l:'TOURNAMENT'}].map((s,i)=>(
              <div key={s.l} style={{ flex:1, textAlign:'center', padding:'12px 4px', borderLeft:i>0?'1px solid rgba(255,255,255,0.06)':'' }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:s.v==='Soon'?12:22, color:s.v==='Soon'?'#334155':'#4ade80', lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:9, color:'#334155', letterSpacing:1.5, fontWeight:700, marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', background:'rgba(6,13,20,0.97)', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0, position:'sticky', top:0, zIndex:10 }}>
        {[{id:'drills',label:'🥷 Drills'},{id:'players',label:'👥 Players'},{id:'tournaments',label:'🏆 Tournaments'},{id:'about',label:'ℹ️ About'}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ flex:1, padding:'11px 4px', background:'none', border:'none', borderBottom:`2px solid ${activeTab===t.id?'#4ade80':'transparent'}`, color:activeTab===t.id?'#4ade80':'#475569', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.label}</button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 32px' }}>

        {/* DRILLS */}
        {activeTab === 'drills' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            <div style={{ fontSize:11, color:'#475569', marginBottom:12, lineHeight:1.5 }}>
              Academy drills curated by Racquet Ninja coaches. Filter by level to find the right challenge.
            </div>
            {/* Level filter */}
            <div style={{ display:'flex', gap:6, marginBottom:16 }}>
              {['All','Beginner','Intermediate','Advanced'].map(l=>{
                const s = LEVEL_COLORS[l] || { c:'#4ade80', bg:'rgba(74,222,128,0.1)', b:'rgba(74,222,128,0.3)' }
                const active = filterLevel===l
                return (
                  <button key={l} onClick={()=>setFilterLevel(l)} style={{ flex:1, padding:'6px 4px', borderRadius:20, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:11, fontWeight:700,
                    background:active?s.bg:'transparent',
                    border:active?`1px solid ${s.b}`:'1px solid rgba(255,255,255,0.07)',
                    color:active?s.c:'#475569' }}>{l==='Intermediate'?'Mid':l}</button>
                )
              })}
            </div>
            {filteredDrills.map((d,i)=>(
              <div key={d.id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'14px 14px', marginBottom:10, animation:`card-in 0.3s ease-out ${i*0.05}s both` }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{ width:46, height:46, borderRadius:12, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{d.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, flexWrap:'wrap' }}>
                      <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#f1f5f9', letterSpacing:1 }}>{d.name}</span>
                      <span style={{ fontSize:9, padding:'2px 7px', borderRadius:20, background:LEVEL_COLORS[d.level].bg, color:LEVEL_COLORS[d.level].c, border:`1px solid ${LEVEL_COLORS[d.level].b}`, fontWeight:700 }}>{d.level}</span>
                      <span style={{ fontSize:9, padding:'2px 7px', borderRadius:20, background:`${TAG_COLORS[d.tag]}18`, color:TAG_COLORS[d.tag]||'#94a3b8', border:`1px solid ${TAG_COLORS[d.tag]}30`, fontWeight:700 }}>{d.tag}</span>
                    </div>
                    <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5, marginBottom:8 }}>{d.desc}</div>
                    <div style={{ fontSize:11, color:'#334155', fontWeight:700 }}>⏱ {d.duration}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PLAYERS */}
        {activeTab === 'players' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            <div style={{ fontSize:11, color:'#475569', marginBottom:16 }}>Academy-enrolled players. Track their progress.</div>
            {PLAYERS.map((p,i)=>{
              const lc = LEVEL_COLORS[p.level]
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', marginBottom:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, animation:`card-in 0.3s ease-out ${i*0.06}s both` }}>
                  <div style={{ width:42, height:42, borderRadius:'50%', background:'rgba(74,222,128,0.1)', border:`2px solid ${lc.c}44`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:lc.c, flexShrink:0 }}>
                    {p.name.charAt(0)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#f1f5f9', letterSpacing:0.5, marginBottom:3 }}>{p.name}</div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <span style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background:lc.bg, color:lc.c, border:`1px solid ${lc.b}`, fontWeight:700 }}>{p.level}</span>
                      <span style={{ fontSize:10, color:'#334155' }}>Since {p.since}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#4ade80' }}>{p.sessions}</div>
                    <div style={{ fontSize:9, color:'#334155', letterSpacing:1 }}>SESSIONS</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* TOURNAMENTS */}
        {activeTab === 'tournaments' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            {/* Coming soon hero */}
            <div style={{ textAlign:'center', padding:'32px 20px', background:'linear-gradient(135deg,rgba(74,222,128,0.06),rgba(96,165,250,0.04))', border:'1px solid rgba(74,222,128,0.15)', borderRadius:20, marginBottom:16 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🏆</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#4ade80', letterSpacing:3, marginBottom:8 }}>TOURNAMENTS COMING SOON</div>
              <div style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>Racquet Ninja is building its first inter-court tournament. Register early to lock in your spot.</div>
            </div>
            {/* Placeholder cards */}
            {[
              { name:'Ninja Open 2025', date:'Coming Soon', type:'Doubles', prize:'🥇 Trophy + Goodies', status:'upcoming' },
              { name:'Internal League', date:'Quarterly', type:'Singles + Doubles', prize:'Rating Points', status:'planned' },
              { name:'Beginner Cup', date:'TBD', type:'Doubles', prize:'Certificate', status:'planned' },
            ].map((t,i)=>(
              <div key={i} style={{ padding:'14px', marginBottom:10, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, opacity:0.7 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#f1f5f9', letterSpacing:1 }}>{t.name}</span>
                  <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(251,191,36,0.1)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.2)', fontWeight:700 }}>SOON</span>
                </div>
                <div style={{ fontSize:12, color:'#475569' }}>📅 {t.date} · {t.type}</div>
                <div style={{ fontSize:12, color:'#4ade80', marginTop:4 }}>Prize: {t.prize}</div>
              </div>
            ))}
          </div>
        )}

        {/* ABOUT */}
        {activeTab === 'about' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            <div style={{ background:'linear-gradient(135deg,rgba(74,222,128,0.06),transparent)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:20, padding:'18px 16px', marginBottom:16 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#4ade80', letterSpacing:2, marginBottom:8 }}>ABOUT RACQUET NINJA</div>
              <div style={{ fontSize:13, color:'#64748b', lineHeight:1.7 }}>
                Racquet Ninja is a professional badminton academy focused on developing players of all skill levels. Our certified coaches bring structured training to your game — from beginner footwork to advanced match tactics.
              </div>
            </div>
            {[
              { icon:'🥷', title:'Expert Coaches', desc:'Certified coaches with national-level playing experience.' },
              { icon:'📊', title:'Tracked Progress', desc:'Your sessions and improvement tracked right here on Shuttle.' },
              { icon:'🏟️', title:'Premium Courts', desc:'Well-maintained courts with proper lighting and flooring.' },
              { icon:'🎯', title:'Structured Drills', desc:'Science-backed drill programs for every level.' },
              { icon:'🤝', title:'Community', desc:'Join a competitive, supportive badminton community.' },
            ].map((item,i)=>(
              <div key={i} style={{ display:'flex', gap:12, padding:'12px 14px', marginBottom:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14 }}>
                <div style={{ fontSize:24, flexShrink:0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:'#f1f5f9', letterSpacing:1, marginBottom:3 }}>{item.title}</div>
                  <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}

            {/* Contact placeholder */}
            <div style={{ marginTop:20, background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:14, padding:'14px 16px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#4ade80', letterSpacing:2, marginBottom:6 }}>GET IN TOUCH</div>
              <div style={{ fontSize:12, color:'#475569' }}>DM us on Instagram or WhatsApp to enrol</div>
              <div style={{ fontSize:11, color:'#334155', marginTop:6 }}>@racquetninja · Coming soon</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}