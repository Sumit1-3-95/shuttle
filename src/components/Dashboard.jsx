// src/components/Dashboard.jsx — v7
// Groups filter, bigger tabs, clearer typography, games tab upgrades
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRealtimeDashboard } from '../hooks/useRealtimeDashboard'
import { getAvatarUrl, getCharacterName } from '../utils/avatars'
import { supabase } from '../supabaseClient'
import LogGame from './LogGame'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&family=Teko:wght@300;400;500;600;700&display=swap');`

function getLevel(wins) {
  if (wins >= 50) return { name:'LEGEND',    tier:5, aura:'#ffd700', bg:'#2a1f00', glow:'rgba(255,215,0,0.4)',   emoji:'👑' }
  if (wins >= 30) return { name:'ELITE',     tier:4, aura:'#c084fc', bg:'#1a0f2e', glow:'rgba(192,132,252,0.4)', emoji:'⚡' }
  if (wins >= 15) return { name:'SMASH PRO', tier:3, aura:'#38bdf8', bg:'#001f2e', glow:'rgba(56,189,248,0.4)',  emoji:'🔥' }
  if (wins >= 5)  return { name:'CONTENDER', tier:2, aura:'#4ade80', bg:'#001a0f', glow:'rgba(74,222,128,0.35)', emoji:'⚔️' }
  return            { name:'ROOKIE',     tier:1, aura:'#94a3b8', bg:'#111827', glow:'rgba(148,163,184,0.2)', emoji:'🎯' }
}

function getRankBadge(rank) {
  if (rank === 1) return { label:'#1', color:'#ffd700', bg:'rgba(255,215,0,0.15)', border:'rgba(255,215,0,0.4)' }
  if (rank === 2) return { label:'#2', color:'#94a3b8', bg:'rgba(148,163,184,0.15)', border:'rgba(148,163,184,0.4)' }
  if (rank === 3) return { label:'#3', color:'#cd7f32', bg:'rgba(205,127,50,0.15)', border:'rgba(205,127,50,0.4)' }
  return { label:`#${rank}`, color:'#475569', bg:'rgba(71,85,105,0.1)', border:'rgba(71,85,105,0.2)' }
}

function Avatar({ playerId, size = 40, aura, style = {} }) {
  const [err, setErr] = useState(false)
  const level = getLevel(0)
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: `1.5px solid ${aura || '#4ade8055'}`, background: '#1a2a1a', flexShrink: 0, ...style }}>
      {!err
        ? <img src={getAvatarUrl(playerId)} width={size} height={size} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)}/>
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, color: aura || '#4ade80' }}>?</div>
      }
    </div>
  )
}

// ── Hero profile card ──────────────────────────────────────────
function HeroCard({ player, isCurrentUser, onClick }) {
  const level = getLevel(player.total_wins || 0)
  const winPct = player.total_games > 0 ? Math.round((player.total_wins / player.total_games) * 100) : 0

  return (
    <div onClick={onClick} style={{ position:'relative', borderRadius:20, overflow:'hidden', background:`linear-gradient(145deg, ${level.bg}, #060d14)`, border:`1.5px solid ${level.aura}55`, padding:'18px 16px 14px', marginBottom:16, cursor:'pointer', boxShadow:`0 8px 32px ${level.glow}` }}>
      <div style={{ position:'absolute', inset:0, opacity:0.05, pointerEvents:'none' }}>
        <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
          <line x1="200" y1="0" x2="200" y2="200" stroke="#4ade80" strokeWidth="1.5"/>
          <line x1="0" y1="100" x2="400" y2="100" stroke="#4ade80" strokeWidth="1.5"/>
          <rect x="20" y="10" width="360" height="180" fill="none" stroke="#4ade80" strokeWidth="1"/>
        </svg>
      </div>
      <div style={{ position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <Avatar playerId={player.id} size={68} aura={level.aura} style={{ border:`2.5px solid ${level.aura}`, boxShadow:`0 0 20px ${level.glow}` }}/>
            {level.tier >= 4 && <div style={{ position:'absolute', inset:-4, borderRadius:'50%', border:`1.5px solid ${level.aura}`, borderTopColor:'transparent', borderRightColor:'transparent', animation:'spin-ring 3s linear infinite' }}/>}
          </div>
          <div style={{ flex:1 }}>
            {isCurrentUser && <div style={{ fontSize:10, color:level.aura, letterSpacing:2, fontWeight:700, marginBottom:2 }}>YOUR PROFILE</div>}
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:2, color:'#f1f5f9', lineHeight:1, marginBottom:5 }}>{player.display_name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20, background:`${level.aura}20`, color:level.aura, border:`1px solid ${level.aura}44` }}>{level.emoji} {level.name}</span>
              {(player.current_streak||0) >= 3 && <span style={{ fontSize:13, color:'#f97316' }}>🔥{player.current_streak}</span>}
            </div>
          </div>
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:34, color:level.aura, lineHeight:1 }}>{winPct}%</div>
            <div style={{ fontSize:10, color:'#475569', letterSpacing:1 }}>WIN RATE</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
          {[
            { label:'GAMES', val:player.total_games||0, color:'#60a5fa' },
            { label:'WINS',  val:player.total_wins||0,  color:'#4ade80' },
            { label:'LOSSES',val:player.total_losses||0,color:'#f87171' },
            { label:'STREAK',val:`🔥${player.best_streak||0}`, color:'#f97316' },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(0,0,0,0.35)', borderRadius:10, padding:'8px 4px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Teko',sans-serif", fontSize:22, color:s.color, lineHeight:1, fontWeight:600 }}>{s.val}</div>
              <div style={{ fontSize:10, color:'#64748b', letterSpacing:0.8, marginTop:1 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${winPct}%`, background:`linear-gradient(90deg,${level.aura}66,${level.aura})`, borderRadius:2 }}/>
        </div>
        <div style={{ fontSize:10, color:'#334155', textAlign:'right', marginTop:4 }}>Tap for full profile →</div>
      </div>
    </div>
  )
}

// ── Leaderboard row ────────────────────────────────────────────
function LeaderRow({ player, rank, isCurrentUser, onClick }) {
  const level = getLevel(player.total_wins || 0)
  const winPct = player.total_games > 0 ? Math.round((player.total_wins / player.total_games) * 100) : 0
  const badge = getRankBadge(rank)

  return (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 12px', background:isCurrentUser?`${level.aura}0e`:'rgba(255,255,255,0.02)', border:`1px solid ${isCurrentUser?level.aura+'44':'rgba(255,255,255,0.06)'}`, borderRadius:14, cursor:'pointer', marginBottom:8 }}>
      <div style={{ width:34, height:34, borderRadius:8, background:badge.bg, border:`1px solid ${badge.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:badge.color }}>{badge.label}</span>
      </div>
      <Avatar playerId={player.id} size={42} aura={level.aura}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3, flexWrap:'wrap' }}>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:1, color:isCurrentUser?level.aura:'#f1f5f9', lineHeight:1 }}>{player.display_name}</span>
          <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:10, background:`${level.aura}18`, color:level.aura, border:`1px solid ${level.aura}33` }}>{level.emoji} {level.name}</span>
          {isCurrentUser && <span style={{ fontSize:9, color:'#4ade80', fontWeight:700, letterSpacing:1, background:'rgba(74,222,128,0.1)', padding:'1px 5px', borderRadius:6 }}>YOU</span>}
          {(player.current_streak||0) >= 3 && <span style={{ fontSize:11, color:'#f97316' }}>🔥{player.current_streak}</span>}
        </div>
        <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden', maxWidth:100 }}>
          <div style={{ height:'100%', width:`${winPct}%`, background:level.aura, borderRadius:2 }}/>
        </div>
      </div>
      <div style={{ display:'flex', gap:5, flexShrink:0 }}>
        {[{v:player.total_wins||0,l:'W',c:'#4ade80',bg:'rgba(74,222,128,0.08)'},{v:player.total_losses||0,l:'L',c:'#f87171',bg:'rgba(248,113,113,0.08)'},{v:`${winPct}%`,l:'WIN',c:level.aura,bg:'rgba(255,255,255,0.05)'}].map(s=>(
          <div key={s.l} style={{ textAlign:'center', background:s.bg, borderRadius:8, padding:'4px 7px', minWidth:32 }}>
            <div style={{ fontFamily:"'Teko',sans-serif", fontSize:17, color:s.c, lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:9, color:'#475569' }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Teams tab ──────────────────────────────────────────────────
function TeamsTab({ allPlayers, currentUserId }) {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const playerMap = Object.fromEntries((allPlayers||[]).map(p=>[p.id,p]))

  useEffect(() => {
    async function build() {
      const { data: games } = await supabase.from('games').select('*').eq('is_reverted',false).order('played_at',{ascending:true})
      if (!games) { setLoading(false); return }
      const ts = {}
      games.forEach(g => {
        [{ids:[...g.team_a_ids].sort(),won:g.winner_team==='A',sa:g.score_a,sb:g.score_b},
         {ids:[...g.team_b_ids].sort(),won:g.winner_team==='B',sa:g.score_b,sb:g.score_a}
        ].forEach(({ids,won,sa,sb})=>{
          const k=ids.join('|')
          if(!ts[k]) ts[k]={ids,wins:0,losses:0,scored:0,conceded:0}
          ts[k].wins+=won?1:0; ts[k].losses+=won?0:1; ts[k].scored+=sa; ts[k].conceded+=sb
        })
      })
      setTeams(Object.values(ts).sort((a,b)=>b.wins-a.wins).slice(0,10))
      setLoading(false)
    }
    build()
  },[allPlayers])

  if (loading) return <div style={{textAlign:'center',color:'#334155',padding:40}}>Building team stats...</div>
  if (teams.length===0) return <div style={{textAlign:'center',color:'#334155',padding:60}}><div style={{fontSize:40,marginBottom:12}}>🤝</div><div style={{fontSize:14}}>No team data yet</div></div>

  const myBestTeam = teams.find(t=>t.ids.includes(currentUserId))

  return (
    <div>
      {myBestTeam && (()=>{
        const pid = myBestTeam.ids.find(id=>id!==currentUserId)
        const partner = playerMap[pid], me = playerMap[currentUserId]
        if(!partner||!me) return null
        const total=myBestTeam.wins+myBestTeam.losses
        const pct=total>0?Math.round((myBestTeam.wins/total)*100):0
        const lM=getLevel(me.total_wins||0), lP=getLevel(partner.total_wins||0)
        return (
          <div style={{background:'linear-gradient(135deg,rgba(74,222,128,0.08),rgba(96,165,250,0.06))',border:'1.5px solid rgba(74,222,128,0.25)',borderRadius:18,padding:'16px 14px',marginBottom:20}}>
            <div style={{fontSize:11,color:'#4ade80',letterSpacing:2,fontWeight:700,marginBottom:10}}>🤝 YOUR BEST DUO</div>
            <div style={{display:'flex',gap:10,marginBottom:12}}>
              {[{p:me,l:lM},{p:partner,l:lP}].map(({p,l},i)=>(
                <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,flex:1,background:'rgba(0,0,0,0.3)',borderRadius:12,padding:'10px'}}>
                  <Avatar playerId={p.id} size={42} aura={l.aura}/>
                  <div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,letterSpacing:1,color:'#f1f5f9',lineHeight:1}}>{p.display_name}</div><div style={{fontSize:10,color:l.aura}}>{l.emoji} {l.name}</div></div>
                  {i===0&&<div style={{fontSize:14,color:'#334155',marginLeft:'auto'}}>+</div>}
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
              {[{label:'WINS',val:myBestTeam.wins,color:'#4ade80'},{label:'LOSSES',val:myBestTeam.losses,color:'#f87171'},{label:'WIN RATE',val:`${pct}%`,color:'#ffd700'}].map(s=>(
                <div key={s.label} style={{background:'rgba(0,0,0,0.4)',borderRadius:10,padding:'8px 4px',textAlign:'center'}}>
                  <div style={{fontFamily:"'Teko',sans-serif",fontSize:22,color:s.color,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:10,color:'#64748b'}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{height:4,background:'rgba(255,255,255,0.07)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#4ade8066,#4ade80)',borderRadius:2}}/></div>
          </div>
        )
      })()}

      <div style={{fontSize:13,color:'#64748b',letterSpacing:2,textTransform:'uppercase',fontWeight:700,marginBottom:12}}>ALL DUOS · TOP 10</div>

      {teams.map((t,idx)=>{
        const p1=playerMap[t.ids[0]],p2=playerMap[t.ids[1]]
        if(!p1||!p2) return null
        const total=t.wins+t.losses, pct=total>0?Math.round((t.wins/total)*100):0
        const isMe=t.ids.includes(currentUserId)
        const badge=getRankBadge(idx+1)
        const l1=getLevel(p1.total_wins||0),l2=getLevel(p2.total_wins||0)
        const tc=pct>=60?'#ffd700':pct>=40?'#4ade80':'#94a3b8'
        return (
          <div key={t.ids.join('|')} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 12px',marginBottom:8,background:isMe?'rgba(74,222,128,0.05)':'rgba(255,255,255,0.02)',border:`1px solid ${isMe?'rgba(74,222,128,0.3)':'rgba(255,255,255,0.06)'}`,borderRadius:14}}>
            <div style={{width:32,height:32,borderRadius:8,background:badge.bg,border:`1px solid ${badge.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,color:badge.color}}>{badge.label}</span>
            </div>
            <div style={{position:'relative',width:54,height:36,flexShrink:0}}>
              {[{p:p1,l:l1,left:0},{p:p2,l:l2,left:20}].map(({p,l,left})=>(
                <div key={p.id} style={{position:'absolute',left,top:0,width:34,height:34,borderRadius:'50%',overflow:'hidden',border:`1.5px solid ${l.aura}66`,background:'#1a2a1a'}}>
                  <img src={getAvatarUrl(p.id)} width={34} height={34} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                </div>
              ))}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:1,color:isMe?'#4ade80':'#f1f5f9',lineHeight:1,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {p1.display_name} + {p2.display_name} {isMe&&<span style={{fontSize:9,color:'#4ade80',letterSpacing:1}}>YOU</span>}
              </div>
              <div style={{height:3,background:'rgba(255,255,255,0.06)',borderRadius:2,overflow:'hidden',maxWidth:90}}><div style={{height:'100%',width:`${pct}%`,background:tc,borderRadius:2}}/></div>
            </div>
            <div style={{display:'flex',gap:4,flexShrink:0}}>
              {[{v:t.wins,l:'W',c:'#4ade80',bg:'rgba(74,222,128,0.08)'},{v:t.losses,l:'L',c:'#f87171',bg:'rgba(248,113,113,0.08)'},{v:`${pct}%`,l:'WIN',c:tc,bg:'rgba(255,255,255,0.05)'}].map(s=>(
                <div key={s.l} style={{textAlign:'center',background:s.bg,borderRadius:7,padding:'4px 6px',minWidth:30}}>
                  <div style={{fontFamily:"'Teko',sans-serif",fontSize:16,color:s.c,lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:8,color:'#475569'}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Games tab ──────────────────────────────────────────────────
function GamesTab({ recentGames, players, loading }) {
  if (loading) return <div style={{textAlign:'center',color:'#334155',padding:40}}>Loading...</div>
  if (recentGames.length===0) return (
    <div style={{textAlign:'center',color:'#334155',padding:60}}>
      <div style={{fontSize:48,marginBottom:12}}>🏸</div>
      <div style={{fontSize:14}}>No games yet — tap LOG GAME!</div>
    </div>
  )

  const groups = {}
  recentGames.forEach(g => {
    const key = new Date(g.played_at).toDateString()
    if (!groups[key]) groups[key] = []
    groups[key].push(g)
  })

  function fmtHeader(ds) {
    const d=new Date(ds), t=new Date(), y=new Date(t); y.setDate(t.getDate()-1)
    if(d.toDateString()===t.toDateString()) return {main:'Today',sub:d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
    if(d.toDateString()===y.toDateString()) return {main:'Yesterday',sub:d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
    return {main:d.toLocaleDateString('en-IN',{weekday:'long'}),sub:d.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
  }

  return (
    <div>
      {Object.entries(groups).map(([ds, dayGames]) => {
        const {main,sub}=fmtHeader(ds)
        return (
          <div key={ds} style={{marginBottom:24}}>
            {/* Date header */}
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:'#f1f5f9',letterSpacing:2,lineHeight:1}}>{main}</div>
                <div style={{fontSize:12,color:'#475569'}}>{sub}</div>
              </div>
              <div style={{flex:1,height:1,background:'rgba(255,255,255,0.06)'}}/>
              <div style={{background:'rgba(255,255,255,0.05)',borderRadius:20,padding:'3px 10px',fontSize:11,color:'#64748b'}}>{dayGames.length} game{dayGames.length>1?'s':''}</div>
            </div>

            {dayGames.map((g,i) => {
              const tA=(g.team_a_ids||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean)
              const tB=(g.team_b_ids||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean)
              const ref=players.find(p=>p.id===g.logged_by)
              const winTeam=g.winner_team==='A'?tA:tB
              const loseTeam=g.winner_team==='A'?tB:tA
              const winNames=winTeam.map(p=>p.display_name).join(' + ')
              const time=new Date(g.played_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})

              return (
                <div key={g.id} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,padding:'14px 13px',marginBottom:10}}>
                  {/* Header: time + date + winner label */}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <span style={{fontSize:12,color:'#475569',fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>{time}</span>
                    <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:'rgba(74,222,128,0.1)',color:'#4ade80',border:'1px solid rgba(74,222,128,0.2)',letterSpacing:0.5,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      🏆 {winNames} WON
                    </span>
                  </div>

                  {/* Score */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                    <span style={{fontSize:13,fontWeight:700,color:g.winner_team==='A'?'#4ade80':'#475569',fontFamily:"'Rajdhani',sans-serif"}}>Team A</span>
                    <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,color:'#f1f5f9',letterSpacing:5}}>{g.score_a} — {g.score_b}</span>
                    <span style={{fontSize:13,fontWeight:700,color:g.winner_team==='B'?'#4ade80':'#475569',fontFamily:"'Rajdhani',sans-serif"}}>Team B</span>
                  </div>

                  {/* Players row */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                    {/* Team A */}
                    <div style={{display:'flex',gap:6}}>
                      {tA.map(p=>{
                        const l=getLevel(p.total_wins||0)
                        return (
                          <div key={p.id} style={{textAlign:'center'}}>
                            <div style={{width:34,height:34,borderRadius:'50%',overflow:'hidden',border:`2px solid ${g.winner_team==='A'?l.aura:l.aura+'44'}`,margin:'0 auto 3px',background:'#1a2a1a'}}>
                              <img src={getAvatarUrl(p.id)} width={34} height={34} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                            </div>
                            <div style={{fontSize:10,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,color:g.winner_team==='A'?l.aura:'#475569'}}>{p.display_name}</div>
                            <div style={{fontSize:9,color:l.aura,opacity:0.8}}>{l.emoji}</div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,color:'#1e293b',letterSpacing:2}}>VS</div>
                    {/* Team B */}
                    <div style={{display:'flex',gap:6}}>
                      {tB.map(p=>{
                        const l=getLevel(p.total_wins||0)
                        return (
                          <div key={p.id} style={{textAlign:'center'}}>
                            <div style={{width:34,height:34,borderRadius:'50%',overflow:'hidden',border:`2px solid ${g.winner_team==='B'?l.aura:l.aura+'44'}`,margin:'0 auto 3px',background:'#1a2a1a'}}>
                              <img src={getAvatarUrl(p.id)} width={34} height={34} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                            </div>
                            <div style={{fontSize:10,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,color:g.winner_team==='B'?l.aura:'#475569'}}>{p.display_name}</div>
                            <div style={{fontSize:9,color:l.aura,opacity:0.8}}>{l.emoji}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Referee chip */}
                  {ref && (
                    <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.04)',borderRadius:20,padding:'4px 10px',alignSelf:'flex-start',width:'fit-content',border:'1px solid rgba(255,255,255,0.07)'}}>
                      <div style={{width:18,height:18,borderRadius:'50%',overflow:'hidden',flexShrink:0,background:'#1a2a1a'}}>
                        <img src={getAvatarUrl(ref.id)} width={18} height={18} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                      </div>
                      <span style={{fontSize:10,color:'#475569',fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>📋 {ref.display_name}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function Dashboard({ onOpenProfile }) {
  const { currentUser, logout } = useAuth()
  const { players, recentGames, loading, refetch } = useRealtimeDashboard()
  const [tab, setTab]                 = useState('players')
  const [showLogGame, setShowLogGame] = useState(false)
  const [newGame, setNewGame]         = useState(false)
  const [activeGroup, setActiveGroup] = useState('all')
  const [groups, setGroups]           = useState([])
  const [groupMembers, setGroupMembers] = useState({})

  const me = players.find(p => p.id === currentUser.id)

  // Load groups
  useEffect(() => {
    async function loadGroups() {
      const [{ data: g }, { data: gm }] = await Promise.all([
        supabase.from('groups').select('*').order('name'),
        supabase.from('group_members').select('*'),
      ])
      if (g) setGroups(g)
      if (gm) {
        const map = {}
        gm.forEach(m => {
          if (!map[m.group_id]) map[m.group_id] = []
          map[m.group_id].push(m.player_id)
        })
        setGroupMembers(map)
      }
    }
    loadGroups()
  }, [])

  // Filter players by active group
  const filteredPlayers = activeGroup === 'all'
    ? players
    : players.filter(p => (groupMembers[activeGroup] || []).includes(p.id))

  function handleGameLogged() {
    refetch(); setShowLogGame(false)
    setNewGame(true); setTimeout(() => setNewGame(false), 2000)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#060d14', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', maxWidth:480, margin:'0 auto', position:'relative' }}>
      <style>{`
        ${FONTS}
        @keyframes spin-ring { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes card-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slide-up { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fab-pulse { 0%,100%{box-shadow:0 4px 24px rgba(74,222,128,0.35)} 50%{box-shadow:0 4px 40px rgba(74,222,128,0.6),0 0 0 6px rgba(74,222,128,0.08)} }
        @keyframes shuttle-fly { 0%{left:-40px;opacity:1} 100%{left:110%;opacity:0} }
        .tab-btn { background:none; border:none; color:#64748b; font-family:'Bebas Neue',sans-serif; font-size:16px; letter-spacing:2px; padding:13px 0; cursor:pointer; border-bottom:3px solid transparent; transition:all 0.2s; flex:1; text-align:center; }
        .tab-btn.active { color:#4ade80; border-bottom-color:#4ade80; }
        .group-chip { padding:7px 14px; border-radius:20px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#64748b; font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.2s; white-space:nowrap; letter-spacing:0.5px; }
        .group-chip.active { background:rgba(74,222,128,0.15); border-color:rgba(74,222,128,0.5); color:#4ade80; }
      `}</style>

      {newGame && Array.from({length:4}).map((_,i)=>(
        <div key={i} style={{position:'fixed',zIndex:200,pointerEvents:'none',fontSize:24,top:`${20+i*18}%`,left:'-40px',animation:`shuttle-fly ${0.7+i*0.2}s ease-out ${i*0.12}s forwards`}}>🏸</div>
      ))}

      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:40, background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(74,222,128,0.08)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:22 }}>🏸</span>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'#4ade80', letterSpacing:4 }}>SHUTTLE</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {me && (
            <div onClick={() => onOpenProfile && onOpenProfile(currentUser.id)}
              style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:20, padding:'5px 12px', cursor:'pointer' }}>
              <Avatar playerId={currentUser.id} size={22} aura='#4ade80'/>
              <span style={{ fontSize:13, color:'#4ade80', fontWeight:700 }}>{currentUser.displayName}</span>
            </div>
          )}
          <button onClick={logout} style={{ background:'transparent', border:'1px solid #1e293b', color:'#475569', borderRadius:20, padding:'5px 10px', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>Out</button>
        </div>
      </div>

      {/* Group filter chips */}
      <div style={{ position:'sticky', top:50, zIndex:39, background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', padding:'10px 16px', display:'flex', gap:8, overflowX:'auto', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <button className={`group-chip${activeGroup==='all'?' active':''}`} onClick={() => setActiveGroup('all')}>All Courts</button>
        {groups.map(g => (
          <button key={g.id} className={`group-chip${activeGroup===g.id?' active':''}`} onClick={() => setActiveGroup(g.id)}>{g.name}</button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ position:'sticky', top:98, zIndex:38, background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', display:'flex', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        {[{id:'players',label:'⚡ PLAYERS'},{id:'teams',label:'🤝 TEAMS'},{id:'games',label:'📋 GAMES'}].map(t=>(
          <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:'16px 14px 100px' }}>

        {tab === 'players' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            {me && filteredPlayers.find(p=>p.id===me.id) && (
              <HeroCard player={me} isCurrentUser={true} onClick={() => onOpenProfile && onOpenProfile(me.id)}/>
            )}
            <div style={{ fontSize:13, color:'#64748b', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:12 }}>🏆 LEADERBOARD</div>
            {filteredPlayers.map((p,idx) => (
              <LeaderRow key={p.id} player={p} rank={idx+1} isCurrentUser={p.id===currentUser.id} onClick={() => onOpenProfile && onOpenProfile(p.id)}/>
            ))}
          </div>
        )}

        {tab === 'teams' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            <TeamsTab allPlayers={filteredPlayers} currentUserId={currentUser.id}/>
          </div>
        )}

        {tab === 'games' && (
          <GamesTab recentGames={recentGames} players={players} loading={loading}/>
        )}
      </div>

      {/* Sticky FAB */}
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', zIndex:50, width:'100%', maxWidth:480, padding:'10px 16px 24px', background:'linear-gradient(to top,rgba(6,13,20,1) 65%,transparent)', pointerEvents:'none' }}>
        <button onClick={() => setShowLogGame(true)} style={{ display:'block', width:'100%', background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:5, padding:'17px', borderRadius:50, cursor:'pointer', animation:'fab-pulse 2.5s ease-in-out infinite', pointerEvents:'all' }}>
          + LOG GAME
        </button>
      </div>

      {showLogGame && <LogGame onClose={() => setShowLogGame(false)} onGameLogged={handleGameLogged}/>}
    </div>
  )
}