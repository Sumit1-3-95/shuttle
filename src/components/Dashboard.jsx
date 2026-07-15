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

// ── Hamburger menu ─────────────────────────────────────────────
function HamburgerMenu({ currentUser, currentPlayer, groups, myGroupIds, activeGroup, onGroupSelect, onClose, onLogout, onOpenProfile, onGroupCreated, onJoinGroup, onOpenCourtManager, onOpenMyCourts, onCreateCourt, onJoinCourt, onOpenSettings, onOpenRatingInfo }) {
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
      <div style={{ position:'fixed', top:0, left:0, bottom:0, width:'min(290px, 85vw)', background:'#0a1628', borderRight:'1px solid rgba(74,222,128,0.15)', zIndex:91, display:'flex', flexDirection:'column', animation:'drawer-in 0.25s cubic-bezier(0.34,1.2,0.64,1)', boxShadow:'4px 0 40px rgba(0,0,0,0.8)', overflowY:'auto' }}>

        {/* Profile */}
        <div style={{ padding:'40px 20px 16px', background:`linear-gradient(180deg,${level.bg},transparent)`, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div style={{ position:'relative', cursor:'pointer' }} onClick={() => { onOpenProfile(currentUser.id, activeGroup); onClose() }}>
              <Av id={currentUser.id} size={56} aura={level.aura} profilePic={currentPlayer?.profile_pic} style={{ border:`2.5px solid ${level.aura}`, boxShadow:`0 0 16px ${level.glow}` }}/>
              {(level.tier >= 4) && <div style={{ position:'absolute', inset:-3, borderRadius:'50%', border:`1px solid ${level.aura}`, borderTopColor:'transparent', animation:'spin-ring 3s linear infinite', pointerEvents:'none' }}/>}
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
        <div style={{ flex:1, overflowY:'auto', padding:'16px 0', WebkitOverflowScrolling:'touch' }}>

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

          <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'4px 16px 12px' }}/>

          {/* Court actions — all users */}
          <div style={{ padding:'0 16px', marginBottom:8 }}>
            <div style={{ fontSize:10, color:'#475569', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:10, fontFamily:"'Rajdhani',sans-serif" }}>Courts</div>
            <button onClick={() => { onCreateCourt && onCreateCourt(); onClose() }} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 12px', marginBottom:8, background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:10, cursor:'pointer', color:'#4ade80', fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700 }}>
              <span>🏟️</span> Create a Court
            </button>
            <button onClick={() => { onJoinCourt && onJoinCourt(); onClose() }} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 12px', marginBottom:8, background:'rgba(96,165,250,0.06)', border:'1px solid rgba(96,165,250,0.2)', borderRadius:10, cursor:'pointer', color:'#60a5fa', fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700 }}>
              <span>🔍</span> Join a Court
            </button>
            <button onClick={() => { onOpenMyCourts && onOpenMyCourts(); onClose() }} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 12px', background:'rgba(148,163,184,0.06)', border:'1px solid rgba(148,163,184,0.2)', borderRadius:10, cursor:'pointer', color:'#94a3b8', fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700 }}>
              <span>🏸</span> Manage My Courts
            </button>
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

        {/* Settings */}
        <div style={{ padding:'0 16px', marginBottom:8 }}>
          <button onClick={() => { onOpenSettings && onOpenSettings(); onClose() }} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, cursor:'pointer', color:'#64748b', fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700 }}>
            <span>⚙️</span> Settings
          </button>
        </div>

        <div style={{ padding:'0 16px', marginBottom:8 }}>
          <button onClick={() => { setShowRatingInfo(true); setShowMenu(false) }} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 12px', marginBottom:8, background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:10, cursor:'pointer', color:'#4ade80', fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700 }}>
            <span>📊</span> How Rating Works
          </button>
          <button onClick={() => { setShowSettings(true); setShowMenu(false) }} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, cursor:'pointer', color:'#64748b', fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700 }}>
            <span>⚙️</span> Settings
          </button>
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
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
            <div style={{ position:'relative' }}>
              <Av id={player.id} size={62} aura={level.aura} profilePic={player.profile_pic} style={{ border:`2.5px solid ${level.aura}`, boxShadow:`0 0 18px ${level.glow}` }}/>
              {(level.tier >= 4) && <div style={{ position:'absolute', inset:-4, borderRadius:'50%', border:`1.5px solid ${level.aura}`, borderTopColor:'transparent', borderRightColor:'transparent', animation:'spin-ring 3s linear infinite' }}/>}
            </div>
            <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20, background:`${level.aura}22`, color:level.aura, border:`1px solid ${level.aura}44`, fontFamily:"'Rajdhani',sans-serif", letterSpacing:0.5, whiteSpace:'nowrap' }}>{level.emoji} {level.name}</span>
          </div>
          <div style={{ flex:1, minWidth:0, paddingTop:2 }}>
            {isCurrentUser && <div style={{ fontSize:9, color:level.aura, letterSpacing:2, fontWeight:700, fontFamily:"'Rajdhani',sans-serif", marginBottom:1 }}>YOUR PROFILE</div>}
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, letterSpacing:2, color:'#fff', lineHeight:1, marginBottom:5 }}>{player.display_name}</div>
            {(()=>{ const r=player.rating_doubles||1000; const t=getRatingTier(r); const c=isCalibrating(player.rating_doubles_games||0); return (
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:6, background:`${t.color}15`, border:`1px solid ${t.color}30`, marginBottom:4 }}>
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, color:t.color, letterSpacing:0.5 }}>{t.emoji} {c?'CALIBRATING':r+' ELO'}</span>
              </div>
            )})()}
            {((player.current_streak||0) >= 3) && <div><span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:'rgba(249,115,22,0.12)', border:'1px solid rgba(249,115,22,0.3)', color:'#fb923c', fontFamily:"'Rajdhani',sans-serif" }}>🔥 {player.current_streak} streak</span></div>}
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
  const level  = getLevel(player.total_wins || 0)
  const winPct = player.total_games > 0 ? Math.round((player.total_wins / player.total_games) * 100) : 0
  const badge  = getRankBadge(rank)
  const rTier  = getRatingTier(player.rating_doubles || 1000)
  const rCalib = isCalibrating(player.rating_doubles_games || 0)
  return (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:isCurrentUser?`${level.aura}0e`:'rgba(255,255,255,0.02)', border:`1px solid ${isCurrentUser?level.aura+'44':'rgba(255,255,255,0.07)'}`, borderRadius:14, cursor:'pointer', marginBottom:8, transition:'all 0.2s' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flexShrink:0 }}>
        <div style={{ width:32, padding:'1px 0', borderRadius:4, background:`${rTier.color}12`, border:`1px solid ${rTier.color}25`, textAlign:'center' }}>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:8, color:rTier.color }}>{rCalib?'?':player.rating_doubles||1000}</span>
        </div>
        <div style={{ width:32, height:26, borderRadius:7, background:badge.bg, border:`1px solid ${badge.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:12, color:badge.color }}>{badge.label}</span>
        </div>
      </div>
      <Av id={player.id} size={42} aura={level.aura} profilePic={player.profile_pic}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:1, color:isCurrentUser?level.aura:'#f1f5f9', lineHeight:1 }}>{player.display_name}</span>
          {isCurrentUser && <span style={{ fontSize:9, color:'#4ade80', fontWeight:700, background:'rgba(74,222,128,0.12)', padding:'1px 5px', borderRadius:6, fontFamily:"'Rajdhani',sans-serif", letterSpacing:1 }}>YOU</span>}
          {((player.current_streak||0) >= 3) && <span style={{ fontSize:11, color:'#f97316' }}>🔥{player.current_streak}</span>}
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
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:1,color:isSelected?'#4ade80':isMe?'#4ade80':'#f1f5f9',lineHeight:1,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
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
            background: filter===f.id?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.03)',
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
              <div style={{flex:1,height:1,background:'rgba(255,255,255,0.06)'}}/>
              <div style={{background:'rgba(255,255,255,0.05)',borderRadius:20,padding:'3px 10px',fontSize:11,color:'#64748b',fontFamily:"'Rajdhani',sans-serif",fontWeight:600,whiteSpace:'nowrap'}}>{dayGames.length} game{dayGames.length !== 1 ? 's' : ''}</div>
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
                      : <span style={{fontSize:9,padding:'1px 6px',borderRadius:20,background:'rgba(255,255,255,0.05)',color:'#334155',border:'1px solid rgba(255,255,255,0.07)',fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>2v2</span>
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
  const [courtManagerView, setCourtManagerView] = useState('list')
  const [myCourtsView, setMyCourtsView]         = useState('my')
  const [showMyCourts, setShowMyCourts]         = useState(false)
  const TAB_ORDER = ['players','teams','games','report','videos']
  const [openTeamDetail, setOpenTeamDetail]     = useState(null)
  const [showSettings, setShowSettings]         = useState(false)
  const [showRatingInfo, setShowRatingInfo]     = useState(false)
  const [showReportCard, setShowReportCard]     = useState(false)
  const [showNinja, setShowNinja]               = useState(false)
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

  const filteredPlayers = [...players].sort((a,b)=>(b.rating_doubles||0)-(a.rating_doubles||0))
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
            <Av id={currentUser.id} size={34} aura={getLevel(me.total_wins||0).aura} profilePic={me?.profile_pic} style={{ border:`2px solid ${getLevel(me.total_wins||0).aura}` }}/>
          </div>
        )}
      </div>

      {/* Group filter chips — not sticky, hides on scroll */}
      {myGroupIds.length ? (
        <div style={{
          overflow:'hidden',
          maxHeight: chipsVisible ? 52 : 0,
          opacity: chipsVisible ? 1 : 0,
          transition: 'max-height 0.35s ease, opacity 0.3s ease',
          background:'rgba(6,13,20,0.97)',
          borderBottom: chipsVisible ? '1px solid rgba(255,255,255,0.04)' : 'none',
        }}>
          <div style={{ padding:'8px 16px', display:'flex', gap:8, overflowX:'auto' }}>
            <button className={`group-chip${effectiveGroup==='all'?' active':''}`} onClick={()=>setActiveGroup('all')} style={{flexShrink:0}}>All</button>
            {groups.filter(g => myGroupIds.includes(g.id)).map(g => (
              <button key={g.id} className={`group-chip${effectiveGroup===g.id?' active':''}`} onClick={()=>setActiveGroup(g.id)} style={{flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:130}}>{g.name}</button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <div style={{ position:'sticky', top:54, zIndex:38, background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', display:'flex', borderBottom:'2px solid rgba(255,255,255,0.05)', overflowX:'auto' }}>
        {[{id:'players',label:'PLAYERS'},{id:'teams',label:'TEAMS'},{id:'games',label:'GAMES'},{id:'report',label:'REPORT'},{id:'videos',label:'DEUCE'}].map(t=>(
          <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={()=>switchTab(t.id)} style={t.id==='videos' ? {
            color: tab==='videos' ? '#fb923c' : '#f97316',
            borderBottomColor: tab==='videos' ? '#fb923c' : 'transparent',
            position: 'relative',
            background: tab==='videos' ? 'rgba(251,146,60,0.12)' : 'rgba(251,146,60,0.05)',
            borderRadius: '8px 8px 0 0',
            marginTop: 2,
          } : {}}>
            {t.label}
            {t.id==='videos' && tab!=='videos' && (
              <span style={{ position:'absolute', top:8, right:6, width:5, height:5, borderRadius:'50%', background:'#fb923c', animation:'reel-pulse 2s ease-in-out 3' }}/>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:'14px 14px 100px', minHeight:'calc(100vh - 160px)' }}>
        {tab === 'players' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            {me && (
              <HeroCard player={me} isCurrentUser onClick={()=>onOpenProfile&&onOpenProfile(me.id, effectiveGroup)}/>
            )}
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, color:'#64748b', letterSpacing:3, marginBottom:6 }}>🏆 LEADERBOARD</div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:10, color:'#334155', fontFamily:"'Rajdhani',sans-serif" }}>Ranked by ELO rating</span>
              <button onClick={()=>setShowRatingInfo(true)} style={{ background:'none', border:'none', color:'#4ade80', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700, padding:0 }}>Know more →</button>
            </div>
            {filteredPlayers.map((p,idx) => (
              <LeaderRow key={p.id} player={p} rank={idx+1} isCurrentUser={p.id===currentUser.id} onClick={()=>onOpenProfile&&onOpenProfile(p.id, effectiveGroup)}/>
            ))}
          </div>
        )}
        {tab==='players' && (
          <div style={{ textAlign:'center', padding:'32px 16px 16px', color:'#1e293b', fontFamily:"'Rajdhani',sans-serif", fontSize:12, letterSpacing:1, fontWeight:700 }}>
            ↓ KEEP SCROLLING FOR TEAMS
          </div>
        )}
        {tab === 'teams' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            <TeamsTab allPlayers={filteredPlayers} currentUserId={currentUser.id}/>
          </div>
        )}
        {tab==='teams' && (
          <div style={{ textAlign:'center', padding:'32px 16px 16px', color:'#1e293b', fontFamily:"'Rajdhani',sans-serif", fontSize:12, letterSpacing:1, fontWeight:700 }}>
            ↓ KEEP SCROLLING FOR GAMES
          </div>
        )}
        {tab === 'games' && (
          <div style={{ animation:'card-in 0.3s ease-out' }}>
            <GamesTab recentGames={filteredGames} players={filteredPlayers} loading={loading} isAdmin={isAdmin} groups={groups} onDeleteGame={async(id)=>{ if(window.confirm('Delete this game? Stats will be updated for all players.')) { const r = await deleteGame(id); if(r.success){ setTimeout(()=>refetch(), 800) } else { alert('Delete failed: ' + r.message) } }}} onEditGame={(g)=>setEditGame(g)}/>
          </div>
        )}
        {tab === 'report' && (
          <div style={{ padding:'16px', animation:'card-in 0.3s ease-out' }}>
            <ReportCard players={filteredPlayers} currentUserId={currentUser.id} groups={groups} activeGroup={effectiveGroup}/>
          </div>
        )}

        {tab === 'videos' && (
          <div style={{ padding:'16px', animation:'card-in 0.3s ease-out' }}>
            <VideoTab currentUserId={currentUser.id}/>
          </div>
        )}
      </div>

      {/* FAB */}
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', zIndex:50, width:'100%', maxWidth:480, padding:'10px 16px 24px', background:'linear-gradient(to top,rgba(6,13,20,1) 65%,transparent)', pointerEvents:'none' }}>
        <button onClick={()=>setShowLogGame(true)} style={{ display:'block', width:'92%', margin:'0 auto', background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:3, padding:'13px', borderRadius:50, cursor:'pointer', animation:'fab-pulse 2.5s ease-in-out infinite', pointerEvents:'all' }}>
          + ADD GAME
        </button>
      </div>

      {/* Racquet Ninja floating button — bottom right */}
      <div onClick={()=>setShowRN(true)} style={{ position:'fixed', bottom:96, right:16, zIndex:60, display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer' }}>
        <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#fbbf24,#d97706)', border:'2.5px solid rgba(251,191,36,0.8)', boxShadow:'0 0 20px rgba(251,191,36,0.5), 0 4px 16px rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, animation:'rn-fab-glow 2.5s ease-in-out infinite' }}>
          🥷
        </div>
        <div style={{ fontSize:8, color:'#fbbf24', fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1, textShadow:'0 0 8px rgba(251,191,36,0.6)', textAlign:'center', lineHeight:1.1 }}>RACQUET<br/>NINJA</div>
        <style>{`@keyframes rn-fab-glow{0%,100%{box-shadow:0 0 20px rgba(251,191,36,0.5),0 4px 16px rgba(0,0,0,0.4)}50%{box-shadow:0 0 35px rgba(251,191,36,0.8),0 4px 20px rgba(0,0,0,0.5)}}`}</style>
      </div>

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
      {/* Racquet Ninja Page */}
      {showNinja && <RacquetNinja onClose={()=>setShowNinja(false)} currentUser={currentUser} currentPlayer={players?.find(p=>p.id===currentUser.id)}/>}

      {/* Racquet Ninja Floating Button */}
      {!showNinja && (
        <div onClick={()=>setShowNinja(true)} style={{ position:'fixed', bottom:88, right:16, zIndex:60, display:'flex', flexDirection:'column', alignItems:'center', gap:5, cursor:'pointer', animation:'ninja-float 3s ease-in-out infinite' }}>
          <div style={{ width:52, height:52, borderRadius:'50%', overflow:'hidden', border:'2.5px solid #4ade80', boxShadow:'0 0 16px rgba(74,222,128,0.35)', background:'#0a1a0a' }}>
            <img src="/racquet-ninja.jpg" alt="Racquet Ninja" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{ e.target.style.display='none' }}/>
          </div>
          <div style={{ fontSize:8, color:'#4ade80', letterSpacing:1.5, fontWeight:700, fontFamily:"'Rajdhani',sans-serif", whiteSpace:'nowrap', background:'rgba(6,13,20,0.85)', padding:'2px 7px', borderRadius:10, border:'1px solid rgba(74,222,128,0.25)' }}>RACQUET NINJA</div>
        </div>
      )}

      {showLogGame && <LogGame onClose={()=>setShowLogGame(false)} onGameLogged={handleGameLogged} activeGroup={effectiveGroup} groupMembers={groupMembers} groups={groups} currentUserId={currentUser.id} defaultSingles={gamePreference==='singles'}/>}
    </div>
  )
}