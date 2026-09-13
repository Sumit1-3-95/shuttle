// src/components/GoalsTab.jsx — v2
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { getAvatarUrl } from '../utils/avatars'

const G = '#4ade80'  // green — matches
const B = '#60a5fa'  // blue  — wins

// ── Animated SVG Ring ─────────────────────────────────────────
function Ring({ pct, color, r, sw, cx, cy }) {
  const circ = 2 * Math.PI * r
  const [d, setD] = useState(0)
  useEffect(() => {
    const target = Math.min(1, Math.max(0, pct)) * circ
    let start = null
    function step(ts) {
      if (!start) start = ts
      const prog = Math.min((ts - start) / 800, 1)
      const ease = 1 - Math.pow(1 - prog, 3)
      setD(target * ease)
      if (prog < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [pct])
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${color}15`} strokeWidth={sw}/>
      {d > 0.5 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${d} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter:`drop-shadow(0 0 5px ${color}77)` }}/>
      )}
    </>
  )
}

// ── Compact Today Rings ───────────────────────────────────────
function TodayRings({ mPlayed, wPlayed, mGoal, wGoal }) {
  const SIZE = 160, cx = 80, cy = 80
  const mPct = mGoal > 0 ? mPlayed / mGoal : 0
  const wPct = wGoal > 0 ? wPlayed / wGoal : 0
  const bothMet = mPlayed >= mGoal && wPlayed >= wGoal

  return (
    <div style={{ display:'flex', alignItems:'center', gap:20 }}>
      {/* Rings */}
      <div style={{ position:'relative', width:SIZE, height:SIZE, flexShrink:0 }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ position:'absolute', inset:0 }}>
          <Ring pct={mPct} color={G} r={68} sw={11} cx={cx} cy={cy}/>
          <Ring pct={wPct} color={B} r={48} sw={11} cx={cx} cy={cy}/>
        </svg>
        {/* Center */}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {bothMet
            ? <span style={{ fontSize:28 }}>🏆</span>
            : <div style={{ textAlign:'center', lineHeight:1 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:G }}>{mPlayed}<span style={{ fontSize:11, color:'#334155' }}>/{mGoal}</span></div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:B }}>{wPlayed}<span style={{ fontSize:10, color:'#334155' }}>/{wGoal}</span></div>
              </div>
          }
        </div>
      </div>

      {/* Legend */}
      <div style={{ flex:1 }}>
        {[{c:G,l:'MATCHES',v:`${mPlayed} / ${mGoal}`,pct:Math.round(mPct*100)},{c:B,l:'WINS',v:`${wPlayed} / ${wGoal}`,pct:Math.round(wPct*100)}].map(r=>(
          <div key={r.l} style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:10, color:r.c, fontWeight:700, letterSpacing:1.5 }}>{r.l}</span>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:r.c }}>{r.v}</span>
            </div>
            <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min(100,r.pct)}%`, background:r.c, borderRadius:2, transition:'width 0.8s ease' }}/>
            </div>
          </div>
        ))}
        {bothMet && <div style={{ fontSize:11, color:G, fontWeight:700, letterSpacing:1 }}>🎯 ALL GOALS MET!</div>}
      </div>
    </div>
  )
}

// ── Goal Setup Modal ──────────────────────────────────────────
function GoalSetupModal({ onSave, existing, onClose }) {
  const [matches, setMatches] = useState(Number(existing?.daily_matches_goal) || 2)
  const [wins,    setWins]    = useState(Number(existing?.daily_wins_goal)    || 1)

  function adj(setter, delta, min, max) {
    setter(v => Math.min(max, Math.max(min, Number(v) + delta)))
  }

  function Stepper({ val, onMinus, onPlus, color }) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:20, justifyContent:'center' }}>
        <button onClick={onMinus} style={{ width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', fontSize:22, cursor:'pointer', lineHeight:1 }}>−</button>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:52, color, lineHeight:1, minWidth:52, textAlign:'center' }}>{Number(val)}</div>
        <button onClick={onPlus}  style={{ width:44, height:44, borderRadius:'50%', background:`${color}18`, border:`1px solid ${color}44`, color, fontSize:22, cursor:'pointer', lineHeight:1 }}>+</button>
      </div>
    )
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'flex-end', justifyContent:'center', fontFamily:"'Rajdhani',sans-serif" }}>
      <div style={{ background:'#0a1628', borderRadius:'24px 24px 0 0', padding:'24px 24px 44px', width:'100%', maxWidth:440, border:'1px solid rgba(255,255,255,0.08)', borderBottom:'none', position:'relative' }}>
        {/* Close */}
        {existing && onClose && (
          <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#64748b', borderRadius:'50%', width:34, height:34, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        )}

        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#fff', letterSpacing:3, marginBottom:4 }}>
            {existing ? 'EDIT GOALS' : 'SET YOUR DAILY GOALS'}
          </div>
          <div style={{ fontSize:12, color:'#475569' }}>Changes only affect future tracking — past data stays as-is.</div>
        </div>

        {/* Matches */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, justifyContent:'center' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:G, boxShadow:`0 0 6px ${G}` }}/>
            <span style={{ fontSize:11, color:G, fontWeight:700, letterSpacing:2 }}>DAILY MATCHES GOAL</span>
          </div>
          <Stepper val={matches} color={G}
            onMinus={()=>adj(setMatches,-1,1,10)}
            onPlus={()=>adj(setMatches,1,1,10)}/>
          <div style={{ fontSize:11, color:'#334155', textAlign:'center', marginTop:6 }}>Games to play each day</div>
        </div>

        <div style={{ height:1, background:'rgba(255,255,255,0.06)', marginBottom:20 }}/>

        {/* Wins */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, justifyContent:'center' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:B, boxShadow:`0 0 6px ${B}` }}/>
            <span style={{ fontSize:11, color:B, fontWeight:700, letterSpacing:2 }}>DAILY WINS GOAL</span>
          </div>
          <Stepper val={wins} color={B}
            onMinus={()=>adj(setWins,-1,0,matches)}
            onPlus={()=>adj(setWins,1,0,matches)}/>
          <div style={{ fontSize:11, color:'#334155', textAlign:'center', marginTop:6 }}>Wins per day (0 – {matches})</div>
        </div>

        <button onClick={()=>onSave(Number(matches), Number(wins))}
          style={{ width:'100%', background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', borderRadius:50, padding:'14px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:3 }}>
          {existing ? 'SAVE CHANGES →' : 'START TRACKING →'}
        </button>
      </div>
    </div>
  )
}

// ── Day Circle ────────────────────────────────────────────────
function DayCircle({ day, mPct, wPct, isToday, isFuture, onClick }) {
  const S=34, cx=17, cy=17, r1=13, r2=8, sw=3
  const c1=2*Math.PI*r1, c2=2*Math.PI*r2
  return (
    <div onClick={isFuture?undefined:onClick} style={{ cursor:isFuture?'default':'pointer', position:'relative' }}>
      {isToday && <div style={{ position:'absolute', inset:-3, borderRadius:'50%', border:`2px solid ${G}55`, animation:'pulse-ring 2s ease-in-out infinite' }}/>}
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        <circle cx={cx} cy={cy} r={r1} fill="none" stroke={isFuture?'rgba(255,255,255,0.04)':'rgba(74,222,128,0.1)'} strokeWidth={sw}/>
        {!isFuture && mPct>0 && <circle cx={cx} cy={cy} r={r1} fill="none" stroke={G} strokeWidth={sw} strokeDasharray={`${Math.min(1,mPct)*c1} ${c1}`} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}/>}
        <circle cx={cx} cy={cy} r={r2} fill="none" stroke={isFuture?'rgba(255,255,255,0.04)':'rgba(96,165,250,0.1)'} strokeWidth={sw}/>
        {!isFuture && wPct>0 && <circle cx={cx} cy={cy} r={r2} fill="none" stroke={B} strokeWidth={sw} strokeDasharray={`${Math.min(1,wPct)*c2} ${c2}`} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}/>}
        <text x={cx} y={cy+4} textAnchor="middle" style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:9 }}
          fill={isToday?G:isFuture?'#1e2937':'#475569'}>{day}</text>
      </svg>
    </div>
  )
}

// ── Main GoalsTab ─────────────────────────────────────────────
export default function GoalsTab({ currentUserId, allGames, players }) {
  const [goals,      setGoals]      = useState(null)
  const [showSetup,  setShowSetup]  = useState(false)
  const [dayStats,   setDayStats]   = useState({})
  const [selectedDay,setSelectedDay]= useState(null)
  const [loading,    setLoading]    = useState(true)
  const [viewDate,   setViewDate]   = useState(new Date()) // for month nav

  const now       = new Date()
  const todayStr  = now.toISOString().slice(0,10)
  const playerMap = Object.fromEntries((players||[]).map(p=>[p.id, p]))

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const firstDow    = (new Date(year, month, 1).getDay()+6)%7 // Mon=0
  const monthLabel  = viewDate.toLocaleDateString('en-IN',{month:'long',year:'numeric'}).toUpperCase()

  useEffect(() => { loadGoals() }, [currentUserId])
  useEffect(() => { if (goals) buildDayStats() }, [allGames, goals])

  async function loadGoals() {
    const { data } = await supabase.from('player_goals').select('*').eq('player_id', currentUserId).maybeSingle()
    if (data) setGoals(data)
    else setShowSetup(true)
    setLoading(false)
  }

  function buildDayStats() {
    const my = (allGames||[]).filter(g => g.team_a_ids?.includes(currentUserId)||g.team_b_ids?.includes(currentUserId))
    const stats = {}
    my.forEach(g => {
      const d = g.played_at?.slice(0,10); if (!d) return
      if (!stats[d]) stats[d] = { played:0, wins:0, games:[] }
      stats[d].played++
      stats[d].games.push(g)
      const inA = g.team_a_ids?.includes(currentUserId)
      if (g.winner_team===(inA?'A':'B')) stats[d].wins++
    })
    setDayStats(stats)
  }

  async function saveGoals(m, w) {
    const p = { player_id:currentUserId, daily_matches_goal:Number(m), daily_wins_goal:Number(w), updated_at:new Date().toISOString() }
    // Delete then insert to avoid upsert conflict issues
    await supabase.from('player_goals').delete().eq('player_id', currentUserId)
    const { data: saved } = await supabase.from('player_goals').insert(p).select().single()
    await supabase.from('player_goal_history').insert({ player_id:currentUserId, matches_goal:Number(m), wins_goal:Number(w), effective_from:todayStr })
    setGoals(saved || p)
    setShowSetup(false)
  }

  if (loading) return <div style={{ textAlign:'center', color:'#334155', padding:60, fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:3 }}>LOADING...</div>

  const mGoal = Number(goals?.daily_matches_goal)||2
  const wGoal = Number(goals?.daily_wins_goal)||1
  const todaySt = dayStats[todayStr]||{played:0,wins:0,games:[]}

  // Weekly — last 7 days
  const weekDays = Array.from({length:7},(_,i)=>{
    const d=new Date(now); d.setDate(now.getDate()-6+i)
    const ds=d.toISOString().slice(0,10)
    const st=dayStats[ds]||{played:0,wins:0}
    const past=ds<=todayStr
    const met=past&&st.played>=mGoal&&st.wins>=wGoal
    return {ds,st,past,met,label:d.toLocaleDateString('en-IN',{weekday:'short'}).slice(0,2).toUpperCase()}
  })
  const weekHits=weekDays.filter(d=>d.met).length
  const pastDays=weekDays.filter(d=>d.past).length

  // Streak
  let streak=0
  for(let i=0;i<60;i++){
    const d=new Date(now); d.setDate(now.getDate()-i)
    const ds=d.toISOString().slice(0,10)
    const st=dayStats[ds]||{played:0,wins:0}
    if(st.played>=mGoal&&st.wins>=wGoal) streak++
    else if(ds<todayStr) break
  }

  const selSt = selectedDay ? dayStats[selectedDay] : null

  return (
    <div style={{ fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', paddingBottom:48 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes pulse-ring{0%,100%{opacity:0.3;transform:scale(1)}50%{opacity:0.7;transform:scale(1.1)}}
        ::-webkit-scrollbar{width:0}
      `}</style>

      {showSetup && <GoalSetupModal onSave={saveGoals} existing={goals} onClose={goals?()=>setShowSetup(false):null}/>}

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 16px 12px' }}>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#f1f5f9', letterSpacing:2, lineHeight:1 }}>GOALS</div>
          <div style={{ fontSize:10, color:'#334155', letterSpacing:2, fontWeight:700 }}>
            {now.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'}).toUpperCase()}
          </div>
        </div>
        <button onClick={()=>setShowSetup(true)}
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#475569', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:11, fontWeight:700 }}>
          ✎ EDIT GOALS
        </button>
      </div>

      {/* ── Today rings ── */}
      <div style={{ margin:'0 16px 16px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:'16px' }}>
        <div style={{ fontSize:9, color:'#334155', letterSpacing:2, fontWeight:700, marginBottom:12 }}>TODAY</div>
        <TodayRings mPlayed={todaySt.played} wPlayed={todaySt.wins} mGoal={mGoal} wGoal={wGoal}/>
      </div>

      {/* ── Weekly streak ── */}
      <div style={{ margin:'0 16px 16px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:'14px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <div style={{ fontSize:9, color:'#334155', letterSpacing:2, fontWeight:700, marginBottom:2 }}>THIS WEEK</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#f1f5f9' }}>
              {weekHits}<span style={{ fontSize:12, color:'#334155' }}>/{pastDays} days</span>
            </div>
          </div>
          {streak>0 && (
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:12, padding:'6px 12px' }}>
              <span style={{ fontSize:18 }}>🔥</span>
              <div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#fb923c', lineHeight:1 }}>{streak}</div>
                <div style={{ fontSize:8, color:'#fb923c', letterSpacing:1, fontWeight:700 }}>STREAK</div>
              </div>
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:5 }}>
          {weekDays.map(d=>(
            <div key={d.ds} style={{ flex:1, textAlign:'center' }}>
              <div style={{ width:'100%', aspectRatio:'1', borderRadius:'50%', margin:'0 auto 4px', display:'flex', alignItems:'center', justifyContent:'center',
                background:!d.past?'rgba(255,255,255,0.03)':d.met?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.03)',
                border:`1.5px solid ${!d.past?'rgba(255,255,255,0.05)':d.met?G:'rgba(255,255,255,0.06)'}` }}>
                <span style={{ fontSize:11, color:d.met?G:'#1e293b' }}>{d.met?'✓':''}</span>
              </div>
              <div style={{ fontSize:8, color:'#334155', fontWeight:700 }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Monthly calendar ── */}
      <div style={{ margin:'0 16px 12px' }}>
        {/* Month nav */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <button onClick={()=>setViewDate(d=>{ const n=new Date(d); n.setMonth(n.getMonth()-1); return n })}
            style={{ background:'none', border:'none', color:'#475569', fontSize:18, cursor:'pointer', padding:'4px 8px' }}>‹</button>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:'#94a3b8', letterSpacing:3 }}>{monthLabel}</div>
          <button onClick={()=>setViewDate(d=>{ const n=new Date(d); n.setMonth(n.getMonth()+1); return n })}
            disabled={month>=now.getMonth()&&year>=now.getFullYear()}
            style={{ background:'none', border:'none', color:month>=now.getMonth()&&year>=now.getFullYear()?'#1e293b':'#475569', fontSize:18, cursor:'pointer', padding:'4px 8px' }}>›</button>
        </div>
        {/* DOW labels */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
          {['M','T','W','T','F','S','S'].map((l,i)=>(
            <div key={i} style={{ textAlign:'center', fontSize:8, color:'#1e293b', fontWeight:700 }}>{l}</div>
          ))}
        </div>
        {/* Days */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
          {Array.from({length:firstDow}).map((_,i)=><div key={`e${i}`}/>)}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const day=i+1
            const ds=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const st=dayStats[ds]||{played:0,wins:0}
            const isToday=ds===todayStr, isFuture=ds>todayStr
            return (
              <div key={ds} style={{ display:'flex', justifyContent:'center' }}>
                <DayCircle day={day} mPct={mGoal>0?st.played/mGoal:0} wPct={wGoal>0?st.wins/wGoal:0}
                  isToday={isToday} isFuture={isFuture}
                  onClick={()=>setSelectedDay(selectedDay===ds?null:ds)}/>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Selected day detail ── */}
      {selectedDay && (
        <div style={{ margin:'0 16px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:'14px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#f1f5f9', letterSpacing:1 }}>
                {new Date(selectedDay+'T12:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'}).toUpperCase()}
              </div>
              {selSt && (
                <div style={{ display:'flex', gap:12, marginTop:4 }}>
                  {[{v:selSt.played,l:'PLAYED',c:G},{v:selSt.wins,l:'WINS',c:B},{v:selSt.played-selSt.wins,l:'LOSSES',c:'#f87171'}].map(s=>(
                    <div key={s.l} style={{ display:'flex', gap:4, alignItems:'baseline' }}>
                      <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:s.c }}>{s.v}</span>
                      <span style={{ fontSize:9, color:'#334155', fontWeight:700 }}>{s.l}</span>
                    </div>
                  ))}
                  {/* Goal status */}
                  {selSt.played>0 && (
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20,
                      background: selSt.played>=mGoal&&selSt.wins>=wGoal ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.05)',
                      color: selSt.played>=mGoal&&selSt.wins>=wGoal ? G : '#475569',
                      border: `1px solid ${selSt.played>=mGoal&&selSt.wins>=wGoal?'rgba(74,222,128,0.3)':'rgba(255,255,255,0.08)'}`,
                      fontWeight:700, alignSelf:'center' }}>
                      {selSt.played>=mGoal&&selSt.wins>=wGoal?'🎯 GOAL MET':'IN PROGRESS'}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button onClick={()=>setSelectedDay(null)} style={{ background:'none', border:'none', color:'#334155', cursor:'pointer', fontSize:18 }}>✕</button>
          </div>

          {/* Game list */}
          {selSt?.games?.length > 0 ? (
            <div>
              <div style={{ fontSize:9, color:'#334155', letterSpacing:2, fontWeight:700, marginBottom:8 }}>MATCHES</div>
              {selSt.games.map((g,i)=>{
                const inA = g.team_a_ids?.includes(currentUserId)
                const won = g.winner_team===(inA?'A':'B')
                const myScore  = inA?g.score_a:g.score_b
                const oppScore = inA?g.score_b:g.score_a
                const oppIds   = (inA?g.team_b_ids:g.team_a_ids)||[]
                return (
                  <div key={g.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', marginBottom:6, background:won?'rgba(74,222,128,0.05)':'rgba(248,113,113,0.04)', border:`1px solid ${won?'rgba(74,222,128,0.15)':'rgba(248,113,113,0.1)'}`, borderLeft:`3px solid ${won?G:'#f87171'}`, borderRadius:10 }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, color:won?G:'#f87171', width:14 }}>{won?'W':'L'}</div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#f1f5f9', letterSpacing:2 }}>{myScore}–{oppScore}</div>
                    <div style={{ flex:1, fontSize:11, color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      vs {oppIds.map(id=>playerMap[id]?.display_name?.split(' ')[0]||'?').join(' & ')}
                    </div>
                    <div style={{ fontSize:10, color:'#334155' }}>{g.is_singles?'1v1':'2v2'}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign:'center', color:'#1e293b', fontSize:12, padding:'12px 0' }}>No games on this day</div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ display:'flex', gap:16, padding:'12px 16px 0', justifyContent:'center' }}>
        {[{c:G,l:'MATCHES'},{c:B,l:'WINS'},{c:'rgba(255,255,255,0.1)',l:'NO GAMES'}].map(l=>(
          <div key={l.l} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:20, height:3, borderRadius:2, background:l.c }}/>
            <span style={{ fontSize:8, color:'#334155', fontWeight:700, letterSpacing:1 }}>{l.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}