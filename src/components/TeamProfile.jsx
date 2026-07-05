// src/components/TeamProfile.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { getAvatarUrl } from '../utils/avatars'

function getLevel(wins) {
  if (wins >= 50) return { name:'LEGEND',    aura:'#ffd700', bg:'#2a1f00', glow:'rgba(255,215,0,0.4)',   emoji:'👑' }
  if (wins >= 30) return { name:'ELITE',     aura:'#c084fc', bg:'#1a0f2e', glow:'rgba(192,132,252,0.4)', emoji:'⚡' }
  if (wins >= 15) return { name:'SMASH PRO', aura:'#38bdf8', bg:'#001f2e', glow:'rgba(56,189,248,0.4)',  emoji:'🔥' }
  if (wins >= 5)  return { name:'CONTENDER', aura:'#4ade80', bg:'#001a0f', glow:'rgba(74,222,128,0.35)', emoji:'⚔️' }
  return            { name:'ROOKIE',     aura:'#94a3b8', bg:'#111827', glow:'rgba(148,163,184,0.2)', emoji:'🎯' }
}

function Av({ id, size=48, aura='#4ade8055', profilePic=null }) {
  const [err, setErr] = useState(false)
  const src = profilePic && !err ? profilePic : getAvatarUrl(id)
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', border:'2px solid '+aura, background:'#1a2a1a', flexShrink:0 }}>
      {!err
        ? <img src={src} width={size} height={size} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setErr(true)}/>
        : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.4,color:aura}}>?</div>
      }
    </div>
  )
}

// Simple SVG bar chart
function MiniBarChart({ games, p1id, p2id }) {
  if (!games.length) return null
  const last10 = games.slice(-10)
  return (
    <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:40 }}>
      {last10.map((g, i) => {
        const won = (g.team_a_ids.includes(p1id) && g.winner_team==='A') ||
                    (g.team_b_ids.includes(p1id) && g.winner_team==='B')
        return (
          <div key={i} style={{ flex:1, borderRadius:3, background:won?'#4ade80':'#f87171', height:won?'100%':'50%', opacity:0.8, transition:'height 0.3s' }}/>
        )
      })}
    </div>
  )
}

export default function TeamProfile({ p1, p2, onBack }) {
  const [games, setGames]   = useState([])
  const [loading, setLoading] = useState(true)

  const l1 = getLevel(p1.total_wins||0)
  const l2 = getLevel(p2.total_wins||0)

  // Pick a team colour — use the higher-level player's aura
  const teamColor = (p1.total_wins||0) >= (p2.total_wins||0) ? l1.aura : l2.aura

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('is_reverted', false)
        .order('played_at', { ascending: true })
      if (!data) { setLoading(false); return }

      // Filter games where both p1 and p2 are on the same team
      const teamGames = data.filter(g => {
        const inSameA = g.team_a_ids.includes(p1.id) && g.team_a_ids.includes(p2.id)
        const inSameB = g.team_b_ids.includes(p1.id) && g.team_b_ids.includes(p2.id)
        return inSameA || inSameB
      })
      setGames(teamGames)
      setLoading(false)
    }
    load()
  }, [p1.id, p2.id])

  const wins   = games.filter(g => {
    const inA = g.team_a_ids.includes(p1.id) && g.team_a_ids.includes(p2.id)
    return g.winner_team === (inA ? 'A' : 'B')
  }).length
  const losses = games.length - wins
  const winPct = games.length > 0 ? Math.round((wins/games.length)*100) : 0

  const totalScored   = games.reduce((acc, g) => {
    const inA = g.team_a_ids.includes(p1.id)
    return acc + (inA ? g.score_a : g.score_b)
  }, 0)
  const totalConceded = games.reduce((acc, g) => {
    const inA = g.team_a_ids.includes(p1.id)
    return acc + (inA ? g.score_b : g.score_a)
  }, 0)
  const avgScore    = games.length ? Math.round(totalScored/games.length) : 0
  const avgConceded = games.length ? Math.round(totalConceded/games.length) : 0
  const pointDiff   = totalScored - totalConceded

  // Streak
  let currentStreak = 0, bestStreak = 0, temp = 0
  games.forEach(g => {
    const inA = g.team_a_ids.includes(p1.id)
    const won = g.winner_team === (inA?'A':'B')
    if (won) { temp++; bestStreak = Math.max(bestStreak, temp) }
    else temp = 0
  })
  currentStreak = temp

  // Last 5 form
  const form = games.slice(-5).map(g => {
    const inA = g.team_a_ids.includes(p1.id)
    return g.winner_team===(inA?'A':'B') ? 'W' : 'L'
  })

  // Best win margin
  const bestMargin = games.reduce((best, g) => {
    const inA = g.team_a_ids.includes(p1.id)
    const margin = (inA?g.score_a:g.score_b) - (inA?g.score_b:g.score_a)
    return margin > best ? margin : best
  }, 0)

  return (
    <div style={{ minHeight:'100vh', background:'#060d14', color:'#f1f5f9', width:'100%', fontFamily:"'Rajdhani',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');`}</style>

      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', padding:'12px 16px', display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>← Back</button>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#f1f5f9', letterSpacing:2 }}>DUO STATS</span>
      </div>

      <div style={{ padding:'16px 14px 60px' }}>

        {/* Hero card */}
        <div style={{ position:'relative', borderRadius:20, overflow:'hidden', background:'linear-gradient(160deg,#0a1a0a,#060d14)', border:'1.5px solid '+teamColor+'44', padding:'20px 16px 16px', marginBottom:20, boxShadow:'0 8px 32px '+teamColor+'22' }}>
          {/* Court bg */}
          <svg width="100%" height="100%" viewBox="0 0 420 180" preserveAspectRatio="xMidYMid slice"
            style={{ position:'absolute', inset:0, opacity:0.08 }} aria-hidden="true">
            <rect x="12" y="10" width="396" height="160" fill="none" stroke={teamColor} strokeWidth="1.5"/>
            <line x1="210" y1="10" x2="210" y2="170" stroke={teamColor} strokeWidth="2"/>
            <line x1="12" y1="85" x2="408" y2="85" stroke={teamColor} strokeWidth="1.5"/>
          </svg>

          <div style={{ position:'relative', zIndex:1 }}>
            {/* Two players */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:20, marginBottom:16 }}>
              <div style={{ textAlign:'center' }}>
                <Av id={p1.id} size={64} aura={l1.aura} profilePic={p1.profile_pic}/>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:1, marginTop:6, color:'#f1f5f9' }}>{p1.display_name}</div>
                <div style={{ fontSize:10, color:l1.aura, fontFamily:"'Rajdhani',sans-serif" }}>{l1.emoji} {l1.name}</div>
              </div>

              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:teamColor+'66', letterSpacing:2 }}>+</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:38, color:teamColor, lineHeight:1, textShadow:'0 0 20px '+teamColor+'66' }}>{winPct}%</div>
                <div style={{ fontSize:10, color:'#64748b', fontFamily:"'Rajdhani',sans-serif", letterSpacing:1 }}>WIN RATE</div>
              </div>

              <div style={{ textAlign:'center' }}>
                <Av id={p2.id} size={64} aura={l2.aura} profilePic={p2.profile_pic}/>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:1, marginTop:6, color:'#f1f5f9' }}>{p2.display_name}</div>
                <div style={{ fontSize:10, color:l2.aura, fontFamily:"'Rajdhani',sans-serif" }}>{l2.emoji} {l2.name}</div>
              </div>
            </div>

            {/* Win bar */}
            <div style={{ height:5, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden', marginBottom:6 }}>
              <div style={{ height:'100%', width:winPct+'%', background:'linear-gradient(90deg,'+teamColor+'66,'+teamColor+')', borderRadius:3, transition:'width 1s' }}/>
            </div>

            {/* Form dots */}
            {form.length > 0 && (
              <div style={{ display:'flex', gap:5, justifyContent:'center' }}>
                {form.map((r,i) => (
                  <div key={i} style={{ width:24, height:24, borderRadius:'50%', background:r==='W'?'rgba(74,222,128,0.18)':'rgba(248,113,113,0.18)', border:'1px solid '+(r==='W'?'#4ade80':'#f87171'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, fontFamily:"'Bebas Neue',sans-serif", color:r==='W'?'#4ade80':'#f87171' }}>{r}</div>
                ))}
                <div style={{ fontSize:10, color:'#334155', fontFamily:"'Rajdhani',sans-serif", alignSelf:'center', marginLeft:4 }}>last {form.length}</div>
              </div>
            )}
          </div>
        </div>

        {loading && <div style={{ textAlign:'center', color:'#334155', padding:40, fontFamily:"'Rajdhani',sans-serif" }}>Loading stats...</div>}

        {!loading && (
          <>
            {/* Core stats grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
              {[
                { label:'GAMES',  val:games.length, color:'#93c5fd' },
                { label:'WINS',   val:wins,         color:'#4ade80' },
                { label:'LOSSES', val:losses,       color:'#f87171' },
                { label:'STREAK', val:'🔥'+bestStreak, color:'#fb923c' },
              ].map(s => (
                <div key={s.label} style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'10px 4px', textAlign:'center' }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:s.color, lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontSize:9, color:'#94a3b8', fontFamily:"'Rajdhani',sans-serif", letterSpacing:1, marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Scoring */}
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:'14px', marginBottom:14 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:'#f1f5f9', letterSpacing:2, marginBottom:12 }}>📊 Scoring</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                {[
                  { label:'Avg Points Scored',   val:avgScore,    color:'#4ade80' },
                  { label:'Avg Points Conceded', val:avgConceded, color:'#f87171' },
                  { label:'Total Scored',        val:totalScored,   color:'#4ade80' },
                  { label:'Total Conceded',      val:totalConceded, color:'#f87171' },
                  { label:'Point Diff',          val:(pointDiff>=0?'+':'')+pointDiff, color:pointDiff>=0?'#4ade80':'#f87171' },
                  { label:'Best Win Margin',     val:'+'+bestMargin, color:teamColor },
                ].map(s => (
                  <div key={s.label} style={{ background:'rgba(0,0,0,0.35)', borderRadius:10, padding:'10px 10px', textAlign:'center' }}>
                    <div style={{ fontSize:10, color:'#64748b', fontFamily:"'Rajdhani',sans-serif", marginBottom:4 }}>{s.label}</div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:s.color, lineHeight:1 }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Mini bar chart — last 10 */}
              {games.length > 0 && (
                <>
                  <div style={{ fontSize:11, color:'#334155', fontFamily:"'Rajdhani',sans-serif", marginBottom:6 }}>Last {Math.min(games.length,10)} games</div>
                  <MiniBarChart games={games} p1id={p1.id} p2id={p2.id}/>
                </>
              )}
            </div>

            {/* Recent games */}
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:'14px' }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:'#f1f5f9', letterSpacing:2, marginBottom:12 }}>🏸 Recent Games</div>
              {games.length === 0 && (
                <div style={{ textAlign:'center', color:'#334155', padding:20, fontFamily:"'Rajdhani',sans-serif" }}>No games together yet</div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {games.slice(-8).reverse().map(g => {
                  const inA = g.team_a_ids.includes(p1.id)
                  const won = g.winner_team===(inA?'A':'B')
                  const own = inA?g.score_a:g.score_b
                  const opp = inA?g.score_b:g.score_a
                  const date = new Date(g.played_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})
                  const time = new Date(g.played_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
                  return (
                    <div key={g.id} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(0,0,0,0.3)', border:'1px solid '+(won?'rgba(74,222,128,0.15)':'rgba(248,113,113,0.1)'), borderRadius:12, padding:'10px 12px' }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:won?'rgba(74,222,128,0.15)':'rgba(248,113,113,0.15)', border:'1px solid '+(won?'#4ade80':'#f87171'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, fontFamily:"'Bebas Neue',sans-serif", color:won?'#4ade80':'#f87171', flexShrink:0 }}>{won?'W':'L'}</div>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#f1f5f9', letterSpacing:3, flex:1 }}>{own} — {opp}</div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:11, color:'#475569', fontFamily:"'Rajdhani',sans-serif" }}>{date}</div>
                        <div style={{ fontSize:10, color:'#334155', fontFamily:"'Rajdhani',sans-serif" }}>{time}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}