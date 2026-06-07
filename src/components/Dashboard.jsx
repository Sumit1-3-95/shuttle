// src/components/Dashboard.jsx — v8
// Hamburger menu, fixed groups, fixed profile click, fixed fonts
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRealtimeDashboard } from '../hooks/useRealtimeDashboard'
import { getAvatarUrl, getCharacterName } from '../utils/avatars'
import { supabase } from '../supabaseClient'
import LogGame from './LogGame'

function getLevel(wins) {
  if (wins >= 50) return { name:'LEGEND',    tier:5, aura:'#ffd700', bg:'#2a1f00', glow:'rgba(255,215,0,0.4)',   emoji:'👑' }
  if (wins >= 30) return { name:'ELITE',     tier:4, aura:'#c084fc', bg:'#1a0f2e', glow:'rgba(192,132,252,0.4)', emoji:'⚡' }
  if (wins >= 15) return { name:'SMASH PRO', tier:3, aura:'#38bdf8', bg:'#001f2e', glow:'rgba(56,189,248,0.4)',  emoji:'🔥' }
  if (wins >= 5)  return { name:'CONTENDER', tier:2, aura:'#4ade80', bg:'#001a0f', glow:'rgba(74,222,128,0.35)', emoji:'⚔️' }
  return            { name:'ROOKIE',     tier:1, aura:'#94a3b8', bg:'#111827', glow:'rgba(148,163,184,0.2)', emoji:'🎯' }
}

// ── Tab transition loader ─────────────────────────────────────
function TabLoader() {
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:200,
      background:'rgba(6,13,20,0.92)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      animation:'tab-loader-in 0.15s ease-out',
      pointerEvents:'none',
    }}>
      <div style={{ position:'relative', width:60, height:60 }}>
        {/* Shuttlecock spinning */}
        <div style={{ fontSize:36, animation:'shuttle-spin 0.5s linear infinite', display:'inline-block' }}>🏸</div>
        {/* Court lines */}
        <svg style={{ position:'absolute', top:'-20px', left:'-20px', opacity:0.15 }} width="100" height="100" viewBox="0 0 100 100">
          <rect x="5" y="5" width="90" height="90" fill="none" stroke="#4ade80" strokeWidth="1"/>
          <line x1="50" y1="5" x2="50" y2="95" stroke="#4ade80" strokeWidth="1"/>
          <line x1="5" y1="50" x2="95" y2="50" stroke="#4ade80" strokeWidth="1.5"/>
        </svg>
      </div>
    </div>
  )
}


function getRankBadge(rank) {
  if (rank === 1) return { label:'#1', color:'#ffd700', bg:'rgba(255,215,0,0.15)', border:'rgba(255,215,0,0.4)' }
  if (rank === 2) return { label:'#2', color:'#94a3b8', bg:'rgba(148,163,184,0.15)', border:'rgba(148,163,184,0.4)' }
  if (rank === 3) return { label:'#3', color:'#cd7f32', bg:'rgba(205,127,50,0.15)', border:'rgba(205,127,50,0.4)' }
  return { label:`#${rank}`, color:'#475569', bg:'rgba(71,85,105,0.1)', border:'rgba(71,85,105,0.2)' }
}

function Av({ id, size=40, aura='#4ade8055', style={} }) {
  const [err, setErr] = useState(false)
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', border:`1.5px solid ${aura}`, background:'#1a2a1a', flexShrink:0, ...style }}>
      {!err
        ? <img src={getAvatarUrl(id)} width={size} height={size} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setErr(true)}/>
        : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.4,color:aura}}>?</div>
      }
    </div>
  )
}

// ── Hamburger menu ─────────────────────────────────────────────
function HamburgerMenu({ currentUser, currentPlayer, groups, myGroupIds, onClose, onLogout, onOpenProfile }) {
  const level = getLevel(currentPlayer?.total_wins || 0)

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:90, backdropFilter:'blur(4px)' }}/>

      {/* Drawer */}
      <div style={{
        position:'fixed', top:0, left:0, bottom:0, width:280,
        background:'#0a1628', borderRight:'1px solid rgba(74,222,128,0.15)',
        zIndex:91, display:'flex', flexDirection:'column',
        animation:'drawer-in 0.25s cubic-bezier(0.34,1.2,0.64,1)',
        boxShadow:'4px 0 40px rgba(0,0,0,0.8)',
      }}>
        {/* Profile section */}
        <div style={{ padding:'40px 20px 20px', background:`linear-gradient(180deg,${level.bg},transparent)`, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div style={{ position:'relative', cursor:'pointer' }} onClick={() => { onOpenProfile(currentUser.id); onClose() }}>
              <Av id={currentUser.id} size={56} aura={level.aura} style={{ border:`2.5px solid ${level.aura}`, boxShadow:`0 0 16px ${level.glow}` }}/>
              {level.tier >= 4 && (
                <div style={{ position:'absolute', inset:-3, borderRadius:'50%', border:`1px solid ${level.aura}`, borderTopColor:'transparent', animation:'spin-ring 3s linear infinite', pointerEvents:'none' }}/>
              )}
            </div>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#f1f5f9', letterSpacing:1, lineHeight:1 }}>{currentPlayer?.display_name || currentUser.displayName}</div>
              <div style={{ fontSize:11, color:level.aura, fontWeight:700, letterSpacing:1, marginTop:2 }}>{level.emoji} {level.name}</div>
              <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{getCharacterName(currentUser.id)}</div>
            </div>
          </div>
          <button onClick={() => { onOpenProfile(currentUser.id); onClose() }} style={{ width:'100%', background:`${level.aura}15`, border:`1px solid ${level.aura}33`, color:level.aura, borderRadius:10, padding:'8px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, letterSpacing:1 }}>
            View My Profile →
          </button>
        </div>

        {/* Menu body */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 0' }}>

          {/* Your groups */}
          <div style={{ padding:'0 20px 8px' }}>
            <div style={{ fontSize:10, color:'#475569', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:10 }}>Your Courts</div>
            {groups.filter(g => myGroupIds.includes(g.id)).map(g => (
              <div key={g.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', marginBottom:6, background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:10 }}>
                <span style={{ fontSize:16 }}>🏸</span>
                <span style={{ fontSize:14, color:'#4ade80', fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>{g.name}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'8px 20px 16px' }}/>

          {/* All groups */}
          <div style={{ padding:'0 20px 8px' }}>
            <div style={{ fontSize:10, color:'#475569', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:10 }}>All Courts</div>
            {groups.map(g => (
              <div key={g.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', marginBottom:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10 }}>
                <span style={{ fontSize:16 }}>🏟️</span>
                <span style={{ fontSize:14, color:'#94a3b8', fontFamily:"'Rajdhani',sans-serif", fontWeight:600 }}>{g.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div style={{ padding:'16px 20px 40px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => { onLogout(); onClose() }} style={{ width:'100%', background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', color:'#f87171', borderRadius:10, padding:'12px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2 }}>
            LOGOUT
          </button>
        </div>
      </div>
    </>
  )
}

// ── Hero card ──────────────────────────────────────────────────
function HeroCard({ player, isCurrentUser, onClick }) {
  const level = getLevel(player.total_wins || 0)
  const winPct = player.total_games > 0 ? Math.round((player.total_wins / player.total_games) * 100) : 0

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        borderRadius: 22,
        overflow: 'hidden',
        background: `linear-gradient(160deg, ${level.bg} 0%, #060d14 100%)`,
        border: `1.5px solid ${level.aura}44`,
        padding: '0 0 16px',
        marginBottom: 20,
        cursor: 'pointer',
        boxShadow: `0 8px 40px ${level.glow}, 0 0 0 1px ${level.aura}11`,
      }}
    >
      {/* Court background */}
      <svg width="100%" height="100%" viewBox="0 0 420 200" preserveAspectRatio="xMidYMid slice"
        style={{ position:'absolute', inset:0, opacity:0.13 }} aria-hidden="true">
        <rect width="420" height="200" fill={level.aura} opacity="0.04"/>
        <rect x="12" y="10" width="396" height="180" fill="none" stroke={level.aura} strokeWidth="1.5" rx="2"/>
        <line x1="44" y1="10" x2="44" y2="190" stroke={level.aura} strokeWidth="1"/>
        <line x1="376" y1="10" x2="376" y2="190" stroke={level.aura} strokeWidth="1"/>
        <line x1="210" y1="10" x2="210" y2="190" stroke={level.aura} strokeWidth="2"/>
        <line x1="12" y1="64" x2="408" y2="64" stroke={level.aura} strokeWidth="1"/>
        <line x1="12" y1="136" x2="408" y2="136" stroke={level.aura} strokeWidth="1"/>
        <line x1="210" y1="64" x2="210" y2="136" stroke={level.aura} strokeWidth="1"/>
        <line x1="12" y1="34" x2="408" y2="34" stroke={level.aura} strokeWidth="0.8" opacity="0.5"/>
        <line x1="12" y1="166" x2="408" y2="166" stroke={level.aura} strokeWidth="0.8" opacity="0.5"/>
        <circle cx="12" cy="100" r="3" fill={level.aura} opacity="0.5"/>
        <circle cx="408" cy="100" r="3" fill={level.aura} opacity="0.5"/>
      </svg>

      <div style={{ position:'relative', zIndex:1, padding:'18px 18px 14px' }}>
        {/* Avatar + name row */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <Av id={player.id} size={72} aura={level.aura} style={{ border:`3px solid ${level.aura}`, boxShadow:`0 0 24px ${level.glow}` }}/>
            {level.tier >= 4 && (
              <div style={{ position:'absolute', inset:-5, borderRadius:'50%', border:`1.5px solid ${level.aura}`, borderTopColor:'transparent', borderRightColor:'transparent', animation:'spin-ring 3s linear infinite' }}/>
            )}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            {isCurrentUser && (
              <div style={{ fontSize:10, color:level.aura, letterSpacing:2, fontWeight:700, fontFamily:"'Rajdhani',sans-serif", marginBottom:4 }}>YOUR PROFILE</div>
            )}
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:30, letterSpacing:2, color:'#ffffff', lineHeight:1, marginBottom:8, textShadow:`0 0 20px ${level.aura}44` }}>
              {player.display_name}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:20, background:`${level.aura}25`, color:level.aura, border:`1.5px solid ${level.aura}66`, fontFamily:"'Rajdhani',sans-serif", letterSpacing:1 }}>
                {level.emoji} {level.name}
              </span>
              {(player.current_streak||0) >= 3 && (
                <span style={{ fontSize:12, fontWeight:700, padding:'5px 10px', borderRadius:20, background:'rgba(249,115,22,0.15)', border:'1px solid rgba(249,115,22,0.35)', color:'#fb923c', fontFamily:"'Rajdhani',sans-serif" }}>
                  🔥 {player.current_streak} streak
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:38, color:level.aura, lineHeight:1, textShadow:`0 0 16px ${level.glow}` }}>{winPct}%</div>
            <div style={{ fontSize:11, color:'#94a3b8', fontFamily:"'Rajdhani',sans-serif", letterSpacing:1, fontWeight:600 }}>WIN RATE</div>
          </div>
        </div>

        {/* Net divider */}
        <div style={{ height:1, background:`linear-gradient(90deg,transparent,${level.aura}44,transparent)`, marginBottom:14 }}/>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
          {[
            { label:'GAMES',   val:player.total_games||0,  color:'#93c5fd' },
            { label:'WINS',    val:player.total_wins||0,   color:'#4ade80' },
            { label:'LOSSES',  val:player.total_losses||0, color:'#f87171' },
            { label:'BEST 🔥', val:player.best_streak||0,  color:'#fb923c' },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(0,0,0,0.45)', borderRadius:12, padding:'10px 4px', textAlign:'center', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:s.color, lineHeight:1, textShadow:`0 0 12px ${s.color}44` }}>{s.val}</div>
              <div style={{ fontSize:10, color:'#94a3b8', fontFamily:"'Rajdhani',sans-serif", letterSpacing:1, fontWeight:600, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Win bar */}
        <div style={{ height:5, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden', marginBottom:8 }}>
          <div style={{ height:'100%', width:`${winPct}%`, background:`linear-gradient(90deg,${level.aura}66,${level.aura})`, borderRadius:3 }}/>
        </div>
        <div style={{ fontSize:11, color:'#475569', textAlign:'right', fontFamily:"'Rajdhani',sans-serif" }}>
          Tap to view charts & full stats →
        </div>
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
    <div onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:10,
      padding:'10px 12px',
      background:isCurrentUser?`${level.aura}0e`:'rgba(255,255,255,0.02)',
      border:`1px solid ${isCurrentUser?level.aura+'44':'rgba(255,255,255,0.07)'}`,
      borderRadius:14, cursor:'pointer', marginBottom:8, transition:'all 0.2s',
    }}>
      {/* Rank */}
      <div style={{ width:32,height:32,borderRadius:8,background:badge.bg,border:`1px solid ${badge.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:13,color:badge.color }}>{badge.label}</span>
      </div>
      {/* Avatar */}
      <Av id={player.id} size={42} aura={level.aura}/>
      {/* Name + win bar */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:1,color:isCurrentUser?level.aura:'#f1f5f9',lineHeight:1 }}>{player.display_name}</span>
          {isCurrentUser && <span style={{ fontSize:9,color:'#4ade80',fontWeight:700,background:'rgba(74,222,128,0.12)',padding:'1px 5px',borderRadius:6,fontFamily:"'Rajdhani',sans-serif",letterSpacing:1 }}>YOU</span>}
          {(player.current_streak||0)>=3 && <span style={{ fontSize:11,color:'#f97316' }}>🔥{player.current_streak}</span>}
        </div>
        <div style={{ height:3,background:'rgba(255,255,255,0.07)',borderRadius:2,overflow:'hidden',maxWidth:100 }}>
          <div style={{ height:'100%',width:`${winPct}%`,background:level.aura,borderRadius:2 }}/>
        </div>
        {/* Level badge on its own line — clean */}
        <div style={{ marginTop:4 }}>
          <span style={{ fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:10,background:`${level.aura}15`,color:level.aura,border:`1px solid ${level.aura}30`,fontFamily:"'Rajdhani',sans-serif",letterSpacing:0.5 }}>{level.emoji} {level.name}</span>
        </div>
      </div>
      {/* Stats chips */}
      <div style={{ display:'flex',gap:4,flexShrink:0 }}>
        {[{v:player.total_wins||0,l:'W',c:'#4ade80',bg:'rgba(74,222,128,0.08)'},{v:player.total_losses||0,l:'L',c:'#f87171',bg:'rgba(248,113,113,0.08)'},{v:`${winPct}%`,l:'WIN',c:level.aura,bg:'rgba(255,255,255,0.05)'}].map(s=>(
          <div key={s.l} style={{ textAlign:'center',background:s.bg,borderRadius:7,padding:'4px 6px',minWidth:30 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:'#ffffff',fontWeight:700,lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:9,color:'#94a3b8',fontFamily:"'Rajdhani',sans-serif",fontWeight:600 }}>{s.l}</div>
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

  if (loading) return <div style={{textAlign:'center',color:'#475569',padding:40,fontFamily:"'Rajdhani',sans-serif",fontSize:16}}>Building team stats...</div>
  if (!teams.length) return <div style={{textAlign:'center',color:'#334155',padding:60}}><div style={{fontSize:40,marginBottom:12}}>🤝</div><div style={{fontSize:16,fontFamily:"'Rajdhani',sans-serif"}}>No team data yet</div></div>

  const myBest = teams.find(t=>t.ids.includes(currentUserId))

  return (
    <div>
      {myBest && (()=>{
        const pid=myBest.ids.find(id=>id!==currentUserId)
        const partner=playerMap[pid], me=playerMap[currentUserId]
        if(!partner||!me) return null
        const total=myBest.wins+myBest.losses, pct=total>0?Math.round((myBest.wins/total)*100):0
        const lM=getLevel(me.total_wins||0), lP=getLevel(partner.total_wins||0)
        return (
          <div style={{background:'linear-gradient(135deg,rgba(74,222,128,0.08),rgba(96,165,250,0.06))',border:'1.5px solid rgba(74,222,128,0.25)',borderRadius:18,padding:'16px 14px',marginBottom:20}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:'#4ade80',letterSpacing:3,marginBottom:12}}>🤝 YOUR BEST DUO</div>
            <div style={{display:'flex',gap:10,marginBottom:12}}>
              {[{p:me,l:lM},{p:partner,l:lP}].map(({p,l},i)=>(
                <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,flex:1,background:'rgba(0,0,0,0.3)',borderRadius:12,padding:'10px'}}>
                  <Av id={p.id} size={44} aura={l.aura}/>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:1,color:'#f1f5f9',lineHeight:1}}>{p.display_name}</div>
                    <div style={{fontSize:11,color:l.aura,fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>{l.emoji} {l.name}</div>
                  </div>
                  {i===0&&<div style={{fontSize:14,color:'#334155',marginLeft:'auto'}}>+</div>}
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
              {[{label:'WINS',val:myBest.wins,c:'#4ade80'},{label:'LOSSES',val:myBest.losses,c:'#f87171'},{label:'WIN RATE',val:`${pct}%`,c:'#ffd700'}].map(s=>(
                <div key={s.label} style={{background:'rgba(0,0,0,0.4)',borderRadius:10,padding:'9px 4px',textAlign:'center'}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:s.c,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:10,color:'#64748b',fontFamily:"'Rajdhani',sans-serif",letterSpacing:1}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{height:4,background:'rgba(255,255,255,0.07)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#4ade8066,#4ade80)',borderRadius:2}}/></div>
          </div>
        )
      })()}

      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:'#64748b',letterSpacing:3,marginBottom:14}}>ALL DUOS · TOP 10</div>

      {teams.map((t,idx)=>{
        const p1=playerMap[t.ids[0]],p2=playerMap[t.ids[1]]
        if(!p1||!p2) return null
        const total=t.wins+t.losses,pct=total>0?Math.round((t.wins/total)*100):0
        const isMe=t.ids.includes(currentUserId)
        const badge=getRankBadge(idx+1)
        const l1=getLevel(p1.total_wins||0),l2=getLevel(p2.total_wins||0)
        const tc=pct>=60?'#ffd700':pct>=40?'#4ade80':'#94a3b8'
        return (
          <div key={t.ids.join('|')} style={{display:'flex',alignItems:'center',gap:10,padding:'12px',marginBottom:8,background:isMe?'rgba(74,222,128,0.05)':'rgba(255,255,255,0.02)',border:`1px solid ${isMe?'rgba(74,222,128,0.3)':'rgba(255,255,255,0.07)'}`,borderRadius:14}}>
            <div style={{width:34,height:34,borderRadius:8,background:badge.bg,border:`1px solid ${badge.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
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
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:1,color:isMe?'#4ade80':'#f1f5f9',lineHeight:1,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {p1.display_name} + {p2.display_name} {isMe&&<span style={{fontSize:9,color:'#4ade80',letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}}>YOU</span>}
              </div>
              <div style={{height:3,background:'rgba(255,255,255,0.06)',borderRadius:2,overflow:'hidden',maxWidth:100}}><div style={{height:'100%',width:`${pct}%`,background:tc,borderRadius:2}}/></div>
            </div>
            <div style={{display:'flex',gap:4,flexShrink:0}}>
              {[{v:t.wins,l:'W',c:'#4ade80',bg:'rgba(74,222,128,0.08)'},{v:t.losses,l:'L',c:'#f87171',bg:'rgba(248,113,113,0.08)'},{v:`${pct}%`,l:'WIN',c:tc,bg:'rgba(255,255,255,0.05)'}].map(s=>(
                <div key={s.l} style={{textAlign:'center',background:s.bg,borderRadius:7,padding:'5px 6px',minWidth:32}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:s.c,lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:9,color:'#64748b',fontFamily:"'Rajdhani',sans-serif"}}>{s.l}</div>
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
  if (loading) return <div style={{textAlign:'center',color:'#475569',padding:40,fontFamily:"'Rajdhani',sans-serif",fontSize:16}}>Loading...</div>
  if (!recentGames.length) return (
    <div style={{textAlign:'center',color:'#334155',padding:60}}>
      <div style={{fontSize:48,marginBottom:12}}>🏸</div>
      <div style={{fontSize:16,fontFamily:"'Rajdhani',sans-serif"}}>No games yet — tap LOG GAME!</div>
    </div>
  )

  const groups = {}
  recentGames.forEach(g => {
    const key = new Date(g.played_at).toDateString()
    if (!groups[key]) groups[key] = []
    groups[key].push(g)
  })

  function fmtHeader(ds) {
    const d=new Date(ds),t=new Date(),y=new Date(t); y.setDate(t.getDate()-1)
    if(d.toDateString()===t.toDateString()) return {main:'Today',sub:d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
    if(d.toDateString()===y.toDateString()) return {main:'Yesterday',sub:d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
    return {main:d.toLocaleDateString('en-IN',{weekday:'long'}),sub:d.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
  }

  return (
    <div>
      {Object.entries(groups).map(([ds,dayGames])=>{
        const {main,sub}=fmtHeader(ds)
        return (
          <div key={ds} style={{marginBottom:20}}>
            {/* Date header — same style as section headers in other tabs */}
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:'#f1f5f9',letterSpacing:2,lineHeight:1}}>{main}</div>
                <div style={{fontSize:11,color:'#475569',fontFamily:"'Rajdhani',sans-serif"}}>{sub}</div>
              </div>
              <div style={{flex:1,height:1,background:'rgba(255,255,255,0.06)'}}/>
              <div style={{background:'rgba(255,255,255,0.05)',borderRadius:20,padding:'3px 10px',fontSize:11,color:'#64748b',fontFamily:"'Rajdhani',sans-serif",fontWeight:600,whiteSpace:'nowrap'}}>{dayGames.length} game{dayGames.length>1?'s':''}</div>
            </div>

            {dayGames.map((g,i)=>{
              const tA=(g.team_a_ids||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean)
              const tB=(g.team_b_ids||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean)
              const ref=players.find(p=>p.id===g.logged_by)
              const winNames=(g.winner_team==='A'?tA:tB).map(p=>p.display_name).join(' + ')
              const time=new Date(g.played_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
              return (
                <div key={g.id} style={{
                  background:'rgba(255,255,255,0.02)',
                  border:'1px solid rgba(255,255,255,0.07)',
                  borderRadius:14,
                  padding:'10px 12px',
                  marginBottom:8,
                }}>
                  {/* Time + winner chip — compact */}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <span style={{fontSize:12,color:'#475569',fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>{time}</span>
                    <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20,background:'rgba(74,222,128,0.1)',color:'#4ade80',border:'1px solid rgba(74,222,128,0.2)',fontFamily:"'Rajdhani',sans-serif",maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      🏆 {winNames} WON
                    </span>
                  </div>

                  {/* Score — same size as other number displays */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <span style={{fontSize:12,fontWeight:700,color:g.winner_team==='A'?'#4ade80':'#475569',fontFamily:"'Rajdhani',sans-serif"}}>Team A</span>
                    <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:'#f1f5f9',letterSpacing:4}}>{g.score_a} — {g.score_b}</span>
                    <span style={{fontSize:12,fontWeight:700,color:g.winner_team==='B'?'#4ade80':'#475569',fontFamily:"'Rajdhani',sans-serif"}}>Team B</span>
                  </div>

                  {/* Players row — compact avatars same size as leaderboard */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{display:'flex',gap:6}}>
                      {tA.map(p=>{
                        const lv=getLevel(p.total_wins||0)
                        return(
                          <div key={p.id} style={{textAlign:'center'}}>
                            <div style={{width:30,height:30,borderRadius:'50%',overflow:'hidden',border:`1.5px solid ${g.winner_team==='A'?lv.aura:lv.aura+'44'}`,margin:'0 auto 2px',background:'#1a2a1a'}}>
                              <img src={getAvatarUrl(p.id)} width={30} height={30} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                            </div>
                            <div style={{fontSize:9,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,color:g.winner_team==='A'?lv.aura:'#475569'}}>{p.display_name}</div>
                            <div style={{fontSize:8,color:lv.aura,opacity:0.7}}>{lv.emoji}</div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:'#1e293b',letterSpacing:2}}>VS</div>
                    <div style={{display:'flex',gap:6}}>
                      {tB.map(p=>{
                        const lv=getLevel(p.total_wins||0)
                        return(
                          <div key={p.id} style={{textAlign:'center'}}>
                            <div style={{width:30,height:30,borderRadius:'50%',overflow:'hidden',border:`1.5px solid ${g.winner_team==='B'?lv.aura:lv.aura+'44'}`,margin:'0 auto 2px',background:'#1a2a1a'}}>
                              <img src={getAvatarUrl(p.id)} width={30} height={30} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                            </div>
                            <div style={{fontSize:9,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,color:g.winner_team==='B'?lv.aura:'#475569'}}>{p.display_name}</div>
                            <div style={{fontSize:8,color:lv.aura,opacity:0.7}}>{lv.emoji}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Referee chip — small, same as before */}
                  {ref && (
                    <div style={{display:'inline-flex',alignItems:'center',gap:5,background:'rgba(255,255,255,0.04)',borderRadius:20,padding:'3px 8px',border:'1px solid rgba(255,255,255,0.07)'}}>
                      <div style={{width:14,height:14,borderRadius:'50%',overflow:'hidden',background:'#1a2a1a',flexShrink:0}}>
                        <img src={getAvatarUrl(ref.id)} width={14} height={14} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
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
  const [tab, setTab] = useState('players')
  const [tabLoading, setTabLoading] = useState(false)
  const [showLogGame, setShowLogGame] = useState(false)
  const [showMenu, setShowMenu]   = useState(false)
  const [newGame, setNewGame]     = useState(false)
  const [groups, setGroups]       = useState([])
  const [groupMembers, setGroupMembers] = useState({})
  const [activeGroup, setActiveGroup]   = useState('all')

  const me = players.find(p => p.id === currentUser.id)

  // My group IDs
  const myGroupIds = Object.entries(groupMembers)
    .filter(([gid, pids]) => pids.includes(currentUser.id))
    .map(([gid]) => gid)

  useEffect(() => {
    async function loadGroups() {
      const [{ data:g }, { data:gm }] = await Promise.all([
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

  const filteredPlayers = activeGroup === 'all'
    ? players
    : players.filter(p => (groupMembers[activeGroup]||[]).includes(p.id))

  function handleGameLogged() {
    refetch(); setShowLogGame(false)
    setNewGame(true); setTimeout(()=>setNewGame(false),2000)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#060d14', color:'#f1f5f9', maxWidth:480, margin:'0 auto', position:'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes spin-ring { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes card-in { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fab-pulse { 0%,100%{box-shadow:0 4px 24px rgba(74,222,128,0.35)} 50%{box-shadow:0 4px 40px rgba(74,222,128,0.6),0 0 0 6px rgba(74,222,128,0.08)} }
        @keyframes shuttle-fly { 0%{left:-40px;opacity:1} 100%{left:110%;opacity:0} }
        @keyframes shuttle-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes tab-loader-in { from{opacity:0} to{opacity:1} }
        @keyframes drawer-in { from{transform:translateX(-100%)} to{transform:translateX(0)} }
        .tab-btn { background:none; border:none; color:#64748b; font-family:'Bebas Neue',sans-serif; font-size:17px; letter-spacing:2px; padding:14px 0; cursor:pointer; border-bottom:3px solid transparent; transition:all 0.2s; flex:1; text-align:center; }
        .tab-btn.active { color:#4ade80; border-bottom-color:#4ade80; }
        .group-chip { padding:8px 16px; border-radius:20px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#64748b; font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:700; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
        .group-chip.active { background:rgba(74,222,128,0.15); border-color:rgba(74,222,128,0.5); color:#4ade80; }
        .hamburger { background:transparent; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:7px 8px; cursor:pointer; display:flex; flex-direction:column; gap:4px; }
        .ham-line { width:20px; height:2px; background:#94a3b8; border-radius:2px; transition:all 0.2s; }
      `}</style>

      {newGame && Array.from({length:4}).map((_,i)=>(
        <div key={i} style={{position:'fixed',zIndex:200,pointerEvents:'none',fontSize:24,top:`${20+i*18}%`,left:'-40px',animation:`shuttle-fly ${0.7+i*0.2}s ease-out ${i*0.12}s forwards`}}>🏸</div>
      ))}


      {/* Hamburger menu */}
      {showMenu && (
        <HamburgerMenu
          currentUser={currentUser}
          currentPlayer={me}
          groups={groups}
          myGroupIds={myGroupIds}
          onClose={() => setShowMenu(false)}
          onLogout={logout}
          onOpenProfile={onOpenProfile}
        />
      )}

      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:40, background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(74,222,128,0.08)', padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
        {/* Hamburger button */}
        <button className="hamburger" onClick={() => setShowMenu(true)}>
          <div className="ham-line"/>
          <div className="ham-line"/>
          <div className="ham-line"/>
        </button>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
          <span style={{ fontSize:20 }}>🏸</span>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'#4ade80', letterSpacing:4 }}>SHUTTLE</span>
        </div>

        {/* Own avatar in header */}
        {me && (
          <div onClick={() => onOpenProfile && onOpenProfile(currentUser.id)} style={{ cursor:'pointer' }}>
            <Av id={currentUser.id} size={34} aura={getLevel(me.total_wins||0).aura} style={{ border:`2px solid ${getLevel(me.total_wins||0).aura}` }}/>
          </div>
        )}
      </div>

      {/* Group filter chips */}
      {groups.length > 0 && (
        <div style={{ position:'sticky', top:54, zIndex:39, background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', padding:'10px 16px', display:'flex', gap:8, overflowX:'auto', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
          <button className={`group-chip${activeGroup==='all'?' active':''}`} onClick={() => setActiveGroup('all')}>All Courts</button>
          {groups.map(g => (
            <button key={g.id} className={`group-chip${activeGroup===g.id?' active':''}`} onClick={() => setActiveGroup(g.id)}>{g.name}</button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ position:'sticky', top: groups.length > 0 ? 106 : 54, zIndex:38, background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', display:'flex', borderBottom:'2px solid rgba(255,255,255,0.05)' }}>
        {[{id:'players',label:'🏆 PLAYERS'},{id:'teams',label:'🔥 TEAMS'},{id:'games',label:'🏸 GAMES'}].map(t=>(
          <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={()=>{ if(tab===t.id) return; setTabLoading(true); setTimeout(()=>setTabLoading(false),350); setTab(t.id) }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:'14px 14px 100px', animation:'card-in 0.3s ease-out', minHeight:'calc(100vh - 160px)' }}>
        {tab === 'players' && (
          <div>
            {me && filteredPlayers.find(p=>p.id===me.id) && (
              <HeroCard player={me} isCurrentUser onClick={() => onOpenProfile && onOpenProfile(me.id)}/>
            )}
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, color:'#64748b', letterSpacing:3, marginBottom:14 }}>🏆 LEADERBOARD</div>
            {filteredPlayers.map((p,idx) => (
              <LeaderRow key={p.id} player={p} rank={idx+1} isCurrentUser={p.id===currentUser.id} onClick={() => onOpenProfile && onOpenProfile(p.id)}/>
            ))}
          </div>
        )}
        {tab === 'teams' && <TeamsTab allPlayers={filteredPlayers} currentUserId={currentUser.id}/>}
        {tab === 'games' && <GamesTab recentGames={recentGames} players={players} loading={loading}/>}
      </div>

      {/* Sticky FAB */}
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', zIndex:50, width:'100%', maxWidth:480, padding:'10px 16px 24px', background:'linear-gradient(to top,rgba(6,13,20,1) 65%,transparent)', pointerEvents:'none' }}>
        <button onClick={() => setShowLogGame(true)} style={{ display:'block', width:'100%', background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:5, padding:'17px', borderRadius:50, cursor:'pointer', animation:'fab-pulse 2.5s ease-in-out infinite', pointerEvents:'all' }}>
          + ADD GAME
        </button>
      </div>

      {showLogGame && <LogGame onClose={() => setShowLogGame(false)} onGameLogged={handleGameLogged}/>}
    </div>
  )
}