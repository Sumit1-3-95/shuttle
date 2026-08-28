// src/components/tournaments/CreateTournament.jsx
// 3-step tournament wizard
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { generateMatches, getRecommendedFormat, getTimeSettings } from './tournamentEngine'
import { getAvatarUrl } from '../../utils/avatars'

const COURT_BG = 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80'

const FORMATS = [
  { id:'knockout',       icon:'⚡', name:'Knockout',         desc:'Lose once, you\'re out. Fast & fierce.',      minPlayers:4, color:'#f87171' },
  { id:'round_robin',    icon:'🔄', name:'Round Robin',       desc:'Everyone plays everyone. Fairest format.',   minPlayers:3, color:'#60a5fa' },
  { id:'group_knockout', icon:'🏆', name:'Group + Knockout',  desc:'Groups then knockout finals.',               minPlayers:6, color:'#fbbf24' },
  { id:'king_of_court',  icon:'👑', name:'King of the Court', desc:'Win to stay. Lose to rotate out.',           minPlayers:4, color:'#c084fc' },
]

const TIME_OPTIONS = [
  { mins:60,  label:'1 Hour',   sub:'Quick session', games:'~6 games' },
  { mins:120, label:'2 Hours',  sub:'Standard',      games:'~12 games' },
  { mins:180, label:'3 Hours',  sub:'Full session',  games:'~18 games' },
]

function getLevel(wins) {
  if (wins>=50) return '#ffd700'
  if (wins>=30) return '#c084fc'
  if (wins>=15) return '#38bdf8'
  if (wins>=5)  return '#4ade80'
  return '#94a3b8'
}

export default function CreateTournament({ onBack, onCreated, currentUser, groupId, groupPlayers, groupName }) {
  const [step, setStep]         = useState(1)
  // Step 1
  const [name, setName]         = useState('')
  const [format, setFormat]     = useState(null)
  const [gameType, setGameType] = useState('doubles')
  const [timeMins, setTimeMins] = useState(120)
  // Step 2
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [teams, setTeams]       = useState([]) // [{name, p1, p2}]
  // UI
  const [creating, setCreating] = useState(false)
  const [error, setError]       = useState('')

  const recommended = format ? null : getRecommendedFormat(selectedPlayers.length, timeMins)
  const timeSettings = getTimeSettings(timeMins)
  const isSingles = gameType === 'singles'

  // Auto-name
  useEffect(() => {
    if (!name) setName(`${groupName || 'Court'} ${format ? FORMATS.find(f=>f.id===format)?.name||'' : 'Tournament'}`)
  }, [format])

  function togglePlayer(p) {
    setSelectedPlayers(prev =>
      prev.find(x=>x.id===p.id) ? prev.filter(x=>x.id!==p.id) : [...prev, p]
    )
    setTeams([]) // reset teams on player change
  }

  function autoAssignTeams() {
    const shuffled = [...selectedPlayers].sort(()=>Math.random()-0.5)
    const newTeams = []
    for (let i=0; i<shuffled.length; i+=2) {
      if (shuffled[i+1]) {
        newTeams.push({ name:`Team ${newTeams.length+1}`, p1:shuffled[i], p2:shuffled[i+1] })
      }
    }
    setTeams(newTeams)
  }

  function moveToTeam(player, teamIdx, slot) {
    setTeams(prev => {
      const next = prev.map(t => ({
        ...t,
        p1: t.p1?.id===player.id ? null : t.p1,
        p2: t.p2?.id===player.id ? null : t.p2,
      }))
      if (next[teamIdx]) {
        next[teamIdx] = { ...next[teamIdx], [slot]: player }
      }
      return next
    })
  }

  function addTeamSlot() {
    setTeams(prev => [...prev, { name:`Team ${prev.length+1}`, p1:null, p2:null }])
  }

  function unassignedPlayers() {
    const assigned = new Set(teams.flatMap(t=>[t.p1?.id,t.p2?.id].filter(Boolean)))
    return selectedPlayers.filter(p=>!assigned.has(p.id))
  }

  async function handleCreate() {
    if (!format) { setError('Pick a format'); return }
    if (selectedPlayers.length < 3) { setError('Add at least 3 players'); return }
    if (!isSingles && teams.length < 2) { setError('Set up at least 2 teams'); return }

    setCreating(true); setError('')
    try {
      // 1. Create tournament
      const { data: t, error: tErr } = await supabase.from('tournaments').insert({
        name: name || 'Tournament',
        format, game_type: gameType,
        group_id: groupId,
        time_budget_mins: timeMins,
        target_score: timeSettings.target_score,
        best_of: timeSettings.best_of,
        created_by: currentUser.id,
        status: 'active',
      }).select().single()
      if (tErr) throw tErr

      // 2. Insert players
      await supabase.from('tournament_players').insert(
        selectedPlayers.map((p,i) => ({ tournament_id: t.id, player_id: p.id, seed: i }))
      )

      // 3. Insert teams
      let dbTeams = []
      if (isSingles) {
        const { data: st } = await supabase.from('tournament_teams').insert(
          selectedPlayers.map((p,i) => ({
            tournament_id: t.id, player1_id: p.id,
            name: p.display_name, seed: i,
          }))
        ).select()
        dbTeams = st || []
      } else {
        const { data: dt } = await supabase.from('tournament_teams').insert(
          teams.filter(t=>t.p1).map((team,i) => ({
            tournament_id: t.id,
            player1_id: team.p1?.id, player2_id: team.p2?.id,
            name: team.name, seed: i,
          }))
        ).select()
        dbTeams = dt || []
      }

      // 4. Generate + insert matches
      const matches = generateMatches(dbTeams, format, gameType)
      if (matches.length > 0) {
        await supabase.from('tournament_matches').insert(
          matches.map(m => ({ ...m, tournament_id: t.id }))
        )
      }

      onCreated(t.id)
    } catch(err) {
      setError(err.message || 'Something went wrong')
    }
    setCreating(false)
  }

  const canProceed1 = format && selectedPlayers.length >= (FORMATS.find(f=>f.id===format)?.minPlayers||3)
  const canCreate   = isSingles ? canProceed1 : (canProceed1 && teams.filter(t=>t.p1).length >= 2)

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', overflowY:'auto' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        input:focus{outline:none;border-color:#4ade80!important}
        input::placeholder{color:#334155}
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08)}
      `}</style>

      {/* Hero header */}
      <div style={{ position:'relative', height:160, flexShrink:0, overflow:'hidden' }}>
        <img src={COURT_BG} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(6,13,20,0.5),rgba(6,13,20,1))' }}/>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'0 16px 16px' }}>
          <button onClick={onBack} style={{ position:'absolute', top:14, left:16, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.12)', color:'#94a3b8', borderRadius:20, padding:'5px 12px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700 }}>← Back</button>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:'#fff', letterSpacing:3, lineHeight:1 }}>NEW TOURNAMENT</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', letterSpacing:2, marginTop:3 }}>{groupName?.toUpperCase()||'YOUR COURT'}</div>
        </div>
        {/* Progress */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:'rgba(255,255,255,0.08)' }}>
          <div style={{ height:'100%', width:`${(step/2)*100}%`, background:'#4ade80', transition:'width 0.4s' }}/>
        </div>
      </div>

      <div style={{ padding:'20px 16px 40px' }}>

        {/* ── STEP 1: Setup ── */}
        {step===1 && (
          <div>
            {/* Name */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:10, color:'#475569', letterSpacing:2, fontWeight:700, marginBottom:8 }}>TOURNAMENT NAME</div>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Saturday Smashfest"
                style={{ width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.4)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px 14px', color:'#f1f5f9', fontSize:15, fontFamily:"'Rajdhani',sans-serif" }}/>
            </div>

            {/* Singles / Doubles */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:10, color:'#475569', letterSpacing:2, fontWeight:700, marginBottom:8 }}>GAME TYPE</div>
              <div style={{ display:'flex', gap:8 }}>
                {[{id:'doubles',label:'👥 Doubles',sub:'2v2'},{id:'singles',label:'👤 Singles',sub:'1v1'}].map(g=>(
                  <div key={g.id} onClick={()=>setGameType(g.id)} style={{ flex:1, padding:'12px', borderRadius:14, cursor:'pointer', textAlign:'center',
                    background:gameType===g.id?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.03)',
                    border:gameType===g.id?'1.5px solid rgba(74,222,128,0.4)':'1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:gameType===g.id?'#4ade80':'#94a3b8', letterSpacing:1 }}>{g.label}</div>
                    <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{g.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:10, color:'#475569', letterSpacing:2, fontWeight:700, marginBottom:8 }}>TIME BUDGET</div>
              <div style={{ display:'flex', gap:8 }}>
                {TIME_OPTIONS.map(t=>(
                  <div key={t.mins} onClick={()=>setTimeMins(t.mins)} style={{ flex:1, padding:'12px 6px', borderRadius:14, cursor:'pointer', textAlign:'center',
                    background:timeMins===t.mins?'rgba(96,165,250,0.1)':'rgba(255,255,255,0.03)',
                    border:timeMins===t.mins?'1.5px solid rgba(96,165,250,0.4)':'1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:timeMins===t.mins?'#60a5fa':'#94a3b8', letterSpacing:1 }}>{t.label}</div>
                    <div style={{ fontSize:9, color:'#475569', marginTop:2 }}>{t.games}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Format */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:10, color:'#475569', letterSpacing:2, fontWeight:700, marginBottom:8 }}>FORMAT</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {FORMATS.map(f=>(
                  <div key={f.id} onClick={()=>setFormat(f.id)} style={{ padding:'14px 12px', borderRadius:16, cursor:'pointer', position:'relative',
                    background:format===f.id?`${f.color}12`:'rgba(255,255,255,0.03)',
                    border:format===f.id?`1.5px solid ${f.color}55`:'1px solid rgba(255,255,255,0.08)',
                    borderTop:format===f.id?`2px solid ${f.color}`:'2px solid transparent',
                  }}>
                    <div style={{ fontSize:22, marginBottom:6 }}>{f.icon}</div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:format===f.id?f.color:'#f1f5f9', letterSpacing:1, marginBottom:4 }}>{f.name}</div>
                    <div style={{ fontSize:10, color:'#475569', lineHeight:1.4 }}>{f.desc}</div>
                    <div style={{ fontSize:9, color:'#334155', marginTop:6 }}>Min {f.minPlayers} players</div>
                    {format===f.id && <div style={{ position:'absolute', top:8, right:8, width:8, height:8, borderRadius:'50%', background:f.color }}/>}
                  </div>
                ))}
              </div>
            </div>

            {/* Players */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ fontSize:10, color:'#475569', letterSpacing:2, fontWeight:700 }}>SELECT PLAYERS</div>
                <span style={{ fontSize:11, color:'#4ade80', fontWeight:700 }}>{selectedPlayers.length} selected</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {groupPlayers.map(p => {
                  const sel = !!selectedPlayers.find(x=>x.id===p.id)
                  const aura = getLevel(p.total_wins||0)
                  return (
                    <div key={p.id} onClick={()=>togglePlayer(p)} style={{ padding:'10px 6px', borderRadius:12, cursor:'pointer', textAlign:'center',
                      background:sel?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.02)',
                      border:sel?'1.5px solid rgba(74,222,128,0.4)':'1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ width:38, height:38, borderRadius:'50%', overflow:'hidden', border:`2px solid ${sel?'#4ade80':aura+'66'}`, margin:'0 auto 6px', background:'#1a2a1a' }}>
                        <img src={p.profile_pic||getAvatarUrl(p.id)} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{ e.target.onerror=null; e.target.src=getAvatarUrl(p.id) }}/>
                      </div>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:12, color:sel?'#4ade80':'#94a3b8', letterSpacing:0.5, lineHeight:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.display_name}</div>
                      {sel && <div style={{ fontSize:8, color:'#4ade80', marginTop:2 }}>✓</div>}
                    </div>
                  )
                })}
              </div>
            </div>

            {error && <div style={{ fontSize:12, color:'#f87171', marginBottom:12 }}>⚠ {error}</div>}

            <button onClick={()=>{ if(!canProceed1){ setError('Pick a format and add enough players'); return } if(isSingles){handleCreate()} else {setStep(2); setError('')} }}
              disabled={!format}
              style={{ width:'100%', background:canProceed1?'linear-gradient(135deg,#14532d,#166534)':'rgba(255,255,255,0.05)', border:`1.5px solid ${canProceed1?'#4ade80':'rgba(255,255,255,0.1)'}`, color:canProceed1?'#4ade80':'#334155', borderRadius:50, padding:'14px', fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:2, cursor:canProceed1?'pointer':'not-allowed' }}>
              {isSingles ? (creating?'CREATING...':'CREATE TOURNAMENT →') : 'NEXT: SET TEAMS →'}
            </button>
          </div>
        )}

        {/* ── STEP 2: Teams ── */}
        {step===2 && !isSingles && (
          <div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#f1f5f9', letterSpacing:2, marginBottom:4 }}>SET UP TEAMS</div>
              <div style={{ fontSize:12, color:'#475569' }}>Assign players to teams. Each team needs 2 players.</div>
            </div>

            {/* Auto-assign */}
            <button onClick={autoAssignTeams} style={{ width:'100%', background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.25)', color:'#60a5fa', borderRadius:12, padding:'10px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:13, letterSpacing:1, marginBottom:16 }}>
              🎲 RANDOM SHUFFLE
            </button>

            {/* Team slots */}
            {teams.map((team, ti) => (
              <div key={ti} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'14px', marginBottom:10 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:'#fbbf24', letterSpacing:2, marginBottom:10 }}>{team.name}</div>
                <div style={{ display:'flex', gap:8 }}>
                  {['p1','p2'].map(slot => (
                    <div key={slot} style={{ flex:1, background:'rgba(0,0,0,0.3)', border:'1px dashed rgba(255,255,255,0.1)', borderRadius:12, padding:'10px', minHeight:60, display:'flex', alignItems:'center', gap:8 }}>
                      {team[slot] ? (
                        <>
                          <div style={{ width:32, height:32, borderRadius:'50%', overflow:'hidden', border:'1.5px solid #4ade80', flexShrink:0 }}>
                            <img src={team[slot].profile_pic||getAvatarUrl(team[slot].id)} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{ e.target.onerror=null; e.target.src=getAvatarUrl(team[slot].id) }}/>
                          </div>
                          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:'#4ade80', flex:1 }}>{team[slot].display_name}</span>
                          <button onClick={()=>moveToTeam(team[slot], ti, slot)} style={{ background:'none', border:'none', color:'#334155', cursor:'pointer', fontSize:14 }}>✕</button>
                        </>
                      ) : (
                        <span style={{ fontSize:11, color:'#334155' }}>Tap a player below</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={addTeamSlot} style={{ width:'100%', background:'rgba(255,255,255,0.03)', border:'1px dashed rgba(255,255,255,0.1)', color:'#475569', borderRadius:12, padding:'10px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, marginBottom:16 }}>
              + Add Team Slot
            </button>

            {/* Unassigned players */}
            {unassignedPlayers().length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, color:'#475569', letterSpacing:2, fontWeight:700, marginBottom:8 }}>UNASSIGNED PLAYERS — tap to assign</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {unassignedPlayers().map(p => {
                    const emptyTeam = teams.findIndex(t=>!t.p1||!t.p2)
                    const slot = emptyTeam>=0 ? (!teams[emptyTeam].p1?'p1':'p2') : null
                    return (
                      <div key={p.id} onClick={()=>{ if(emptyTeam>=0&&slot) moveToTeam(p,emptyTeam,slot) }}
                        style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, cursor:emptyTeam>=0?'pointer':'default' }}>
                        <div style={{ width:24, height:24, borderRadius:'50%', overflow:'hidden', background:'#1a2a1a' }}>
                          <img src={p.profile_pic||getAvatarUrl(p.id)} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{ e.target.onerror=null; e.target.src=getAvatarUrl(p.id) }}/>
                        </div>
                        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:12, color:'#94a3b8' }}>{p.display_name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {error && <div style={{ fontSize:12, color:'#f87171', marginBottom:12 }}>⚠ {error}</div>}

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setStep(1)} style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#64748b', borderRadius:50, padding:'13px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:1 }}>← BACK</button>
              <button onClick={handleCreate} disabled={!canCreate||creating}
                style={{ flex:2, background:canCreate?'linear-gradient(135deg,#14532d,#166534)':'rgba(255,255,255,0.05)', border:`1.5px solid ${canCreate?'#4ade80':'rgba(255,255,255,0.1)'}`, color:canCreate?'#4ade80':'#334155', borderRadius:50, padding:'13px', cursor:canCreate?'pointer':'not-allowed', fontFamily:"'Bebas Neue',sans-serif", fontSize:15, letterSpacing:2 }}>
                {creating?'CREATING...':'START TOURNAMENT →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}