// src/components/Dashboard.jsx — v5 with anime cards, sticky FAB, team rankings
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRealtimeDashboard } from '../hooks/useRealtimeDashboard'
import { getAvatarUrl } from '../utils/avatars'
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

// ── Compact anime player card ─────────────────────────────────
function PlayerCard({ player, rank, onClick }) {
  const level = getLevel(player.total_wins || 0)
  const winPct = player.total_games > 0 ? Math.round((player.total_wins / player.total_games) * 100) : 0
  const [imgErr, setImgErr] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(player)}
      style={{
        position:'relative', background:level.bg,
        border:`1.5px solid ${hovered?level.aura:level.aura+'33'}`,
        borderRadius:14, padding:'12px 10px 10px',
        cursor:'pointer', transition:'all 0.22s',
        transform:hovered?'translateY(-3px) scale(1.02)':'scale(1)',
        boxShadow:hovered?`0 10px 32px ${level.glow}`:'0 3px 12px rgba(0,0,0,0.5)',
        overflow:'hidden',
      }}>

      {/* Holographic sheen */}
      {hovered && <div style={{ position:'absolute', inset:0, borderRadius:14, background:`linear-gradient(135deg,${level.aura}12,transparent 60%,${level.aura}08)`, pointerEvents:'none' }}/>}

      {/* Rank */}
      <div style={{ position:'absolute', top:8, left:8, fontFamily:"'Bebas Neue',sans-serif", fontSize:11, color:rank<=3?level.aura:'#334155', letterSpacing:1 }}>#{rank}</div>

      {/* Streak badge */}
      {player.current_streak >= 3 && (
        <div style={{ position:'absolute', top:6, right:6, background:'rgba(249,115,22,0.2)', border:'1px solid rgba(249,115,22,0.5)', borderRadius:20, padding:'1px 5px', fontSize:9, fontWeight:700, color:'#fb923c' }}>🔥{player.current_streak}</div>
      )}

      {/* Anime avatar */}
      <div style={{ position:'relative', width:52, height:52, margin:'14px auto 8px' }}>
        <div style={{ width:52, height:52, borderRadius:'50%', overflow:'hidden', border:`2px solid ${level.aura}88`, boxShadow:hovered?`0 0 16px ${level.glow}`:'none', background:'#1a2a1a', transition:'box-shadow 0.2s' }}>
          {!imgErr ? (
            <img src={getAvatarUrl(player.id)} alt={player.display_name} width={52} height={52}
              style={{ width:'100%', height:'100%', objectFit:'cover' }}
              onError={() => setImgErr(true)}/>
          ) : (
            <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:level.aura }}>{player.display_name.charAt(0)}</div>
          )}
        </div>
        {level.tier >= 4 && (
          <div style={{ position:'absolute', inset:-4, borderRadius:'50%', border:`1.5px solid ${level.aura}`, borderTopColor:'transparent', borderRightColor:'transparent', animation:'spin-ring 4s linear infinite', pointerEvents:'none' }}/>
        )}
      </div>

      {/* Name */}
      <div style={{ textAlign:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:15, letterSpacing:1.5, color:'#f1f5f9', marginBottom:3, lineHeight:1 }}>{player.display_name}</div>

      {/* Level chip */}
      <div style={{ textAlign:'center', marginBottom:8 }}>
        <span style={{ fontSize:9, fontWeight:700, letterSpacing:1, padding:'2px 6px', borderRadius:20, background:`${level.aura}18`, color:level.aura, border:`1px solid ${level.aura}33` }}>{level.emoji} {level.name}</span>
      </div>

      {/* Win bar */}
      <div style={{ height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden', marginBottom:6 }}>
        <div style={{ height:'100%', width:`${winPct}%`, background:`linear-gradient(90deg,${level.aura}77,${level.aura})`, borderRadius:2 }}/>
      </div>

      {/* Mini stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:3 }}>
        {[{l:'W',v:player.total_wins||0,c:'#4ade80'},{l:'L',v:player.total_losses||0,c:'#f87171'},{l:'%',v:winPct,c:level.aura}].map(s=>(
          <div key={s.l} style={{ textAlign:'center', background:'rgba(0,0,0,0.35)', borderRadius:6, padding:'3px 1px' }}>
            <div style={{ fontFamily:"'Teko',sans-serif", fontSize:15, color:s.c, lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:8, color:'#475569' }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Team Rankings ──────────────────────────────────────────────
function TeamRankings({ allPlayers }) {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  const playerMap = Object.fromEntries((allPlayers||[]).map(p=>[p.id,p]))

  useEffect(() => {
    async function buildTeams() {
      const { data: games } = await supabase
        .from('games').select('*').eq('is_reverted', false).order('played_at', { ascending: true })
      if (!games) { setLoading(false); return }

      const teamStats = {}
      games.forEach(g => {
        const pairs = [
          { ids: [...g.team_a_ids].sort(), won: g.winner_team === 'A', sa: g.score_a, sb: g.score_b },
          { ids: [...g.team_b_ids].sort(), won: g.winner_team === 'B', sa: g.score_b, sb: g.score_a },
        ]
        pairs.forEach(({ ids, won, sa, sb }) => {
          const key = ids.join('|')
          if (!teamStats[key]) teamStats[key] = { ids, wins:0, losses:0, scored:0, conceded:0 }
          teamStats[key].wins    += won ? 1 : 0
          teamStats[key].losses  += won ? 0 : 1
          teamStats[key].scored  += sa
          teamStats[key].conceded+= sb
        })
      })

      const sorted = Object.values(teamStats)
        .sort((a, b) => b.wins - a.wins)
        .slice(0, 10)
      setTeams(sorted)
      setLoading(false)
    }
    buildTeams()
  }, [allPlayers])

  if (loading) return <div style={{ textAlign:'center', color:'#334155', padding:40 }}>Loading teams...</div>
  if (teams.length === 0) return (
    <div style={{ textAlign:'center', color:'#334155', padding:60 }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🏸</div>
      <div style={{ fontSize:14 }}>No team data yet — log some games!</div>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {teams.map((t, idx) => {
        const p1 = playerMap[t.ids[0]], p2 = playerMap[t.ids[1]]
        if (!p1 || !p2) return null
        const total = t.wins + t.losses
        const pct = total > 0 ? Math.round((t.wins/total)*100) : 0
        const diff = t.scored - t.conceded
        const l1 = getLevel(p1.total_wins||0), l2 = getLevel(p2.total_wins||0)
        const teamAura = pct >= 60 ? '#ffd700' : pct >= 40 ? '#4ade80' : '#94a3b8'
        const medals = ['🥇','🥈','🥉']

        return (
          <div key={t.ids.join('|')} style={{
            background:`linear-gradient(135deg, rgba(0,0,0,0.5), rgba(255,255,255,0.02))`,
            border:`1px solid ${idx<3?teamAura+'44':'rgba(255,255,255,0.07)'}`,
            borderRadius:16, padding:'14px 16px',
            animation:`card-in 0.4s ease-out ${idx*0.05}s both`,
          }}>
            {/* Header row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:idx<3?teamAura:'#334155' }}>
                  {medals[idx] || `#${idx+1}`}
                </span>
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${teamAura}18`, color:teamAura, border:`1px solid ${teamAura}33`, fontFamily:"'Rajdhani',sans-serif", letterSpacing:1 }}>
                  {pct}% WIN RATE
                </span>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:"'Teko',sans-serif", fontSize:22, color:teamAura, lineHeight:1 }}>{t.wins}W {t.losses}L</div>
                <div style={{ fontSize:10, color:diff>=0?'#4ade80':'#f87171' }}>{diff>=0?'+':''}{diff} pts diff</div>
              </div>
            </div>

            {/* Players */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              {[{p:p1,l:l1},{p:p2,l:l2}].map(({p,l},i) => (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:8, flex:1, background:'rgba(0,0,0,0.3)', borderRadius:10, padding:'8px 10px', border:`1px solid ${l.aura}22` }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', overflow:'hidden', border:`1.5px solid ${l.aura}66`, flexShrink:0, background:'#1a2a1a' }}>
                    <img src={getAvatarUrl(p.id)} alt={p.display_name} width={38} height={38}
                      style={{ width:'100%', height:'100%', objectFit:'cover' }}
                      onError={e=>e.target.style.display='none'}/>
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:1, color:'#f1f5f9', lineHeight:1 }}>{p.display_name}</div>
                    <div style={{ fontSize:9, color:l.aura, letterSpacing:0.5 }}>{l.emoji} {l.name}</div>
                  </div>
                  {i === 0 && <div style={{ fontSize:11, color:'#334155', margin:'0 2px' }}>+</div>}
                </div>
              ))}
            </div>

            {/* Win rate bar */}
            <div style={{ height:5, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${teamAura}66,${teamAura})`, borderRadius:3, transition:'width 1s ease' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
              <span style={{ fontSize:10, color:'#4ade80' }}>{t.wins} wins</span>
              <span style={{ fontSize:10, color:'#f87171' }}>{t.losses} losses</span>
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

  function handleGameLogged() {
    refetch(); setShowLogGame(false)
    setNewGame(true)
    setTimeout(() => setNewGame(false), 2000)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#060d14', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', position:'relative' }}>
      <style>{`
        ${FONTS}
        @keyframes spin-ring { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes card-in { from{opacity:0;transform:translateY(16px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes slide-up { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fab-pulse { 0%,100%{box-shadow:0 4px 24px rgba(74,222,128,0.35),0 0 0 0 rgba(74,222,128,0.2)} 50%{box-shadow:0 8px 40px rgba(74,222,128,0.5),0 0 0 8px rgba(74,222,128,0.08)} }
        @keyframes shuttle-fly { 0%{left:-40px;opacity:1} 100%{left:110%;opacity:0} }
        .tab-btn { background:none; border:none; color:#475569; font-family:'Rajdhani',sans-serif; font-size:12px; font-weight:700; letter-spacing:1px; padding:10px 12px; cursor:pointer; border-bottom:2px solid transparent; transition:all 0.2s; text-transform:uppercase; white-space:nowrap; }
        .tab-btn.active { color:#4ade80; border-bottom-color:#4ade80; }
        .game-row:hover { background:rgba(255,255,255,0.04) !important; }
      `}</style>

      {/* Shuttlecock on game log */}
      {newGame && Array.from({length:4}).map((_,i) => (
        <div key={i} style={{ position:'fixed', zIndex:200, pointerEvents:'none', fontSize:26, top:`${20+i*18}%`, left:'-40px', animation:`shuttle-fly ${0.7+i*0.2}s ease-out ${i*0.12}s forwards` }}>🏸</div>
      ))}

      {/* Court lines bg */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', opacity:0.04 }}>
        <svg width="100%" height="100%" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice">
          <rect width="800" height="900" fill="none"/>
          <g stroke="#4ade80" fill="none">
            <rect x="40" y="40" width="720" height="820" strokeWidth="1.5"/>
            <line x1="400" y1="40" x2="400" y2="860" strokeWidth="2"/>
            <line x1="40" y1="450" x2="760" y2="450" strokeWidth="2"/>
            <line x1="40" y1="220" x2="760" y2="220" strokeWidth="0.8"/>
            <line x1="40" y1="680" x2="760" y2="680" strokeWidth="0.8"/>
          </g>
        </svg>
      </div>

      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:40, background:'rgba(6,13,20,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(74,222,128,0.08)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:22 }}>🏸</span>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'#4ade80', letterSpacing:4 }}>SHUTTLE</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div onClick={() => onOpenProfile && onOpenProfile(currentUser.id)}
            style={{ background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:20, padding:'5px 12px', fontSize:13, color:'#4ade80', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
            {/* own avatar */}
            <div style={{ width:22, height:22, borderRadius:'50%', overflow:'hidden', border:'1px solid rgba(74,222,128,0.4)' }}>
              <img src={getAvatarUrl(currentUser.id)} width={22} height={22} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
            </div>
            {currentUser.displayName} ↗
          </div>
          <button onClick={logout} style={{ background:'transparent', border:'1px solid #1e293b', color:'#334155', borderRadius:20, padding:'5px 10px', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>Out</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ position:'sticky', top:52, zIndex:39, background:'rgba(6,13,20,0.95)', backdropFilter:'blur(12px)', display:'flex', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'0 12px', overflowX:'auto' }}>
        {[
          { id:'players', label:'⚡ Players' },
          { id:'teams',   label:'🤝 Teams' },
          { id:'games',   label:'📋 Games' },
        ].map(t => (
          <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ position:'relative', zIndex:10, padding:'16px 14px 100px' }}>

        {/* PLAYERS TAB */}
        {tab === 'players' && (
          <div>
            {/* Top 3 podium */}
            {players.length >= 3 && (
              <div style={{ display:'flex', gap:8, marginBottom:18, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:14, padding:'10px 12px', alignItems:'center' }}>
                <span style={{ fontSize:10, color:'#334155', letterSpacing:1, textTransform:'uppercase', fontWeight:700, marginRight:2 }}>Top</span>
                {players.slice(0,3).map((p,i) => {
                  const l = getLevel(p.total_wins||0)
                  return (
                    <div key={p.id} onClick={() => onOpenProfile&&onOpenProfile(p.id)}
                      style={{ display:'flex', alignItems:'center', gap:6, flex:1, background:'rgba(0,0,0,0.3)', borderRadius:10, padding:'6px 8px', border:`1px solid ${l.aura}22`, cursor:'pointer' }}>
                      <span style={{ fontSize:14 }}>{['🥇','🥈','🥉'][i]}</span>
                      <div style={{ width:24, height:24, borderRadius:'50%', overflow:'hidden', border:`1px solid ${l.aura}55`, flexShrink:0 }}>
                        <img src={getAvatarUrl(p.id)} width={24} height={24} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                      </div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:l.aura, lineHeight:1 }}>{p.display_name}</div>
                        <div style={{ fontSize:9, color:'#475569' }}>{p.total_wins||0}W</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {loading && <div style={{ textAlign:'center', color:'#334155', padding:32 }}>Loading...</div>}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
              {players.map((p,i) => (
                <div key={p.id} style={{ animation:`card-in 0.4s ease-out ${i*0.05}s both` }}>
                  <PlayerCard player={p} rank={i+1} onClick={p => onOpenProfile&&onOpenProfile(p.id)}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEAMS TAB */}
        {tab === 'teams' && (
          <div style={{ animation:'slide-up 0.3s ease-out' }}>
            <div style={{ fontSize:11, color:'#334155', letterSpacing:2, textTransform:'uppercase', marginBottom:14, fontWeight:700 }}>
              Top 10 Duos · All Time
            </div>
            <TeamRankings allPlayers={players}/>
          </div>
        )}

        {/* GAMES TAB */}
        {tab === 'games' && (
          <div style={{ animation:'slide-up 0.3s ease-out' }}>
            {recentGames.length === 0 && !loading && (
              <div style={{ textAlign:'center', color:'#334155', padding:'60px 0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🏸</div>
                <div style={{ fontSize:14 }}>No games yet — tap LOG GAME!</div>
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {recentGames.map((g,i) => {
                const allIds = [...(g.team_a_ids||[]), ...(g.team_b_ids||[])]
                const gamePlayers = allIds.map(id => players.find(p=>p.id===id)).filter(Boolean)
                return (
                  <div key={g.id} className="game-row" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'12px 14px', animation:`slide-up 0.25s ease-out ${i*0.04}s both`, transition:'background 0.2s' }}>
                    {/* Time + winner badge */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                      <span style={{ fontSize:11, color:'#334155' }}>
                        {new Date(g.played_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} · {new Date(g.played_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                      </span>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'rgba(74,222,128,0.1)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.2)' }}>
                        TEAM {g.winner_team} WON
                      </span>
                    </div>

                    {/* Score */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:g.winner_team==='A'?'#4ade80':'#475569' }}>Team A</span>
                      <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:30, color:'#f1f5f9', letterSpacing:4 }}>{g.score_a} — {g.score_b}</span>
                      <span style={{ fontSize:14, fontWeight:700, color:g.winner_team==='B'?'#4ade80':'#475569' }}>Team B</span>
                    </div>

                    {/* Player avatars with levels */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      {/* Team A */}
                      <div style={{ display:'flex', gap:6 }}>
                        {(g.team_a_ids||[]).map(pid => {
                          const p = players.find(pl=>pl.id===pid)
                          if (!p) return null
                          const l = getLevel(p.total_wins||0)
                          return (
                            <div key={pid} style={{ textAlign:'center' }}>
                              <div style={{ width:34, height:34, borderRadius:'50%', overflow:'hidden', border:`1.5px solid ${g.winner_team==='A'?l.aura:l.aura+'44'}`, margin:'0 auto 3px', background:'#1a2a1a' }}>
                                <img src={getAvatarUrl(p.id)} width={34} height={34} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                              </div>
                              <div style={{ fontSize:9, fontFamily:"'Rajdhani',sans-serif", fontWeight:700, color:g.winner_team==='A'?l.aura:'#475569', lineHeight:1 }}>{p.display_name}</div>
                              <div style={{ fontSize:8, color:l.aura, opacity:0.7 }}>{l.emoji}</div>
                            </div>
                          )
                        })}
                      </div>

                      {/* VS divider */}
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#1e293b', letterSpacing:2 }}>VS</div>

                      {/* Team B */}
                      <div style={{ display:'flex', gap:6 }}>
                        {(g.team_b_ids||[]).map(pid => {
                          const p = players.find(pl=>pl.id===pid)
                          if (!p) return null
                          const l = getLevel(p.total_wins||0)
                          return (
                            <div key={pid} style={{ textAlign:'center' }}>
                              <div style={{ width:34, height:34, borderRadius:'50%', overflow:'hidden', border:`1.5px solid ${g.winner_team==='B'?l.aura:l.aura+'44'}`, margin:'0 auto 3px', background:'#1a2a1a' }}>
                                <img src={getAvatarUrl(p.id)} width={34} height={34} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                              </div>
                              <div style={{ fontSize:9, fontFamily:"'Rajdhani',sans-serif", fontWeight:700, color:g.winner_team==='B'?l.aura:'#475569', lineHeight:1 }}>{p.display_name}</div>
                              <div style={{ fontSize:8, color:l.aura, opacity:0.7 }}>{l.emoji}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── STICKY FAB — always visible ── */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:50, padding:'12px 16px 24px', background:'linear-gradient(to top, rgba(6,13,20,1) 60%, transparent)', pointerEvents:'none' }}>
        <button
          onClick={() => setShowLogGame(true)}
          style={{
            display:'block', width:'100%', maxWidth:360, margin:'0 auto',
            background:'linear-gradient(135deg,#14532d,#166534,#15803d)',
            border:'1.5px solid #4ade80', color:'#4ade80',
            fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:5,
            padding:'18px', borderRadius:50, cursor:'pointer',
            animation:'fab-pulse 2.5s ease-in-out infinite',
            pointerEvents:'all',
          }}>
          + LOG GAME
        </button>
      </div>

      {showLogGame && <LogGame onClose={() => setShowLogGame(false)} onGameLogged={handleGameLogged}/>}
    </div>
  )
}