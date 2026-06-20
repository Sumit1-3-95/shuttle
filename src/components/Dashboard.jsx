// src/components/Dashboard.jsx — v14
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRealtimeDashboard } from '../hooks/useRealtimeDashboard'
import { useCourtData } from '../hooks/useCourtData'
import { getAvatarUrl, getCharacterName } from '../utils/avatars'
import { supabase } from '../supabaseClient'
import LogGame from './LogGame'
import CourtManager from './CourtManager'
import MyCourts from './MyCourts'
import TeamProfile from './TeamProfile'
import { useGameLogger } from '../hooks/useGameLogger'

function getLevel(wins) {
  if (wins >= 50) return { name:'LEGEND',    tier:5, aura:'#ffd700', bg:'#2a1f00', glow:'rgba(255,215,0,0.4)',   emoji:'👑' }
  if (wins >= 30) return { name:'ELITE',     tier:4, aura:'#c084fc', bg:'#1a0f2e', glow:'rgba(192,132,252,0.4)', emoji:'⚡' }
  if (wins >= 15) return { name:'SMASH PRO', tier:3, aura:'#38bdf8', bg:'#001f2e', glow:'rgba(56,189,248,0.4)',  emoji:'🔥' }
  if (wins >= 5)  return { name:'CONTENDER', tier:2, aura:'#4ade80', bg:'#001a0f', glow:'rgba(74,222,128,0.35)', emoji:'⚔️' }
  return            { name:'ROOKIE',     tier:1, aura:'#94a3b8', bg:'#111827', glow:'rgba(148,163,184,0.2)', emoji:'🎯' }
}

function getRankBadge(rank) {
  if (rank === 1) return { label:'#1', color:'#ffd700', bg:'rgba(255,215,0,0.15)',    border:'rgba(255,215,0,0.4)' }
  if (rank === 2) return { label:'#2', color:'#94a3b8', bg:'rgba(148,163,184,0.15)', border:'rgba(148,163,184,0.4)' }
  if (rank === 3) return { label:'#3', color:'#cd7f32', bg:'rgba(205,127,50,0.15)',  border:'rgba(205,127,50,0.4)' }
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

// ── Tab loader ─────────────────────────────────────────────────
function TabLoader() {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(6,13,20,0.92)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none', animation:'tab-loader-in 0.15s ease-out' }}>
      <div style={{ fontSize:36, animation:'shuttle-spin 0.5s linear infinite', display:'inline-block' }}>🏸</div>
    </div>
  )
}

// ── Hamburger menu ─────────────────────────────────────────────
function HamburgerMenu({ currentUser, currentPlayer, groups, myGroupIds, activeGroup, onGroupSelect, onClose, onLogout, onOpenProfile, onGroupCreated, onJoinGroup, onOpenCourtManager, onOpenMyCourts }) {
  const level = getLevel(currentPlayer?.total_wins || 0)
  const [showCreate, setShowCreate] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  async function handleCreateGroup() {
    if (!newGroupName.trim()) { setCreateError('Enter a group name'); return }
    setCreating(true); setCreateError('')
    try {
      const { data: newGroup, error } = await supabase
        .from('groups').insert({ name: newGroupName.trim() }).select().single()
      if (error) throw error
      await supabase.from('group_members').insert({ group_id: newGroup.id, player_id: currentUser.id })
      setNewGroupName(''); setShowCreate(false)
      onGroupCreated && onGroupCreated()
    } catch (err) { setCreateError(err.message || 'Failed to create group') }
    setCreating(false)
  }

  function handleGroupClick(id) { onGroupSelect(id); onClose() }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:90, backdropFilter:'blur(4px)' }}/>
      <div style={{ position:'fixed', top:0, left:0, bottom:0, width:290, background:'#0a1628', borderRight:'1px solid rgba(74,222,128,0.15)', zIndex:91, display:'flex', flexDirection:'column', animation:'drawer-in 0.25s cubic-bezier(0.34,1.2,0.64,1)', boxShadow:'4px 0 40px rgba(0,0,0,0.8)' }}>

        {/* Profile */}
        <div style={{ padding:'40px 20px 16px', background:`linear-gradient(180deg,${level.bg},transparent)`, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div style={{ position:'relative', cursor:'pointer' }} onClick={() => { onOpenProfile(currentUser.id, activeGroup); onClose() }}>
              <Av id={currentUser.id} size={56} aura={level.aura} style={{ border:`2.5px solid ${level.aura}`, boxShadow:`0 0 16px ${level.glow}` }}/>
              {level.tier >= 4 && <div style={{ position:'absolute', inset:-3, borderRadius:'50%', border:`1px solid ${level.aura}`, borderTopColor:'transparent', animation:'spin-ring 3s linear infinite', pointerEvents:'none' }}/>}
            </div>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#f1f5f9', letterSpacing:1, lineHeight:1 }}>{currentPlayer?.display_name || currentUser.displayName}</div>
              <div style={{ fontSize:11, color:level.aura, fontWeight:700, letterSpacing:1, marginTop:2 }}>{level.emoji} {level.name}</div>
            </div>
          </div>
          <button onClick={() => { onOpenProfile(currentUser.id, activeGroup); onClose() }} style={{ width:'100%', background:`${level.aura}15`, border:`1px solid ${level.aura}33`, color:level.aura, borderRadius:10, padding:'8px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, letterSpacing:1 }}>
            View My Profile →
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 0' }}>

          {/* Your courts */}
          <div style={{ padding:'0 16px 8px' }}>
            <div style={{ fontSize:10, color:'#475569', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:10, fontFamily:"'Rajdhani',sans-serif" }}>Your Courts</div>
            <div onClick={() => handleGroupClick('all')} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', marginBottom:6, background:activeGroup==='all'?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.02)', border:`1px solid ${activeGroup==='all'?'rgba(74,222,128,0.3)':'rgba(255,255,255,0.06)'}`, borderRadius:10, cursor:'pointer' }}>
              <span style={{ fontSize:16 }}>🏸</span>
              <span style={{ fontSize:14, color:activeGroup==='all'?'#4ade80':'#94a3b8', fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>All Courts</span>
              {activeGroup==='all' && <span style={{ marginLeft:'auto', fontSize:10, color:'#4ade80' }}>●</span>}
            </div>
            {groups.filter(g => myGroupIds.includes(g.id)).map(g => (
              <div key={g.id} onClick={() => handleGroupClick(g.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', marginBottom:6, background:activeGroup===g.id?'rgba(74,222,128,0.1)':'rgba(74,222,128,0.03)', border:`1px solid ${activeGroup===g.id?'rgba(74,222,128,0.35)':'rgba(74,222,128,0.1)'}`, borderRadius:10, cursor:'pointer' }}>
                <span style={{ fontSize:16 }}>🏟️</span>
                <span style={{ fontSize:14, color:activeGroup===g.id?'#4ade80':'#64748b', fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>{g.name}</span>
                {activeGroup===g.id && <span style={{ marginLeft:'auto', fontSize:10, color:'#4ade80' }}>●</span>}
              </div>
            ))}
          </div>

          <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'4px 16px 12px' }}/>

          {/* All courts */}
          <div style={{ padding:'0 16px 8px' }}>
            <div style={{ fontSize:10, color:'#475569', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:10, fontFamily:"'Rajdhani',sans-serif" }}>All Courts</div>
            {groups.map(g => (
              <div key={g.id} onClick={() => handleGroupClick(g.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', marginBottom:6, background:activeGroup===g.id?'rgba(74,222,128,0.08)':'rgba(255,255,255,0.02)', border:`1px solid ${activeGroup===g.id?'rgba(74,222,128,0.25)':'rgba(255,255,255,0.06)'}`, borderRadius:10, cursor:'pointer' }}>
                <span style={{ fontSize:16 }}>🏟️</span>
                <span style={{ fontSize:14, color:activeGroup===g.id?'#4ade80':'#94a3b8', fontFamily:"'Rajdhani',sans-serif", fontWeight:600 }}>{g.name}</span>
                {activeGroup===g.id && <span style={{ marginLeft:'auto', fontSize:10, color:'#4ade80' }}>●</span>}
              </div>
            ))}
          </div>

          <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'4px 16px 12px' }}/>

          {/* Create group */}
          {(currentUser.isAdmin || currentUser.role === 'admin') && (
          <div style={{ padding:'0 16px' }}>
            <div style={{ fontSize:10, color:'#475569', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:10, fontFamily:"'Rajdhani',sans-serif" }}>Admin</div>
            <button onClick={() => { onOpenCourtManager && onOpenCourtManager() }} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 12px', marginBottom:8, background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.25)', borderRadius:10, cursor:'pointer', color:'#4ade80', fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700 }}>
              <span>🏟️</span> Manage All Courts
            </button>
            {!showCreate ? (
              <button onClick={() => setShowCreate(true)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'rgba(74,222,128,0.05)', border:'1px dashed rgba(74,222,128,0.3)', borderRadius:10, cursor:'pointer', color:'#4ade80', fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700 }}>
                <span style={{ fontSize:18 }}>＋</span> Create New Court
              </button>
            ) : (
              <div style={{ background:'rgba(74,222,128,0.05)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:12, padding:'12px' }}>
                <div style={{ fontSize:11, color:'#4ade80', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, marginBottom:8 }}>COURT NAME</div>
                <input value={newGroupName} onChange={e=>setNewGroupName(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&handleCreateGroup()}
                  placeholder="e.g. Lotus Court 3" autoFocus
                  style={{ width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:8, padding:'9px 12px', color:'#f1f5f9', fontSize:14, fontFamily:"'Rajdhani',sans-serif", outline:'none', marginBottom:8 }}/>
                {createError && <div style={{ fontSize:11, color:'#f87171', marginBottom:8 }}>⚠ {createError}</div>}
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => { setShowCreate(false); setNewGroupName(''); setCreateError('') }}
                    style={{ flex:1, background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#475569', borderRadius:8, padding:'8px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13 }}>Cancel</button>
                  <button onClick={handleCreateGroup} disabled={creating}
                    style={{ flex:1, background:'rgba(74,222,128,0.15)', border:'1px solid rgba(74,222,128,0.4)', color:'#4ade80', borderRadius:8, padding:'8px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:1 }}>
                    {creating?'Creating...':'CREATE'}
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Logout */}
        <div style={{ padding:'16px 16px 40px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => { onLogout(); onClose() }} style={{ width:'100%', background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', color:'#f87171', borderRadius:10, padding:'12px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2 }}>LOGOUT</button>
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
    <div onClick={onClick} style={{ position:'relative', borderRadius:22, overflow:'hidden', background:`linear-gradient(160deg,${level.bg} 0%,#060d14 100%)`, border:`1.5px solid ${level.aura}44`, padding:'0 0 16px', marginBottom:20, cursor:'pointer', boxShadow:`0 8px 40px ${level.glow}` }}>
      <svg width="100%" height="100%" viewBox="0 0 420 200" preserveAspectRatio="xMidYMid slice" style={{ position:'absolute', inset:0, opacity:0.13 }} aria-hidden="true">
        <rect x="12" y="10" width="396" height="180" fill="none" stroke={level.aura} strokeWidth="1.5" rx="2"/>
        <line x1="44" y1="10" x2="44" y2="190" stroke={level.aura} strokeWidth="1"/>
        <line x1="376" y1="10" x2="376" y2="190" stroke={level.aura} strokeWidth="1"/>
        <line x1="210" y1="10" x2="210" y2="190" stroke={level.aura} strokeWidth="2"/>
        <line x1="12" y1="64" x2="408" y2="64" stroke={level.aura} strokeWidth="1"/>
        <line x1="12" y1="136" x2="408" y2="136" stroke={level.aura} strokeWidth="1"/>
        <line x1="210" y1="64" x2="210" y2="136" stroke={level.aura} strokeWidth="1"/>
        <line x1="12" y1="34" x2="408" y2="34" stroke={level.aura} strokeWidth="0.8" opacity="0.5"/>
        <line x1="12" y1="166" x2="408" y2="166" stroke={level.aura} strokeWidth="0.8" opacity="0.5"/>
      </svg>
      <div style={{ position:'relative', zIndex:1, padding:'18px 18px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <Av id={player.id} size={72} aura={level.aura} style={{ border:`3px solid ${level.aura}`, boxShadow:`0 0 24px ${level.glow}` }}/>
            {level.tier >= 4 && <div style={{ position:'absolute', inset:-5, borderRadius:'50%', border:`1.5px solid ${level.aura}`, borderTopColor:'transparent', borderRightColor:'transparent', animation:'spin-ring 3s linear infinite' }}/>}
          </div>
          <div style={{ flex:1 }}>
            {isCurrentUser && <div style={{ fontSize:10, color:level.aura, letterSpacing:2, fontWeight:700, fontFamily:"'Rajdhani',sans-serif", marginBottom:4 }}>YOUR PROFILE</div>}
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:30, letterSpacing:2, color:'#ffffff', lineHeight:1, marginBottom:8, textShadow:`0 0 20px ${level.aura}44` }}>{player.display_name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:20, background:`${level.aura}25`, color:level.aura, border:`1.5px solid ${level.aura}66`, fontFamily:"'Rajdhani',sans-serif", letterSpacing:1 }}>{level.emoji} {level.name}</span>
              {(player.current_streak||0) >= 3 && <span style={{ fontSize:12, fontWeight:700, padding:'5px 10px', borderRadius:20, background:'rgba(249,115,22,0.15)', border:'1px solid rgba(249,115,22,0.35)', color:'#fb923c', fontFamily:"'Rajdhani',sans-serif" }}>🔥 {player.current_streak}</span>}
            </div>
          </div>
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:38, color:level.aura, lineHeight:1, textShadow:`0 0 16px ${level.glow}` }}>{winPct}%</div>
            <div style={{ fontSize:11, color:'#94a3b8', fontFamily:"'Rajdhani',sans-serif", letterSpacing:1, fontWeight:600 }}>WIN RATE</div>
          </div>
        </div>
        <div style={{ height:1, background:`linear-gradient(90deg,transparent,${level.aura}44,transparent)`, marginBottom:14 }}/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
          {[{label:'GAMES',val:player.total_games||0,color:'#93c5fd'},{label:'WINS',val:player.total_wins||0,color:'#4ade80'},{label:'LOSSES',val:player.total_losses||0,color:'#f87171'},{label:'BEST 🔥',val:player.best_streak||0,color:'#fb923c'}].map(s=>(
            <div key={s.label} style={{ background:'rgba(0,0,0,0.45)', borderRadius:12, padding:'10px 4px', textAlign:'center', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:s.color, lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:10, color:'#94a3b8', fontFamily:"'Rajdhani',sans-serif", letterSpacing:1, fontWeight:600, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ height:5, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden', marginBottom:8 }}>
          <div style={{ height:'100%', width:`${winPct}%`, background:`linear-gradient(90deg,${level.aura}66,${level.aura})`, borderRadius:3 }}/>
        </div>
        <div style={{ fontSize:11, color:'#475569', textAlign:'right', fontFamily:"'Rajdhani',sans-serif" }}>Tap for full profile →</div>
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
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:isCurrentUser?`${level.aura}0e`:'rgba(255,255,255,0.02)', border:`1px solid ${isCurrentUser?level.aura+'44':'rgba(255,255,255,0.07)'}`, borderRadius:14, cursor:'pointer', marginBottom:8, transition:'all 0.2s' }}>
      <div style={{ width:32, height:32, borderRadius:8, background:badge.bg, border:`1px solid ${badge.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:badge.color }}>{badge.label}</span>
      </div>
      <Av id={player.id} size={42} aura={level.aura}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:1, color:isCurrentUser?level.aura:'#f1f5f9', lineHeight:1 }}>{player.display_name}</span>
          {isCurrentUser && <span style={{ fontSize:9, color:'#4ade80', fontWeight:700, background:'rgba(74,222,128,0.12)', padding:'1px 5px', borderRadius:6, fontFamily:"'Rajdhani',sans-serif", letterSpacing:1 }}>YOU</span>}
          {(player.current_streak||0)>=3 && <span style={{ fontSize:11, color:'#f97316' }}>🔥{player.current_streak}</span>}
        </div>
        <div style={{ height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden', maxWidth:100 }}>
          <div style={{ height:'100%', width:`${winPct}%`, background:level.aura, borderRadius:2 }}/>
        </div>
        <div style={{ marginTop:4 }}>
          <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:10, background:`${level.aura}15`, color:level.aura, border:`1px solid ${level.aura}30`, fontFamily:"'Rajdhani',sans-serif" }}>{level.emoji} {level.name}</span>
        </div>
      </div>
      <div style={{ display:'flex', gap:4, flexShrink:0 }}>
        {[{v:player.total_wins||0,l:'W',c:'#4ade80',bg:'rgba(74,222,128,0.08)'},{v:player.total_losses||0,l:'L',c:'#f87171',bg:'rgba(248,113,113,0.08)'},{v:`${winPct}%`,l:'WIN',c:level.aura,bg:'rgba(255,255,255,0.05)'}].map(s=>(
          <div key={s.l} style={{ textAlign:'center', background:s.bg, borderRadius:7, padding:'4px 6px', minWidth:30 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#ffffff', fontWeight:700, lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:9, color:'#94a3b8', fontFamily:"'Rajdhani',sans-serif" }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Teams tab ──────────────────────────────────────────────────
function TeamsTab({ allPlayers, currentUserId, onOpenTeam }) {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const playerMap = Object.fromEntries((allPlayers||[]).map(p=>[p.id,p]))
  const allowedIds = new Set((allPlayers||[]).map(p=>p.id))

  useEffect(() => {
    async function build() {
      const { data: rawGames } = await supabase.from('games').select('*').eq('is_reverted',false).order('played_at',{ascending:true})
      if (!rawGames) { setLoading(false); return }
      // Scope to court: both players on both teams must be in allPlayers
      const games = rawGames.filter(g => {
        const ids = [...(g.team_a_ids||[]), ...(g.team_b_ids||[])]
        return ids.every(id => allowedIds.has(id))
      })
      const ts = {}
      games.forEach(g => {
        [{ids:[...g.team_a_ids].sort(),won:g.winner_team==='A',sa:g.score_a,sb:g.score_b},
         {ids:[...g.team_b_ids].sort(),won:g.winner_team==='B',sa:g.score_b,sb:g.score_a}
        ].forEach(({ids,won,sa,sb})=>{
          const k=ids.join('|')
          if(!ts[k]) ts[k]={ids,wins:0,losses:0}
          ts[k].wins+=won?1:0; ts[k].losses+=won?0:1
        })
      })
      setTeams(Object.values(ts).sort((a,b)=>b.wins-a.wins).slice(0,10))
      setLoading(false)
    }
    build()
  },[allPlayers])

  if (loading) return <div style={{textAlign:'center',color:'#475569',padding:40,fontFamily:"'Rajdhani',sans-serif",fontSize:16}}>Building team stats...</div>
  if (!teams.length) return <div style={{textAlign:'center',color:'#334155',padding:60}}><div style={{fontSize:40,marginBottom:12}}>🤝</div><div style={{fontSize:14,fontFamily:"'Rajdhani',sans-serif"}}>No team data yet</div></div>

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
          <div onClick={()=>onOpenTeam&&onOpenTeam(me,partner)} style={{background:'linear-gradient(135deg,rgba(74,222,128,0.08),rgba(96,165,250,0.06))',border:'1.5px solid rgba(74,222,128,0.25)',borderRadius:18,padding:'16px 14px',marginBottom:20,cursor:'pointer'}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:'#4ade80',letterSpacing:3,marginBottom:12}}>🤝 YOUR BEST DUO</div>
            <div style={{display:'flex',gap:10,marginBottom:12}}>
              {[{p:me,l:lM},{p:partner,l:lP}].map(({p,l},i)=>(
                <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,flex:1,background:'rgba(0,0,0,0.3)',borderRadius:12,padding:'10px'}}>
                  <Av id={p.id} size={42} aura={l.aura}/>
                  <div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,letterSpacing:1,color:'#f1f5f9',lineHeight:1}}>{p.display_name}</div><div style={{fontSize:10,color:l.aura,fontFamily:"'Rajdhani',sans-serif"}}>{l.emoji} {l.name}</div></div>
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
          <div key={t.ids.join('|')} onClick={()=>onOpenTeam&&onOpenTeam(p1,p2)} style={{display:'flex',alignItems:'center',gap:10,padding:'12px',marginBottom:8,background:isMe?'rgba(74,222,128,0.05)':'rgba(255,255,255,0.02)',border:`1px solid ${isMe?'rgba(74,222,128,0.3)':'rgba(255,255,255,0.07)'}`,borderRadius:14,cursor:'pointer'}}>
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
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:1,color:isMe?'#4ade80':'#f1f5f9',lineHeight:1,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {p1.display_name} + {p2.display_name} {isMe&&<span style={{fontSize:9,color:'#4ade80',fontFamily:"'Rajdhani',sans-serif"}}>YOU</span>}
              </div>
              <div style={{height:3,background:'rgba(255,255,255,0.06)',borderRadius:2,overflow:'hidden',maxWidth:90}}><div style={{height:'100%',width:`${pct}%`,background:tc,borderRadius:2}}/></div>
            </div>
            <div style={{display:'flex',gap:4,flexShrink:0}}>
              {[{v:t.wins,l:'W',c:'#4ade80',bg:'rgba(74,222,128,0.08)'},{v:t.losses,l:'L',c:'#f87171',bg:'rgba(248,113,113,0.08)'},{v:`${pct}%`,l:'WIN',c:tc,bg:'rgba(255,255,255,0.05)'}].map(s=>(
                <div key={s.l} style={{textAlign:'center',background:s.bg,borderRadius:7,padding:'5px 6px',minWidth:32}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:'#ffffff',fontWeight:700,lineHeight:1}}>{s.v}</div>
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
function GamesTab({ recentGames, players, loading, isAdmin, onDeleteGame, onEditGame, groups }) {
  const [filter, setFilter] = useState('all')

  function getFilteredGames() {
    if (filter === 'all') return recentGames
    const now = new Date()
    return recentGames.filter(g => {
      const d = new Date(g.played_at)
      if (filter === 'today') {
        return d.toDateString() === now.toDateString()
      }
      if (filter === 'week') {
        // Week starting Monday
        const mon = new Date(now)
        mon.setDate(now.getDate() - ((now.getDay() + 6) % 7))
        mon.setHours(0,0,0,0)
        return d >= mon
      }
      if (filter === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }
      return true
    })
  }

  const filtered = getFilteredGames()

  const FILTERS = [
    { id:'all',   label:'All' },
    { id:'today', label:'Today' },
    { id:'week',  label:'This Week' },
    { id:'month', label:'This Month' },
  ]

  if (loading) return <div style={{textAlign:'center',color:'#475569',padding:40,fontFamily:"'Rajdhani',sans-serif",fontSize:16}}>Loading...</div>

  const dateGroups = {}
  filtered.forEach(g => {
    const key = new Date(g.played_at).toDateString()
    if (!dateGroups[key]) dateGroups[key] = []
    dateGroups[key].push(g)
  })

  function fmtHeader(ds) {
    const d=new Date(ds),t=new Date(),y=new Date(t); y.setDate(t.getDate()-1)
    if(d.toDateString()===t.toDateString()) return {main:'Today',sub:d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
    if(d.toDateString()===y.toDateString()) return {main:'Yesterday',sub:d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
    return {main:d.toLocaleDateString('en-IN',{weekday:'long'}),sub:d.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
  }

  return (
    <div>
      {/* Filter chips */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding:'7px 14px', borderRadius:20, cursor:'pointer', transition:'all 0.15s',
            border:`1px solid ${filter===f.id?'rgba(74,222,128,0.5)':'rgba(255,255,255,0.1)'}`,
            background: filter===f.id?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.03)',
            color: filter===f.id?'#4ade80':'#64748b',
            fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, letterSpacing:0.5,
          }}>{f.label}</button>
        ))}
        {filter !== 'all' && (
          <div style={{ display:'flex', alignItems:'center', marginLeft:'auto', fontSize:12, color:'#475569', fontFamily:"'Rajdhani',sans-serif" }}>
            {filtered.length} game{filtered.length!==1?'s':''} found
          </div>
        )}
      </div>

      {/* Empty state */}
      {!filtered.length && (
        <div style={{textAlign:'center',color:'#334155',padding:48}}>
          <div style={{fontSize:40,marginBottom:12}}>🏸</div>
          <div style={{fontSize:15,fontFamily:"'Rajdhani',sans-serif",color:'#475569'}}>
            {filter==='today'?'No games today yet':filter==='week'?'No games this week':filter==='month'?'No games this month':'No games yet'}
          </div>
          {filter!=='all' && <div style={{fontSize:12,color:'#334155',marginTop:6,fontFamily:"'Rajdhani',sans-serif",cursor:'pointer',color:'#4ade80'}} onClick={()=>setFilter('all')}>View all games →</div>}
        </div>
      )}

      {Object.entries(dateGroups).map(([ds,dayGames])=>{
        const {main,sub}=fmtHeader(ds)
        return (
          <div key={ds} style={{marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:'#f1f5f9',letterSpacing:2,lineHeight:1}}>{main}</div>
                <div style={{fontSize:11,color:'#475569',fontFamily:"'Rajdhani',sans-serif"}}>{sub}</div>
              </div>
              <div style={{flex:1,height:1,background:'rgba(255,255,255,0.06)'}}/>
              <div style={{background:'rgba(255,255,255,0.05)',borderRadius:20,padding:'3px 10px',fontSize:11,color:'#64748b',fontFamily:"'Rajdhani',sans-serif",fontWeight:600,whiteSpace:'nowrap'}}>{dayGames.length} game{dayGames.length>1?'s':''}</div>
            </div>
            {dayGames.map(g=>{
              const tA=(g.team_a_ids||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean)
              const tB=(g.team_b_ids||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean)
              const ref=players.find(p=>p.id===g.logged_by)
              const winNames=(g.winner_team==='A'?tA:tB).map(p=>p.display_name).join(' + ')
              const time=new Date(g.played_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
              return (
                <div key={g.id} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'10px 12px',marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:12,color:'#475569',fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>{time}</span>
                      {g.group_id && groups.find(gr=>gr.id===g.group_id) && (
                        <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'rgba(96,165,250,0.1)',color:'#60a5fa',border:'1px solid rgba(96,165,250,0.2)',fontFamily:"'Rajdhani',sans-serif",fontWeight:700,whiteSpace:'nowrap'}}>
                          🏟️ {groups.find(gr=>gr.id===g.group_id)?.name}
                        </span>
                      )}
                    </div>
                    <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20,background:'rgba(74,222,128,0.1)',color:'#4ade80',border:'1px solid rgba(74,222,128,0.2)',fontFamily:"'Rajdhani',sans-serif",maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      🏆 {winNames} WON
                    </span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <span style={{fontSize:12,fontWeight:700,color:g.winner_team==='A'?'#4ade80':'#475569',fontFamily:"'Rajdhani',sans-serif"}}>Team A</span>
                    <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:'#f1f5f9',letterSpacing:4}}>{g.score_a} — {g.score_b}</span>
                    <span style={{fontSize:12,fontWeight:700,color:g.winner_team==='B'?'#4ade80':'#475569',fontFamily:"'Rajdhani',sans-serif"}}>Team B</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{display:'flex',gap:6}}>
                      {tA.map(p=>{const lv=getLevel(p.total_wins||0);return(
                        <div key={p.id} style={{textAlign:'center'}}>
                          <div style={{width:30,height:30,borderRadius:'50%',overflow:'hidden',border:`1.5px solid ${g.winner_team==='A'?lv.aura:lv.aura+'44'}`,margin:'0 auto 2px',background:'#1a2a1a'}}>
                            <img src={getAvatarUrl(p.id)} width={30} height={30} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                          </div>
                          <div style={{fontSize:9,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,color:g.winner_team==='A'?lv.aura:'#475569'}}>{p.display_name}</div>
                        </div>
                      )})}
                    </div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:'#1e293b',letterSpacing:2}}>VS</div>
                    <div style={{display:'flex',gap:6}}>
                      {tB.map(p=>{const lv=getLevel(p.total_wins||0);return(
                        <div key={p.id} style={{textAlign:'center'}}>
                          <div style={{width:30,height:30,borderRadius:'50%',overflow:'hidden',border:`1.5px solid ${g.winner_team==='B'?lv.aura:lv.aura+'44'}`,margin:'0 auto 2px',background:'#1a2a1a'}}>
                            <img src={getAvatarUrl(p.id)} width={30} height={30} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                          </div>
                          <div style={{fontSize:9,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,color:g.winner_team==='B'?lv.aura:'#475569'}}>{p.display_name}</div>
                        </div>
                      )})}
                    </div>
                  </div>
                  {isAdmin && (
                    <div style={{display:'flex',gap:6,marginBottom:6}}>
                      <button onClick={()=>onEditGame&&onEditGame(g)} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',background:'rgba(96,165,250,0.1)',border:'1px solid rgba(96,165,250,0.25)',borderRadius:20,cursor:'pointer',color:'#60a5fa',fontFamily:"'Rajdhani',sans-serif",fontSize:11,fontWeight:700}}>✏️ Edit Score</button>
                      <button onClick={()=>onDeleteGame&&onDeleteGame(g.id)} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.25)',borderRadius:20,cursor:'pointer',color:'#f87171',fontFamily:"'Rajdhani',sans-serif",fontSize:11,fontWeight:700}}>🗑 Delete</button>
                    </div>
                  )}
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


// ── Report Tab ─────────────────────────────────────────────────
function ReportTab({ players, currentUserId }) {
  const [allGames, setAllGames]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState('overview') // 'overview' | 'mycard'
  const [cardDay, setCardDay]     = useState('today')    // 'today' | 'yesterday' | 'dbf'
  const allowedIds = new Set((players||[]).map(p=>p.id))

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('games').select('*').eq('is_reverted',false).order('played_at',{ascending:false})
      // Scope to court: both players on both teams must be in the players prop
      const scoped = (data||[]).filter(g => {
        const ids = [...(g.team_a_ids||[]), ...(g.team_b_ids||[])]
        return ids.every(id => allowedIds.has(id))
      })
      setAllGames(scoped)
      setLoading(false)
    }
    load()
  }, [])

  const playerMap = Object.fromEntries(players.map(p=>[p.id,p]))

  function dayLabel(offset) {
    const d = new Date()
    d.setDate(d.getDate() - offset)
    return d.toDateString()
  }
  const todayStr = dayLabel(0)
  const todaysGames = allGames.filter(g => new Date(g.played_at).toDateString() === todayStr)

  // Best team today — highest win count among duos who played today
  function getBestTeamToday() {
    const teamStats = {}
    todaysGames.forEach(g => {
      [{ids:[...g.team_a_ids].sort(),won:g.winner_team==='A'},
       {ids:[...g.team_b_ids].sort(),won:g.winner_team==='B'}].forEach(({ids,won})=>{
        const k = ids.join('|')
        if (!teamStats[k]) teamStats[k] = { ids, wins:0, games:0 }
        teamStats[k].games++
        if (won) teamStats[k].wins++
      })
    })
    const arr = Object.values(teamStats).sort((a,b)=>b.wins-a.wins || b.games-a.games)
    return arr[0] || null
  }
  const bestTeam = getBestTeamToday()

  // Player leaderboard for today
  function getTodayPlayerStats() {
    const stats = {}
    todaysGames.forEach(g => {
      const allIds = [...g.team_a_ids, ...g.team_b_ids]
      allIds.forEach(pid => {
        if (!stats[pid]) stats[pid] = { wins:0, games:0 }
        stats[pid].games++
        const inA = g.team_a_ids.includes(pid)
        if (g.winner_team === (inA?'A':'B')) stats[pid].wins++
      })
    })
    return Object.entries(stats)
      .map(([pid,s]) => ({ pid, ...s, pct: s.games>0?Math.round((s.wins/s.games)*100):0 }))
      .sort((a,b) => b.wins-a.wins || b.pct-a.pct)
  }
  const todayPlayerStats = getTodayPlayerStats()

  // Team leaderboard for today (all duos sorted)
  function getTodayTeamStats() {
    const teamStats = {}
    todaysGames.forEach(g => {
      [{ids:[...g.team_a_ids].sort(),won:g.winner_team==='A'},
       {ids:[...g.team_b_ids].sort(),won:g.winner_team==='B'}].forEach(({ids,won})=>{
        const k = ids.join('|')
        if (!teamStats[k]) teamStats[k] = { ids, wins:0, games:0 }
        teamStats[k].games++
        if (won) teamStats[k].wins++
      })
    })
    return Object.values(teamStats).sort((a,b)=>b.wins-a.wins || b.games-a.games)
  }
  const todayTeamStats = getTodayTeamStats()

  // Insights — close games (margin <= 5) and big blowouts (margin >= 10)
  function getInsights() {
    const insights = []
    todaysGames.forEach(g => {
      const margin = Math.abs(g.score_a - g.score_b)
      const tA = g.team_a_ids.map(id=>playerMap[id]?.display_name).filter(Boolean).join(' + ')
      const tB = g.team_b_ids.map(id=>playerMap[id]?.display_name).filter(Boolean).join(' + ')
      if (margin <= 3) {
        insights.push({ type:'nail-biter', icon:'😱', text: tA+' vs '+tB+' — nail-biter, won by just '+margin+'!', g })
      }
      if (margin >= 10) {
        const winnerNames = g.winner_team==='A' ? tA : tB
        const loserNames  = g.winner_team==='A' ? tB : tA
        insights.push({ type:'blowout', icon:'💥', text: winnerNames+' demolished '+loserNames+' by '+margin+' points!', g })
      }
    })
    return insights
  }
  const insights = getInsights()

  // ── My Report Card ──
  function getCardGames() {
    const offset = cardDay==='today' ? 0 : cardDay==='yesterday' ? 1 : 2
    const dayStr = dayLabel(offset)
    return allGames.filter(g => {
      const inGame = g.team_a_ids.includes(currentUserId) || g.team_b_ids.includes(currentUserId)
      return inGame && new Date(g.played_at).toDateString() === dayStr
    })
  }
  const cardGames = getCardGames()
  const cardWins  = cardGames.filter(g => {
    const inA = g.team_a_ids.includes(currentUserId)
    return g.winner_team === (inA?'A':'B')
  }).length
  const cardLosses = cardGames.length - cardWins
  const cardPct = cardGames.length>0 ? Math.round((cardWins/cardGames.length)*100) : 0
  const cardScored = cardGames.reduce((acc,g)=>{
    const inA = g.team_a_ids.includes(currentUserId)
    return acc + (inA?g.score_a:g.score_b)
  },0)
  const cardConceded = cardGames.reduce((acc,g)=>{
    const inA = g.team_a_ids.includes(currentUserId)
    return acc + (inA?g.score_b:g.score_a)
  },0)

  const me = playerMap[currentUserId]
  const myLevel = me ? getLevel(me.total_wins||0) : { aura:'#94a3b8' }

  if (loading) return <div style={{textAlign:'center',color:'#475569',padding:40,fontFamily:"'Rajdhani',sans-serif",fontSize:16}}>Loading reports...</div>

  return (
    <div style={{ fontFamily:"'Rajdhani',sans-serif" }}>
      {/* View toggle */}
      <div style={{ display:'flex', gap:8, marginBottom:18 }}>
        <button onClick={()=>setView('overview')} style={{
          flex:1, padding:'10px', borderRadius:12, cursor:'pointer',
          border: view==='overview' ? '1px solid rgba(74,222,128,0.5)' : '1px solid rgba(255,255,255,0.1)',
          background: view==='overview' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)',
          color: view==='overview' ? '#4ade80' : '#64748b',
          fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:1,
        }}>📊 Daily Overview</button>
        <button onClick={()=>setView('mycard')} style={{
          flex:1, padding:'10px', borderRadius:12, cursor:'pointer',
          border: view==='mycard' ? '1px solid rgba(96,165,250,0.5)' : '1px solid rgba(255,255,255,0.1)',
          background: view==='mycard' ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.03)',
          color: view==='mycard' ? '#60a5fa' : '#64748b',
          fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:1,
        }}>🎴 My Report Card</button>
      </div>

      {view === 'overview' && (
        <div>
          {/* Today summary hero */}
          <div style={{ background:'linear-gradient(160deg,#0a1a0a,#060d14)', border:'1.5px solid rgba(74,222,128,0.25)', borderRadius:18, padding:'16px 16px', marginBottom:18 }}>
            <div style={{ fontSize:11, color:'#4ade80', letterSpacing:2, fontWeight:700, marginBottom:4 }}>TODAY'S REPORT</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'#f1f5f9', letterSpacing:2, marginBottom:12 }}>
              {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              <div style={{ background:'rgba(0,0,0,0.35)', borderRadius:12, padding:'10px', textAlign:'center' }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:'#4ade80' }}>{todaysGames.length}</div>
                <div style={{ fontSize:10, color:'#64748b', letterSpacing:1 }}>MATCHES PLAYED</div>
              </div>
              <div style={{ background:'rgba(0,0,0,0.35)', borderRadius:12, padding:'10px', textAlign:'center' }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:'#60a5fa' }}>{todayPlayerStats.length}</div>
                <div style={{ fontSize:10, color:'#64748b', letterSpacing:1 }}>PLAYERS ACTIVE</div>
              </div>
              <div style={{ background:'rgba(0,0,0,0.35)', borderRadius:12, padding:'10px', textAlign:'center' }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:'#ffd700' }}>{todayTeamStats.length}</div>
                <div style={{ fontSize:10, color:'#64748b', letterSpacing:1 }}>DUOS FORMED</div>
              </div>
            </div>
          </div>

          {/* Best team today */}
          {bestTeam && (
            <div style={{ background:'rgba(255,215,0,0.06)', border:'1px solid rgba(255,215,0,0.25)', borderRadius:16, padding:'14px', marginBottom:18 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#ffd700', letterSpacing:2, marginBottom:10 }}>🏆 BEST TEAM TODAY</div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ display:'flex' }}>
                  {bestTeam.ids.map((pid,i) => (
                    <div key={pid} style={{ width:38, height:38, borderRadius:'50%', overflow:'hidden', border:'1.5px solid #ffd700', marginLeft:i>0?-10:0, background:'#1a2a1a' }}>
                      <img src={getAvatarUrl(pid)} width={38} height={38} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                    </div>
                  ))}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#f1f5f9', letterSpacing:1 }}>
                    {bestTeam.ids.map(pid=>playerMap[pid]?.display_name||'?').join(' + ')}
                  </div>
                  <div style={{ fontSize:11, color:'#94a3b8' }}>{bestTeam.wins}W / {bestTeam.games} games today</div>
                </div>
              </div>
            </div>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <div style={{ marginBottom:18 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#f1f5f9', letterSpacing:2, marginBottom:10 }}>⚡ TODAY'S HIGHLIGHTS</div>
              {insights.map((ins,i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:10, padding:'11px 12px', marginBottom:8, borderRadius:12,
                  background: ins.type==='nail-biter' ? 'rgba(255,215,0,0.06)' : 'rgba(248,113,113,0.06)',
                  border: ins.type==='nail-biter' ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(248,113,113,0.2)',
                }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{ins.icon}</span>
                  <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:600, lineHeight:1.3 }}>{ins.text}</div>
                </div>
              ))}
            </div>
          )}

          {/* Player leaderboard today */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#f1f5f9', letterSpacing:2, marginBottom:10 }}>👤 PLAYER LEADERBOARD — TODAY</div>
            {todayPlayerStats.length === 0 && <div style={{ textAlign:'center', color:'#334155', padding:24, fontSize:13 }}>No games played today yet</div>}
            {todayPlayerStats.map((s,i) => {
              const p = playerMap[s.pid]; if (!p) return null
              const lv = getLevel(p.total_wins||0)
              return (
                <div key={s.pid} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', marginBottom:6, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:'#475569', width:20 }}>#{i+1}</div>
                  <div style={{ width:32, height:32, borderRadius:'50%', overflow:'hidden', border:'1.5px solid '+lv.aura, background:'#1a2a1a' }}>
                    <img src={getAvatarUrl(s.pid)} width={32} height={32} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                  </div>
                  <div style={{ flex:1, fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:'#f1f5f9' }}>{p.display_name}</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <span style={{ fontSize:12, color:'#4ade80', fontWeight:700 }}>{s.wins}W</span>
                    <span style={{ fontSize:12, color:'#f87171', fontWeight:700 }}>{s.games-s.wins}L</span>
                    <span style={{ fontSize:12, color:'#64748b' }}>{s.pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Team leaderboard today */}
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#f1f5f9', letterSpacing:2, marginBottom:10 }}>🤝 TEAM LEADERBOARD — TODAY</div>
            {todayTeamStats.length === 0 && <div style={{ textAlign:'center', color:'#334155', padding:24, fontSize:13 }}>No duos formed today yet</div>}
            {todayTeamStats.map((t,i) => {
              const p1=playerMap[t.ids[0]], p2=playerMap[t.ids[1]]
              if (!p1||!p2) return null
              const pct = t.games>0?Math.round((t.wins/t.games)*100):0
              return (
                <div key={t.ids.join('|')} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', marginBottom:6, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:'#475569', width:20 }}>#{i+1}</div>
                  <div style={{ flex:1, fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#f1f5f9' }}>{p1.display_name} + {p2.display_name}</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <span style={{ fontSize:12, color:'#4ade80', fontWeight:700 }}>{t.wins}W</span>
                    <span style={{ fontSize:12, color:'#64748b' }}>{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'mycard' && (
        <div>
          {/* Day chips */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {[{id:'today',label:'Today'},{id:'yesterday',label:'Yesterday'},{id:'dbf',label:'2 Days Ago'}].map(d => (
              <button key={d.id} onClick={()=>setCardDay(d.id)} style={{
                flex:1, padding:'8px', borderRadius:20, cursor:'pointer',
                border: cardDay===d.id ? '1px solid rgba(96,165,250,0.5)' : '1px solid rgba(255,255,255,0.1)',
                background: cardDay===d.id ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.03)',
                color: cardDay===d.id ? '#60a5fa' : '#64748b',
                fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700,
              }}>{d.label}</button>
            ))}
          </div>

          {/* Report card */}
          <div style={{ background:'linear-gradient(160deg,'+(myLevel.bg||'#111827')+',#060d14)', border:'1.5px solid '+myLevel.aura+'44', borderRadius:20, padding:'20px 16px', marginBottom:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ width:56, height:56, borderRadius:'50%', overflow:'hidden', border:'2.5px solid '+myLevel.aura, background:'#1a2a1a' }}>
                {me && <img src={getAvatarUrl(currentUserId)} width={56} height={56} style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
              </div>
              <div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#f1f5f9', letterSpacing:1, lineHeight:1 }}>{me?.display_name||'You'}</div>
                <div style={{ fontSize:11, color:myLevel.aura, marginTop:2 }}>{cardDay==='today'?'Today':cardDay==='yesterday'?'Yesterday':'2 Days Ago'}'s Report Card</div>
              </div>
            </div>

            {cardGames.length === 0 ? (
              <div style={{ textAlign:'center', color:'#334155', padding:30, fontSize:14 }}>No games played {cardDay==='today'?'today':cardDay==='yesterday'?'yesterday':'2 days ago'}</div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
                  {[
                    { label:'GAMES', val:cardGames.length, color:'#93c5fd' },
                    { label:'WINS',  val:cardWins,          color:'#4ade80' },
                    { label:'LOSSES',val:cardLosses,        color:'#f87171' },
                    { label:'WIN %', val:cardPct+'%',       color:myLevel.aura },
                  ].map(s => (
                    <div key={s.label} style={{ background:'rgba(0,0,0,0.4)', borderRadius:12, padding:'10px 4px', textAlign:'center' }}>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:s.color }}>{s.val}</div>
                      <div style={{ fontSize:9, color:'#94a3b8', letterSpacing:1, marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                  <div style={{ flex:1, background:'rgba(74,222,128,0.06)', borderRadius:10, padding:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:10, color:'#64748b' }}>Points Scored</div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#4ade80' }}>{cardScored}</div>
                  </div>
                  <div style={{ flex:1, background:'rgba(248,113,113,0.06)', borderRadius:10, padding:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:10, color:'#64748b' }}>Points Conceded</div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#f87171' }}>{cardConceded}</div>
                  </div>
                </div>

                <div style={{ fontSize:11, color:'#334155', marginBottom:8, letterSpacing:1 }}>MATCH LOG</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {cardGames.map(g => {
                    const inA = g.team_a_ids.includes(currentUserId)
                    const won = g.winner_team===(inA?'A':'B')
                    const own = inA?g.score_a:g.score_b
                    const opp = inA?g.score_b:g.score_a
                    const partnerId = (inA?g.team_a_ids:g.team_b_ids).find(id=>id!==currentUserId)
                    const partner = playerMap[partnerId]
                    return (
                      <div key={g.id} style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(0,0,0,0.3)', borderRadius:10, padding:'8px 10px' }}>
                        <div style={{ width:22, height:22, borderRadius:'50%', background:won?'rgba(74,222,128,0.15)':'rgba(248,113,113,0.15)', border:'1px solid '+(won?'#4ade80':'#f87171'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:won?'#4ade80':'#f87171' }}>{won?'W':'L'}</div>
                        <div style={{ fontSize:12, color:'#94a3b8', flex:1 }}>with {partner?.display_name||'?'}</div>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#f1f5f9' }}>{own}-{opp}</div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Edit Game Modal ────────────────────────────────────────────
function EditGameModal({ game, players, onClose, onSave }) {
  const [sA, setSA] = useState(String(game.score_a))
  const [sB, setSB] = useState(String(game.score_b))
  const [saving, setSaving] = useState(false)
  const tA = (game.team_a_ids||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean)
  const tB = (game.team_b_ids||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean)

  async function handleSave() {
    const a=parseInt(sA), b=parseInt(sB)
    if (isNaN(a)||isNaN(b)||a<0||b<0||a===b) return
    setSaving(true)
    await onSave(a, b)
    setSaving(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#0a1628', border:'1px solid rgba(74,222,128,0.25)', borderRadius:20, padding:24, width:'100%', maxWidth:340, fontFamily:"'Rajdhani',sans-serif" }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#f1f5f9', letterSpacing:2, marginBottom:4 }}>Edit Score</div>
        <div style={{ fontSize:12, color:'#475569', marginBottom:20 }}>
          {tA.map(p=>p.display_name).join(' + ')} vs {tB.map(p=>p.display_name).join(' + ')}
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginBottom:20 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:12, color:'#4ade80', fontFamily:"'Bebas Neue',sans-serif", letterSpacing:2, marginBottom:8 }}>TEAM A</div>
            <input type="number" inputMode="numeric" value={sA} onChange={e=>setSA(e.target.value)}
              style={{ width:80, background:'rgba(0,0,0,0.5)', border:'2px solid rgba(74,222,128,0.3)', borderRadius:12, padding:'8px 0', color:'#f1f5f9', fontFamily:"'Bebas Neue',sans-serif", fontSize:48, textAlign:'center', outline:'none' }}/>
          </div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:'#1e3a2f', marginTop:24 }}>—</div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:12, color:'#60a5fa', fontFamily:"'Bebas Neue',sans-serif", letterSpacing:2, marginBottom:8 }}>TEAM B</div>
            <input type="number" inputMode="numeric" value={sB} onChange={e=>setSB(e.target.value)}
              style={{ width:80, background:'rgba(0,0,0,0.5)', border:'2px solid rgba(96,165,250,0.3)', borderRadius:12, padding:'8px 0', color:'#f1f5f9', fontFamily:"'Bebas Neue',sans-serif", fontSize:48, textAlign:'center', outline:'none' }}/>
          </div>
        </div>
        {sA && sB && parseInt(sA)!==parseInt(sB) && (
          <div style={{ textAlign:'center', marginBottom:12, fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#4ade80', letterSpacing:2 }}>
            🏆 TEAM {parseInt(sA)>parseInt(sB)?'A':'B'} WINS
          </div>
        )}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, background:'transparent', border:'1px solid #1e293b', color:'#475569', borderRadius:50, padding:12, cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2 }}>CANCEL</button>
          <button onClick={handleSave} disabled={saving||!sA||!sB||parseInt(sA)===parseInt(sB)}
            style={{ flex:2, background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', borderRadius:50, padding:12, cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2, opacity:saving?0.6:1 }}>
            {saving?'SAVING...':'SAVE CHANGES'}
          </button>
        </div>
      </div>
    </div>
  )
}


// ── Join Court Modal ───────────────────────────────────────────
function JoinCourtModal({ group, onClose, onJoined, currentUserId }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  async function handleJoin() {
    if (pin.length !== 4) { setError('Enter the 4-digit court PIN'); return }
    setJoining(true); setError('')
    try {
      // Verify PIN
      const { data: g, error: e } = await supabase
        .from('groups').select('id,pin').eq('id', group.id).single()
      if (e || !g) throw new Error('Court not found')
      if (g.pin !== pin) { setError('Wrong PIN — ask your court admin'); setJoining(false); return }

      // Already a member?
      const { data: existing } = await supabase.from('group_members')
        .select('player_id').eq('group_id', group.id).eq('player_id', currentUserId).single()
      if (existing) { setError('You are already in this court!'); setJoining(false); return }

      // Join
      await supabase.from('group_members').insert({ group_id: group.id, player_id: currentUserId })
      onJoined && onJoined()
      onClose()
    } catch (err) { setError(err.message || 'Failed to join') }
    setJoining(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#0a1628', border:'1px solid rgba(74,222,128,0.25)', borderRadius:20, padding:24, width:'100%', maxWidth:300, fontFamily:"'Rajdhani',sans-serif" }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#f1f5f9', letterSpacing:2, marginBottom:4 }}>Join Court</div>
        <div style={{ fontSize:13, color:'#64748b', marginBottom:16 }}>🏟️ {group.name}</div>

        <div style={{ fontSize:11, color:'#64748b', letterSpacing:1.5, fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Court PIN</div>
        <input
          type="password" inputMode="numeric" maxLength={4}
          value={pin} onChange={e=>{ if(/^\d{0,4}$/.test(e.target.value)) setPin(e.target.value) }}
          onKeyDown={e=>e.key==='Enter'&&handleJoin()}
          placeholder="••••" autoFocus
          style={{ width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.4)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px 16px', color:'#4ade80', fontFamily:"'Bebas Neue',sans-serif", fontSize:32, textAlign:'center', letterSpacing:8, outline:'none', marginBottom:8 }}/>

        {/* PIN dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:12 }}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:i<pin.length?'#4ade80':'rgba(255,255,255,0.1)', transition:'all 0.2s', boxShadow:i<pin.length?'0 0 6px #4ade80':'none' }}/>
          ))}
        </div>

        {error && <div style={{ fontSize:12, color:'#f87171', textAlign:'center', marginBottom:12, fontFamily:"'Rajdhani',sans-serif" }}>⚠ {error}</div>}

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#475569', borderRadius:50, padding:'11px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:1 }}>CANCEL</button>
          <button onClick={handleJoin} disabled={joining||pin.length!==4}
            style={{ flex:2, background:pin.length===4?'linear-gradient(135deg,#14532d,#166534)':'rgba(255,255,255,0.05)', border:`1.5px solid ${pin.length===4?'#4ade80':'rgba(255,255,255,0.1)'}`, color:pin.length===4?'#4ade80':'#475569', borderRadius:50, padding:'11px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:1 }}>
            {joining?'JOINING...':'JOIN COURT'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function Dashboard({ onOpenProfile }) {
  const { currentUser, logout } = useAuth()
  const { players: allPlayers, recentGames: allGames, loading: globalLoading, refetch: globalRefetch } = useRealtimeDashboard()
  const [tab, setTab]               = useState('players')
  const [tabLoading, setTabLoading] = useState(false)
  const [showLogGame, setShowLogGame] = useState(false)
  const [showMenu, setShowMenu]     = useState(false)
  const [newGame, setNewGame]       = useState(false)
  const [groups, setGroups]         = useState([])
  const [groupMembers, setGroupMembers] = useState({})
  const [activeGroup, setActiveGroup]   = useState('player_default')
  const [editGame, setEditGame]         = useState(null)
  const [joinGroup, setJoinGroup]       = useState(null)
  const [showCourtManager, setShowCourtManager] = useState(false)
  const [showMyCourts, setShowMyCourts]         = useState(false)
  const [openTeam, setOpenTeam]               = useState(null) // {p1, p2}

  const isAdmin = currentUser.isAdmin || currentUser.role === 'admin'
  const { deleteGame, updateGameScore } = useGameLogger()
  const myGroupIds = Object.entries(groupMembers)
    .filter(([,pids]) => pids.includes(currentUser.id))
    .map(([gid]) => gid)

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

  useEffect(() => { loadGroups() }, [])

  useEffect(() => {
    if (activeGroup === 'player_default' && myGroupIds.length > 0) {
      setActiveGroup(myGroupIds[0])
    }
  }, [myGroupIds.join(',')])

  const effectiveGroup = activeGroup === 'player_default' ? 'all' : activeGroup
  // Court-scoped data — stats recomputed from court games only
  const { courtPlayers, courtGames, loading: courtLoading, refetch: courtRefetch } = useCourtData(
    effectiveGroup === 'all' ? null : effectiveGroup
  )

  // When admin views "All" — use global data. Otherwise use court-scoped data.
  const players = (effectiveGroup === 'all' && isAdmin) ? allPlayers : courtPlayers
  const recentGames = (effectiveGroup === 'all' && isAdmin) ? allGames : courtGames
  const loading = (effectiveGroup === 'all' && isAdmin) ? globalLoading : courtLoading
  const meGlobal = allPlayers.find(p => p.id === currentUser.id)
  const me = players.find(p => p.id === currentUser.id) || meGlobal

  function refetch() {
    if (effectiveGroup === 'all' && isAdmin) globalRefetch()
    else courtRefetch()
  }

  const filteredPlayers = players
  const filteredGames = recentGames

  function switchTab(id) {
    if (tab === id) return
    setTabLoading(true)
    setTimeout(() => setTabLoading(false), 350)
    setTab(id)
  }

  function handleGameLogged() {
    refetch(); setShowLogGame(false)
    setNewGame(true); setTimeout(()=>setNewGame(false),2000)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#060d14', color:'#f1f5f9', width:'100%', position:'relative', fontFamily:"'Rajdhani',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes spin-ring { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes card-in { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fab-pulse { 0%,100%{box-shadow:0 4px 24px rgba(74,222,128,0.35)} 50%{box-shadow:0 4px 40px rgba(74,222,128,0.6),0 0 0 6px rgba(74,222,128,0.08)} }
        @keyframes shuttle-fly { 0%{left:-40px;opacity:1} 100%{left:110%;opacity:0} }
        @keyframes drawer-in { from{transform:translateX(-100%)} to{transform:translateX(0)} }
        @keyframes shuttle-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes tab-loader-in { from{opacity:0} to{opacity:1} }
        .tab-btn { background:none; border:none; color:#64748b; font-family:'Bebas Neue',sans-serif; font-size:17px; letter-spacing:2px; padding:14px 0; cursor:pointer; border-bottom:3px solid transparent; transition:all 0.2s; flex:1; text-align:center; }
        .tab-btn.active { color:#4ade80; border-bottom-color:#4ade80; }
        .group-chip { padding:8px 16px; border-radius:20px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#64748b; font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:700; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
        .group-chip.active { background:rgba(74,222,128,0.15); border-color:rgba(74,222,128,0.5); color:#4ade80; }
        .hamburger { background:transparent; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:7px 8px; cursor:pointer; display:flex; flex-direction:column; gap:4px; }
        .ham-line { width:20px; height:2px; background:#94a3b8; border-radius:2px; }
      `}</style>

      {tabLoading && <TabLoader/>}

      {newGame && Array.from({length:4}).map((_,i)=>(
        <div key={i} style={{position:'fixed',zIndex:200,pointerEvents:'none',fontSize:24,top:`${20+i*18}%`,left:'-40px',animation:`shuttle-fly ${0.7+i*0.2}s ease-out ${i*0.12}s forwards`}}>🏸</div>
      ))}

      {showMenu && (
        <HamburgerMenu
          currentUser={currentUser}
          currentPlayer={me}
          groups={groups}
          myGroupIds={myGroupIds}
          activeGroup={activeGroup}
          onGroupSelect={(id) => setActiveGroup(id)}
          onClose={() => setShowMenu(false)}
          onLogout={logout}
          onOpenProfile={onOpenProfile}
          onGroupCreated={loadGroups}
          onJoinGroup={(g) => { setJoinGroup(g); setShowMenu(false) }}
          onOpenCourtManager={() => { setShowCourtManager(true); setShowMenu(false) }}
          onOpenMyCourts={() => { setShowMyCourts(true); setShowMenu(false) }}
        />
      )}

      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:40, background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(74,222,128,0.08)', padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <button className="hamburger" onClick={() => setShowMenu(true)}>
          <div className="ham-line"/><div className="ham-line"/><div className="ham-line"/>
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
          <span style={{ fontSize:20 }}>🏸</span>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'#4ade80', letterSpacing:4 }}>SHUTTLE</span>
        </div>
        {me && (
          <div onClick={() => onOpenProfile && onOpenProfile(currentUser.id)} style={{ cursor:'pointer' }}>
            <Av id={currentUser.id} size={34} aura={getLevel(me.total_wins||0).aura} style={{ border:`2px solid ${getLevel(me.total_wins||0).aura}` }}/>
          </div>
        )}
      </div>

      {/* Group filter chips — ALL courts shown, scrollable, All chip for everyone */}
      {groups.length > 0 && (
        <div style={{ position:'sticky', top:54, zIndex:39, background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', padding:'8px 16px', display:'flex', gap:8, borderBottom:'1px solid rgba(255,255,255,0.04)', overflowX:'auto' }}>
          <button className={`group-chip${effectiveGroup==='all'?' active':''}`} onClick={()=>setActiveGroup('all')} style={{flexShrink:0}}>All</button>
          {groups.map(g => (
            <button key={g.id} className={`group-chip${effectiveGroup===g.id?' active':''}`} onClick={()=>setActiveGroup(g.id)} style={{flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:130}}>{g.name}</button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ position:'sticky', top:groups.length>0?98:54, zIndex:38, background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', display:'flex', borderBottom:'2px solid rgba(255,255,255,0.05)' }}>
        {[{id:'players',label:'🏆 PLAYERS'},{id:'teams',label:'🔥 TEAMS'},{id:'games',label:'🏸 GAMES'},{id:'report',label:'📊 REPORT'}].map(t=>(
          <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={()=>switchTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:'14px 14px 100px', minHeight:'calc(100vh - 160px)' }}>
        {tab === 'players' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            {me && (
              <HeroCard player={me} isCurrentUser onClick={()=>onOpenProfile&&onOpenProfile(me.id, effectiveGroup)}/>
            )}
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, color:'#64748b', letterSpacing:3, marginBottom:14 }}>🏆 LEADERBOARD</div>
            {filteredPlayers.map((p,idx) => (
              <LeaderRow key={p.id} player={p} rank={idx+1} isCurrentUser={p.id===currentUser.id} onClick={()=>onOpenProfile&&onOpenProfile(p.id, effectiveGroup)}/>
            ))}
          </div>
        )}
        {tab === 'teams' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            <TeamsTab allPlayers={filteredPlayers} currentUserId={currentUser.id} onOpenTeam={(p1,p2)=>setOpenTeam({p1,p2})}/>
          </div>
        )}
        {tab === 'games' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            <GamesTab recentGames={filteredGames} players={filteredPlayers} loading={loading} isAdmin={isAdmin} groups={groups} onDeleteGame={async(id)=>{ if(window.confirm('Delete this game? Stats will be updated for all players.')) { const r = await deleteGame(id); if(r.success){ setTimeout(()=>refetch(), 800) } else { alert('Delete failed: ' + r.message) } }}} onEditGame={(g)=>setEditGame(g)}/>
          </div>
        )}
        {tab === 'report' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            <ReportTab players={filteredPlayers} currentUserId={currentUser.id}/>
          </div>
        )}
      </div>

      {/* FAB */}
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', zIndex:50, width:'100%', maxWidth:480, padding:'10px 16px 24px', background:'linear-gradient(to top,rgba(6,13,20,1) 65%,transparent)', pointerEvents:'none' }}>
        <button onClick={()=>setShowLogGame(true)} style={{ display:'block', width:'100%', background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:4, padding:'15px', borderRadius:50, cursor:'pointer', animation:'fab-pulse 2.5s ease-in-out infinite', pointerEvents:'all' }}>
          + ADD GAME
        </button>
      </div>

      {openTeam && (
        <TeamProfile
          p1={openTeam.p1}
          p2={openTeam.p2}
          onBack={() => setOpenTeam(null)}
        />
      )}
      {showMyCourts && (
        <MyCourts
          currentUser={currentUser}
          onClose={() => { setShowMyCourts(false); loadGroups() }}
        />
      )}
      {showCourtManager && (
        <CourtManager
          onClose={() => setShowCourtManager(false)}
          currentUserId={currentUser.id}
        />
      )}
      {joinGroup && (
        <JoinCourtModal
          group={joinGroup}
          currentUserId={currentUser.id}
          onClose={() => setJoinGroup(null)}
          onJoined={() => { loadGroups(); setJoinGroup(null) }}
        />
      )}
      {editGame && (
        <EditGameModal
          game={editGame}
          players={players}
          onClose={() => setEditGame(null)}
          onSave={async(sA,sB) => {
            await updateGameScore(editGame.id, sA, sB)
            setEditGame(null)
            refetch()
          }}
        />
      )}
      {showLogGame && <LogGame onClose={()=>setShowLogGame(false)} onGameLogged={handleGameLogged} activeGroup={effectiveGroup} groupMembers={groupMembers} groups={groups} currentUserId={currentUser.id}/>}
    </div>
  )
}