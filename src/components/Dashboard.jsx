// src/components/Dashboard.jsx — v6 Mobile-first redesign
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

// ── Hero card for current user / featured player ──────────────
function HeroCard({ player, isCurrentUser, onClick }) {
  const level = getLevel(player.total_wins || 0)
  const winPct = player.total_games > 0 ? Math.round((player.total_wins / player.total_games) * 100) : 0
  const [imgErr, setImgErr] = useState(false)

  return (
    <div onClick={onClick} style={{
      position: 'relative', borderRadius: 20, overflow: 'hidden',
      background: `linear-gradient(145deg, ${level.bg}, #060d14)`,
      border: `1.5px solid ${level.aura}44`,
      padding: '20px 16px 16px',
      marginBottom: 16, cursor: 'pointer',
      boxShadow: `0 8px 32px ${level.glow}`,
    }}>
      {/* Background court lines */}
      <div style={{ position:'absolute', inset:0, opacity:0.06, pointerEvents:'none' }}>
        <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
          <line x1="200" y1="0" x2="200" y2="200" stroke="#4ade80" strokeWidth="1.5"/>
          <line x1="0" y1="100" x2="400" y2="100" strokeWidth="1.5" stroke="#4ade80"/>
          <rect x="20" y="10" width="360" height="180" fill="none" stroke="#4ade80" strokeWidth="1"/>
        </svg>
      </div>

      <div style={{ position:'relative', zIndex:1 }}>
        {/* Top row */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
          {/* Avatar */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', overflow:'hidden', border:`3px solid ${level.aura}`, boxShadow:`0 0 20px ${level.glow}`, background:'#1a2a1a' }}>
              {!imgErr
                ? <img src={getAvatarUrl(player.id)} alt={player.display_name} width={72} height={72} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={() => setImgErr(true)}/>
                : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:level.aura }}>{player.display_name.charAt(0)}</div>
              }
            </div>
            {level.tier >= 4 && (
              <div style={{ position:'absolute', inset:-4, borderRadius:'50%', border:`1.5px solid ${level.aura}`, borderTopColor:'transparent', borderRightColor:'transparent', animation:'spin-ring 3s linear infinite' }}/>
            )}
          </div>

          {/* Name + level */}
          <div style={{ flex:1, minWidth:0 }}>
            {isCurrentUser && (
              <div style={{ fontSize:10, color:level.aura, letterSpacing:2, fontWeight:700, marginBottom:3, textTransform:'uppercase' }}>YOUR PROFILE</div>
            )}
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, letterSpacing:2, color:'#f1f5f9', lineHeight:1, marginBottom:4 }}>
              {player.display_name}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20, background:`${level.aura}20`, color:level.aura, border:`1px solid ${level.aura}44`, letterSpacing:1 }}>
                {level.emoji} {level.name}
              </span>
              <span style={{ fontSize:11, color:'#64748b', fontFamily:"'Rajdhani',sans-serif" }}>
                {getCharacterName(player.id)}
              </span>
              {(player.current_streak || 0) >= 3 && (
                <span style={{ fontSize:12, color:'#f97316' }}>🔥{player.current_streak}</span>
              )}
            </div>
          </div>

          {/* Win rate circle */}
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:level.aura, lineHeight:1 }}>{winPct}%</div>
            <div style={{ fontSize:10, color:'#475569', letterSpacing:1 }}>WIN RATE</div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
          {[
            { label:'GAMES', val:player.total_games||0, color:'#60a5fa' },
            { label:'WINS',  val:player.total_wins||0,  color:'#4ade80' },
            { label:'LOSSES',val:player.total_losses||0,color:'#f87171' },
            { label:'STREAK',val:`🔥${player.best_streak||0}`, color:'#f97316' },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(0,0,0,0.35)', borderRadius:10, padding:'8px 4px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Teko',sans-serif", fontSize:20, color:s.color, lineHeight:1, fontWeight:600 }}>{s.val}</div>
              <div style={{ fontSize:9, color:'#475569', letterSpacing:0.8, marginTop:1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Win bar */}
        <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${winPct}%`, background:`linear-gradient(90deg,${level.aura}66,${level.aura})`, borderRadius:2, transition:'width 1s ease' }}/>
        </div>
        <div style={{ fontSize:10, color:'#334155', textAlign:'right', marginTop:3 }}>Tap to view full profile →</div>
      </div>
    </div>
  )
}

// ── Compact leaderboard row ────────────────────────────────────
function LeaderRow({ player, rank, isCurrentUser, onClick }) {
  const level = getLevel(player.total_wins || 0)
  const winPct = player.total_games > 0 ? Math.round((player.total_wins / player.total_games) * 100) : 0
  const badge = getRankBadge(rank)
  const [imgErr, setImgErr] = useState(false)

  return (
    <div onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:10,
      padding:'10px 12px',
      background: isCurrentUser ? `${level.aura}0e` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isCurrentUser ? level.aura+'44' : 'rgba(255,255,255,0.06)'}`,
      borderRadius:14, cursor:'pointer', transition:'all 0.2s',
      marginBottom:8,
    }}>
      {/* Rank badge */}
      <div style={{ width:32, height:32, borderRadius:8, background:badge.bg, border:`1px solid ${badge.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:badge.color, letterSpacing:0.5 }}>{badge.label}</span>
      </div>

      {/* Avatar */}
      <div style={{ width:40, height:40, borderRadius:'50%', overflow:'hidden', border:`1.5px solid ${level.aura}55`, flexShrink:0, background:'#1a2a1a' }}>
        {!imgErr
          ? <img src={getAvatarUrl(player.id)} alt={player.display_name} width={40} height={40} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={() => setImgErr(true)}/>
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:level.aura }}>{player.display_name.charAt(0)}</div>
        }
      </div>

      {/* Name + badges */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3, flexWrap:'wrap' }}>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:1, color: isCurrentUser ? level.aura : '#f1f5f9', lineHeight:1 }}>{player.display_name}</span>
          <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:10, background:`${level.aura}18`, color:level.aura, border:`1px solid ${level.aura}33`, letterSpacing:0.8 }}>{level.emoji} {level.name}</span>
          {isCurrentUser && <span style={{ fontSize:9, color:'#4ade80', fontWeight:700, letterSpacing:1 }}>YOU</span>}
          {(player.current_streak||0) >= 3 && <span style={{ fontSize:10, color:'#f97316' }}>🔥{player.current_streak}</span>}
        </div>
        {/* Mini win bar */}
        <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden', maxWidth:120 }}>
          <div style={{ height:'100%', width:`${winPct}%`, background:level.aura, borderRadius:2 }}/>
        </div>
      </div>

      {/* Stats chips */}
      <div style={{ display:'flex', gap:5, flexShrink:0 }}>
        <div style={{ textAlign:'center', background:'rgba(74,222,128,0.08)', borderRadius:7, padding:'4px 7px', minWidth:32 }}>
          <div style={{ fontFamily:"'Teko',sans-serif", fontSize:16, color:'#4ade80', lineHeight:1 }}>{player.total_wins||0}</div>
          <div style={{ fontSize:8, color:'#475569', letterSpacing:0.5 }}>W</div>
        </div>
        <div style={{ textAlign:'center', background:'rgba(248,113,113,0.08)', borderRadius:7, padding:'4px 7px', minWidth:32 }}>
          <div style={{ fontFamily:"'Teko',sans-serif", fontSize:16, color:'#f87171', lineHeight:1 }}>{player.total_losses||0}</div>
          <div style={{ fontSize:8, color:'#475569', letterSpacing:0.5 }}>L</div>
        </div>
        <div style={{ textAlign:'center', background:'rgba(255,255,255,0.05)', borderRadius:7, padding:'4px 7px', minWidth:36 }}>
          <div style={{ fontFamily:"'Teko',sans-serif", fontSize:16, color:level.aura, lineHeight:1 }}>{winPct}%</div>
          <div style={{ fontSize:8, color:'#475569', letterSpacing:0.5 }}>WIN</div>
        </div>
      </div>
    </div>
  )
}

// ── Team Rankings ──────────────────────────────────────────────
function TeamRankings({ allPlayers, currentUserId, onOpenProfile }) {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const playerMap = Object.fromEntries((allPlayers||[]).map(p => [p.id, p]))

  useEffect(() => {
    async function buildTeams() {
      const { data: games } = await supabase
        .from('games').select('*').eq('is_reverted', false).order('played_at', { ascending: true })
      if (!games) { setLoading(false); return }

      const teamStats = {}
      games.forEach(g => {
        [
          { ids:[...g.team_a_ids].sort(), won:g.winner_team==='A', sa:g.score_a, sb:g.score_b },
          { ids:[...g.team_b_ids].sort(), won:g.winner_team==='B', sa:g.score_b, sb:g.score_a },
        ].forEach(({ ids, won, sa, sb }) => {
          const key = ids.join('|')
          if (!teamStats[key]) teamStats[key] = { ids, wins:0, losses:0, scored:0, conceded:0 }
          teamStats[key].wins    += won ? 1 : 0
          teamStats[key].losses  += won ? 0 : 1
          teamStats[key].scored  += sa
          teamStats[key].conceded+= sb
        })
      })

      setTeams(Object.values(teamStats).sort((a,b) => b.wins - a.wins).slice(0, 10))
      setLoading(false)
    }
    buildTeams()
  }, [allPlayers])

  if (loading) return <div style={{ textAlign:'center', color:'#334155', padding:40 }}>Building team stats...</div>
  if (teams.length === 0) return (
    <div style={{ textAlign:'center', color:'#334155', padding:60 }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🤝</div>
      <div style={{ fontSize:14 }}>No team data yet</div>
    </div>
  )

  // Find user's best team
  const myBestTeam = teams.find(t => t.ids.includes(currentUserId))

  return (
    <div>
      {/* User's best team hero */}
      {myBestTeam && (() => {
        const partner = myBestTeam.ids.find(id => id !== currentUserId)
        const partnerPlayer = playerMap[partner]
        const me = playerMap[currentUserId]
        if (!partnerPlayer || !me) return null
        const total = myBestTeam.wins + myBestTeam.losses
        const pct = total > 0 ? Math.round((myBestTeam.wins/total)*100) : 0
        const lMe = getLevel(me.total_wins||0)
        const lP = getLevel(partnerPlayer.total_wins||0)
        return (
          <div style={{ background:'linear-gradient(135deg,rgba(74,222,128,0.08),rgba(96,165,250,0.06))', border:'1.5px solid rgba(74,222,128,0.25)', borderRadius:18, padding:'16px 14px', marginBottom:20 }}>
            <div style={{ fontSize:10, color:'#4ade80', letterSpacing:2, fontWeight:700, marginBottom:10, textTransform:'uppercase' }}>🤝 Your Best Duo</div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
              {[{p:me,l:lMe},{p:partnerPlayer,l:lP}].map(({p,l},i) => (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:8, flex:1, background:'rgba(0,0,0,0.3)', borderRadius:12, padding:'10px 10px' }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', overflow:'hidden', border:`2px solid ${l.aura}`, flexShrink:0, background:'#1a2a1a' }}>
                    <img src={getAvatarUrl(p.id)} alt={p.display_name} width={44} height={44} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:1, color:'#f1f5f9', lineHeight:1 }}>{p.display_name}</div>
                    <div style={{ fontSize:9, color:l.aura }}>{l.emoji} {l.name}</div>
                  </div>
                  {i===0 && <div style={{ fontSize:14, color:'#334155', marginLeft:'auto' }}>+</div>}
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
              {[
                { label:'WINS',    val:myBestTeam.wins,   color:'#4ade80' },
                { label:'LOSSES',  val:myBestTeam.losses, color:'#f87171' },
                { label:'WIN RATE',val:`${pct}%`,         color:'#ffd700' },
              ].map(s => (
                <div key={s.label} style={{ background:'rgba(0,0,0,0.4)', borderRadius:10, padding:'8px 4px', textAlign:'center' }}>
                  <div style={{ fontFamily:"'Teko',sans-serif", fontSize:20, color:s.color, lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontSize:9, color:'#475569', letterSpacing:0.8 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#4ade8066,#4ade80)', borderRadius:2 }}/>
            </div>
          </div>
        )
      })()}

      {/* Section header */}
      <div style={{ fontSize:11, color:'#334155', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:12 }}>ALL DUOS · TOP 10</div>

      {/* Team leaderboard rows */}
      {teams.map((t, idx) => {
        const p1 = playerMap[t.ids[0]], p2 = playerMap[t.ids[1]]
        if (!p1 || !p2) return null
        const total = t.wins + t.losses
        const pct = total > 0 ? Math.round((t.wins/total)*100) : 0
        const diff = t.scored - t.conceded
        const isMyTeam = t.ids.includes(currentUserId)
        const badge = getRankBadge(idx+1)
        const l1 = getLevel(p1.total_wins||0), l2 = getLevel(p2.total_wins||0)
        const teamColor = pct >= 60 ? '#ffd700' : pct >= 40 ? '#4ade80' : '#94a3b8'

        return (
          <div key={t.ids.join('|')} style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'10px 12px', marginBottom:8,
            background: isMyTeam ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${isMyTeam ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius:14, animation:`card-in 0.3s ease-out ${idx*0.04}s both`,
          }}>
            {/* Rank */}
            <div style={{ width:30, height:30, borderRadius:8, background:badge.bg, border:`1px solid ${badge.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:12, color:badge.color }}>{badge.label}</span>
            </div>

            {/* Avatars stacked */}
            <div style={{ position:'relative', width:52, height:36, flexShrink:0 }}>
              {[{p:p1,l:l1,left:0},{p:p2,l:l2,left:18}].map(({p,l,left}) => (
                <div key={p.id} style={{ position:'absolute', left, top:0, width:34, height:34, borderRadius:'50%', overflow:'hidden', border:`1.5px solid ${l.aura}66`, background:'#1a2a1a' }}>
                  <img src={getAvatarUrl(p.id)} alt={p.display_name} width={34} height={34} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                </div>
              ))}
            </div>

            {/* Names + bar */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:1, color: isMyTeam?'#4ade80':'#f1f5f9', lineHeight:1, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {p1.display_name} + {p2.display_name}
                {isMyTeam && <span style={{ fontSize:9, color:'#4ade80', marginLeft:6, letterSpacing:1 }}>YOU</span>}
              </div>
              <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden', maxWidth:100 }}>
                <div style={{ height:'100%', width:`${pct}%`, background:teamColor, borderRadius:2 }}/>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:'flex', gap:4, flexShrink:0 }}>
              <div style={{ textAlign:'center', background:'rgba(74,222,128,0.08)', borderRadius:7, padding:'4px 6px', minWidth:28 }}>
                <div style={{ fontFamily:"'Teko',sans-serif", fontSize:15, color:'#4ade80', lineHeight:1 }}>{t.wins}</div>
                <div style={{ fontSize:8, color:'#475569' }}>W</div>
              </div>
              <div style={{ textAlign:'center', background:'rgba(248,113,113,0.08)', borderRadius:7, padding:'4px 6px', minWidth:28 }}>
                <div style={{ fontFamily:"'Teko',sans-serif", fontSize:15, color:'#f87171', lineHeight:1 }}>{t.losses}</div>
                <div style={{ fontSize:8, color:'#475569' }}>L</div>
              </div>
              <div style={{ textAlign:'center', background:'rgba(255,255,255,0.05)', borderRadius:7, padding:'4px 6px', minWidth:34 }}>
                <div style={{ fontFamily:"'Teko',sans-serif", fontSize:15, color:teamColor, lineHeight:1 }}>{pct}%</div>
                <div style={{ fontSize:8, color:'#475569' }}>WIN</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Games tab with date grouping ───────────────────────────────
function GamesTab({ recentGames, players, loading }) {
  if (loading) return <div style={{ textAlign:'center', color:'#334155', padding:40 }}>Loading games...</div>
  if (recentGames.length === 0) return (
    <div style={{ textAlign:'center', color:'#334155', padding:60 }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🏸</div>
      <div style={{ fontSize:14 }}>No games yet — tap LOG GAME!</div>
    </div>
  )

  // Group games by date
  const groups = {}
  recentGames.forEach(g => {
    const d = new Date(g.played_at)
    const key = d.toDateString()
    if (!groups[key]) groups[key] = []
    groups[key].push(g)
  })

  function formatDateHeader(dateStr) {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return { main:'Today', sub:d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'}) }
    if (d.toDateString() === yesterday.toDateString()) return { main:'Yesterday', sub:d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'}) }
    return {
      main: d.toLocaleDateString('en-IN',{weekday:'long'}),
      sub:  d.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}),
    }
  }

  return (
    <div>
      {Object.entries(groups).map(([dateStr, dayGames]) => {
        const { main, sub } = formatDateHeader(dateStr)
        return (
          <div key={dateStr} style={{ marginBottom:24 }}>
            {/* Date header */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#f1f5f9', letterSpacing:2, lineHeight:1 }}>{main}</div>
                <div style={{ fontSize:11, color:'#475569', letterSpacing:0.5 }}>{sub}</div>
              </div>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }}/>
              <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:20, padding:'3px 10px', fontSize:11, color:'#475569' }}>
                {dayGames.length} game{dayGames.length > 1 ? 's' : ''}
              </div>
            </div>

            {/* Games for this date */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {dayGames.map((g, i) => (
                <div key={g.id} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'12px 12px', animation:`slide-up 0.25s ease-out ${i*0.04}s both` }}>
                  {/* Time + winner */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <span style={{ fontSize:12, color:'#475569', fontFamily:"'Rajdhani',sans-serif" }}>
                      {new Date(g.played_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                    </span>
                    <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'rgba(74,222,128,0.1)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.2)', letterSpacing:1 }}>
                      TEAM {g.winner_team} WON
                    </span>
                  </div>

                  {/* Score */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:g.winner_team==='A'?'#4ade80':'#475569', fontFamily:"'Rajdhani',sans-serif" }}>Team A</span>
                    <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:'#f1f5f9', letterSpacing:4 }}>
                      {g.score_a} — {g.score_b}
                    </span>
                    <span style={{ fontSize:13, fontWeight:700, color:g.winner_team==='B'?'#4ade80':'#475569', fontFamily:"'Rajdhani',sans-serif" }}>Team B</span>
                  </div>

                  {/* Player avatars */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      {(g.team_a_ids||[]).map(pid => {
                        const p = players.find(pl=>pl.id===pid)
                        if (!p) return null
                        const l = getLevel(p.total_wins||0)
                        return (
                          <div key={pid} style={{ textAlign:'center' }}>
                            <div style={{ width:32, height:32, borderRadius:'50%', overflow:'hidden', border:`1.5px solid ${g.winner_team==='A'?l.aura:l.aura+'44'}`, margin:'0 auto 2px', background:'#1a2a1a' }}>
                              <img src={getAvatarUrl(p.id)} alt={p.display_name} width={32} height={32} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                            </div>
                            <div style={{ fontSize:9, fontFamily:"'Rajdhani',sans-serif", fontWeight:700, color:g.winner_team==='A'?l.aura:'#475569', lineHeight:1 }}>{p.display_name}</div>
                            <div style={{ fontSize:8, color:l.aura, opacity:0.7 }}>{l.emoji}</div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:12, color:'#1e293b', letterSpacing:2 }}>VS</div>
                    <div style={{ display:'flex', gap:6 }}>
                      {(g.team_b_ids||[]).map(pid => {
                        const p = players.find(pl=>pl.id===pid)
                        if (!p) return null
                        const l = getLevel(p.total_wins||0)
                        return (
                          <div key={pid} style={{ textAlign:'center' }}>
                            <div style={{ width:32, height:32, borderRadius:'50%', overflow:'hidden', border:`1.5px solid ${g.winner_team==='B'?l.aura:l.aura+'44'}`, margin:'0 auto 2px', background:'#1a2a1a' }}>
                              <img src={getAvatarUrl(p.id)} alt={p.display_name} width={32} height={32} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                            </div>
                            <div style={{ fontSize:9, fontFamily:"'Rajdhani',sans-serif", fontWeight:700, color:g.winner_team==='B'?l.aura:'#475569', lineHeight:1 }}>{p.display_name}</div>
                            <div style={{ fontSize:8, color:l.aura, opacity:0.7 }}>{l.emoji}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

  const me = players.find(p => p.id === currentUser.id)

  function handleGameLogged() {
    refetch(); setShowLogGame(false)
    setNewGame(true)
    setTimeout(() => setNewGame(false), 2000)
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
        .tab-btn { background:none; border:none; color:#475569; font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:700; letter-spacing:1px; padding:10px 14px; cursor:pointer; border-bottom:2px solid transparent; transition:all 0.2s; text-transform:uppercase; white-space:nowrap; flex:1; }
        .tab-btn.active { color:#4ade80; border-bottom-color:#4ade80; }
      `}</style>

      {/* Shuttlecock celebration */}
      {newGame && Array.from({length:4}).map((_,i) => (
        <div key={i} style={{ position:'fixed', zIndex:200, pointerEvents:'none', fontSize:24, top:`${20+i*18}%`, left:'-40px', animation:`shuttle-fly ${0.7+i*0.2}s ease-out ${i*0.12}s forwards` }}>🏸</div>
      ))}

      {/* Sticky header */}
      <div style={{ position:'sticky', top:0, zIndex:40, background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(74,222,128,0.08)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>🏸</span>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#4ade80', letterSpacing:4 }}>SHUTTLE</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {me && (
            <div onClick={() => onOpenProfile && onOpenProfile(currentUser.id)} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:20, padding:'4px 10px', cursor:'pointer' }}>
              <div style={{ width:22, height:22, borderRadius:'50%', overflow:'hidden' }}>
                <img src={getAvatarUrl(currentUser.id)} width={22} height={22} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
              </div>
              <span style={{ fontSize:12, color:'#4ade80', fontWeight:700 }}>{currentUser.displayName}</span>
            </div>
          )}
          <button onClick={logout} style={{ background:'transparent', border:'1px solid #1e293b', color:'#334155', borderRadius:20, padding:'4px 10px', cursor:'pointer', fontSize:11, fontFamily:'inherit' }}>Out</button>
        </div>
      </div>

      {/* Sticky tabs */}
      <div style={{ position:'sticky', top:49, zIndex:39, background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', display:'flex', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        {[
          { id:'players', label:'⚡ Players' },
          { id:'teams',   label:'🤝 Teams' },
          { id:'games',   label:'📋 Games' },
        ].map(t => (
          <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:'16px 14px 100px' }}>

        {/* PLAYERS TAB */}
        {tab === 'players' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            {/* Current user hero card */}
            {me && (
              <HeroCard
                player={me}
                isCurrentUser={true}
                onClick={() => onOpenProfile && onOpenProfile(me.id)}
              />
            )}

            {/* Section label */}
            <div style={{ fontSize:11, color:'#334155', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:12 }}>
              🏆 LEADERBOARD
            </div>

            {/* All players as rows */}
            {players.map((p, idx) => (
              <LeaderRow
                key={p.id}
                player={p}
                rank={idx + 1}
                isCurrentUser={p.id === currentUser.id}
                onClick={() => onOpenProfile && onOpenProfile(p.id)}
              />
            ))}
          </div>
        )}

        {/* TEAMS TAB */}
        {tab === 'teams' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            <TeamRankings
              allPlayers={players}
              currentUserId={currentUser.id}
              onOpenProfile={onOpenProfile}
            />
          </div>
        )}

        {/* GAMES TAB */}
        {tab === 'games' && (
          <GamesTab recentGames={recentGames} players={players} loading={loading}/>
        )}
      </div>

      {/* Sticky FAB */}
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', zIndex:50, width:'100%', maxWidth:480, padding:'10px 16px 24px', background:'linear-gradient(to top,rgba(6,13,20,1) 60%,transparent)', pointerEvents:'none' }}>
        <button onClick={() => setShowLogGame(true)} style={{
          display:'block', width:'100%',
          background:'linear-gradient(135deg,#14532d,#166534)',
          border:'1.5px solid #4ade80', color:'#4ade80',
          fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:5,
          padding:'16px', borderRadius:50, cursor:'pointer',
          animation:'fab-pulse 2.5s ease-in-out infinite',
          pointerEvents:'all',
        }}>+ LOG GAME</button>
      </div>

      {showLogGame && <LogGame onClose={() => setShowLogGame(false)} onGameLogged={handleGameLogged}/>}
    </div>
  )
}