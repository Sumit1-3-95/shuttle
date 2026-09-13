// src/components/Dashboard.jsx — v14
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRealtimeDashboard } from '../hooks/useRealtimeDashboard'
import { useCourtData } from '../hooks/useCourtData'
import { getAvatarUrl, getCharacterName } from '../utils/avatars'
import { supabase } from '../supabaseClient'
import LogGame from './LogGame'
import CourtManager from './CourtManager'
import MyCourts from './MyCourts'
import VideoTab from './VideoTab'
import SettingsPage from './SettingsPage'
import TeamProfile from './TeamProfile'
import { useGameLogger } from '../hooks/useGameLogger'
import { getRatingTier, isCalibrating } from '../utils/ratingEngine'
import HowRatingWorks from './HowRatingWorks'
import ReportCard from './ReportCard'
import RacquetNinja from './racquet-ninja/RacquetNinja'
import TournamentsPage from './tournaments/TournamentsPage'
import EditGameModal from './EditGameModal'
import GoalsTab from './GoalsTab'

function getLevel(wins) {
  if (wins >= 50) return { name:'LEGEND',    tier:5, aura:'#ffd700', bg:'#2a1f00', glow:'rgba(255,215,0,0.4)',   emoji:'👑' }
  if (wins >= 30) return { name:'ELITE',     tier:4, aura:'#4f8ef7', bg:'#0a1428', glow:'rgba(79,142,247,0.4)',  emoji:'⚡' }
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

function Av({ id, size=40, aura='#4ade8055', style={}, profilePic=null }) {
  const [src, setSrc] = useState(profilePic || getAvatarUrl(id))
  const [failed, setFailed] = useState(false)

  // Update src when profilePic changes (e.g. after upload)
  useState(() => { setSrc(profilePic || getAvatarUrl(id)); setFailed(false) }, [profilePic, id])

  function handleError() {
    if (!failed) {
      setFailed(true)
      // Fall back to character avatar, don't loop
      const fallback = getAvatarUrl(id)
      if (src !== fallback) setSrc(fallback)
    }
  }

  return (
    <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', border:`1.5px solid ${aura}`, background:'#1a2a1a', flexShrink:0, ...style }}>
      <img src={src} width={size} height={size} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={handleError}/>
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

// ── Court section — collapsible inside hamburger ───────────────
function CourtSection({ groups, myGroupIds, activeGroup, onGroupClick, onCreateCourt, onJoinCourt, onOpenMyCourts }) {
  const [courtsOpen, setCourtsOpen] = useState(false)
  const myCourts = groups.filter(g => myGroupIds.includes(g.id))
  return (
    <div style={{ padding:'0 16px' }}>
      {/* Manage Courts toggle */}
      <button onClick={()=>setCourtsOpen(v=>!v)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', background:'none', border:'none', borderBottom:'1px solid rgba(255,255,255,0.07)', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700, color:'#94a3b8' }}>
        <span>Courts</span>
        <span style={{ fontSize:12, color:'#334155', transform:courtsOpen?'rotate(90deg)':'none', transition:'transform 0.2s' }}>›</span>
      </button>

      {courtsOpen && (
        <div style={{ paddingTop:8, paddingBottom:4 }}>
          {/* Court list */}
          {myCourts.length > 0 && (
            <div style={{ marginBottom:8 }}>
              <div onClick={()=>onGroupClick('all')} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', marginBottom:4, background:activeGroup==='all'?'rgba(74,222,128,0.08)':'rgba(255,255,255,0.02)', border:`1px solid ${activeGroup==='all'?'rgba(74,222,128,0.25)':'rgba(255,255,255,0.04)'}`, borderRadius:8, cursor:'pointer' }}>
                <span style={{ fontSize:13, color:activeGroup==='all'?'#4ade80':'#64748b', fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>All Courts</span>
                {activeGroup==='all' && <span style={{ fontSize:8, color:'#4ade80' }}>●</span>}
              </div>
              {myCourts.map(g=>(
                <div key={g.id} onClick={()=>onGroupClick(g.id)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', marginBottom:4, background:activeGroup===g.id?'rgba(74,222,128,0.08)':'rgba(255,255,255,0.02)', border:`1px solid ${activeGroup===g.id?'rgba(74,222,128,0.25)':'rgba(255,255,255,0.04)'}`, borderRadius:8, cursor:'pointer' }}>
                  <span style={{ fontSize:13, color:activeGroup===g.id?'#4ade80':'#64748b', fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>{g.name}</span>
                  {activeGroup===g.id && <span style={{ fontSize:8, color:'#4ade80' }}>●</span>}
                </div>
              ))}
            </div>
          )}
          {/* Court actions */}
          {[
            {label:'Join a Court', fn:onJoinCourt},
            {label:'Manage My Courts', fn:onOpenMyCourts},
            {label:'Create a Court', fn:onCreateCourt},
          ].map(a=>(
            <button key={a.label} onClick={a.fn}
              style={{ width:'100%', textAlign:'left', padding:'9px 0', background:'none', border:'none', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, color:'#475569', display:'block' }}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Hamburger menu ─────────────────────────────────────────────
function HamburgerMenu({ currentUser, currentPlayer, groups, myGroupIds, activeGroup, onGroupSelect, onClose, onLogout, onOpenProfile, onGroupCreated, onJoinGroup, onOpenCourtManager, onOpenMyCourts, onCreateCourt, onJoinCourt, onOpenSettings, onOpenRatingInfo, onOpenTournaments }) {
  const level = getLevel(currentPlayer?.total_wins || 0)
  const [showCreate, setShowCreate] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  async function handleCreateGroup() {
    if (!newGroupName.trim()) { setCreateError('Enter a group name'); return }
    setCreating(true); setCreateError('')
    try {
      const courtCode = Math.random().toString(36).substring(2,8).toUpperCase()
      const { data: newGroup, error } = await supabase
        .from('groups').insert({ name: newGroupName.trim(), court_code: courtCode, pin: '1234' }).select().single()
      if (error) throw error
      await supabase.from('group_members').insert({ group_id: newGroup.id, player_id: currentUser.id })
      setNewGroupName(''); setShowCreate(false)
      onGroupCreated && onGroupCreated()
    } catch (err) { setCreateError(err.message || 'Failed to create group') }
    setCreating(false)
  }

  function handleGroupClick(id) { onGroupSelect(id); onClose() }
  // Expose chip visibility toggle via callback handled in Dashboard

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:90, backdropFilter:'blur(4px)' }}/>
      <div style={{ position:'fixed', top:0, left:0, bottom:0, width:'min(290px, 85vw)', background:'#0a1628', borderRight:'1px solid rgba(74,222,128,0.2)', zIndex:91, display:'flex', flexDirection:'column', animation:'drawer-in 0.25s cubic-bezier(0.34,1.2,0.64,1)', boxShadow:'4px 0 40px rgba(0,0,0,0.8)', overflowY:'auto' }}>

        {/* Profile — no CTA, just avatar + name */}
        <div style={{ padding:'40px 20px 16px', background:`linear-gradient(180deg,${level.bg},transparent)`, borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <div onClick={() => { onOpenProfile(currentUser.id, activeGroup); onClose() }} style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
            <div style={{ position:'relative' }}>
              <Av id={currentUser.id} size={52} aura={level.aura} profilePic={currentPlayer?.profile_pic} style={{ border:`2.5px solid ${level.aura}`, boxShadow:`0 0 14px ${level.glow}` }}/>
              {(level.tier >= 4) && <div style={{ position:'absolute', inset:-3, borderRadius:'50%', border:`1px solid ${level.aura}`, borderTopColor:'transparent', animation:'spin-ring 3s linear infinite', pointerEvents:'none' }}/>}
            </div>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#f1f5f9', letterSpacing:1, lineHeight:1 }}>{currentPlayer?.display_name || currentUser.displayName}</div>
              <div style={{ fontSize:11, color:level.aura, fontWeight:700, letterSpacing:1, marginTop:2 }}>{level.emoji} {level.name}</div>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 0 0', WebkitOverflowScrolling:'touch' }}>

          {/* Court Management — collapsible */}
          <CourtSection groups={groups} myGroupIds={myGroupIds} activeGroup={activeGroup}
            onGroupClick={handleGroupClick}
            onCreateCourt={()=>{ onCreateCourt&&onCreateCourt(); onClose() }}
            onJoinCourt={()=>{ onJoinCourt&&onJoinCourt(); onClose() }}
            onOpenMyCourts={()=>{ onOpenMyCourts&&onOpenMyCourts(); onClose() }}/>

          <div style={{ height:1, background:'rgba(255,255,255,0.04)', margin:'12px 16px' }}/>

          {/* Utility links */}
          <div style={{ padding:'0 16px' }}>
            {[
              { label:'Tournaments', color:'#fbbf24', fn:()=>{ onOpenTournaments&&onOpenTournaments(); onClose() } },
              { label:'How Rating Works', color:'#4ade80', fn:()=>{ onOpenRatingInfo&&onOpenRatingInfo(); onClose() } },
              { label:'Racquet Ninja', color:'#c084fc', fn:()=>{ onOpenTournaments&&onOpenTournaments(); onClose() } },
              { label:'Settings', color:'#64748b', fn:()=>{ onOpenSettings&&onOpenSettings(); onClose() } },
            ].map(item=>(
              <button key={item.label} onClick={item.fn}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', background:'none', border:'none', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700, color:item.color, marginBottom:0 }}>
                {item.label}
                <span style={{ fontSize:12, color:'#334155' }}>›</span>
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div style={{ padding:'16px 16px 40px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={() => { onLogout(); onClose() }} style={{ width:'100%', background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.15)', color:'#f87171', borderRadius:10, padding:'11px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:15, letterSpacing:2 }}>LOGOUT</button>
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
      <div style={{ position:'relative', zIndex:1, padding:'14px 16px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
            <div style={{ position:'relative' }}>
              <Av id={player.id} size={62} aura={level.aura} profilePic={player.profile_pic} style={{ border:`2.5px solid ${level.aura}`, boxShadow:`0 0 18px ${level.glow}` }}/>
              {(level.tier >= 4) && <div style={{ position:'absolute', inset:-4, borderRadius:'50%', border:`1.5px solid ${level.aura}`, borderTopColor:'transparent', borderRightColor:'transparent', animation:'spin-ring 3s linear infinite' }}/>}
            </div>

          </div>
          <div style={{ flex:1, minWidth:0, paddingTop:2 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:2, color:'#fff', lineHeight:1, marginBottom:5 }}>{player.display_name}</div>
            {/* Tier tag in place of rating */}
            <span style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, background:`${level.aura}18`, color:level.aura, border:`1px solid ${level.aura}40`, fontFamily:"'Rajdhani',sans-serif", letterSpacing:1 }}>{level.name}</span>
          </div>
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:level.aura, lineHeight:1, textShadow:`0 0 12px ${level.glow}` }}>{winPct}%</div>
            <div style={{ fontSize:9, color:'#64748b', fontFamily:"'Rajdhani',sans-serif", letterSpacing:1, fontWeight:600, marginTop:2 }}>WIN RATE</div>
          </div>
        </div>
        <div style={{ height:1, background:`linear-gradient(90deg,transparent,${level.aura}33,transparent)`, marginBottom:10 }}/>
        {/* Stats: Games | Wins | Losses | Rating */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:10 }}>
          {(()=>{ const rT=getRatingTier(player.rating_doubles||1000); const rC=isCalibrating(player.rating_doubles_games||0);
            return [{label:'GAMES',val:player.total_games||0,color:'#93c5fd'},{label:'WINS',val:player.total_wins||0,color:'#4ade80'},{label:'LOSSES',val:player.total_losses||0,color:'#f87171'},{label:'RATING',val:rC?'···':player.rating_doubles||1000,color:rT.color}]
            .map(s=>(
              <div key={s.label} style={{ background:'rgba(0,0,0,0.4)', borderRadius:10, padding:'8px 4px', textAlign:'center', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:s.color, lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:9, color:'#64748b', fontFamily:"'Rajdhani',sans-serif", letterSpacing:1, marginTop:2 }}>{s.label}</div>
              </div>
            ))
          })()}
        </div>
        <div style={{ height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden', marginBottom:4 }}>
          <div style={{ height:'100%', width:`${winPct}%`, background:`linear-gradient(90deg,${level.aura}66,${level.aura})`, borderRadius:2 }}/>
        </div>

      </div>
    </div>
  )
}

// ── Leaderboard row ────────────────────────────────────────────
function LeaderRow({ player, rank, isCurrentUser, onClick }) {
  const level  = getLevel(player.total_wins || 0)
  const winPct = player.total_games > 0 ? Math.round((player.total_wins / player.total_games) * 100) : 0
  const badge  = getRankBadge(rank)
  const rTier  = getRatingTier(player.rating_doubles || 1000)
  const rCalib = isCalibrating(player.rating_doubles_games || 0)
  return (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:isCurrentUser?`${level.aura}0e`:'rgba(255,255,255,0.02)', border:`1px solid ${isCurrentUser?level.aura+'44':'rgba(255,255,255,0.07)'}`, borderRadius:14, cursor:'pointer', marginBottom:8, transition:'all 0.2s' }}>

      {/* Left: rank chip + ELO */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flexShrink:0, width:42 }}>
        <div style={{ width:42, height:22, borderRadius:6, background:badge.bg, border:`1px solid ${badge.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:12, color:badge.color }}>{badge.label}</span>
        </div>
        <div style={{ width:42, padding:'4px 2px', borderRadius:6, background:`linear-gradient(135deg,${rTier.color}20,${rTier.color}08)`, border:`1px solid ${rTier.color}35`, textAlign:'center' }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:rTier.color, lineHeight:1 }}>{rCalib?'···':player.rating_doubles||1000}</div>
        </div>
      </div>

      {/* Avatar + tier label below — no emoji */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flexShrink:0 }}>
        <Av id={player.id} size={40} aura={level.aura} profilePic={player.profile_pic}/>
        <span style={{ fontSize:7, fontWeight:700, padding:'1px 6px', borderRadius:4, background:`${level.aura}12`, color:level.aura, border:`1px solid ${level.aura}22`, fontFamily:"'Rajdhani',sans-serif", letterSpacing:0.5, whiteSpace:'nowrap', lineHeight:1.3 }}>{level.name}</span>
      </div>

      {/* Name — full width, wraps if needed */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap', marginBottom:5 }}>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:0.5, color:isCurrentUser?level.aura:'#f1f5f9', lineHeight:1.1, wordBreak:'break-word' }}>{player.display_name}</span>
          {isCurrentUser && <span style={{ fontSize:8, color:'#4ade80', fontWeight:700, background:'rgba(74,222,128,0.12)', padding:'1px 5px', borderRadius:6, fontFamily:"'Rajdhani',sans-serif", letterSpacing:1, flexShrink:0 }}>YOU</span>}
        </div>
        <div style={{ height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${winPct}%`, background:level.aura, borderRadius:2 }}/>
        </div>
      </div>

      {/* Stats — wins + win% only, no losses */}
      <div style={{ display:'flex', flexDirection:'column', gap:3, flexShrink:0, alignItems:'flex-end' }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#4ade80', lineHeight:1 }}>{player.total_wins||0}<span style={{ fontSize:10, color:'#334155', fontWeight:400 }}>W</span></div>
        <div style={{ fontSize:10, color:level.aura, fontWeight:700, fontFamily:"'Rajdhani',sans-serif" }}>{winPct}%</div>
      </div>

    </div>
  )
}

// ── Teams tab ──────────────────────────────────────────────────
function TeamsTab({ allPlayers, currentUserId }) {
  const [teams, setTeams]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null) // selected team key
  const [teamGames, setTeamGames] = useState([])
  const statsRef = useRef(null)
  const playerMap = Object.fromEntries((allPlayers||[]).map(p=>[p.id,p]))
  const allowedIds = new Set((allPlayers||[]).map(p=>p.id))

  useEffect(() => {
    async function build() {
      const { data: rawGames } = await supabase.from('games').select('*').eq('is_reverted',false).order('played_at',{ascending:true})
      if (!rawGames) { setLoading(false); return }
      const games = rawGames.filter(g => {
        const ids = [...(g.team_a_ids||[]), ...(g.team_b_ids||[])]
        return ids.every(id => allowedIds.has(id))
      })
      const ts = {}
      games.forEach(g => {
        [{ids:[...g.team_a_ids].sort(),won:g.winner_team==='A',sa:g.score_a,sb:g.score_b,game:g},
         {ids:[...g.team_b_ids].sort(),won:g.winner_team==='B',sa:g.score_b,sb:g.score_a,game:g}
        ].forEach(({ids,won,sa,sb,game})=>{
          const k=ids.join('|')
          if(!ts[k]) ts[k]={ids,wins:0,losses:0,games:[]}
          ts[k].wins+=won?1:0; ts[k].losses+=won?0:1; ts[k].games.push({...game,won})
        })
      })
      setTeams(Object.values(ts).sort((a,b)=>b.wins-a.wins).slice(0,10))
      setLoading(false)
    }
    build()
  },[allPlayers])

  function selectTeam(t) {
    const key = t.ids.join('|')
    if (selected === key) {
      setSelected(null)
      return
    }
    setSelected(key)
    setTeamGames(t.games || [])
    // Smooth scroll to stats section after render
    setTimeout(() => {
      statsRef.current?.scrollIntoView({ behavior:'smooth', block:'start' })
    }, 80)
  }

  if (loading) return <div style={{textAlign:'center',color:'#475569',padding:40,fontFamily:"'Rajdhani',sans-serif",fontSize:16}}>Building team stats...</div>
  if (!teams.length) return <div style={{textAlign:'center',color:'#334155',padding:60}}><div style={{fontSize:40,marginBottom:12}}>🤝</div><div style={{fontSize:14,fontFamily:"'Rajdhani',sans-serif"}}>No team data yet</div></div>

  const myBest = teams.find(t=>t.ids.includes(currentUserId))
  const selectedTeam = selected ? teams.find(t=>t.ids.join('|')===selected) : null

  return (
    <div>
      {/* My Best Duo */}
      {myBest && (()=>{
        const pid=myBest.ids.find(id=>id!==currentUserId)
        const partner=playerMap[pid], me=playerMap[currentUserId]
        if(!partner||!me) return null
        const total=myBest.wins+myBest.losses, pct=total>0?Math.round((myBest.wins/total)*100):0
        const lM=getLevel(me.total_wins||0), lP=getLevel(partner.total_wins||0)
        const key=myBest.ids.join('|')
        const isSelected=selected===key
        return (
          <div onClick={()=>selectTeam(myBest)} style={{background:isSelected?'rgba(74,222,128,0.12)':'linear-gradient(135deg,rgba(74,222,128,0.08),rgba(96,165,250,0.06))',border:`1.5px solid ${isSelected?'#4ade80':'rgba(74,222,128,0.25)'}`,borderRadius:18,padding:'16px 14px',marginBottom:20,cursor:'pointer',transition:'all 0.2s'}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:'#4ade80',letterSpacing:3,marginBottom:12}}>🤝 YOUR BEST DUO {isSelected&&<span style={{fontSize:10,color:'#4ade80',letterSpacing:1}}>· TAP TO COLLAPSE</span>}</div>
            <div style={{display:'flex',gap:10,marginBottom:12}}>
              {[{p:me,l:lM},{p:partner,l:lP}].map(({p,l},i)=>(
                <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,flex:1,background:'rgba(0,0,0,0.3)',borderRadius:12,padding:'10px'}}>
                  <Av id={p.id} size={42} aura={l.aura} profilePic={p.profile_pic}/>
                  <div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,letterSpacing:1,color:'#f1f5f9',lineHeight:1}}>{p.display_name}</div><div style={{fontSize:10,color:l.aura,fontFamily:"'Rajdhani',sans-serif"}}>{l.emoji} {l.name}</div></div>
                  {i===0&&<div style={{fontSize:14,color:'#334155',marginLeft:'auto'}}>+</div>}
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {[{label:'WINS',val:myBest.wins,c:'#4ade80'},{label:'LOSSES',val:myBest.losses,c:'#f87171'},{label:'WIN RATE',val:`${pct}%`,c:'#ffd700'}].map(s=>(
                <div key={s.label} style={{background:'rgba(0,0,0,0.4)',borderRadius:10,padding:'9px 4px',textAlign:'center'}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:s.c,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:10,color:'#64748b',fontFamily:"'Rajdhani',sans-serif",letterSpacing:1}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* All Duos leaderboard */}
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:'#64748b',letterSpacing:3,marginBottom:14}}>ALL DUOS · TOP 10</div>
      {teams.map((t,idx)=>{
        const p1=playerMap[t.ids[0]],p2=playerMap[t.ids[1]]
        if(!p1||!p2) return null
        const total=t.wins+t.losses,pct=total>0?Math.round((t.wins/total)*100):0
        const isMe=t.ids.includes(currentUserId)
        const badge=getRankBadge(idx+1)
        const l1=getLevel(p1.total_wins||0),l2=getLevel(p2.total_wins||0)
        const tc=pct>=60?'#ffd700':pct>=40?'#4ade80':'#94a3b8'
        const key=t.ids.join('|')
        const isSelected=selected===key
        return (
          <div key={key} onClick={()=>selectTeam(t)}
            style={{display:'flex',alignItems:'center',gap:10,padding:'12px',marginBottom:8,
              background:isSelected?'rgba(74,222,128,0.08)':isMe?'rgba(74,222,128,0.05)':'rgba(255,255,255,0.02)',
              border:`1px solid ${isSelected?'#4ade8066':isMe?'rgba(74,222,128,0.3)':'rgba(255,255,255,0.07)'}`,
              borderRadius:14,cursor:'pointer',transition:'all 0.15s'}}>
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
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:0.5,color:isSelected?'#4ade80':isMe?'#4ade80':'#f1f5f9',lineHeight:1.2,marginBottom:3}}>
                {p1.display_name.split(' ')[0]} + {p2.display_name.split(' ')[0]} {isMe&&<span style={{fontSize:9,color:'#4ade80',fontFamily:"'Rajdhani',sans-serif"}}>YOU</span>}
              </div>
              <div style={{height:3,background:'rgba(255,255,255,0.04)',borderRadius:2,overflow:'hidden',maxWidth:90}}><div style={{height:'100%',width:`${pct}%`,background:tc,borderRadius:2}}/></div>
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2,flexShrink:0}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:'#4ade80',lineHeight:1}}>{t.wins}<span style={{fontSize:10,color:'#334155'}}>W</span></div>
              <div style={{fontSize:11,color:tc,fontWeight:700,fontFamily:"'Rajdhani',sans-serif"}}>{pct}%</div>
            </div>
          </div>
        )
      })}

      {/* Team Stats Section — scrolls into view on select */}
      {selectedTeam && (()=>{
        const p1=playerMap[selectedTeam.ids[0]], p2=playerMap[selectedTeam.ids[1]]
        if(!p1||!p2) return null
        const total=selectedTeam.wins+selectedTeam.losses
        const pct=total>0?Math.round((selectedTeam.wins/total)*100):0
        const l1=getLevel(p1.total_wins||0), l2=getLevel(p2.total_wins||0)
        const recentGames = [...(selectedTeam.games||[])].reverse().slice(0,5)
        const scored    = selectedTeam.games.reduce((a,g)=>a+(g.won?(g.score_a>g.score_b?g.score_a:g.score_b):(g.score_a>g.score_b?g.score_b:g.score_a)),0)
        const conceded  = selectedTeam.games.reduce((a,g)=>a+(g.won?(g.score_a>g.score_b?g.score_b:g.score_a):(g.score_a>g.score_b?g.score_a:g.score_b)),0)
        return (
          <div ref={statsRef} style={{marginTop:24,background:'linear-gradient(160deg,#0d1f14,#060d14)',border:'1.5px solid rgba(74,222,128,0.2)',borderRadius:20,padding:'18px 16px',scrollMarginTop:80}}>
            {/* Header */}
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,color:'#4ade80',letterSpacing:3,marginBottom:14}}>⚔️ TEAM STATS</div>
            {/* Players */}
            <div style={{display:'flex',gap:8,marginBottom:16}}>
              {[{p:p1,l:l1},{p:p2,l:l2}].map(({p,l},i)=>(
                <div key={p.id} style={{flex:1,display:'flex',alignItems:'center',gap:8,background:'rgba(0,0,0,0.35)',borderRadius:12,padding:'10px'}}>
                  <Av id={p.id} size={38} aura={l.aura} profilePic={p.profile_pic}/>
                  <div style={{minWidth:0}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:'#f1f5f9',letterSpacing:0.5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.display_name}</div>
                    <div style={{fontSize:10,color:l.aura}}>{l.emoji} {l.name}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Stats grid */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:16}}>
              {[{label:'WINS',val:selectedTeam.wins,c:'#4ade80'},{label:'LOSSES',val:selectedTeam.losses,c:'#f87171'},{label:'WIN %',val:`${pct}%`,c:'#ffd700'},{label:'PLAYED',val:total,c:'#93c5fd'}].map(s=>(
                <div key={s.label} style={{background:'rgba(0,0,0,0.4)',borderRadius:10,padding:'8px 4px',textAlign:'center'}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:s.c,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:9,color:'#475569',fontFamily:"'Rajdhani',sans-serif",letterSpacing:1,marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Points */}
            <div style={{display:'flex',gap:8,marginBottom:16}}>
              {[{label:'POINTS SCORED',val:scored,c:'#4ade80'},{label:'POINTS CONCEDED',val:conceded,c:'#f87171'}].map(s=>(
                <div key={s.label} style={{flex:1,background:'rgba(0,0,0,0.3)',borderRadius:10,padding:'10px',textAlign:'center'}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:s.c}}>{s.val}</div>
                  <div style={{fontSize:9,color:'#475569',letterSpacing:1}}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Win rate bar */}
            <div style={{marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                <span style={{fontSize:10,color:'#475569',letterSpacing:1,fontWeight:700}}>WIN RATE</span>
                <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:'#4ade80'}}>{pct}%</span>
              </div>
              <div style={{height:6,background:'rgba(255,255,255,0.07)',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#4ade8066,#4ade80)',borderRadius:3,transition:'width 0.5s ease'}}/>
              </div>
            </div>
            {/* Recent games */}
            {recentGames.length>0&&(
              <div>
                <div style={{fontSize:10,color:'#334155',letterSpacing:2,fontWeight:700,marginBottom:8}}>RECENT MATCHES</div>
                {recentGames.map((g,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',marginBottom:5,background:'rgba(0,0,0,0.3)',borderRadius:10,border:`1px solid ${g.won?'rgba(74,222,128,0.15)':'rgba(248,113,113,0.1)'}`}}>
                    <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:g.won?'#4ade80':'#f87171',letterSpacing:1}}>{g.won?'WIN':'LOSS'}</span>
                    <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:'#f1f5f9',letterSpacing:2}}>{g.score_a} — {g.score_b}</span>
                    <span style={{fontSize:10,color:'#334155'}}>{new Date(g.played_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}


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
            background: filter===f.id?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.02)',
            color: filter===f.id?'#4ade80':'#64748b',
            fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, letterSpacing:0.5,
          }}>{f.label}</button>
        ))}
        {filter !== 'all' && (
          <div style={{ display:'flex', alignItems:'center', marginLeft:'auto', fontSize:12, color:'#475569', fontFamily:"'Rajdhani',sans-serif" }}>
            {filtered.length} game{filtered.length !== 1 ? 's' : ''} found
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
              <div style={{flex:1,height:1,background:'rgba(255,255,255,0.04)'}}/>
              <div style={{background:'rgba(255,255,255,0.04)',borderRadius:20,padding:'3px 10px',fontSize:11,color:'#64748b',fontFamily:"'Rajdhani',sans-serif",fontWeight:600,whiteSpace:'nowrap'}}>{dayGames.length} game{dayGames.length !== 1 ? 's' : ''}</div>
            </div>
            {dayGames.map(g=>{
              const tA=(g.team_a_ids||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean)
              const tB=(g.team_b_ids||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean)
              const ref=players.find(p=>p.id===g.logged_by)
              const winNames=(g.winner_team==='A'?tA:tB).map(p=>p.display_name).join(' + ')
              const time=new Date(g.played_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
              return (
                <div key={g.id} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'10px 12px',marginBottom:8}}>
                  {/* Compact header row: time + tags + winner */}
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:11,color:'#334155',fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>{time}</span>
                    {(g.team_a_ids?.length===1||g.team_b_ids?.length===1)
                      ? <span style={{fontSize:9,padding:'1px 6px',borderRadius:20,background:'rgba(96,165,250,0.1)',color:'#60a5fa',border:'1px solid rgba(96,165,250,0.2)',fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>1v1</span>
                      : <span style={{fontSize:9,padding:'1px 6px',borderRadius:20,background:'rgba(255,255,255,0.04)',color:'#334155',border:'1px solid rgba(255,255,255,0.07)',fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>2v2</span>
                    }
                    {Math.abs(g.score_a-g.score_b)>=10 && <span style={{fontSize:9,padding:'1px 6px',borderRadius:20,background:'rgba(251,146,60,0.1)',color:'#fb923c',border:'1px solid rgba(251,146,60,0.2)',fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>💥 DOM</span>}
                    {Math.abs(g.score_a-g.score_b)<=3 && <span style={{fontSize:9,padding:'1px 6px',borderRadius:20,background:'rgba(255,215,0,0.1)',color:'#ffd700',border:'1px solid rgba(255,215,0,0.2)',fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>😱 CLOSE</span>}
                    <span style={{marginLeft:'auto',fontSize:10,fontWeight:700,color:'#4ade80',fontFamily:"'Rajdhani',sans-serif",maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>🏆 {winNames}</span>
                  </div>
                  {/* Score row */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                    <span style={{fontSize:11,fontWeight:700,color:g.winner_team==='A'?'#4ade80':'#475569',fontFamily:"'Rajdhani',sans-serif"}}>Team A</span>
                    <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:'#f1f5f9',letterSpacing:3}}>{g.score_a} — {g.score_b}</span>
                    <span style={{fontSize:11,fontWeight:700,color:g.winner_team==='B'?'#4ade80':'#475569',fontFamily:"'Rajdhani',sans-serif"}}>Team B</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{display:'flex',gap:6}}>
                      {tA.map(p=>{const lv=getLevel(p.total_wins||0);return(
                        <div key={p.id} style={{textAlign:'center'}}>
                          <div style={{width:30,height:30,borderRadius:'50%',overflow:'hidden',border:`1.5px solid ${g.winner_team==='A'?lv.aura:lv.aura+'44'}`,margin:'0 auto 2px',background:'#1a2a1a'}}>
                            <img src={p.profile_pic || getAvatarUrl(p.id)} width={30} height={30} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{ e.target.src=getAvatarUrl(p.id) }}/>
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
                            <img src={p.profile_pic || getAvatarUrl(p.id)} width={30} height={30} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{ e.target.src=getAvatarUrl(p.id) }}/>
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



export default function Dashboard({ onOpenProfile, gameNav, onGameNavHandled }) {
  const { currentUser, logout } = useAuth()
  const { players: allPlayers, recentGames: allGames, loading: globalLoading, refetch: globalRefetch } = useRealtimeDashboard()
  const [tab, setTab]               = useState('action')
  const [tabLoading, setTabLoading] = useState(false)
  const [showLogGame, setShowLogGame] = useState(false)

  const [showMenu, setShowMenu]     = useState(false)
  const [subTab, setSubTab]         = useState('players')
  const [newGame, setNewGame]       = useState(false)
  const [groups, setGroups]         = useState([])
  const [groupMembers, setGroupMembers] = useState({})
  const [activeGroup, setActiveGroup]   = useState('player_default')
  const [editGame, setEditGame]         = useState(null)
  const [joinGroup, setJoinGroup]       = useState(null)
  const [showCourtManager, setShowCourtManager] = useState(false)
  const [courtManagerView, setCourtManagerView] = useState('list')
  const [myCourtsView, setMyCourtsView]         = useState('my')
  const [showMyCourts, setShowMyCourts]         = useState(false)
  const TAB_ORDER = ['players','teams','games','report','videos']
  const [openTeamDetail, setOpenTeamDetail]     = useState(null)
  const [showSettings, setShowSettings]         = useState(false)
  const [showRatingInfo, setShowRatingInfo]     = useState(false)
  const [showReportCard, setShowReportCard]     = useState(false)
  const [showNinja, setShowNinja]               = useState(false)
  const [showTournaments, setShowTournaments]   = useState(false)
  const [highlightedGame, setHighlightedGame]   = useState(null)
  const [gamePreference, setGamePreference]     = useState('doubles')
  const [chipsVisible, setChipsVisible]         = useState(true)
  const chipsShownOnce                          = useRef(false)
  const scrollRef                               = useRef(null)

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

  // Handle navigation from PlayerProfile
  useEffect(() => {
    if (gameNav?.tab === 'games') {
      setTab('games')
      setHighlightedGame(gameNav.gameId)
      onGameNavHandled && onGameNavHandled()
      setTimeout(() => setHighlightedGame(null), 3000)
    } else if (gameNav?.tab === 'rating') {
      setShowRatingInfo(true)
      onGameNavHandled && onGameNavHandled()
    }
  }, [gameNav])
  useEffect(() => {
    supabase.from('player_settings').select('game_preference').eq('player_id', currentUser.id).single()
      .then(({ data }) => { if (data) setGamePreference(data.game_preference) })
  }, [])
  useEffect(() => {
    supabase.from('player_settings').select('game_preference').eq('player_id', currentUser.id).single()
      .then(({ data }) => { if (data) setGamePreference(data.game_preference) })
  }, [])



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
  const isLoading = (effectiveGroup === 'all' && isAdmin) ? globalLoading : courtLoading
  const meGlobal = allPlayers.find(p => p.id === currentUser.id)
  const me = players.find(p => p.id === currentUser.id) || meGlobal

  function refetch() {
    if (effectiveGroup === 'all' && isAdmin) globalRefetch()
    else courtRefetch()
  }

  const filteredPlayers = [...players].sort((a,b)=>{
          const aCalib = (a.rating_doubles_games||0) < 15
          const bCalib = (b.rating_doubles_games||0) < 15
          if (aCalib !== bCalib) return aCalib ? 1 : -1 // calibrating goes to bottom
          return (b.rating_doubles||0)-(a.rating_doubles||0)
        })
  const filteredGames = recentGames
  const loading = isLoading

  function switchTab(id) {
    if (tab === id) return
    setTabLoading(true)
    setTimeout(() => setTabLoading(false), 350)
    setTab(id)
    // Scroll content to top on tab change
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }

  function handleContentScroll(e) {
    // Hide chips on first scroll
    if (e.target.scrollTop > 30 && !chipsShownOnce.current) {
      chipsShownOnce.current = true
      setChipsVisible(false)
    }
    // Infinite scroll to next tab — only on Players, Teams tabs
    const scrollableToNext = ['players','teams']
    if (!scrollableToNext.includes(tab)) return
    const el = e.target
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (nearBottom) {
      const currentIdx = TAB_ORDER.indexOf(tab)
      const nextTab = TAB_ORDER[currentIdx + 1]
      if (nextTab) {
        setTabLoading(true)
        setTimeout(() => { setTabLoading(false); setTab(nextTab); el.scrollTop = 0 }, 400)
      }
    }
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
        @keyframes fab-jump { 0%,100%{transform:translateY(0)} 10%{transform:translateY(-6px)} 20%{transform:translateY(0)} 30%{transform:translateY(-3px)} 40%{transform:translateY(0)} }
@keyframes shuttle-fly { 0%{left:-40px;opacity:1} 100%{left:110%;opacity:0} }
        @keyframes drawer-in { from{transform:translateX(-100%)} to{transform:translateX(0)} }
        @keyframes shuttle-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes tab-loader-in { from{opacity:0} to{opacity:1} }
        @keyframes ninja-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes reel-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.4)} }
        .tab-btn { background:none; border:none; color:#64748b; font-family:'Bebas Neue',sans-serif; font-size:15px; letter-spacing:1.5px; padding:12px 14px; cursor:pointer; border-bottom:3px solid transparent; transition:all 0.2s; flex:0 0 auto; text-align:center; white-space:nowrap; }
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
          onCreateCourt={() => { setCourtManagerView('create'); setShowCourtManager(true); setShowMenu(false) }}
          onJoinCourt={() => { setMyCourtsView('join'); setShowMyCourts(true); setShowMenu(false) }}
          onOpenSettings={() => { setShowSettings(true); setShowMenu(false) }}
          onOpenRatingInfo={() => { setShowRatingInfo(true); setShowMenu(false) }}
          onOpenTournaments={() => { setShowTournaments(true); setShowMenu(false) }}
        />
      )}

      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:40, background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <button className="hamburger" onClick={() => setShowMenu(true)}>
          <div className="ham-line"/><div className="ham-line"/><div className="ham-line"/>
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
          <span style={{ fontSize:20 }}>🏸</span>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'#4ade80', letterSpacing:4 }}>SHUTTLE</span>
        </div>
        <button onClick={()=>setShowLogGame(true)}
          style={{ background:'rgba(6,13,20,0.9)', border:'1.5px solid rgba(74,222,128,0.5)', color:'#4ade80', borderRadius:22, padding:'7px 16px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:2, display:'flex', alignItems:'center', gap:6, flexShrink:0, backdropFilter:'blur(8px)', boxShadow:'0 2px 12px rgba(74,222,128,0.15)' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="7" y1="1" x2="7" y2="13" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/><line x1="1" y1="7" x2="13" y2="7" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/></svg>
          ADD GAME
        </button>
      </div>



      {/* Action sub-tabs — only show when on action tab */}
      {tab==='action' && (
        <div style={{ position:'sticky', top:54, zIndex:38, background:'rgba(6,13,20,0.97)', backdropFilter:'blur(8px)', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          {/* Sub-tab strip */}
          <div style={{ display:'flex' }}>
            {[{id:'players',label:'PLAYERS'},{id:'teams',label:'TEAMS'},{id:'games',label:'GAMES'}].map(s=>(
              <button key={s.id} onClick={()=>setSubTab(s.id)}
                style={{ flex:1, padding:'12px 4px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:15, letterSpacing:2, border:'none', borderBottom:`2.5px solid ${subTab===s.id?'#4ade80':'transparent'}`,
                  background:'transparent',
                  color:subTab===s.id?'#4ade80':'#334155' }}>
                {s.label}
              </button>
            ))}
          </div>
          {/* Court chips — only in action tab */}
          {myGroupIds.length > 0 && (
            <div style={{ padding:'6px 16px 8px', display:'flex', gap:8, overflowX:'auto' }}>
              <button className={`group-chip${effectiveGroup==='all'?' active':''}`} onClick={()=>setActiveGroup('all')} style={{flexShrink:0}}>All</button>
              {groups.filter(g=>myGroupIds.includes(g.id)).map(g=>(
                <button key={g.id} className={`group-chip${effectiveGroup===g.id?' active':''}`} onClick={()=>setActiveGroup(g.id)} style={{flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:130}}>{g.name}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ padding:'14px 14px 100px', minHeight:'calc(100vh - 160px)' }}>

        {tab==='action' && subTab==='players' && (
          <div style={{ animation:'card-in 0.3s ease-out', padding:'0 16px' }}>
            {me && <HeroCard player={me} isCurrentUser onClick={()=>onOpenProfile&&onOpenProfile(me.id, effectiveGroup)}/>}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:'#64748b', letterSpacing:3 }}>🏆 LEADERBOARD</div>
              <button onClick={()=>setShowRatingInfo(true)} style={{ background:'none', border:'none', color:'#4ade80', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:11, fontWeight:700, padding:0 }}>How ELO works →</button>
            </div>
            {filteredPlayers.map((p,idx) => (
              <LeaderRow key={p.id} player={p} rank={idx+1} isCurrentUser={p.id===currentUser.id} onClick={()=>onOpenProfile&&onOpenProfile(p.id, effectiveGroup)}/>
            ))}
          </div>
        )}

        {tab==='action' && subTab==='teams' && (
          <div style={{ animation:'card-in 0.3s ease-out', padding:'0 16px' }}>
            <TeamsTab allPlayers={filteredPlayers} currentUserId={currentUser.id}/>
          </div>
        )}
        {tab==='action' && subTab==='games' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            <GamesTab recentGames={filteredGames} players={filteredPlayers} loading={loading} isAdmin={isAdmin} groups={groups} onDeleteGame={async(id)=>{ if(window.confirm('Delete this game? Stats will be updated for all players.')) { const r = await deleteGame(id); if(r.success){ setTimeout(()=>refetch(), 800) } else { alert('Delete failed: ' + r.message) } }}} onEditGame={(g)=>setEditGame(g)}/>
          </div>
        )}
        {tab==='goals' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            <GoalsTab currentUserId={currentUser.id} allGames={recentGames} players={filteredPlayers}/>
          </div>
        )}
        {tab==='report' && (
          <div style={{ padding:'16px', animation:'card-in 0.3s ease-out' }}>
            <ReportCard players={filteredPlayers} currentUserId={currentUser.id} groups={groups} activeGroup={effectiveGroup}/>
          </div>
        )}

        {tab==='deuce' && (
          <div style={{ padding:'16px', animation:'card-in 0.3s ease-out' }}>
            <VideoTab currentUserId={currentUser.id}/>
          </div>
        )}
      </div>

      {/* FAB */}



      {showSettings && (
        <SettingsPage
          currentUser={currentUser}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showRatingInfo && <HowRatingWorks onClose={()=>setShowRatingInfo(false)}/>}
      {openTeamDetail && (
        <TeamProfile
          p1={openTeamDetail.p1}
          p2={openTeamDetail.p2}
          onBack={() => setOpenTeamDetail(null)}
        />
      )}
      {showMyCourts && (
        <MyCourts
          currentUser={currentUser}
          onClose={() => { setShowMyCourts(false); setMyCourtsView('my'); loadGroups() }}
          initialView={myCourtsView}
          onCreateCourt={() => { setShowMyCourts(false); setCourtManagerView('create'); setShowCourtManager(true) }}
        />
      )}
      {showCourtManager && (
        <CourtManager
          onClose={(newCourtId) => { setShowCourtManager(false); setCourtManagerView('list'); loadGroups(); if(newCourtId){ setActiveGroup(newCourtId); setTab('games') } }}
          currentUserId={currentUser.id}
          initialView={courtManagerView}
        />
      )}
      {joinGroup && (
        <MyCourts
          currentUser={currentUser}
          initialView="join"
          onClose={() => setJoinGroup(null)}
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
      {/* Racquet Ninja Page */}
      {showTournaments && (
        <TournamentsPage
          onBack={()=>setShowTournaments(false)}
          currentUser={currentUser}
          players={players}
          groups={groups}
          activeGroup={effectiveGroup}
        />
      )}
      {showNinja && <RacquetNinja onClose={()=>setShowNinja(false)} currentUser={currentUser} currentPlayer={players?.find(p=>p.id===currentUser.id)}/>}


      {/* ── Floating + button — hidden when LogGame is open ── */}
      {!showLogGame && <div onClick={()=>setShowLogGame(true)} style={{ position:'fixed', bottom:100, right:20, zIndex:51, width:44, height:44, borderRadius:'50%', background:'rgba(6,13,20,0.9)', border:'1.5px solid rgba(74,222,128,0.5)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 12px rgba(74,222,128,0.15)', backdropFilter:'blur(8px)', animation:'fab-jump 3s ease-in-out infinite' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="9" y1="2" x2="9" y2="16" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/><line x1="2" y1="9" x2="16" y2="9" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/></svg>
      </div>}

      {/* ── Bottom Nav ── */}
      <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', zIndex:50, width:'calc(100% - 48px)', maxWidth:400 }}>
        <div style={{ display:'flex', alignItems:'center', background:'rgba(10,14,24,0.92)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1.5px solid rgba(255,255,255,0.18)', borderRadius:28, padding:'8px 6px', boxShadow:'0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          {[
            { id:'action', label:'Action', color:'#4ade80', icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
            { id:'goals',  label:'Goals',  color:'#c084fc', icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
            { id:'report', label:'Report', color:'#60a5fa', icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
            { id:'deuce',  label:'Deuce',  color:'#fb923c', icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> },
          ].map(t=>{
            const active = tab===t.id
            return (
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'6px 4px', borderRadius:22, border:'none', cursor:'pointer', transition:'all 0.2s',
                  background: active ? `${t.color}18` : 'transparent',
                  color: active ? t.color : '#334155' }}>
                {t.icon}
                <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:9, fontWeight:700, letterSpacing:1, lineHeight:1 }}>{t.label.toUpperCase()}</span>
                {active && <div style={{ width:4, height:4, borderRadius:'50%', background:t.color, marginTop:-1 }}/>}
              </button>
            )
          })}
        </div>
      </div>

      {showLogGame && <LogGame onClose={()=>setShowLogGame(false)} onGameLogged={handleGameLogged} activeGroup={effectiveGroup} groupMembers={groupMembers} groups={groups} currentUserId={currentUser.id} defaultSingles={gamePreference==='singles'}/>}
    </div>
  )
}