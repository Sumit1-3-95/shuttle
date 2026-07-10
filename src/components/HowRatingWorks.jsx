// src/components/HowRatingWorks.jsx
// Interactive explainer for Shuttle's rating system
import { useState } from 'react'
import { getRatingTier } from '../utils/ratingEngine'

const TIERS = [
  { min:1800, name:'LEGEND',       color:'#ffd700', emoji:'👑', desc:'Elite competitive' },
  { min:1500, name:'ELITE',        color:'#c084fc', emoji:'💜', desc:'Tournament level' },
  { min:1300, name:'ADVANCED',     color:'#38bdf8', emoji:'🔵', desc:'Strong club player' },
  { min:1100, name:'INTERMEDIATE', color:'#4ade80', emoji:'🟢', desc:'Regular recreational' },
  { min:900,  name:'BEGINNER',     color:'#fb923c', emoji:'🟠', desc:'Learning the game' },
  { min:0,    name:'ROOKIE',       color:'#94a3b8', emoji:'⚪', desc:'Just starting out' },
]

// Interactive ELO calculator
function EloCalculator() {
  const [yourRating, setYourRating]  = useState(1000)
  const [oppRating, setOppRating]    = useState(1000)
  const [won, setWon]                = useState(true)

  const K = 24
  const expected = 1 / (1 + Math.pow(10, (oppRating - yourRating) / 400))
  const delta    = Math.round(K * ((won?1:0) - expected))
  const bonus    = won ? 3 : 0 // participation bonus mid-range
  const total    = won ? Math.max(1, delta+bonus) : Math.min(-1, delta)
  const newRating = Math.max(100, yourRating + total)

  const yourTier = getRatingTier(yourRating)
  const oppTier  = getRatingTier(oppRating)
  const newTier  = getRatingTier(newRating)

  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'18px 16px', marginBottom:20 }}>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:'#4ade80', letterSpacing:2, marginBottom:14 }}>⚡ LIVE CALCULATOR</div>

      {/* Your rating */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <span style={{ fontSize:12, color:'#64748b', fontWeight:700, letterSpacing:1 }}>YOUR RATING</span>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:yourTier.color }}>{yourRating} {yourTier.emoji}</span>
        </div>
        <input type="range" min={100} max={2000} value={yourRating}
          onChange={e=>setYourRating(Number(e.target.value))}
          style={{ width:'100%', accentColor:'#4ade80' }}/>
      </div>

      {/* Opponent rating */}
      <div style={{ marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <span style={{ fontSize:12, color:'#64748b', fontWeight:700, letterSpacing:1 }}>OPPONENT RATING</span>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:oppTier.color }}>{oppRating} {oppTier.emoji}</span>
        </div>
        <input type="range" min={100} max={2000} value={oppRating}
          onChange={e=>setOppRating(Number(e.target.value))}
          style={{ width:'100%', accentColor:'#60a5fa' }}/>
      </div>

      {/* Win/Loss toggle */}
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        <button onClick={()=>setWon(true)} style={{ flex:1, padding:'10px', borderRadius:10, cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:1,
          background:won?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.04)',
          border:won?'1.5px solid rgba(74,222,128,0.5)':'1px solid rgba(255,255,255,0.08)',
          color:won?'#4ade80':'#475569' }}>🏆 YOU WIN</button>
        <button onClick={()=>setWon(false)} style={{ flex:1, padding:'10px', borderRadius:10, cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:1,
          background:!won?'rgba(248,113,113,0.15)':'rgba(255,255,255,0.04)',
          border:!won?'1.5px solid rgba(248,113,113,0.5)':'1px solid rgba(255,255,255,0.08)',
          color:!won?'#f87171':'#475569' }}>YOU LOSE</button>
      </div>

      {/* Result */}
      <div style={{ background:'rgba(0,0,0,0.4)', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:11, color:'#475569', letterSpacing:1, marginBottom:4 }}>EXPECTED WIN CHANCE</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#f1f5f9' }}>{Math.round(expected*100)}%</div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:36,
            color: total>0?'#4ade80':'#f87171',
            textShadow: total>0?'0 0 20px rgba(74,222,128,0.4)':'0 0 20px rgba(248,113,113,0.4)' }}>
            {total>0?'+':''}{total}
          </div>
          <div style={{ fontSize:10, color:'#475569', letterSpacing:1 }}>RATING CHANGE</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:11, color:'#475569', letterSpacing:1, marginBottom:4 }}>NEW RATING</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:newTier.color }}>{newRating}</div>
          {newTier.name !== yourTier.name && (
            <div style={{ fontSize:10, color:'#ffd700', marginTop:2 }}>
              {newRating > yourRating ? '↑ ' : '↓ '}{newTier.emoji} {newTier.name}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop:10, fontSize:11, color:'#334155', textAlign:'center', fontFamily:"'Rajdhani',sans-serif" }}>
        {won
          ? total < 5  ? 'Low gain — you were expected to win'
          : total > 15 ? 'Big gain — you beat a stronger opponent!'
          : 'Fair gain for a fair match'
          : Math.abs(total) < 5 ? 'Low loss — you were expected to lose'
          : Math.abs(total) > 15 ? 'Big loss — you lost to a weaker opponent'
          : 'Fair loss for a fair match'}
      </div>
    </div>
  )
}

export default function HowRatingWorks({ onClose }) {
  const [section, setSection] = useState(0)

  const sections = [
    { id:'basics',  label:'Basics' },
    { id:'tiers',   label:'Tiers' },
    { id:'doubles', label:'Doubles' },
    { id:'calc',    label:'Try It' },
  ]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        input[type=range]{height:4px;border-radius:2px;outline:none;cursor:pointer;}
        .rule-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px 16px;margin-bottom:10px;}
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid rgba(74,222,128,0.1)', flexShrink:0 }}>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>← Back</button>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#4ade80', letterSpacing:3, lineHeight:1 }}>HOW RATING WORKS</div>
          <div style={{ fontSize:10, color:'#334155', letterSpacing:1 }}>SHUTTLE ELO SYSTEM</div>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        {sections.map((s,i) => (
          <button key={s.id} onClick={()=>setSection(i)} style={{ flex:1, padding:'11px 4px', background:'none', border:'none', borderBottom:`2px solid ${section===i?'#4ade80':'transparent'}`, color:section===i?'#4ade80':'#475569', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, cursor:'pointer' }}>{s.label}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'20px 16px' }}>

        {/* ── BASICS ── */}
        {section === 0 && (
          <div>
            {/* Hero statement */}
            <div style={{ background:'linear-gradient(135deg,rgba(74,222,128,0.1),rgba(74,222,128,0.03))', border:'1.5px solid rgba(74,222,128,0.2)', borderRadius:18, padding:'18px 16px', marginBottom:20, textAlign:'center' }}>
              <div style={{ fontSize:42, marginBottom:8 }}>♟️</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#4ade80', letterSpacing:2, marginBottom:6 }}>CHESS-STYLE ELO RATING</div>
              <div style={{ fontSize:13, color:'#94a3b8', lineHeight:1.6 }}>Your rating reflects your true skill level. Win against stronger players, gain more. Lose to weaker players, lose more.</div>
            </div>

            <div className="rule-card">
              <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ fontSize:24, flexShrink:0 }}>🎯</div>
                <div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#f1f5f9', letterSpacing:1, marginBottom:4 }}>ZERO SUM GAME</div>
                  <div style={{ fontSize:13, color:'#64748b', lineHeight:1.5 }}>Every match is a trade. What the winner gains is exactly what the loser loses. No rating is created or destroyed — only transferred.</div>
                </div>
              </div>
            </div>

            <div className="rule-card">
              <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ fontSize:24, flexShrink:0 }}>📊</div>
                <div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#f1f5f9', letterSpacing:1, marginBottom:4 }}>EXPECTED VS ACTUAL</div>
                  <div style={{ fontSize:13, color:'#64748b', lineHeight:1.5 }}>The system calculates your probability of winning before the match. Beat expectations and gain more. Fall short and lose more.</div>
                  <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[{label:"You beat a 1400",sub:"You're 1000",gain:"+28",c:"#4ade80"},{label:"You beat an 800",sub:"You're 1000",gain:"+8",c:"#4ade80"},{label:"You lose to 1400",sub:"You're 1000",loss:"-8",c:"#f87171"},{label:"You lose to 800",sub:"You're 1000",loss:"-24",c:"#f87171"}].map((e,i)=>(
                      <div key={i} style={{ background:'rgba(0,0,0,0.3)', borderRadius:10, padding:'8px 10px' }}>
                        <div style={{ fontSize:10, color:'#475569', marginBottom:2 }}>{e.sub}</div>
                        <div style={{ fontSize:11, color:'#f1f5f9', fontWeight:700, marginBottom:4 }}>{e.label}</div>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:e.c }}>{e.gain||e.loss}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rule-card">
              <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ fontSize:24, flexShrink:0 }}>🎁</div>
                <div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#f1f5f9', letterSpacing:1, marginBottom:4 }}>PARTICIPATION BONUS</div>
                  <div style={{ fontSize:13, color:'#64748b', lineHeight:1.5 }}>Early players get a bonus for building the habit. It decays as you play more.</div>
                  <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
                    {[{g:'1-10',b:'+5'},{g:'11-20',b:'+4'},{g:'21-30',b:'+3'},{g:'31-40',b:'+2'},{g:'41-50',b:'+1'},{g:'51+',b:'+0'}].map(b=>(
                      <div key={b.g} style={{ background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:8, padding:'5px 10px', textAlign:'center' }}>
                        <div style={{ fontSize:10, color:'#64748b' }}>Game {b.g}</div>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#4ade80' }}>{b.b}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rule-card">
              <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ fontSize:24, flexShrink:0 }}>📡</div>
                <div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#f1f5f9', letterSpacing:1, marginBottom:4 }}>CALIBRATION PERIOD</div>
                  <div style={{ fontSize:13, color:'#64748b', lineHeight:1.5 }}>Your first 15 games are calibration. Rating moves faster during this period to find your true level. You'll see a 📡 badge until it settles.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TIERS ── */}
        {section === 1 && (
          <div>
            <div style={{ fontSize:13, color:'#475569', marginBottom:20, lineHeight:1.6 }}>
              Six tiers define your level. Your tier badge updates automatically as your rating changes.
            </div>
            {TIERS.map((t,i) => (
              <div key={t.name} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', marginBottom:8, background:`rgba(0,0,0,0.3)`, border:`1.5px solid ${t.color}22`, borderLeft:`4px solid ${t.color}`, borderRadius:14 }}>
                <div style={{ fontSize:28, flexShrink:0 }}>{t.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:t.color, letterSpacing:1 }}>{t.name}</div>
                  <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>{t.desc}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:t.color }}>{t.min === 0 ? '< 900' : `${t.min}+`}</div>
                  <div style={{ fontSize:9, color:'#334155', letterSpacing:1 }}>RATING</div>
                </div>
              </div>
            ))}

            <div style={{ background:'rgba(255,215,0,0.06)', border:'1px solid rgba(255,215,0,0.15)', borderRadius:14, padding:'14px 16px', marginTop:8 }}>
              <div style={{ fontSize:12, color:'#ffd700', lineHeight:1.6 }}>
                💡 <strong>Fun fact:</strong> Top international badminton players would rate 2000+ on this scale. Viktor Axelsen, the world #1, would be roughly 2400.
              </div>
            </div>
          </div>
        )}

        {/* ── DOUBLES ── */}
        {section === 2 && (
          <div>
            <div className="rule-card" style={{ marginBottom:14 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#60a5fa', letterSpacing:1, marginBottom:8 }}>👥 DOUBLES FORMULA</div>
              <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6, marginBottom:12 }}>
                In doubles, your team's strength is the <strong style={{ color:'#f1f5f9' }}>average rating</strong> of both players. Both teammates gain or lose the same points.
              </div>
              {/* Visual example */}
              <div style={{ background:'rgba(0,0,0,0.4)', borderRadius:12, padding:'14px' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
                  <div style={{ flex:1, textAlign:'center' }}>
                    <div style={{ fontSize:11, color:'#64748b', marginBottom:4 }}>TEAM A</div>
                    <div style={{ fontSize:12, color:'#f1f5f9' }}>Player 1: <span style={{ color:'#4ade80' }}>1200</span></div>
                    <div style={{ fontSize:12, color:'#f1f5f9' }}>Player 2: <span style={{ color:'#4ade80' }}>800</span></div>
                    <div style={{ height:1, background:'rgba(74,222,128,0.3)', margin:'8px 0' }}/>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#4ade80' }}>AVG: 1000</div>
                  </div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#334155' }}>VS</div>
                  <div style={{ flex:1, textAlign:'center' }}>
                    <div style={{ fontSize:11, color:'#64748b', marginBottom:4 }}>TEAM B</div>
                    <div style={{ fontSize:12, color:'#f1f5f9' }}>Player 3: <span style={{ color:'#60a5fa' }}>1100</span></div>
                    <div style={{ fontSize:12, color:'#f1f5f9' }}>Player 4: <span style={{ color:'#60a5fa' }}>900</span></div>
                    <div style={{ height:1, background:'rgba(96,165,250,0.3)', margin:'8px 0' }}/>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#60a5fa' }}>AVG: 1000</div>
                  </div>
                </div>
                <div style={{ textAlign:'center', background:'rgba(74,222,128,0.08)', borderRadius:8, padding:'8px' }}>
                  <div style={{ fontSize:11, color:'#64748b', marginBottom:2 }}>IF TEAM A WINS</div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#4ade80' }}>Both get <span>+14</span> · Team B both get <span style={{color:'#f87171'}}>-14</span></div>
                </div>
              </div>
            </div>

            <div className="rule-card">
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#f1f5f9', letterSpacing:1, marginBottom:8 }}>👤 SEPARATE SINGLES RATING</div>
              <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6 }}>
                Singles and doubles are tracked separately because the skills differ. A 1v1 specialist can be unbeatable in singles but struggle in doubles — your profile shows both.
              </div>
            </div>

            <div className="rule-card">
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#fb923c', letterSpacing:1, marginBottom:8 }}>⚠️ WEAK PARTNER RISK</div>
              <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6 }}>
                Paired with a weaker partner against a strong team? You risk losing rating even in a close loss. This is intentional — it mirrors real badminton where partnerships matter.
              </div>
            </div>
          </div>
        )}

        {/* ── CALCULATOR ── */}
        {section === 3 && (
          <div>
            <div style={{ fontSize:13, color:'#475569', marginBottom:16, lineHeight:1.6 }}>
              Drag the sliders and toggle win/loss to see exactly how many rating points change hands.
            </div>
            <EloCalculator/>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'14px 16px' }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:'#f1f5f9', letterSpacing:1, marginBottom:8 }}>KEY INSIGHT</div>
              <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6 }}>
                Set yourself at 1000 and your opponent at 1000 — you both have equal odds. Now raise your opponent to 1400. Notice you lose very few points if they beat you, but gain a lot if you win. <strong style={{ color:'#f1f5f9' }}>The system rewards you for competing up.</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}