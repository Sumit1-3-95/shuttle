// src/components/ReportCard.jsx — v3
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { getRatingTier, isCalibrating } from '../utils/ratingEngine'
import { getAvatarUrl } from '../utils/avatars'

// ── Win gauge SVG ───────────────────────────────────────────────
function WinGauge({ pct, color, size=130 }) {
  const r = 48, cx = size/2, cy = size/2
  const circ = 2 * Math.PI * r
  const dash  = (pct/100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} style={{ transition:'stroke-dasharray 0.8s ease' }}/>
      <text x={cx} y={cy-6} textAnchor="middle" fill={color}
        style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28 }}>{pct}%</text>
      <text x={cx} y={cy+14} textAnchor="middle" fill="rgba(255,255,255,0.3)"
        style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700, letterSpacing:2 }}>WIN RATE</text>
    </svg>
  )
}

// ── Mini rating chart ───────────────────────────────────────────
function MiniRatingChart({ history, color }) {
  if (!history || history.length < 2) return null
  const vals = history.map(h => h.rating_after || h.rating_before || 1000)
  const min = Math.min(...vals) - 20, max = Math.max(...vals) + 20
  const W = 220, H = 44
  const pts = vals.map((v,i) => `${(i/(vals.length-1))*W},${H - ((v-min)/(max-min))*H}`).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx={(vals.length-1)/(vals.length-1)*W} cy={H-((vals[vals.length-1]-min)/(max-min))*H} r="3" fill={color}/>
    </svg>
  )
}

// ── Personal Card ───────────────────────────────────────────────
function PersonalCard({ player, periodGames, ratingHistory, drillSessions, getPeriodStart, allGames, currentUserId, period, courtName, playerMap }) {
  const myGames = periodGames.filter(g =>
    g.team_a_ids?.includes(currentUserId) || g.team_b_ids?.includes(currentUserId)
  )
  const myWins   = myGames.filter(g => g.winner_team===(g.team_a_ids?.includes(currentUserId)?'A':'B')).length
  const myLosses = myGames.length - myWins
  const winPct   = myGames.length ? Math.round(myWins/myGames.length*100) : 0
  const tier     = getRatingTier(player.rating_doubles||1000)
  const calib    = isCalibrating(player.rating_doubles_games||0)

  const periodLabel = period==='today'?'TODAY':period==='week'?'THIS WEEK':'THIS MONTH'

  // Rating delta this period
  const periodRH = ratingHistory.filter(h => {
    const d = new Date(h.created_at||'')
    return d >= getPeriodStart()
  })
  const ratingDelta = periodRH.length
    ? (periodRH[periodRH.length-1].rating_after||0) - (periodRH[0].rating_before||0)
    : 0

  // Best partner
  const partnerMap = {}
  allGames.filter(g=>g.team_a_ids?.includes(currentUserId)||g.team_b_ids?.includes(currentUserId)).forEach(g => {
    const inA=g.team_a_ids?.includes(currentUserId)
    const won=g.winner_team===(inA?'A':'B')
    const partners=inA?g.team_a_ids:g.team_b_ids
    partners?.filter(pid=>pid!==currentUserId).forEach(pid => {
      if (!partnerMap[pid]) partnerMap[pid]={wins:0,games:0}
      partnerMap[pid].games++
      if (won) partnerMap[pid].wins++
    })
  })
  const bestPartner = Object.entries(partnerMap).sort((a,b)=>b[1].wins-a[1].wins)[0]

  const form = myGames.slice(0,8).reverse().map(g =>
    g.winner_team===(g.team_a_ids?.includes(currentUserId)?'A':'B') ? 'W' : 'L'
  )

  return (
    <div style={{ width:360, background:'linear-gradient(160deg,#0d1a0d 0%,#060d14 60%,#0a0d1a 100%)', borderRadius:24, overflow:'hidden', position:'relative', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', flexShrink:0 }}>
      <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.07,pointerEvents:'none' }} viewBox="0 0 360 560" preserveAspectRatio="xMidYMid slice">
        <rect x="18" y="18" width="324" height="524" fill="none" stroke="#4ade80" strokeWidth="1.5"/>
        <line x1="180" y1="18" x2="180" y2="542" stroke="#4ade80" strokeWidth="1.5"/>
        <line x1="18" y1="280" x2="342" y2="280" stroke="#4ade80" strokeWidth="1"/>
        <ellipse cx="180" cy="280" rx="55" ry="55" fill="none" stroke="#4ade80" strokeWidth="1"/>
      </svg>
      <div style={{ height:3, background:'linear-gradient(90deg,transparent,#4ade80,transparent)' }}/>
      <div style={{ padding:'20px 20px 24px', position:'relative', zIndex:1 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
          <div style={{ width:62, height:62, borderRadius:'50%', overflow:'hidden', border:`2.5px solid ${tier.color}`, background:'#1a2a1a', flexShrink:0, boxShadow:`0 0 16px ${tier.color}44` }}>
            <img src={player.profile_pic||getAvatarUrl(player.id)} style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={e=>e.target.src=getAvatarUrl(player.id)}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:9, color:'#4ade80', letterSpacing:4, fontWeight:700, marginBottom:2 }}>🏸 SHUTTLE · {periodLabel}</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:'#fff', letterSpacing:2, lineHeight:1, marginBottom:4 }}>{player.display_name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:tier.color, padding:'2px 10px', borderRadius:20, background:`${tier.color}15`, border:`1px solid ${tier.color}30` }}>{calib?'?':player.rating_doubles||1000} {tier.emoji}</span>
              {ratingDelta!==0 && <span style={{ fontSize:11, color:ratingDelta>0?'#4ade80':'#f87171', fontWeight:700 }}>{ratingDelta>0?'+':''}{ratingDelta}</span>}
            </div>
          </div>
        </div>

        {/* Win gauge + stats */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
          <WinGauge pct={winPct} color={tier.color}/>
          <div style={{ flex:1 }}>
            {[
              { v:myGames.length, l:'GAMES',   c:'#93c5fd' },
              { v:myWins,         l:'WINS',     c:'#4ade80' },
              { v:myLosses,       l:'LOSSES',   c:'#f87171' },
            ].map(s=>(
              <div key={s.l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, padding:'5px 10px', background:'rgba(0,0,0,0.3)', borderRadius:8 }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:700, letterSpacing:1 }}>{s.l}</span>
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:s.c, lineHeight:1 }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rating chart */}
        {ratingHistory.length >= 2 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:2, fontWeight:700, marginBottom:5 }}>RATING TREND</div>
            <MiniRatingChart history={ratingHistory} color={tier.color}/>
          </div>
        )}

        {/* Form dots */}
        {form.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:2, fontWeight:700, marginBottom:6 }}>RECENT FORM</div>
            <div style={{ display:'flex', gap:5 }}>
              {form.map((r,i)=>(
                <div key={i} style={{ width:28, height:28, borderRadius:'50%', background:r==='W'?'rgba(74,222,128,0.2)':'rgba(248,113,113,0.2)', border:`1.5px solid ${r==='W'?'#4ade80':'#f87171'}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:12, color:r==='W'?'#4ade80':'#f87171' }}>{r}</div>
              ))}
            </div>
          </div>
        )}

        {/* Best partner + rivalry side by side with avatars */}
        {(()=>{
          // Find best rivalry from allGames
          const rivMap = {}
          allGames.filter(g=>g.team_a_ids?.includes(currentUserId)||g.team_b_ids?.includes(currentUserId)).forEach(g=>{
            const inA=g.team_a_ids?.includes(currentUserId)
            const opps=(inA?g.team_b_ids:g.team_a_ids)||[]
            opps.forEach(oid=>{
              const k=[currentUserId,oid].sort().join('|')
              if(!rivMap[k]) rivMap[k]={pid:oid,games:0,wins:0}
              rivMap[k].games++
              if(g.winner_team===(inA?'A':'B')) rivMap[k].wins++
            })
          })
          const rivalry = Object.values(rivMap).filter(r=>r.games>=2).sort((a,b)=>b.games-a.games)[0]
          return (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
              {/* Best partner */}
              {bestPartner && playerMap[bestPartner[0]] && (() => {
                const p = playerMap[bestPartner[0]]
                return (
                  <div style={{ background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.18)', borderRadius:12, padding:'10px' }}>
                    <div style={{ fontSize:8, color:'rgba(74,222,128,0.5)', letterSpacing:2, fontWeight:700, marginBottom:7 }}>🤝 BEST PARTNER</div>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', overflow:'hidden', border:'2px solid rgba(74,222,128,0.4)', background:'#1a2a1a', flexShrink:0 }}>
                        <img src={p.profile_pic||getAvatarUrl(p.id)} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.src=getAvatarUrl(p.id)}/>
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.display_name?.split(' ')[0]}</div>
                        <div style={{ fontSize:9, color:'#4ade80' }}>{bestPartner[1].wins}W</div>
                      </div>
                    </div>
                  </div>
                )
              })()}
              {/* Rivalry */}
              {rivalry && playerMap[rivalry.pid] && (() => {
                const p = playerMap[rivalry.pid]
                const rivPct = Math.round(rivalry.wins/rivalry.games*100)
                return (
                  <div style={{ background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.18)', borderRadius:12, padding:'10px' }}>
                    <div style={{ fontSize:8, color:'rgba(248,113,113,0.5)', letterSpacing:2, fontWeight:700, marginBottom:7 }}>⚔️ RIVALRY</div>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', overflow:'hidden', border:'2px solid rgba(248,113,113,0.4)', background:'#1a2a1a', flexShrink:0 }}>
                        <img src={p.profile_pic||getAvatarUrl(p.id)} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.src=getAvatarUrl(p.id)}/>
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.display_name?.split(' ')[0]}</div>
                        <div style={{ fontSize:9, color:'#f87171' }}>{rivalry.games}G · {rivPct}%W</div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )
        })()}

        {/* Court + date */}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:14, fontSize:9, color:'rgba(255,255,255,0.2)', fontWeight:700, letterSpacing:1 }}>
          <span>🏟️ {courtName||'SHUTTLE'}</span>
          <span>{new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}).toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}

// ── Court Card ──────────────────────────────────────────────────
function CourtCard({ courtName, players, periodGames, allGames, period, playerMap, getPeriodStart, drillSessions }) {
  const [expanded, setExpanded] = useState(null)
  const periodLabel = period==='today'?'TODAY':period==='week'?'THIS WEEK':'THIS MONTH'

  const pStats = players.map(p => {
    const pg   = periodGames.filter(g=>g.team_a_ids?.includes(p.id)||g.team_b_ids?.includes(p.id))
    const wins = pg.filter(g=>g.winner_team===(g.team_a_ids?.includes(p.id)?'A':'B')).length
    const losses = pg.length - wins
    const pct  = pg.length>0?Math.round(wins/pg.length*100):0
    const tier = getRatingTier(p.rating_doubles||1000)

    // ELO delta this period
    const allPG = allGames.filter(g=>g.team_a_ids?.includes(p.id)||g.team_b_ids?.includes(p.id))
    const ratingNow = p.rating_doubles||1000
    const ratingStart = p.rating_doubles_before_period || ratingNow

    // Best partner for this player
    const partMap = {}
    allPG.forEach(g=>{
      const inA=g.team_a_ids?.includes(p.id)
      const won=g.winner_team===(inA?'A':'B')
      const partners=(inA?g.team_a_ids:g.team_b_ids)||[]
      partners.filter(pid=>pid!==p.id).forEach(pid=>{
        if(!partMap[pid]) partMap[pid]={wins:0,games:0}
        partMap[pid].games++
        if(won) partMap[pid].wins++
      })
    })
    const bestPartner = Object.entries(partMap).sort((a,b)=>b[1].wins-a[1].wins)[0]

    // Easiest opponent
    const oppMap = {}
    allPG.forEach(g=>{
      const inA=g.team_a_ids?.includes(p.id)
      const won=g.winner_team===(inA?'A':'B')
      const opps=(inA?g.team_b_ids:g.team_a_ids)||[]
      opps.forEach(pid=>{
        if(!oppMap[pid]) oppMap[pid]={wins:0,games:0}
        oppMap[pid].games++
        if(won) oppMap[pid].wins++
      })
    })
    const easyOpp = Object.entries(oppMap).filter(([,s])=>s.games>=2).sort((a,b)=>b[1].wins/b[1].games-a[1].wins/a[1].games)[0]

    return { ...p, pg:pg.length, wins, losses, pct, tier, bestPartner, easyOpp }
  }).filter(p=>p.pg>0).sort((a,b)=>b.wins-a.wins||b.pct-a.pct)

  const top5 = pStats.slice(0,5)
  const totalGames = periodGames.length
  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣']

  // Best duo
  const duos = {}
  periodGames.forEach(g => {
    [{ids:[...g.team_a_ids||[]].sort(), won:g.winner_team==='A'},{ids:[...g.team_b_ids||[]].sort(), won:g.winner_team==='B'}].forEach(({ids,won})=>{
      if(ids.length<2) return
      const k=ids.join('|')
      if(!duos[k]) duos[k]={ids,wins:0,games:0}
      duos[k].games++
      if(won) duos[k].wins++
    })
  })
  const bestDuo = Object.values(duos).sort((a,b)=>b.wins-a.wins)[0]||null

  // Best rivalry
  const h2h = {}
  periodGames.forEach(g => {
    const wIds=g.winner_team==='A'?g.team_a_ids:g.team_b_ids
    const lIds=g.winner_team==='A'?g.team_b_ids:g.team_a_ids
    wIds?.forEach(w=>lIds?.forEach(l=>{
      const k=[w,l].sort().join('|')
      if(!h2h[k]) h2h[k]={p1:w,p2:l,p1wins:0,p2wins:0,games:0}
      h2h[k].games++
      if(h2h[k].p1===w) h2h[k].p1wins++; else h2h[k].p2wins++
    }))
  })
  const bestRivalry = Object.values(h2h).filter(r=>r.games>=2).sort((a,b)=>b.games-a.games)[0]||null

  return (
    <div style={{ width:360, background:'linear-gradient(160deg,#0d1420 0%,#060d14 55%,#0a0d1a 100%)', borderRadius:24, overflow:'hidden', position:'relative', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', flexShrink:0 }}>
      <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.06,pointerEvents:'none' }} viewBox="0 0 360 620" preserveAspectRatio="xMidYMid slice">
        <rect x="18" y="18" width="324" height="584" fill="none" stroke="#60a5fa" strokeWidth="1.5"/>
        <line x1="180" y1="18" x2="180" y2="602" stroke="#60a5fa" strokeWidth="1.5"/>
        <line x1="18" y1="310" x2="342" y2="310" stroke="#60a5fa" strokeWidth="1"/>
        <ellipse cx="180" cy="310" rx="55" ry="55" fill="none" stroke="#60a5fa" strokeWidth="1"/>
      </svg>
      <div style={{ height:3, background:'linear-gradient(90deg,transparent,#60a5fa,transparent)' }}/>
      <div style={{ padding:'20px 20px 24px', position:'relative', zIndex:1 }}>
        {/* Header */}
        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            {/* Left: period + court name */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:9, color:'#60a5fa', letterSpacing:3, fontWeight:700, marginBottom:2 }}>{periodLabel}</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'#fff', letterSpacing:2, lineHeight:1 }}>{courtName||'COURT REPORT'}</div>
            </div>
            {/* Right: games + players */}
            <div style={{ display:'flex', gap:12, flexShrink:0, marginLeft:10 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'#60a5fa', lineHeight:1 }}>{totalGames}</div>
                <div style={{ fontSize:8, color:'rgba(255,255,255,0.4)', letterSpacing:1.5, fontWeight:700, marginTop:1 }}>GAMES</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'rgba(255,255,255,0.6)', lineHeight:1 }}>{top5.length}</div>
                <div style={{ fontSize:8, color:'rgba(255,255,255,0.4)', letterSpacing:1.5, fontWeight:700, marginTop:1 }}>PLAYERS</div>
              </div>
            </div>
          </div>
          {/* Date — bold and visible */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ height:1, flex:1, background:'rgba(255,255,255,0.1)' }}/>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:'rgba(255,255,255,0.55)', letterSpacing:2, whiteSpace:'nowrap' }}>
              {(()=>{
                const now = new Date()
                if (period==='today') return now.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}).toUpperCase()
                if (period==='week') {
                  const weekNum = Math.ceil(now.getDate()/7)
                  return `WEEK ${weekNum} · ${now.toLocaleDateString('en-IN',{month:'short',year:'numeric'}).toUpperCase()}`
                }
                return now.toLocaleDateString('en-IN',{month:'long',year:'numeric'}).toUpperCase()
              })()}
            </span>
            <div style={{ height:1, flex:1, background:'rgba(255,255,255,0.1)' }}/>
          </div>
        </div>

        {/* Leaderboard */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:2, fontWeight:700, marginBottom:8 }}>⚔️ LEADERBOARD</div>
          {top5.map((p,i)=>{
            const isExp = expanded===p.id
            return (
              <div key={p.id} style={{ marginBottom:6 }}>
                {/* Main row */}
                <div onClick={()=>setExpanded(isExp?null:p.id)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:isExp?`${p.tier.color}10`:'rgba(255,255,255,0.03)', borderRadius:isExp?'12px 12px 0 0':12, border:`1px solid ${isExp?p.tier.color+'30':'rgba(255,255,255,0.07)'}`, cursor:'pointer', transition:'all 0.2s' }}>
                  <span style={{ fontSize:i<3?18:12, width:24, textAlign:'center', flexShrink:0 }}>{medals[i]}</span>
                  <div style={{ width:36, height:36, borderRadius:'50%', overflow:'hidden', border:`2px solid ${p.tier.color}`, background:'#1a2a1a', flexShrink:0 }}>
                    <img src={p.profile_pic||getAvatarUrl(p.id)} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.src=getAvatarUrl(p.id)}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, color:'#f1f5f9', letterSpacing:0.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.display_name}</div>

                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#4ade80', lineHeight:1 }}>{p.wins}W</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>{p.pct}%</div>
                  </div>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.2)', marginLeft:2 }}>{isExp?'▲':'▼'}</span>
                </div>
                {/* Expanded detail */}
                {isExp && (
                  <div style={{ background:`${p.tier.color}08`, border:`1px solid ${p.tier.color}20`, borderTop:'none', borderRadius:'0 0 12px 12px', padding:'12px 14px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:10 }}>
                      {[
                        {v:p.pg,      l:'GAMES',   c:'#93c5fd'},
                        {v:p.wins,    l:'WINS',    c:'#4ade80'},
                        {v:p.losses,  l:'LOSSES',  c:'#f87171'},
                        {v:`${p.pct}%`,l:'WIN%',   c:p.tier.color},
                      ].map(s=>(
                        <div key={s.l} style={{ textAlign:'center', background:'rgba(0,0,0,0.3)', borderRadius:8, padding:'6px 2px' }}>
                          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:s.c, lineHeight:1 }}>{s.v}</div>
                          <div style={{ fontSize:8, color:'rgba(255,255,255,0.3)', letterSpacing:1, marginTop:2 }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      {[
                        {label:'ELO', val:isCalibrating(p.rating_doubles_games||0)?'?':p.rating_doubles||1000, c:p.tier.color},
                        p.bestPartner&&playerMap[p.bestPartner[0]] ? {label:'BEST PARTNER', val:playerMap[p.bestPartner[0]]?.display_name?.split(' ')[0]||'?', c:'#4ade80'} : null,
                        p.easyOpp&&playerMap[p.easyOpp[0]] ? {label:'EASY OPP', val:playerMap[p.easyOpp[0]]?.display_name?.split(' ')[0]||'?', c:'#fbbf24'} : null,
                      ].filter(Boolean).map(s=>(
                        <div key={s.label} style={{ flex:1, background:'rgba(0,0,0,0.3)', borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
                          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:s.c, lineHeight:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.val}</div>
                          <div style={{ fontSize:8, color:'rgba(255,255,255,0.3)', letterSpacing:1, marginTop:2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {top5.length===0 && <div style={{textAlign:'center',color:'rgba(255,255,255,0.15)',fontSize:13,padding:20}}>No games this period</div>}
        </div>

        {/* Best duo + rivalry — clean horizontal cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
          {bestDuo && bestDuo.ids.every(id=>playerMap[id]) && (
            <div style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.18)', borderRadius:12, padding:'9px 10px' }}>
              <div style={{ fontSize:8, color:'#fbbf2488', letterSpacing:2, fontWeight:700, marginBottom:7 }}>🏆 BEST DUO</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {/* Overlapping avatars */}
                <div style={{ display:'flex', flexShrink:0 }}>
                  {bestDuo.ids.map((id,i)=>(
                    <div key={id} style={{ width:28, height:28, borderRadius:'50%', overflow:'hidden', border:'2px solid #fbbf24', background:'#1a2a1a', marginLeft:i>0?-10:0, zIndex:2-i }}>
                      <img src={playerMap[id]?.profile_pic||getAvatarUrl(id)} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.src=getAvatarUrl(id)}/>
                    </div>
                  ))}
                </div>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:12, color:'#ffd700', letterSpacing:0.5, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {bestDuo.ids.map(id=>playerMap[id]?.display_name?.split(' ')[0]||'?').join(' & ')}
                  </div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{bestDuo.wins}W · {bestDuo.games}G</div>
                </div>
              </div>
            </div>
          )}
          {bestRivalry && playerMap[bestRivalry.p1] && playerMap[bestRivalry.p2] && (
            <div style={{ background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.18)', borderRadius:12, padding:'9px 10px' }}>
              <div style={{ fontSize:8, color:'#f8717188', letterSpacing:2, fontWeight:700, marginBottom:7 }}>⚔️ RIVALRY</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {/* Overlapping avatars with VS divider */}
                <div style={{ display:'flex', alignItems:'center', flexShrink:0, gap:3 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', overflow:'hidden', border:'2px solid #f87171', background:'#1a2a1a' }}>
                    <img src={playerMap[bestRivalry.p1]?.profile_pic||getAvatarUrl(bestRivalry.p1)} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.src=getAvatarUrl(bestRivalry.p1)}/>
                  </div>
                  <span style={{ fontSize:8, color:'#f8717166', fontWeight:700 }}>VS</span>
                  <div style={{ width:28, height:28, borderRadius:'50%', overflow:'hidden', border:'2px solid #f87171', background:'#1a2a1a' }}>
                    <img src={playerMap[bestRivalry.p2]?.profile_pic||getAvatarUrl(bestRivalry.p2)} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.src=getAvatarUrl(bestRivalry.p2)}/>
                  </div>
                </div>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, color:'#f1f5f9', letterSpacing:0.3, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {playerMap[bestRivalry.p1]?.display_name?.split(' ')[0]} – {playerMap[bestRivalry.p2]?.display_name?.split(' ')[0]}
                  </div>
                  <div style={{ fontSize:9, color:'#f87171', marginTop:2 }}>{bestRivalry.p1wins}–{bestRivalry.p2wins}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'rgba(255,255,255,0.2)', fontWeight:700, letterSpacing:1 }}>
          <span>🏟️ {courtName||'SHUTTLE'}</span>
          <span>{new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}).toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main ReportCard ─────────────────────────────────────────────
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

  // Re-fetch on mount and when period changes — always gets fresh data incl. edits/deletes
  useEffect(() => {
    setLoading(true)
    Promise.all([
      supabase.from('games').select('*').order('played_at',{ascending:false}),
      supabase.from('rating_history').select('*').eq('player_id',currentUserId).eq('game_type','doubles').order('created_at',{ascending:true}).limit(30),
      supabase.from('drill_sessions').select('*, drill_participants!inner(player_id), drills(name,category,calories_per_min)').eq('drill_participants.player_id',currentUserId).order('session_date',{ascending:false}).limit(30),
    ]).then(([{data:g},{data:rh},{data:ds}]) => {
      // Include all games for this court — no is_reverted filter so edits show
      setAllGames((g||[]).filter(x=>[...(x.team_a_ids||[]),...(x.team_b_ids||[])].some(id=>allowedIds.has(id))))
      setRatingHistory(rh||[])
      setDrillSessions(ds||[])
      setLoading(false)
    })
  }, [players, period])

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
        await navigator.share({ title:'My Shuttle Report', text:`Check out my badminton stats on Shuttle!`, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied!')
      }
    } catch {}
    setSharing(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#060d14', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', paddingBottom:40 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');`}</style>

      {/* Controls */}
      <div style={{ padding:'14px 16px 10px' }}>
        {/* Period picker */}
        <div style={{ display:'flex', gap:6, marginBottom:10 }}>
          {[{id:'today',l:'Today'},{id:'week',l:'This Week'},{id:'month',l:'This Month'}].map(p=>(
            <button key={p.id} onClick={()=>setPeriod(p.id)} style={{ flex:1, padding:'7px 4px', borderRadius:10, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700,
              background:period===p.id?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.04)',
              border:period===p.id?'1px solid rgba(74,222,128,0.35)':'1px solid rgba(255,255,255,0.08)',
              color:period===p.id?'#4ade80':'#475569' }}>{p.l}</button>
          ))}
        </div>
        {/* Card type toggle */}
        <div style={{ display:'flex', gap:6, marginBottom:4 }}>
          {[{id:'personal',l:'My Card'},{id:'court',l:'Court Card'}].map(c=>(
            <button key={c.id} onClick={()=>setCardType(c.id)} style={{ flex:1, padding:'7px', borderRadius:10, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700,
              background:cardType===c.id?'rgba(96,165,250,0.1)':'rgba(255,255,255,0.04)',
              border:cardType===c.id?'1px solid rgba(96,165,250,0.35)':'1px solid rgba(255,255,255,0.08)',
              color:cardType===c.id?'#60a5fa':'#475569' }}>{c.l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', color:'#475569', padding:60, fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:3 }}>LOADING...</div>
      ) : (
        <div style={{ padding:'0 16px' }}>
          <div ref={cardRef} style={{ display:'flex', justifyContent:'center' }}>
            {cardType==='personal' && me
              ? <PersonalCard player={me} periodGames={periodGames} allGames={allGames} ratingHistory={ratingHistory} drillSessions={drillSessions} getPeriodStart={getPeriodStart} currentUserId={currentUserId} period={period} courtName={courtName} playerMap={playerMap}/>
              : <CourtCard courtName={courtName} players={players} periodGames={periodGames} allGames={allGames} period={period} playerMap={playerMap} getPeriodStart={getPeriodStart} drillSessions={drillSessions}/>
            }
          </div>
          <button onClick={handleShare} disabled={sharing}
            style={{ display:'block', width:'100%', marginTop:16, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#64748b', borderRadius:50, padding:'12px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:2 }}>
            {sharing?'SHARING...':'↗ SHARE CARD'}
          </button>
        </div>
      )}
    </div>
  )
}