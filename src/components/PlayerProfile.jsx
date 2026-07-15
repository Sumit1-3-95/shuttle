// src/components/PlayerProfile.jsx — v3
// Fixed back button, smooth tabs, standardised layout, skills/flaws section
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { usePlayerProfile } from '../hooks/usePlayerProfile'
import { getRatingTier, isCalibrating } from '../utils/ratingEngine'
import { getAvatarUrl, getCharacterName } from '../utils/avatars'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');`

function getLevel(wins) {
  if (wins >= 50) return { name:'LEGEND',    tier:5, aura:'#ffd700', bg:'#2a1f00', glow:'rgba(255,215,0,0.4)',   emoji:'👑' }
  if (wins >= 30) return { name:'ELITE',     tier:4, aura:'#c084fc', bg:'#1a0f2e', glow:'rgba(192,132,252,0.4)', emoji:'⚡' }
  if (wins >= 15) return { name:'SMASH PRO', tier:3, aura:'#38bdf8', bg:'#001f2e', glow:'rgba(56,189,248,0.4)',  emoji:'🔥' }
  if (wins >= 5)  return { name:'CONTENDER', tier:2, aura:'#4ade80', bg:'#001a0f', glow:'rgba(74,222,128,0.35)', emoji:'⚔️' }
  return            { name:'ROOKIE',     tier:1, aura:'#94a3b8', bg:'#111827', glow:'rgba(148,163,184,0.2)', emoji:'🎯' }
}

function Av({ id, size=48, aura='#4ade8055' }) {
  const [err, setErr] = useState(false)
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', border:`2px solid ${aura}`, background:'#1a2a1a', flexShrink:0 }}>
      {!err
        ? <img src={getAvatarUrl(id)} width={size} height={size} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setErr(true)}/>
        : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.4,color:aura}}>?</div>
      }
    </div>
  )
}

// ── SVG Line chart ────────────────────────────────────────────
function LineChart({ data, color, height=80 }) {
  if (!data || data.length < 2) return (
    <div style={{ height, display:'flex', alignItems:'center', justifyContent:'center', color:'#334155', fontSize:13, fontFamily:"'Rajdhani',sans-serif" }}>Not enough games yet</div>
  )
  const w=300, h=height, min=Math.min(...data), max=Math.max(...data), range=max-min||1
  const pts = data.map((v,i) => {
    const x=(i/(data.length-1))*w
    const y=h-((v-min)/range)*(h-10)-5
    return `${x},${y}`
  })
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:'block'}}>
      <defs>
        <linearGradient id={`lg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`} fill={`url(#lg${color.replace('#','')})`}/>
      <path d={`M ${pts.join(' L ')}`} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((v,i) => {
        const x=(i/(data.length-1))*w
        const y=h-((v-min)/range)*(h-10)-5
        return <circle key={i} cx={x} cy={y} r="3.5" fill={color}/>
      })}
    </svg>
  )
}

// ── Bar chart ─────────────────────────────────────────────────
function BarChart({ items, color }) {
  if (!items?.length) return <div style={{color:'#334155',fontSize:13,textAlign:'center',padding:16,fontFamily:"'Rajdhani',sans-serif"}}>No partner data yet</div>
  const max = Math.max(...items.map(i=>i.value))||1
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {items.map((item,i) => (
        <div key={i}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{fontSize:14,color:'#94a3b8',fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>{item.label}</span>
            <span style={{fontSize:14,color,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1}}>{item.value}W · {item.pct}%</span>
          </div>
          <div style={{height:6,background:'rgba(255,255,255,0.07)',borderRadius:3,overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:3,width:`${(item.value/max)*100}%`,background:`linear-gradient(90deg,${color}88,${color})`,transition:'width 0.8s ease'}}/>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Margin chart ──────────────────────────────────────────────
function MarginChart({ games, playerId }) {
  if (!games?.length) return <div style={{color:'#334155',fontSize:13,textAlign:'center',padding:16,fontFamily:"'Rajdhani',sans-serif"}}>No games yet</div>
  const margins = games.slice(-15).map(g => {
    const inA=g.team_a_ids?.includes(playerId)
    const own=inA?g.score_a:g.score_b, opp=inA?g.score_b:g.score_a
    return { margin:own-opp, won:g.winner_team===(inA?'A':'B') }
  })
  const maxM=Math.max(...margins.map(m=>Math.abs(m.margin)))||1
  const w=300, h=80, midY=h/2
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:'block'}}>
      <line x1="0" y1={midY} x2={w} y2={midY} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="4" y={midY-5} fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Rajdhani">WIN</text>
      <text x="4" y={midY+14} fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Rajdhani">LOSS</text>
      {margins.map((m,i) => {
        const x=((i+0.5)/margins.length)*w
        const barH=Math.max(4,(Math.abs(m.margin)/maxM)*(midY-8))
        const y=m.won?midY-barH:midY
        return <rect key={i} x={x-6} y={y} width={12} height={barH} rx={3} fill={m.won?'#4ade80':'#f87171'} opacity="0.85"/>
      })}
    </svg>
  )
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null
  const green = toast.type==='green'
  return (
    <div style={{ position:'fixed', top:16, left:'50%', transform:'translateX(-50%)', zIndex:999, background:green?'rgba(20,83,45,0.95)':'rgba(15,23,42,0.95)', border:`1px solid ${green?'#4ade80':'#334155'}`, borderRadius:50, padding:'10px 20px', fontSize:13, fontWeight:600, color:green?'#4ade80':'#94a3b8', fontFamily:"'Rajdhani',sans-serif", letterSpacing:0.5, whiteSpace:'nowrap', boxShadow:green?'0 4px 24px rgba(74,222,128,0.25)':'0 4px 24px rgba(0,0,0,0.5)', animation:'toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
      {toast.msg}
    </div>
  )
}

export default function PlayerProfile({ playerId, groupId, onBack }) {
  const { currentUser } = useAuth()
  const isOwnProfile = currentUser?.id === playerId
  const { player, games, allPlayers, skills, loading, refreshing, toast, hasNewGame, refresh } = usePlayerProfile(playerId, groupId)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  async function handlePhotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const ext  = file.name.split('.').pop()
      // Use playerId (not username) to ensure unique, stable path per player
      const path = `player-photos/${playerId}_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file)
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('players').update({ profile_pic: urlData.publicUrl }).eq('id', playerId)
      refresh()
    } catch (err) {
      alert('Upload failed: ' + err.message)
    }
    setUploadingPhoto(false)
  }
  const [tab, setTab] = useState('overview')

  if (loading || !player) return (
    <div style={{ minHeight:'100vh', background:'#060d14', display:'flex', alignItems:'center', justifyContent:'center', color:'#4ade80', fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:3 }}>
      LOADING...
    </div>
  )

  const level   = getLevel(player.total_wins||0)
  const winPct  = player.total_games>0 ? Math.round((player.total_wins/player.total_games)*100) : 0
  const ptDiff  = (player.points_scored||0)-(player.points_conceded||0)

  // Days played this calendar month
  const now = new Date()
  const daysThisMonth = new Set(
    games
      .filter(g => {
        const d = new Date(g.played_at)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .map(g => new Date(g.played_at).toDateString())
  ).size
  const playerMap = Object.fromEntries(allPlayers.map(p=>[p.id,p]))

  // Charts data
  let cum=0
  const winsOverTime = games.map(g => {
    const inA=g.team_a_ids?.includes(playerId)
    if(g.winner_team===(inA?'A':'B')) cum++
    return cum
  })

  const partnerMap={}
  games.forEach(g => {
    const inA=g.team_a_ids?.includes(playerId)
    const won=g.winner_team===(inA?'A':'B')
    const teammates=inA?g.team_a_ids:g.team_b_ids
    teammates?.forEach(pid => {
      if(pid===playerId) return
      if(!partnerMap[pid]) partnerMap[pid]={wins:0,games:0}
      partnerMap[pid].games++
      if(won) partnerMap[pid].wins++
    })
  })
  const partnerData = Object.entries(partnerMap)
    .map(([pid,s])=>({ label:playerMap[pid]?.display_name||'?', value:s.wins, pct:Math.round((s.wins/s.games)*100) }))
    .sort((a,b)=>b.value-a.value).slice(0,5)

  const recentForm = games.slice(-10).map(g => {
    const inA=g.team_a_ids?.includes(playerId)
    return g.winner_team===(inA?'A':'B')?'W':'L'
  })

  const h2hMap={}
  games.forEach(g => {
    const inA=g.team_a_ids?.includes(playerId)
    const won=g.winner_team===(inA?'A':'B')
    const opponents=inA?g.team_b_ids:g.team_a_ids
    opponents?.forEach(pid => {
      if(!h2hMap[pid]) h2hMap[pid]={wins:0,losses:0}
      if(won) h2hMap[pid].wins++; else h2hMap[pid].losses++
    })
  })
  const h2hData = Object.entries(h2hMap)
    .map(([pid,s])=>({ name:playerMap[pid]?.display_name||'?', pid, ...s, total:s.wins+s.losses }))
    .sort((a,b)=>b.total-a.total)

  const tabs = [
    { id:'overview', label:'Overview' },
    { id:'charts',   label:'Charts' },
    { id:'h2h',      label:'H2H' },
    { id:'skills',   label:'Skills' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#060d14', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', width:'100%' }}>
      <style>{`
        ${FONTS}
        @keyframes toast-in { from{opacity:0;transform:translateX(-50%) translateY(-10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes spin-ring { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes tab-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .ptab { background:none; border:none; color:#64748b; font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:700; letter-spacing:1px; padding:12px 0; cursor:pointer; border-bottom:2.5px solid transparent; transition:color 0.2s, border-color 0.2s; flex:1; text-align:center; text-transform:uppercase; }
        .ptab.active { color:#4ade80; border-bottom-color:#4ade80; }
        .stat-box { background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:12px 4px; text-align:center; min-width:0; }
        .chart-card { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:14px; margin-bottom:14px; width:100%; box-sizing:border-box; }
      `}</style>

      <Toast toast={toast}/>

      {/* ── Hero header ── */}
      <div style={{ position:'relative', overflow:'hidden', background:`linear-gradient(180deg,${level.bg} 0%,#060d14 100%)`, paddingBottom:20 }}>
        {/* Court lines */}
        <svg width="100%" height="100%" viewBox="0 0 420 240" preserveAspectRatio="xMidYMid slice"
          style={{ position:'absolute', inset:0, opacity:0.1 }} aria-hidden="true">
          <rect x="14" y="10" width="392" height="220" fill="none" stroke={level.aura} strokeWidth="1.5" rx="2"/>
          <line x1="46" y1="10" x2="46" y2="230" stroke={level.aura} strokeWidth="1"/>
          <line x1="374" y1="10" x2="374" y2="230" stroke={level.aura} strokeWidth="1"/>
          <line x1="210" y1="10" x2="210" y2="230" stroke={level.aura} strokeWidth="2"/>
          <line x1="14" y1="76" x2="406" y2="76" stroke={level.aura} strokeWidth="1"/>
          <line x1="14" y1="164" x2="406" y2="164" stroke={level.aura} strokeWidth="1"/>
          <line x1="210" y1="76" x2="210" y2="164" stroke={level.aura} strokeWidth="1"/>
          <circle cx="14" cy="120" r="3" fill={level.aura} opacity="0.5"/>
          <circle cx="406" cy="120" r="3" fill={level.aura} opacity="0.5"/>
        </svg>

        {/* Back + refresh bar */}
        <div style={{ position:'relative', zIndex:2, padding:'16px 16px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button
            onClick={() => { if(onBack) onBack() }}
            style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.12)', color:'#94a3b8', borderRadius:20, padding:'8px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700, letterSpacing:0.5 }}>
            ← Back
          </button>
          <button
            onClick={refresh} disabled={refreshing}
            className={hasNewGame?'has-new':''}
            style={{ display:'flex', alignItems:'center', gap:6, background:hasNewGame?'rgba(74,222,128,0.12)':'rgba(0,0,0,0.4)', border:`1px solid ${hasNewGame?'rgba(74,222,128,0.4)':'rgba(255,255,255,0.1)'}`, color:hasNewGame?'#4ade80':'#64748b', borderRadius:20, padding:'8px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>
            {refreshing ? '↻ Updating...' : hasNewGame ? '● Refresh' : '↻ Refresh'}
          </button>
        </div>

        {/* Avatar + name */}
        <div style={{ position:'relative', zIndex:2, textAlign:'center', padding:'20px 16px 0' }}>
          <div style={{ position:'relative', display:'inline-block', marginBottom:12 }}>
            <div style={{ width:88, height:88, borderRadius:'50%', overflow:'hidden', border:`3px solid ${level.aura}`, margin:'0 auto', background:'#1a2a1a', boxShadow:`0 0 32px ${level.glow}`, animation:'float 3s ease-in-out infinite' }}>
              <img src={player.profile_pic || getAvatarUrl(playerId)} alt={player.display_name} width={88} height={88} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{ e.target.onerror=null; e.target.src=getAvatarUrl(playerId) }}/>
            </div>
            {/* Camera upload button — own profile only */}
            {isOwnProfile && (
              <label style={{ position:'absolute', bottom:2, right:2, width:28, height:28, borderRadius:'50%', background:'#060d14', border:`2px solid ${level.aura}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:13, zIndex:10, boxShadow:`0 0 8px ${level.glow}` }} title="Upload photo">
                {uploadingPhoto ? '⏳' : '📷'}
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoUpload}/>
              </label>
            )}
            {level.tier>=4 && <div style={{ position:'absolute', inset:-6, borderRadius:'50%', border:`1.5px solid ${level.aura}`, borderTopColor:'transparent', borderRightColor:'transparent', animation:'spin-ring 3s linear infinite' }}/>}
          </div>

          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:34, letterSpacing:3, color:'#ffffff', lineHeight:1, marginBottom:6, textShadow:`0 0 20px ${level.aura}44` }}>
            {player.display_name}
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            {player.role === 'admin' && <span style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20, background:'rgba(255,215,0,0.15)', color:'#ffd700', border:'1px solid rgba(255,215,0,0.35)', fontFamily:"'Rajdhani',sans-serif", letterSpacing:1 }}>👑 ADMIN</span>}
            <span style={{ fontSize:13, fontWeight:700, padding:'5px 14px', borderRadius:20, background:`${level.aura}22`, color:level.aura, border:`1.5px solid ${level.aura}55`, fontFamily:"'Rajdhani',sans-serif", letterSpacing:1 }}>
              {level.emoji} {level.name}
            </span>
            <span style={{ fontSize:12, color:'#64748b', fontFamily:"'Rajdhani',sans-serif" }}>{getCharacterName(playerId)}</span>
          </div>

          {/* Recent form dots */}
          {recentForm.length>0 && (
            <div style={{ display:'flex', gap:4, justifyContent:'center', marginBottom:0, flexWrap:'wrap' }}>
              {recentForm.map((r,i) => (
                <div key={i} style={{ width:26, height:26, borderRadius:'50%', background:r==='W'?'rgba(74,222,128,0.18)':'rgba(248,113,113,0.18)', border:`1px solid ${r==='W'?'#4ade80':'#f87171'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, fontFamily:"'Bebas Neue',sans-serif", color:r==='W'?'#4ade80':'#f87171' }}>{r}</div>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div style={{ position:'relative', zIndex:2, display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:5, padding:'12px 14px 0' }}>
          {[
            { label:'GAMES',   val:player.total_games||0,  color:'#93c5fd' },
            { label:'WINS',    val:player.total_wins||0,   color:'#4ade80' },
            { label:'WIN %',   val:`${winPct}%`,            color:level.aura },
            { label:'STREAK',  val:`🔥${player.best_streak||0}`, color:'#fb923c' },
            { label:'DAYS MTH',val:daysThisMonth,           color:'#a78bfa' },
          ].map(s => (
            <div key={s.label} className="stat-box">
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:s.color, lineHeight:1, textShadow:`0 0 10px ${s.color}44` }}>{s.val}</div>
              <div style={{ fontSize:8, color:'#94a3b8', fontFamily:"'Rajdhani',sans-serif", letterSpacing:0.5, fontWeight:600, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rating Cards ── */}
      {(()=>{
        const dR = player.rating_doubles||1000, sR = player.rating_singles||1000
        const dG = player.rating_doubles_games||0, sG = player.rating_singles_games||0
        const dT = getRatingTier(dR), sT = getRatingTier(sR)
        return (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:'12px 14px' }}>
            {[{label:'DOUBLES RATING',r:dR,g:dG,t:dT},{label:'SINGLES RATING',r:sR,g:sG,t:sT}].map(x=>(
              <div key={x.label} style={{ background:'rgba(0,0,0,0.4)', borderRadius:12, padding:'10px 12px', border:`1px solid ${x.t.color}25` }}>
                <div style={{ fontSize:9, color:'#475569', letterSpacing:1.5, fontWeight:700, marginBottom:3, fontFamily:"'Rajdhani',sans-serif" }}>{x.label}</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:x.t.color, lineHeight:1 }}>{isCalibrating(x.g)?'?':x.r}</div>
                <div style={{ fontSize:10, color:x.t.color, marginTop:3 }}>{x.t.emoji} {x.t.name}{isCalibrating(x.g)?' · 📡 calibrating':''}</div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* ── Tabs ── */}
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', display:'flex', borderBottom:'2px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(t => (
          <button key={t.id} className={`ptab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding:'16px 14px 60px', minHeight:400, width:'100%', boxSizing:'border-box', overflowX:'hidden' }}>

        {/* OVERVIEW */}
        {tab==='overview' && (
          <div key="overview" style={{ animation:'tab-fade 0.25s ease-out' }}>
            <div style={{ fontSize:12, color:'#475569', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:12, fontFamily:"'Rajdhani',sans-serif" }}>Full Stats</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16, width:'100%' }}>
              {[
                { label:'Total Wins',      val:player.total_wins||0,      color:'#4ade80' },
                { label:'Total Losses',    val:player.total_losses||0,    color:'#f87171' },
                { label:'Win Rate',        val:`${winPct}%`,               color:level.aura },
                { label:'Best Streak',     val:player.best_streak||0,     color:'#fb923c' },
                { label:'Points Scored',   val:player.points_scored||0,   color:'#4ade80' },
                { label:'Points Conceded', val:player.points_conceded||0, color:'#f87171' },
                { label:'Point Diff',      val:(ptDiff>=0?'+':'')+ptDiff, color:ptDiff>=0?'#4ade80':'#f87171' },
                { label:'Current Streak',  val:player.current_streak||0,  color:'#fb923c' },
              ].map(s => (
                <div key={s.label} className="stat-box">
                  <div style={{ fontSize:10, color:'#64748b', letterSpacing:1, marginBottom:4, fontFamily:"'Rajdhani',sans-serif", textTransform:'uppercase' }}>{s.label}</div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:s.color, lineHeight:1 }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Best partner */}
            {partnerData.length>0 && (
              <div className="chart-card">
                <div style={{ fontSize:12, color:'#475569', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:12, fontFamily:"'Rajdhani',sans-serif" }}>🤝 Best Partner</div>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <Av id={Object.entries(partnerMap).sort((a,b)=>b[1].wins-a[1].wins)[0]?.[0]||playerId} size={52} aura={level.aura}/>
                  <div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:2, color:'#f1f5f9' }}>{partnerData[0].label}</div>
                    <div style={{ fontSize:13, color:'#4ade80', fontWeight:600, fontFamily:"'Rajdhani',sans-serif" }}>{partnerData[0].value} wins · {partnerData[0].pct}% win rate</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent games */}
            <div style={{ fontSize:12, color:'#475569', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:12, fontFamily:"'Rajdhani',sans-serif" }}>Recent Games</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {games.slice(-8).reverse().map(g => {
                const inA=g.team_a_ids?.includes(playerId)
                const won=g.winner_team===(inA?'A':'B')
                const own=inA?g.score_a:g.score_b, opp=inA?g.score_b:g.score_a
                return (
                  <div key={g.id} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.02)', border:`1px solid ${won?'rgba(74,222,128,0.15)':'rgba(248,113,113,0.1)'}`, borderRadius:12, padding:'10px 12px', width:'100%', boxSizing:'border-box' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:won?'rgba(74,222,128,0.15)':'rgba(248,113,113,0.15)', border:`1px solid ${won?'#4ade80':'#f87171'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, fontFamily:"'Bebas Neue',sans-serif", color:won?'#4ade80':'#f87171', flexShrink:0 }}>{won?'W':'L'}</div>
                    <div style={{ flex:1, fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#f1f5f9', letterSpacing:2 }}>{own} — {opp}</div>
                    <div style={{ fontSize:11, color:'#334155', fontFamily:"'Rajdhani',sans-serif" }}>{new Date(g.played_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
                  </div>
                )
              })}
              {!games.length && <div style={{ textAlign:'center', color:'#334155', padding:24, fontSize:14, fontFamily:"'Rajdhani',sans-serif" }}>No games yet</div>}
            </div>
          </div>
        )}

        {/* CHARTS */}
        {tab==='charts' && (
          <div key="charts" style={{ animation:'tab-fade 0.25s ease-out' }}>
            <div className="chart-card">
              <div style={{ fontSize:12, color:'#475569', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:4, fontFamily:"'Rajdhani',sans-serif" }}>📈 Wins Over Time</div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:12, fontFamily:"'Rajdhani',sans-serif" }}>Cumulative wins across all games</div>
              <LineChart data={winsOverTime} color={level.aura} height={90}/>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                <span style={{ fontSize:10, color:'#334155', fontFamily:"'Rajdhani',sans-serif" }}>First game</span>
                <span style={{ fontSize:10, color:'#334155', fontFamily:"'Rajdhani',sans-serif" }}>Latest</span>
              </div>
            </div>
            <div className="chart-card">
              <div style={{ fontSize:12, color:'#475569', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:4, fontFamily:"'Rajdhani',sans-serif" }}>🤝 Wins By Partner</div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:14, fontFamily:"'Rajdhani',sans-serif" }}>Wins with each teammate</div>
              <BarChart items={partnerData} color={level.aura}/>
            </div>
            <div className="chart-card">
              <div style={{ fontSize:12, color:'#475569', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:4, fontFamily:"'Rajdhani',sans-serif" }}>📊 Score Margins · Last 15</div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:12, fontFamily:"'Rajdhani',sans-serif" }}>Green = win · Red = loss</div>
              <MarginChart games={games} playerId={playerId}/>
              <div style={{ display:'flex', gap:16, marginTop:10 }}>
                {[{c:'#4ade80',l:'Win'},{c:'#f87171',l:'Loss'}].map(s=>(
                  <div key={s.l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:10, height:10, borderRadius:2, background:s.c }}/>
                    <span style={{ fontSize:11, color:'#475569', fontFamily:"'Rajdhani',sans-serif" }}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* H2H */}
        {tab==='h2h' && (
          <div key="h2h" style={{ animation:'tab-fade 0.25s ease-out' }}>
            {!h2hData.length && (
              <div style={{ textAlign:'center', color:'#334155', padding:48 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>⚔️</div>
                <div style={{ fontSize:14, fontFamily:"'Rajdhani',sans-serif" }}>No head-to-head data yet</div>
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {h2hData.map((h,i) => {
                const pct=h.total>0?Math.round((h.wins/h.total)*100):0
                const color=pct>=50?'#4ade80':'#f87171'
                return (
                  <div key={i} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${pct>=50?'rgba(74,222,128,0.15)':'rgba(248,113,113,0.1)'}`, borderRadius:14, padding:'12px 14px', width:'100%', boxSizing:'border-box' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                      <Av id={h.pid} size={42} aura={color}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:1.5, color:'#f1f5f9' }}>vs {h.name}</div>
                        <div style={{ fontSize:12, color:'#475569', fontFamily:"'Rajdhani',sans-serif" }}>{h.total} games played</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color, lineHeight:1 }}>{pct}%</div>
                        <div style={{ fontSize:10, color:'#475569', fontFamily:"'Rajdhani',sans-serif" }}>win rate</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', height:8, borderRadius:4, overflow:'hidden', gap:1 }}>
                      <div style={{ width:`${pct}%`, background:'#4ade80', borderRadius:'4px 0 0 4px', minWidth:pct>0?4:0 }}/>
                      <div style={{ flex:1, background:'#f87171', borderRadius:'0 4px 4px 0' }}/>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                      <span style={{ fontSize:12, color:'#4ade80', fontWeight:700, fontFamily:"'Rajdhani',sans-serif" }}>{h.wins}W</span>
                      <span style={{ fontSize:12, color:'#f87171', fontWeight:700, fontFamily:"'Rajdhani',sans-serif" }}>{h.losses}L</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SKILLS */}
        {tab==='skills' && (
          <div key="skills" style={{ animation:'tab-fade 0.25s ease-out' }}>
            <div style={{ fontSize:12, color:'#475569', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:16, fontFamily:"'Rajdhani',sans-serif" }}>
              Strengths & Weaknesses
            </div>

            {(() => {
              // Count each skill from real data
              const counts = {}
              skills.forEach(s => { counts[s.skill_key] = (counts[s.skill_key]||0)+1 })
              const maxCount = Math.max(...Object.values(counts), 1)
              const skillKeys  = ['bullet_smash','killer_drop','service_streak']
              const flawKeys   = ['unforced_error','nervous_net','forced_out']
              const skillsMeta = {
                bullet_smash:   { label:'Bullet Smash',   icon:'💥' },
                killer_drop:    { label:'Killer Drop',    icon:'🎯' },
                service_streak: { label:'Service Streak', icon:'🔥' },
                unforced_error: { label:'Unforced Error', icon:'😬' },
                nervous_net:    { label:'Nervous Net',    icon:'😰' },
                forced_out:     { label:'Forced Out',     icon:'💨' },
              }
              const total = skills.length
              return (
                <>
                  {/* Summary chip */}
                  {total > 0 && (
                    <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                      <div style={{ background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:20, padding:'5px 14px', fontSize:12, color:'#4ade80', fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>
                        ⚡ {skillKeys.reduce((a,k)=>a+(counts[k]||0),0)} Skills tagged
                      </div>
                      <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:20, padding:'5px 14px', fontSize:12, color:'#f87171', fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>
                        ⚠️ {flawKeys.reduce((a,k)=>a+(counts[k]||0),0)} Flaws tagged
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  <div className="chart-card" style={{ marginBottom:14 }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#4ade80', letterSpacing:2, marginBottom:12 }}>⚡ SKILLS</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {skillKeys.map(key => {
                        const meta = skillsMeta[key]
                        const count = counts[key]||0
                        const pct = Math.min((count/Math.max(maxCount,1))*100, 100)
                        return (
                          <div key={key} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:count>0?'rgba(74,222,128,0.06)':'rgba(255,255,255,0.02)', border:`1px solid ${count>0?'rgba(74,222,128,0.2)':'rgba(255,255,255,0.06)'}`, borderRadius:12, transition:'all 0.3s' }}>
                            <span style={{ fontSize:22, flexShrink:0 }}>{meta.icon}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                                <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700, color:count>0?'#f1f5f9':'#475569' }}>{meta.label}</span>
                                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:count>0?'#4ade80':'#334155', letterSpacing:1 }}>{count}x</span>
                              </div>
                              <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
                                <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#4ade8077,#4ade80)', borderRadius:2, transition:'width 0.8s ease' }}/>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Flaws */}
                  <div className="chart-card">
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#f87171', letterSpacing:2, marginBottom:12 }}>⚠️ FLAWS</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {flawKeys.map(key => {
                        const meta = skillsMeta[key]
                        const count = counts[key]||0
                        const pct = Math.min((count/Math.max(maxCount,1))*100, 100)
                        return (
                          <div key={key} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:count>0?'rgba(248,113,113,0.06)':'rgba(255,255,255,0.02)', border:`1px solid ${count>0?'rgba(248,113,113,0.2)':'rgba(255,255,255,0.06)'}`, borderRadius:12, transition:'all 0.3s' }}>
                            <span style={{ fontSize:22, flexShrink:0 }}>{meta.icon}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                                <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700, color:count>0?'#f1f5f9':'#475569' }}>{meta.label}</span>
                                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:count>0?'#f87171':'#334155', letterSpacing:1 }}>{count}x</span>
                              </div>
                              <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
                                <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#f8717177,#f87171)', borderRadius:2, transition:'width 0.8s ease' }}/>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {total === 0 && (
                      <div style={{ marginTop:12, padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)', textAlign:'center' }}>
                        <div style={{ fontSize:12, color:'#334155', fontFamily:"'Rajdhani',sans-serif" }}>
                          No skills tagged yet — referee can add them after each game
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}