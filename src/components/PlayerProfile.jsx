// src/components/PlayerProfile.jsx — v2 with refresh + toast
import { useState } from 'react'
import { usePlayerProfile } from '../hooks/usePlayerProfile'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&family=Teko:wght@300;400;500;600;700&display=swap');`

function getLevel(wins) {
  if (wins >= 50) return { name:'LEGEND',    tier:5, aura:'#ffd700', bg:'#2a1f00', glow:'rgba(255,215,0,0.4)',   emoji:'👑' }
  if (wins >= 30) return { name:'ELITE',     tier:4, aura:'#c084fc', bg:'#1a0f2e', glow:'rgba(192,132,252,0.4)', emoji:'⚡' }
  if (wins >= 15) return { name:'SMASH PRO', tier:3, aura:'#38bdf8', bg:'#001f2e', glow:'rgba(56,189,248,0.4)',  emoji:'🔥' }
  if (wins >= 5)  return { name:'CONTENDER', tier:2, aura:'#4ade80', bg:'#001a0f', glow:'rgba(74,222,128,0.35)', emoji:'⚔️' }
  return            { name:'ROOKIE',     tier:1, aura:'#94a3b8', bg:'#111827', glow:'rgba(148,163,184,0.2)', emoji:'🎯' }
}

// ── Toast component ──────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null
  const isGreen = toast.type === 'green'
  return (
    <div style={{
      position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 999,
      background: isGreen ? 'rgba(20,83,45,0.95)' : 'rgba(15,23,42,0.95)',
      border: `1px solid ${isGreen ? '#4ade80' : '#334155'}`,
      borderRadius: 50, padding: '10px 20px',
      fontSize: 13, fontWeight: 600, color: isGreen ? '#4ade80' : '#94a3b8',
      fontFamily: "'Rajdhani', sans-serif", letterSpacing: 0.5,
      boxShadow: isGreen ? '0 4px 24px rgba(74,222,128,0.25)' : '0 4px 24px rgba(0,0,0,0.5)',
      whiteSpace: 'nowrap',
      animation: 'toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
    }}>
      {toast.msg}
    </div>
  )
}

// ── Stat box with flash animation ────────────────────────────
function StatBox({ label, val, color, flash }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      border: `1px solid ${flash ? color + '66' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 12, padding: '12px 14px',
      transition: 'border 0.4s',
      animation: flash ? 'stat-flash 0.6s ease-out' : 'none',
    }}>
      <div style={{ fontSize: 10, color: '#475569', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 24, color, fontWeight: 600, lineHeight: 1 }}>{val}</div>
    </div>
  )
}

// ── SVG Line chart ────────────────────────────────────────────
function LineChart({ data, color, height = 80 }) {
  if (!data || data.length < 2) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 12 }}>
      Not enough data yet
    </div>
  )
  const w = 300, h = height
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 10) - 5
    return `${x},${y}`
  })
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`lg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`} fill={`url(#lg-${color.replace('#','')})`}/>
      <path d={`M ${pts.join(' L ')}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - ((v - min) / range) * (h - 10) - 5
        return <circle key={i} cx={x} cy={y} r="3" fill={color} opacity="0.8"/>
      })}
    </svg>
  )
}

// ── Bar chart ─────────────────────────────────────────────────
function BarChart({ items, color }) {
  if (!items || items.length === 0) return (
    <div style={{ color: '#334155', fontSize: 12, textAlign: 'center', padding: 16 }}>No partner data yet</div>
  )
  const max = Math.max(...items.map(i => i.value)) || 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{item.label}</span>
            <span style={{ fontSize: 13, color, fontFamily: "'Teko', sans-serif" }}>{item.value}W · {item.pct}%</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${(item.value / max) * 100}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, transition: 'width 0.8s ease' }}/>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Margin chart ──────────────────────────────────────────────
function MarginChart({ games, playerId }) {
  if (!games || games.length === 0) return (
    <div style={{ color: '#334155', fontSize: 12, textAlign: 'center', padding: 16 }}>No games yet</div>
  )
  const margins = games.slice(-15).map(g => {
    const inA = g.team_a_ids?.includes(playerId)
    const own = inA ? g.score_a : g.score_b
    const opp = inA ? g.score_b : g.score_a
    const won = g.winner_team === (inA ? 'A' : 'B')
    return { margin: own - opp, won }
  })
  const maxM = Math.max(...margins.map(m => Math.abs(m.margin))) || 1
  const w = 300, h = 80, midY = h / 2
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <line x1="0" y1={midY} x2={w} y2={midY} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="4" y={midY - 4} fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Rajdhani">WIN</text>
      <text x="4" y={midY + 12} fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Rajdhani">LOSS</text>
      {margins.map((m, i) => {
        const x = ((i + 0.5) / margins.length) * w
        const barH = Math.max(4, (Math.abs(m.margin) / maxM) * (midY - 8))
        const y = m.won ? midY - barH : midY
        return <rect key={i} x={x - 6} y={y} width={12} height={barH} rx={3} fill={m.won ? '#4ade80' : '#f87171'} opacity="0.85"/>
      })}
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────
export default function PlayerProfile({ playerId, onBack }) {
  const {
    player, games, allPlayers,
    loading, refreshing,
    toast, hasNewGame,
    refresh,
  } = usePlayerProfile(playerId)

  const [tab, setTab] = useState('overview')

  if (loading || !player) return (
    <div style={{ minHeight: '100vh', background: '#060d14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 3 }}>
      LOADING...
    </div>
  )

  const level    = getLevel(player.total_wins || 0)
  const winPct   = player.total_games > 0 ? Math.round((player.total_wins / player.total_games) * 100) : 0
  const ptDiff   = (player.points_scored || 0) - (player.points_conceded || 0)
  const playerMap = Object.fromEntries(allPlayers.map(p => [p.id, p]))

  // Derived data
  let cumWins = 0
  const winsOverTime = games.map(g => {
    const inA = g.team_a_ids?.includes(playerId)
    if (g.winner_team === (inA ? 'A' : 'B')) cumWins++
    return cumWins
  })

  const partnerMap = {}
  games.forEach(g => {
    const inA = g.team_a_ids?.includes(playerId)
    const won = g.winner_team === (inA ? 'A' : 'B')
    const teammates = inA ? g.team_a_ids : g.team_b_ids
    teammates?.forEach(pid => {
      if (pid === playerId) return
      if (!partnerMap[pid]) partnerMap[pid] = { wins: 0, games: 0 }
      partnerMap[pid].games++
      if (won) partnerMap[pid].wins++
    })
  })
  const partnerData = Object.entries(partnerMap)
    .map(([pid, s]) => ({ label: playerMap[pid]?.display_name || '?', value: s.wins, pct: Math.round((s.wins / s.games) * 100) }))
    .sort((a, b) => b.value - a.value).slice(0, 5)

  const recentForm = games.slice(-10).map(g => {
    const inA = g.team_a_ids?.includes(playerId)
    return g.winner_team === (inA ? 'A' : 'B') ? 'W' : 'L'
  })

  const h2hMap = {}
  games.forEach(g => {
    const inA = g.team_a_ids?.includes(playerId)
    const won = g.winner_team === (inA ? 'A' : 'B')
    const opponents = inA ? g.team_b_ids : g.team_a_ids
    opponents?.forEach(pid => {
      if (!h2hMap[pid]) h2hMap[pid] = { wins: 0, losses: 0 }
      if (won) h2hMap[pid].wins++; else h2hMap[pid].losses++
    })
  })
  const h2hData = Object.entries(h2hMap)
    .map(([pid, s]) => ({ name: playerMap[pid]?.display_name || '?', ...s, total: s.wins + s.losses }))
    .sort((a, b) => b.total - a.total)

  return (
    <div style={{ minHeight: '100vh', background: '#060d14', fontFamily: "'Rajdhani', sans-serif", color: '#f1f5f9', paddingBottom: 40 }}>
      <style>{`
        ${FONTS}
        @keyframes toast-in { from{opacity:0;transform:translateX(-50%) translateY(-12px) scale(0.9)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
        @keyframes stat-flash { 0%{background:rgba(74,222,128,0.2)} 100%{background:rgba(0,0,0,0.4)} }
        @keyframes spin-ring { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes profile-in { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.8)} }
        .profile-tab { background:none; border:none; color:#475569; font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:700; letter-spacing:1.5px; padding:10px 14px; cursor:pointer; border-bottom:2px solid transparent; transition:all 0.2s; text-transform:uppercase; white-space:nowrap; }
        .profile-tab.active { color:#4ade80; border-bottom-color:#4ade80; }
        .chart-card { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:18px; margin-bottom:14px; }
        .refresh-btn { display:flex; align-items:center; gap:6px; background:rgba(74,222,128,0.08); border:1px solid rgba(74,222,128,0.25); color:#4ade80; font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:700; letter-spacing:1px; padding:7px 14px; border-radius:20px; cursor:pointer; transition:all 0.2s; }
        .refresh-btn:hover { background:rgba(74,222,128,0.15); }
        .refresh-btn.has-new { border-color:#4ade80; animation:pulse-dot 1.5s ease-in-out infinite; box-shadow:0 0 12px rgba(74,222,128,0.3); }
      `}</style>

      {/* Toast */}
      <Toast toast={toast}/>

      {/* Hero header */}
      <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(180deg, ${level.bg} 0%, #060d14 100%)`, padding: '0 0 20px', animation: 'profile-in 0.35s ease-out' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06 }}>
          <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
            <rect x="20" y="20" width="360" height="180" fill="none" stroke="#4ade80" strokeWidth="1"/>
            <line x1="200" y1="20" x2="200" y2="200" stroke="#4ade80" strokeWidth="1.5"/>
            <line x1="20" y1="110" x2="380" y2="110" stroke="#4ade80" strokeWidth="2"/>
          </svg>
        </div>

        {/* Top bar: back + refresh */}
        <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600 }}>
            ← Back
          </button>

          {/* Refresh button — glows when new game detected */}
          <button
            className={`refresh-btn${hasNewGame ? ' has-new' : ''}`}
            onClick={refresh}
            disabled={refreshing}
          >
            {refreshing
              ? <span style={{ display: 'inline-block', animation: 'spin-ring 0.8s linear infinite' }}>↻</span>
              : '↻'}
            {refreshing ? 'Updating...' : hasNewGame ? 'New game! Refresh' : 'Refresh'}
            {/* Live dot */}
            {hasNewGame && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', animation: 'pulse-dot 1s ease-in-out infinite', display: 'inline-block', marginLeft: 2 }}/>
            )}
          </button>
        </div>

        {/* Avatar */}
        <div style={{ textAlign: 'center', padding: '20px 20px 0', position: 'relative' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', margin: '0 auto', background: `radial-gradient(circle at 35% 35%, ${level.aura}44, ${level.aura}11)`, border: `3px solid ${level.aura}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontFamily: "'Bebas Neue', sans-serif", color: level.aura, boxShadow: `0 0 40px ${level.glow}`, animation: 'float 3s ease-in-out infinite' }}>
              {player.display_name.charAt(0)}
            </div>
            {level.tier >= 4 && (
              <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `2px solid ${level.aura}`, borderTopColor: 'transparent', borderRightColor: 'transparent', animation: 'spin-ring 3s linear infinite' }}/>
            )}
          </div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3, color: '#f1f5f9', lineHeight: 1 }}>{player.display_name}</div>
          <div style={{ fontSize: 13, color: level.aura, letterSpacing: 2, fontWeight: 700, marginTop: 4 }}>{level.emoji} {level.name}</div>

          {/* Recent form */}
          {recentForm.length > 0 && (
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              {recentForm.map((r, i) => (
                <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: r==='W'?'rgba(74,222,128,0.2)':'rgba(248,113,113,0.2)', border: `1px solid ${r==='W'?'#4ade80':'#f87171'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: "'Bebas Neue', sans-serif", color: r==='W'?'#4ade80':'#f87171' }}>{r}</div>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '20px 16px 0' }}>
          {[
            { label:'Wins',   val:player.total_wins||0,  color:'#4ade80' },
            { label:'Games',  val:player.total_games||0, color:'#60a5fa' },
            { label:'Win %',  val:`${winPct}%`,           color:level.aura },
            { label:'Streak', val:`🔥${player.current_streak||0}`, color:'#f97316' },
          ].map(s => (
            <StatBox key={s.label} label={s.label} val={s.val} color={s.color} flash={refreshing}/>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 16px', overflowX: 'auto' }}>
        {[
          { id:'overview', label:'📊 Overview' },
          { id:'charts',   label:'📈 Charts' },
          { id:'h2h',      label:'⚔️ Head-to-Head' },
        ].map(t => (
          <button key={t.id} className={`profile-tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div style={{ animation:'profile-in 0.3s ease-out' }}>
            <div style={{ fontSize:11, color:'#334155', letterSpacing:2, textTransform:'uppercase', marginBottom:12, fontWeight:700 }}>Full Stats</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
              {[
                { label:'Total Wins',      val:player.total_wins||0,      color:'#4ade80' },
                { label:'Total Losses',    val:player.total_losses||0,    color:'#f87171' },
                { label:'Win Rate',        val:`${winPct}%`,               color:level.aura },
                { label:'Best Streak',     val:player.best_streak||0,     color:'#f97316' },
                { label:'Points Scored',   val:player.points_scored||0,   color:'#4ade80' },
                { label:'Points Conceded', val:player.points_conceded||0, color:'#f87171' },
                { label:'Point Diff',      val:(ptDiff>0?'+':'')+ptDiff,  color:ptDiff>=0?'#4ade80':'#f87171' },
                { label:'Current Streak',  val:player.current_streak||0,  color:'#f97316' },
              ].map(s => <StatBox key={s.label} {...s} flash={refreshing}/>)}
            </div>

            {partnerData.length > 0 && (
              <div className="chart-card">
                <div style={{ fontSize:11, color:'#475569', letterSpacing:2, textTransform:'uppercase', marginBottom:12, fontWeight:700 }}>🤝 Best Partner</div>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:52, height:52, borderRadius:'50%', flexShrink:0, background:`${level.aura}18`, border:`2px solid ${level.aura}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontFamily:"'Bebas Neue', sans-serif", color:level.aura }}>
                    {partnerData[0].label.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:22, letterSpacing:2, color:'#f1f5f9' }}>{partnerData[0].label}</div>
                    <div style={{ fontSize:13, color:'#4ade80', fontWeight:600 }}>{partnerData[0].value} wins · {partnerData[0].pct}% win rate</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ fontSize:11, color:'#334155', letterSpacing:2, textTransform:'uppercase', marginBottom:12, fontWeight:700 }}>Recent Games</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {games.slice(-8).reverse().map(g => {
                const inA = g.team_a_ids?.includes(playerId)
                const won = g.winner_team === (inA ? 'A' : 'B')
                const own = inA ? g.score_a : g.score_b
                const opp = inA ? g.score_b : g.score_a
                return (
                  <div key={g.id} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.02)', border:`1px solid ${won?'rgba(74,222,128,0.15)':'rgba(248,113,113,0.1)'}`, borderRadius:12, padding:'10px 14px' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, background:won?'rgba(74,222,128,0.15)':'rgba(248,113,113,0.15)', border:`1px solid ${won?'#4ade80':'#f87171'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, fontFamily:"'Bebas Neue', sans-serif", color:won?'#4ade80':'#f87171' }}>{won?'W':'L'}</div>
                    <div style={{ flex:1, fontFamily:"'Teko', sans-serif", fontSize:20, color:'#f1f5f9', letterSpacing:2 }}>{own} — {opp}</div>
                    <div style={{ fontSize:11, color:'#334155' }}>{new Date(g.played_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
                  </div>
                )
              })}
              {games.length === 0 && <div style={{ textAlign:'center', color:'#334155', padding:24, fontSize:13 }}>No games yet</div>}
            </div>
          </div>
        )}

        {/* CHARTS */}
        {tab === 'charts' && (
          <div style={{ animation:'profile-in 0.3s ease-out' }}>
            <div className="chart-card">
              <div style={{ fontSize:11, color:'#475569', letterSpacing:2, textTransform:'uppercase', marginBottom:4, fontWeight:700 }}>📈 Cumulative Wins Over Time</div>
              <div style={{ fontSize:12, color:'#334155', marginBottom:12 }}>Each dot = one game played</div>
              <LineChart data={winsOverTime} color={level.aura} height={90}/>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                <span style={{ fontSize:10, color:'#334155' }}>First game</span>
                <span style={{ fontSize:10, color:'#334155' }}>Latest</span>
              </div>
            </div>

            <div className="chart-card">
              <div style={{ fontSize:11, color:'#475569', letterSpacing:2, textTransform:'uppercase', marginBottom:4, fontWeight:700 }}>🤝 Wins By Partner</div>
              <div style={{ fontSize:12, color:'#334155', marginBottom:14 }}>Wins with each teammate</div>
              <BarChart items={partnerData} color={level.aura}/>
            </div>

            <div className="chart-card">
              <div style={{ fontSize:11, color:'#475569', letterSpacing:2, textTransform:'uppercase', marginBottom:4, fontWeight:700 }}>📊 Score Margins (Last 15)</div>
              <div style={{ fontSize:12, color:'#334155', marginBottom:12 }}>Green = win · Red = loss</div>
              <MarginChart games={games} playerId={playerId}/>
              <div style={{ display:'flex', gap:16, marginTop:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:10, height:10, borderRadius:2, background:'#4ade80' }}/><span style={{ fontSize:11, color:'#475569' }}>Win</span></div>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:10, height:10, borderRadius:2, background:'#f87171' }}/><span style={{ fontSize:11, color:'#475569' }}>Loss</span></div>
              </div>
            </div>
          </div>
        )}

        {/* H2H */}
        {tab === 'h2h' && (
          <div style={{ animation:'profile-in 0.3s ease-out' }}>
            {h2hData.length === 0 && (
              <div style={{ textAlign:'center', color:'#334155', padding:48 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>⚔️</div>
                <div style={{ fontSize:13 }}>No head-to-head data yet</div>
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {h2hData.map((h, i) => {
                const pct = h.total > 0 ? Math.round((h.wins / h.total) * 100) : 0
                const color = pct >= 50 ? '#4ade80' : '#f87171'
                return (
                  <div key={i} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${pct>=50?'rgba(74,222,128,0.15)':'rgba(248,113,113,0.1)'}`, borderRadius:14, padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                      <div style={{ width:40, height:40, borderRadius:'50%', flexShrink:0, background:`${color}18`, border:`1.5px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontFamily:"'Bebas Neue', sans-serif", color }}>{h.name.charAt(0)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:20, letterSpacing:1.5, color:'#f1f5f9' }}>vs {h.name}</div>
                        <div style={{ fontSize:12, color:'#475569' }}>{h.total} games</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontFamily:"'Teko', sans-serif", fontSize:28, color, lineHeight:1 }}>{pct}%</div>
                        <div style={{ fontSize:10, color:'#475569' }}>win rate</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', height:8, borderRadius:4, overflow:'hidden', gap:1 }}>
                      <div style={{ width:`${pct}%`, background:'#4ade80', borderRadius:'4px 0 0 4px', minWidth:pct>0?4:0 }}/>
                      <div style={{ flex:1, background:'#f87171', borderRadius:'0 4px 4px 0' }}/>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                      <span style={{ fontSize:11, color:'#4ade80', fontWeight:700 }}>{h.wins}W</span>
                      <span style={{ fontSize:11, color:'#f87171', fontWeight:700 }}>{h.losses}L</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default PlayerProfile