// src/components/ReportCard.jsx — v2
// Main report view with personal card + court card
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { getRatingTier, isCalibrating } from '../utils/ratingEngine'
import { getAvatarUrl } from '../utils/avatars'

function WinGauge({ pct, color, size=130 }) {
  const r = 48, cx = size/2, cy = size/2
  const circ = 2 * Math.PI * r
  const dash  = (pct / 100) * circ * 0.75
  const rotation = -225
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)"
        strokeWidth={9} strokeDasharray={`${circ*0.75} ${circ*0.25}`}
        strokeLinecap="round" transform={`rotate(${rotation} ${cx} ${cy})`}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color}
        strokeWidth={9} strokeDasharray={`${dash} ${circ - dash + circ*0.25}`}
        strokeLinecap="round" transform={`rotate(${rotation} ${cx} ${cy})`}
        style={{ filter:`drop-shadow(0 0 8px ${color}88)`, transition:'stroke-dasharray 0.6s ease' }}/>
      <text x={cx} y={cy-4} textAnchor="middle" fill={color} fontSize="26"
        fontFamily="'Bebas Neue'" letterSpacing="1">{pct}%</text>
      <text x={cx} y={cy+16} textAnchor="middle" fill="rgba(255,255,255,0.35)"
        fontSize="8" fontFamily="'Rajdhani'" fontWeight="700" letterSpacing="2">WIN RATE</text>
    </svg>
  )
}

function MiniRatingChart({ history, color }) {
  if (!history || history.length < 2) return null
  const vals = history.map(h => h.rating_after)
  const min  = Math.min(...vals) - 20
  const max  = Math.max(...vals) + 20
  const w = 200, h = 50
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w
    const y = h - ((v - min) / (max - min)) * h
    return `${x},${y}`
  }).join(' ')
  const last = vals[vals.length - 1]
  const first = vals[0]
  const delta = last - first
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:2, fontWeight:700 }}>RATING TREND</span>
        <span style={{ fontSize:11, color:delta>=0?'#4ade80':'#f87171', fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1 }}>{delta>=0?'+':''}{delta} pts</span>
      </div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ width:'100%', height:50 }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ filter:`drop-shadow(0 0 4px ${color}66)` }}/>
        {/* Fill area */}
        <polygon points={`0,${h} ${pts} ${w},${h}`} fill={color} opacity="0.08"/>
        {/* Last point dot */}
        {vals.length ? (
          <circle cx={(vals.length-1)/(vals.length-1)*w} cy={h-((last-min)/(max-min))*h} r="3" fill={color}/>
        ) : null}
      </svg>
    </div>
  )
}

// ── Rating Gauge ──────────────────────────────────────────────
function RatingGauge({ rating, tier, calibrating, size=130 }) {
  const pct  = Math.min(100, Math.round(((rating - 100) / (2000 - 100)) * 100))
  const r    = 48, cx = size/2, cy = size/2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ * 0.75
  const rotation = -225
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)"
        strokeWidth={9} strokeDasharray={`${circ*0.75} ${circ*0.25}`}
        strokeLinecap="round" transform={`rotate(${rotation} ${cx} ${cy})`}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={tier.color}
        strokeWidth={9} strokeDasharray={`${dash} ${circ - dash + circ*0.25}`}
        strokeLinecap="round" transform={`rotate(${rotation} ${cx} ${cy})`}
        style={{ filter:`drop-shadow(0 0 8px ${tier.color}88)`, transition:'stroke-dasharray 0.6s ease' }}/>
      {calibrating ? (
        <>
          <text x={cx} y={cy-2} textAnchor="middle" fill={tier.color} fontSize="20" fontFamily="'Bebas Neue'" letterSpacing="1">?</text>
          <text x={cx} y={cy+14} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="'Rajdhani'" fontWeight="700" letterSpacing="1.5">CALIBRATING</text>
        </>
      ) : (
        <>
          <text x={cx} y={cy-4} textAnchor="middle" fill={tier.color} fontSize="22" fontFamily="'Bebas Neue'" letterSpacing="1">{rating}</text>
          <text x={cx} y={cy+13} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="'Rajdhani'" fontWeight="700" letterSpacing="2">ELO RATING</text>
          <text x={cx} y={cy+24} textAnchor="middle" fill={tier.color} fontSize="8" fontFamily="'Rajdhani'" fontWeight="700">{tier.emoji} {tier.name}</text>
        </>
      )}
    </svg>
  )
}

function getBragLine(wins, losses, games, streak, ratingDelta) {
  if (streak >= 5) return `🔥 On fire — ${streak} wins in a row!`
  if (ratingDelta >= 50) return `📈 Rating soared +${ratingDelta} this period`
  if (wins > 0 && losses === 0) return `✨ Unbeaten — ${wins}W clean sheet!`
  if (games === 0) return `🏸 No games yet — get on court!`
  const wr = Math.round(wins/games*100)
  if (wr >= 70) return `🎯 Elite form — ${wr}% win rate`
  if (wr >= 50) return `⬆️ Positive record — keep going`
  if (streak > 0) return `💪 On a ${streak}-game win run`
  return `💡 ${games} battles fought this period`
}

// ── Personal Card ─────────────────────────────────────────────
function PersonalCard({ player, periodGames, ratingHistory, drillSessions, getPeriodStart, allGames, currentUserId, period, courtName, playerMap }) {
  const myGames = periodGames.filter(g =>
    g.team_a_ids?.includes(currentUserId) || g.team_b_ids?.includes(currentUserId)
  )
  const myWins    = myGames.filter(g => g.winner_team === (g.team_a_ids?.includes(currentUserId)?'A':'B')).length
  const myLosses  = myGames.length - myWins
  const myPct     = myGames.length > 0 ? Math.round(myWins/myGames.length*100) : 0
  const myScored  = myGames.reduce((a,g) => a+(g.team_a_ids?.includes(currentUserId)?g.score_a:g.score_b), 0)
  const rDelta    = myGames.reduce((a,g) => a+((g.team_a_ids?.includes(currentUserId)?g.rating_delta_a:g.rating_delta_b)||0), 0)
  let streak = 0
  for (const g of [...myGames].reverse()) {
    if (g.winner_team===(g.team_a_ids?.includes(currentUserId)?'A':'B')) streak++
    else break
  }
  const rating = player?.rating_doubles || 1000
  const tier   = getRatingTier(rating)
  const calib  = isCalibrating(player?.rating_doubles_games||0)
  const formGames = myGames.slice(-8)

  // Best Duo — from ALL games, not just period
  const duoMap = {}
  allGames.filter(g => g.team_a_ids?.includes(currentUserId)||g.team_b_ids?.includes(currentUserId)).forEach(g => {
    const myTeam = g.team_a_ids?.includes(currentUserId) ? g.team_a_ids : g.team_b_ids
    const won    = g.winner_team === (g.team_a_ids?.includes(currentUserId)?'A':'B')
    const partner = myTeam.find(id => id !== currentUserId)
    if (!partner) return
    if (!duoMap[partner]) duoMap[partner] = { wins:0, games:0 }
    duoMap[partner].games++
    if (won) duoMap[partner].wins++
  })
  const bestDuoEntry = Object.entries(duoMap).sort((a,b)=>b[1].wins-a[1].wins)[0]
  const bestDuoPlayer = bestDuoEntry ? playerMap[bestDuoEntry[0]] : null
  const bestDuoStats  = bestDuoEntry ? bestDuoEntry[1] : null

  const brag = getBragLine(myWins, myLosses, myGames.length, streak, rDelta)
  const periodLabel = period==='today'?'TODAY':period==='week'?'THIS WEEK':'THIS MONTH'

  return (
    <div style={{ width:360, background:'linear-gradient(160deg,#0d1f14 0%,#060d14 55%,#0a0a14 100%)', borderRadius:24, overflow:'hidden', position:'relative', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', flexShrink:0 }}>
      <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.06,pointerEvents:'none' }} viewBox="0 0 360 620" preserveAspectRatio="xMidYMid slice">
        <rect x="18" y="18" width="324" height="584" fill="none" stroke="#4ade80" strokeWidth="1.5"/>
        <line x1="180" y1="18" x2="180" y2="602" stroke="#4ade80" strokeWidth="1.5"/>
        <line x1="18" y1="310" x2="342" y2="310" stroke="#4ade80" strokeWidth="1"/>
        <ellipse cx="180" cy="310" rx="60" ry="60" fill="none" stroke="#4ade80" strokeWidth="1"/>
        <line x1="18" y1="110" x2="342" y2="110" stroke="#4ade80" strokeWidth="0.8"/>
        <line x1="18" y1="510" x2="342" y2="510" stroke="#4ade80" strokeWidth="0.8"/>
      </svg>
      <div style={{ height:3, background:'linear-gradient(90deg,transparent,#4ade80,transparent)' }}/>
      <div style={{ padding:'18px 20px 22px', position:'relative', zIndex:1 }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:9, color:'#4ade80', letterSpacing:4, fontWeight:700, marginBottom:4 }}>🏸 SHUTTLE · {periodLabel}</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:'#fff', letterSpacing:2, lineHeight:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{player?.display_name||'PLAYER'}</div>
            <div style={{ display:'flex', gap:5, marginTop:5, flexWrap:'wrap' }}>
              <span style={{ fontSize:10, padding:'2px 9px', borderRadius:20, background:`${tier.color}20`, border:`1px solid ${tier.color}44`, color:tier.color, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1 }}>{tier.emoji} {calib?'CALIBRATING':tier.name}</span>
              <span style={{ fontSize:10, padding:'2px 9px', borderRadius:20, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.45)', fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1 }}>{calib?'?':rating} ELO</span>
            </div>
          </div>
          <div style={{ width:54, height:54, borderRadius:'50%', overflow:'hidden', border:`2.5px solid ${tier.color}`, boxShadow:`0 0 18px ${tier.color}44`, background:'#1a2a1a', flexShrink:0, marginLeft:10 }}>
            <img src={player?.profile_pic||getAvatarUrl(currentUserId)} style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={e=>{e.target.onerror=null;e.target.src=getAvatarUrl(currentUserId)}}/>
          </div>
        </div>
        {/* Dual gauges */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:8, color:'rgba(255,255,255,0.25)', letterSpacing:2, fontWeight:700, marginBottom:2 }}>WIN RATE</div>
            <WinGauge pct={myPct} color={myPct>=60?'#4ade80':myPct>=40?'#fbbf24':'#f87171'} size={130}/>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:8, color:'rgba(255,255,255,0.25)', letterSpacing:2, fontWeight:700, marginBottom:2 }}>RATING</div>
            <RatingGauge rating={rating} tier={tier} calibrating={calib} size={130}/>
          </div>
        </div>
        {/* Stats — now a horizontal row below gauges */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:12 }}>
          {[{v:myWins,l:'WINS',c:'#4ade80'},{v:myLosses,l:'LOSSES',c:'#f87171'},{v:myGames.length,l:'PLAYED',c:'#93c5fd'},{v:myScored,l:'PTS',c:'#fbbf24'}].map(s=>(
            <div key={s.l} style={{ textAlign:'center', background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'6px 2px', border:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:s.c, lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:8, color:'rgba(255,255,255,0.3)', letterSpacing:1, fontWeight:700, marginTop:1 }}>{s.l}</div>
            </div>
          ))}
        </div>
        {/* Rating delta */}
        {myGames.length ? (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'7px 12px', marginBottom:12 }}>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:1 }}>RATING CHANGE</span>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:rDelta>=0?'#4ade80':'#f87171' }}>{rDelta>=0?'+':''}{rDelta} pts</span>
          </div>
        ) : null}
        {/* Rating chart */}
        {ratingHistory?.length >= 2 && <MiniRatingChart history={ratingHistory} color={tier.color}/>}
        {/* Brag line */}
        <div style={{ background:'linear-gradient(135deg,rgba(74,222,128,0.1),rgba(74,222,128,0.04))', border:'1px solid rgba(74,222,128,0.18)', borderRadius:10, padding:'9px 12px', marginBottom:12, textAlign:'center' }}>
          <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:700 }}>{brag}</div>
        </div>
        {/* Drills summary */}
        {(()=>{
          const start = getPeriodStart()
          const periodDrills = drillSessions ? drillSessions.filter(s => new Date(s.session_date+'T00:00:00') >= start) : []
          if (periodDrills.length === 0) return null
          const totalMins = periodDrills.reduce((a,s)=>a+s.duration_mins, 0)
          const totalCal  = periodDrills.reduce((a,s)=>a+Math.round((s.drills?.calories_per_min||6)*s.duration_mins), 0)
          return (
            <div style={{ background:'rgba(96,165,250,0.07)', border:'1px solid rgba(96,165,250,0.18)', borderRadius:10, padding:'9px 12px', marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ fontSize:18, flexShrink:0 }}>🏋️</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:9, color:'#60a5fa', letterSpacing:2, fontWeight:700, marginBottom:2 }}>DRILLS THIS PERIOD</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#f1f5f9', letterSpacing:0.5 }}>{periodDrills.length} session{periodDrills.length!==1?'s':''}</div>
              </div>
              <div style={{ display:'flex', gap:10, flexShrink:0 }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#60a5fa' }}>{totalMins}m</div>
                  <div style={{ fontSize:8, color:'rgba(96,165,250,0.5)', letterSpacing:1 }}>TRAINED</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#fb923c' }}>{totalCal}</div>
                  <div style={{ fontSize:8, color:'rgba(251,146,60,0.5)', letterSpacing:1 }}>CALORIES</div>
                </div>
              </div>
            </div>
          )
        })()}
        {/* Best Duo */}
        {bestDuoPlayer && (
          <div style={{ background:'rgba(255,215,0,0.06)', border:'1px solid rgba(255,215,0,0.15)', borderRadius:10, padding:'9px 12px', marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontSize:16, flexShrink:0 }}>🤝</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:9, color:'#ffd700', letterSpacing:2, fontWeight:700, marginBottom:2 }}>BEST DUO PARTNER</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:'#ffd700', letterSpacing:1 }}>{bestDuoPlayer.display_name}</div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#ffd700' }}>{bestDuoStats.wins}W</div>
              <div style={{ fontSize:9, color:'rgba(255,215,0,0.5)' }}>{bestDuoStats.games} together</div>
            </div>
          </div>
        )}
        {/* Form dots */}
        {formGames.length ? (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:2, fontWeight:700, marginBottom:5 }}>RECENT FORM</div>
            <div style={{ display:'flex', gap:4 }}>
              {formGames.map((g,i)=>{
                const inA=g.team_a_ids?.includes(currentUserId)
                const won=g.winner_team===(inA?'A':'B')
                return <div key={i} style={{ flex:1, height:26, borderRadius:6, background:won?'rgba(74,222,128,0.18)':'rgba(248,113,113,0.12)', border:`1px solid ${won?'#4ade80':'#f87171'}33`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:12, color:won?'#4ade80':'#f87171' }}>{won?'W':'L'}</span>
                </div>
              })}
            </div>
          </div>
        ) : null}
        {/* Footer */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          {courtName&&<span style={{ fontSize:9, color:'rgba(255,255,255,0.2)', letterSpacing:1 }}>🏟️ {courtName}</span>}
          <span style={{ fontSize:9, color:'rgba(74,222,128,0.35)', letterSpacing:3, fontWeight:700, fontFamily:"'Bebas Neue',sans-serif", marginLeft:'auto' }}>SHUTTLE-ALPHA.APP</span>
        </div>
      </div>
      <div style={{ height:2, background:'linear-gradient(90deg,transparent,#4ade8033,transparent)' }}/>
    </div>
  )
}

// ── Court Card ────────────────────────────────────────────────
function CourtCard({ courtName, players, periodGames, period, playerMap, getPeriodStart, drillSessions }) {
  const periodLabel = period==='today'?'TODAY':period==='week'?'THIS WEEK':'THIS MONTH'

  const pStats = players.map(p => {
    const pg = periodGames.filter(g=>g.team_a_ids?.includes(p.id)||g.team_b_ids?.includes(p.id))
    const wins = pg.filter(g=>g.winner_team===(g.team_a_ids?.includes(p.id)?'A':'B')).length
    return {...p, pg:pg.length, wins, pct:pg.length>0?Math.round(wins/pg.length*100):0}
  }).filter(p=>p.pg).sort((a,b)=>b.wins-a.wins||b.pct-a.pct).slice(0,5)

  const totalGames   = periodGames.length
  const totalPlayers = pStats.length
  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣']

  // Best Duo — sort by wins only
  const duos = {}
  periodGames.forEach(g => {
    [{ids:[...g.team_a_ids||[]].sort(), won:g.winner_team==='A'},{ids:[...g.team_b_ids||[]].sort(), won:g.winner_team==='B'}].forEach(({ids,won})=>{
      if (ids.length < 2) return
      const k=ids.join('|')
      if (!duos[k]) duos[k]={ids,wins:0,games:0}
      duos[k].games++
      if (won) duos[k].wins++
    })
  })
  const bestDuo = Object.values(duos).sort((a,b)=>b.wins-a.wins)[0]||null

  // Best Rivals — pair with most games against each other AND closest win split
  const h2h = {}
  periodGames.forEach(g => {
    const wIds = g.winner_team==='A'?g.team_a_ids:g.team_b_ids
    const lIds = g.winner_team==='A'?g.team_b_ids:g.team_a_ids
    wIds?.forEach(w => lIds?.forEach(l => {
      const k=[w,l].sort().join('|')
      if (!h2h[k]) h2h[k]={p1:w,p2:l,p1wins:0,p2wins:0,games:0}
      h2h[k].games++
      if (h2h[k].p1===w) h2h[k].p1wins++
      else h2h[k].p2wins++
    }))
  })
  const bestRivalry = Object.values(h2h).filter(r=>r.games>=2).sort((a,b)=>b.games-a.games)[0]||null

  return (
    <div style={{ width:360, background:'linear-gradient(160deg,#0d1420 0%,#060d14 55%,#0a0d1a 100%)', borderRadius:24, overflow:'hidden', position:'relative', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', flexShrink:0 }}>
      <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.06,pointerEvents:'none' }} viewBox="0 0 360 560" preserveAspectRatio="xMidYMid slice">
        <rect x="18" y="18" width="324" height="524" fill="none" stroke="#60a5fa" strokeWidth="1.5"/>
        <line x1="180" y1="18" x2="180" y2="542" stroke="#60a5fa" strokeWidth="1.5"/>
        <line x1="18" y1="280" x2="342" y2="280" stroke="#60a5fa" strokeWidth="1"/>
        <ellipse cx="180" cy="280" rx="55" ry="55" fill="none" stroke="#60a5fa" strokeWidth="1"/>
      </svg>
      <div style={{ height:3, background:'linear-gradient(90deg,transparent,#60a5fa,transparent)' }}/>
      <div style={{ padding:'18px 20px 22px', position:'relative', zIndex:1 }}>
        {/* Header */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:9, color:'#60a5fa', letterSpacing:4, fontWeight:700, marginBottom:4 }}>🏟️ SHUTTLE · {periodLabel}</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'#fff', letterSpacing:2, lineHeight:1 }}>{courtName||'COURT REPORT'}</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:3 }}>{totalGames} matches · {totalPlayers} active players</div>
        </div>
        {/* Leaderboard */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:2, fontWeight:700, marginBottom:7 }}>⚔️ LEADERBOARD</div>
          {pStats.map((p,i)=>(
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:9, padding:'6px 10px', marginBottom:4, background:'rgba(255,255,255,0.03)', borderRadius:9, border:'1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize:i<3?15:10, width:22, textAlign:'center', flexShrink:0 }}>{medals[i]}</span>
              <div style={{ width:28, height:28, borderRadius:'50%', overflow:'hidden', border:`1.5px solid ${getRatingTier(p.rating_doubles||1000).color}`, background:'#1a2a1a', flexShrink:0 }}>
                <img src={p.profile_pic||getAvatarUrl(p.id)} width={28} height={28} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.src=getAvatarUrl(p.id)}/>
              </div>
              <span style={{ flex:1, fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.display_name}</span>
              <span style={{ fontSize:11, color:'#4ade80', fontFamily:"'Bebas Neue',sans-serif", fontWeight:700 }}>{p.wins}W</span>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontFamily:"'Bebas Neue',sans-serif", minWidth:30, textAlign:'right' }}>{p.pct}%</span>
            </div>
          ))}
          {pStats.length===0&&<div style={{textAlign:'center',color:'rgba(255,255,255,0.15)',fontSize:12,padding:16}}>No games this period</div>}
        </div>
        {/* Drills summary */}
        {(()=>{
          const start = getPeriodStart()
          const periodDrills = drillSessions ? drillSessions.filter(s => new Date(s.session_date+'T00:00:00') >= start) : []
          if (periodDrills.length === 0) return null
          const totalMins = periodDrills.reduce((a,s)=>a+s.duration_mins, 0)
          const totalCal  = periodDrills.reduce((a,s)=>a+Math.round((s.drills?.calories_per_min||6)*s.duration_mins), 0)
          return (
            <div style={{ background:'rgba(96,165,250,0.07)', border:'1px solid rgba(96,165,250,0.18)', borderRadius:10, padding:'9px 12px', marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ fontSize:18, flexShrink:0 }}>🏋️</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:9, color:'#60a5fa', letterSpacing:2, fontWeight:700, marginBottom:2 }}>DRILLS THIS PERIOD</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#f1f5f9', letterSpacing:0.5 }}>{periodDrills.length} session{periodDrills.length!==1?'s':''}</div>
              </div>
              <div style={{ display:'flex', gap:10, flexShrink:0 }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#60a5fa' }}>{totalMins}m</div>
                  <div style={{ fontSize:8, color:'rgba(96,165,250,0.5)', letterSpacing:1 }}>TRAINED</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#fb923c' }}>{totalCal}</div>
                  <div style={{ fontSize:8, color:'rgba(251,146,60,0.5)', letterSpacing:1 }}>CALORIES</div>
                </div>
              </div>
            </div>
          )
        })()}
        {/* Best Duo */}
        {bestDuo && playerMap[bestDuo.ids[0]] && playerMap[bestDuo.ids[1]] && (
          <div style={{ background:'rgba(255,215,0,0.07)', border:'1px solid rgba(255,215,0,0.18)', borderRadius:12, padding:'10px 12px', marginBottom:10 }}>
            <div style={{ fontSize:9, color:'#ffd700', letterSpacing:2, fontWeight:700, marginBottom:6 }}>🏆 BEST DUO</div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ display:'flex' }}>
                {bestDuo.ids.map((id,i)=>(
                  <div key={id} style={{ width:32, height:32, borderRadius:'50%', overflow:'hidden', border:'2px solid #ffd700', marginLeft:i?-8:0, background:'#1a2a1a' }}>
                    <img src={playerMap[id]?.profile_pic||getAvatarUrl(id)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  </div>
                ))}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#ffd700', letterSpacing:1 }}>
                  {playerMap[bestDuo.ids[0]]?.display_name?.split(' ')[0]} + {playerMap[bestDuo.ids[1]]?.display_name?.split(' ')[0]}
                </div>
                <div style={{ fontSize:10, color:'rgba(255,215,0,0.5)' }}>{bestDuo.games} games together</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#ffd700' }}>{bestDuo.wins}W</div>
                <div style={{ fontSize:9, color:'rgba(255,215,0,0.4)' }}>{bestDuo.games ? Math.round(bestDuo.wins/bestDuo.games*100) : 0}%</div>
              </div>
            </div>
          </div>
        )}
        {/* Best Rivalry */}
        {bestRivalry && playerMap[bestRivalry.p1] && playerMap[bestRivalry.p2] && (
          <div style={{ background:'rgba(248,113,113,0.07)', border:'1px solid rgba(248,113,113,0.18)', borderRadius:12, padding:'10px 12px', marginBottom:14 }}>
            <div style={{ fontSize:9, color:'#f87171', letterSpacing:2, fontWeight:700, marginBottom:6 }}>⚔️ BIGGEST RIVALRY</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', overflow:'hidden', border:'2px solid #f87171', margin:'0 auto 4px', background:'#1a2a1a' }}>
                  <img src={playerMap[bestRivalry.p1]?.profile_pic||getAvatarUrl(bestRivalry.p1)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                </div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:12, color:'#f1f5f9' }}>{playerMap[bestRivalry.p1]?.display_name?.split(' ')[0]}</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#f87171' }}>{bestRivalry.p1wins}</div>
              </div>
              <div style={{ textAlign:'center', flexShrink:0 }}>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', letterSpacing:1, marginBottom:2 }}>WINS</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#334155' }}>VS</div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', letterSpacing:1, marginTop:2 }}>{bestRivalry.games} CLASHES</div>
              </div>
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', overflow:'hidden', border:'2px solid #f87171', margin:'0 auto 4px', background:'#1a2a1a' }}>
                  <img src={playerMap[bestRivalry.p2]?.profile_pic||getAvatarUrl(bestRivalry.p2)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                </div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:12, color:'#f1f5f9' }}>{playerMap[bestRivalry.p2]?.display_name?.split(' ')[0]}</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#f87171' }}>{bestRivalry.p2wins}</div>
              </div>
            </div>
          </div>
        )}
        <div style={{ textAlign:'center' }}>
          <span style={{ fontSize:9, color:'rgba(96,165,250,0.35)', letterSpacing:3, fontWeight:700, fontFamily:"'Bebas Neue',sans-serif" }}>SHUTTLE-ALPHA.APP</span>
        </div>
      </div>
      <div style={{ height:2, background:'linear-gradient(90deg,transparent,#60a5fa33,transparent)' }}/>
    </div>
  )
}

// ── Main ReportCard ────────────────────────────────────────────
export default function ReportCard({ players, currentUserId, groups, activeGroup }) {
  const [period, setPeriod]     = useState('week')
  const [cardType, setCardType] = useState('personal')
  const [allGames, setAllGames] = useState([])
  const [ratingHistory, setRatingHistory] = useState([])
  const [drillSessions, setDrillSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [sharing, setSharing]   = useState(false)
  const cardRef = useRef(null)

  const allowedIds = new Set((players||[]).map(p=>p.id))
  const playerMap  = Object.fromEntries((players||[]).map(p=>[p.id,p]))

  useEffect(() => {
    Promise.all([
      supabase.from('games').select('*').eq('is_reverted',false).order('played_at',{ascending:false}),
      supabase.from('rating_history').select('*').eq('player_id',currentUserId).eq('game_type','doubles').order('created_at',{ascending:true}).limit(30),
      supabase.from('drill_sessions').select('*, drill_participants!inner(player_id), drills(name,category,calories_per_min)').eq('drill_participants.player_id',currentUserId).order('session_date',{ascending:false}).limit(30),
    ]).then(([{data:g},{data:rh},{data:ds}]) => {
      setAllGames((g||[]).filter(x=>[...(x.team_a_ids||[]),...(x.team_b_ids||[])].every(id=>allowedIds.has(id))))
      setRatingHistory(rh||[])
      setDrillSessions(ds||[])
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when players list identity changes
  }, [players])

  function getPeriodStart() {
    const now = new Date()
    if (period==='today') { const s=new Date(now); s.setHours(0,0,0,0); return s }
    if (period==='week')  { const s=new Date(now); s.setDate(now.getDate()-((now.getDay()+6)%7)); s.setHours(0,0,0,0); return s }
    return new Date(now.getFullYear(),now.getMonth(),1)
  }

  const periodGames = allGames.filter(g => new Date(g.played_at) >= getPeriodStart())
  const me = players.find(p => p.id === currentUserId)
  const courtName = groups?.find(g=>g.id===activeGroup)?.name

  async function handleShare() {
    setSharing(true)
    try {
      if (navigator.share) {
        await navigator.share({ title:'My Shuttle Badminton Stats 🏸', text:'Check out my stats on Shuttle!', url:'https://shuttle-alpha-umber.vercel.app' })
      }
    } catch { /* ignore share cancel */ }
    setSharing(false)
  }

  return (
    <div style={{ fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');`}</style>

      {/* Controls */}
      <div style={{ padding:'0 0 14px' }}>
        <div style={{ display:'flex', gap:6, marginBottom:8 }}>
          {[{id:'personal',label:'👤 My Card'},{id:'court',label:'🏟️ Court Card'}].map(t=>(
            <button key={t.id} onClick={()=>setCardType(t.id)} style={{ flex:1, padding:'9px', borderRadius:10, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700,
              background:cardType===t.id?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.03)',
              border:cardType===t.id?'1px solid rgba(74,222,128,0.4)':'1px solid rgba(255,255,255,0.07)',
              color:cardType===t.id?'#4ade80':'#64748b' }}>{t.label}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[{id:'today',label:'Today'},{id:'week',label:'This Week'},{id:'month',label:'This Month'}].map(p=>(
            <button key={p.id} onClick={()=>setPeriod(p.id)} style={{ flex:1, padding:'7px', borderRadius:20, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700,
              background:period===p.id?'rgba(74,222,128,0.1)':'transparent',
              border:period===p.id?'1px solid rgba(74,222,128,0.4)':'1px solid rgba(255,255,255,0.07)',
              color:period===p.id?'#4ade80':'#64748b' }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Card */}
      {loading ? (
        <div style={{ textAlign:'center', color:'#475569', padding:40 }}>Loading...</div>
      ) : (
        <div ref={cardRef} style={{ display:'flex', justifyContent:'center' }}>
          {cardType==='personal'
            ? <PersonalCard player={me} periodGames={periodGames} allGames={allGames} ratingHistory={ratingHistory} drillSessions={drillSessions} getPeriodStart={getPeriodStart} currentUserId={currentUserId} period={period} courtName={courtName} playerMap={playerMap}/>
            : <CourtCard courtName={courtName} players={players} periodGames={periodGames} allGames={allGames} period={period} playerMap={playerMap} getPeriodStart={getPeriodStart} drillSessions={drillSessions}/>
          }
        </div>
      )}

      {/* Share */}
      <div style={{ textAlign:'center', marginTop:16 }}>
        <button onClick={handleShare} disabled={sharing}
          style={{ background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', borderRadius:50, padding:'12px 32px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2, opacity:sharing?0.6:1 }}>
          {sharing?'SHARING...':'📤 SHARE CARD'}
        </button>
        <div style={{ fontSize:11, color:'#334155', marginTop:8 }}>📸 Screenshot to share on WhatsApp or Instagram</div>
      </div>
    </div>
  )
}