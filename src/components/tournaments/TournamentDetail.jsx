// src/components/tournaments/TournamentDetail.jsx
// Live tournament view — bracket, logging, standings
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useGameLogger } from '../../hooks/useGameLogger'
import { getRoundName } from './tournamentEngine'
import { getAvatarUrl } from '../../utils/avatars'

const COURT_BG = 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80'

function TeamChip({ team, playerMap, color='#4ade80', won, lost }) {
  if (!team) return <div style={{ flex:1, background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'8px', textAlign:'center', color:'#334155', fontSize:11 }}>TBD</div>
  const p1 = playerMap[team.player1_id]
  const p2 = playerMap[team.player2_id]
  return (
    <div style={{ flex:1, background:won?'rgba(74,222,128,0.1)':lost?'rgba(248,113,113,0.08)':'rgba(255,255,255,0.04)', border:`1px solid ${won?'rgba(74,222,128,0.3)':lost?'rgba(248,113,113,0.2)':'rgba(255,255,255,0.08)'}`, borderRadius:10, padding:'8px 10px' }}>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:12, color:won?'#4ade80':lost?'#f87171':'#94a3b8', letterSpacing:1, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{team.name}</div>
      <div style={{ display:'flex', gap:4, alignItems:'center' }}>
        {[p1,p2].filter(Boolean).map(p=>(
          <div key={p.id} style={{ width:22, height:22, borderRadius:'50%', overflow:'hidden', border:`1px solid ${won?'#4ade8066':'rgba(255,255,255,0.15)'}`, background:'#1a2a1a', flexShrink:0 }}>
            <img src={p.profile_pic||getAvatarUrl(p.id)} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{ e.target.onerror=null; e.target.src=getAvatarUrl(p.id) }}/>
          </div>
        ))}
        <span style={{ fontSize:10, color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {[p1,p2].filter(Boolean).map(p=>p.display_name.split(' ')[0]).join(' & ')}
        </span>
      </div>
    </div>
  )
}

function ScoreModal({ match, teams, playerMap, onClose, onSubmit }) {
  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')
  const teamA = teams.find(t=>t.id===match.team_a_id)
  const teamB = teams.find(t=>t.id===match.team_b_id)
  const sA = parseInt(scoreA)||0, sB = parseInt(scoreB)||0
  const bothFilled = scoreA!=='' && scoreB!==''
  const aWins = bothFilled && sA>sB
  const bWins = bothFilled && sB>sA

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#0a1628', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'20px 16px', width:'100%', maxWidth:380 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#4ade80', letterSpacing:2, marginBottom:16, textAlign:'center' }}>LOG SCORE</div>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:aWins?'#4ade80':bWins?'#f87171':'#94a3b8', letterSpacing:1, textAlign:'center', marginBottom:6 }}>{teamA?.name||'Team A'}</div>
            <input value={scoreA} onChange={e=>{ if(/^\d{0,2}$/.test(e.target.value)) setScoreA(e.target.value) }}
              type="number" inputMode="numeric" placeholder="0" autoFocus
              style={{ width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.5)', border:`1.5px solid ${aWins?'rgba(74,222,128,0.5)':bWins?'rgba(248,113,113,0.4)':'rgba(255,255,255,0.15)'}`, borderRadius:12, padding:'14px', color:'#f1f5f9', fontSize:32, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:2, textAlign:'center', outline:'none' }}/>
          </div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'#334155', marginTop:20 }}>—</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:bWins?'#4ade80':aWins?'#f87171':'#94a3b8', letterSpacing:1, textAlign:'center', marginBottom:6 }}>{teamB?.name||'Team B'}</div>
            <input value={scoreB} onChange={e=>{ if(/^\d{0,2}$/.test(e.target.value)) setScoreB(e.target.value) }}
              type="number" inputMode="numeric" placeholder="0"
              style={{ width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.5)', border:`1.5px solid ${bWins?'rgba(74,222,128,0.5)':aWins?'rgba(248,113,113,0.4)':'rgba(255,255,255,0.15)'}`, borderRadius:12, padding:'14px', color:'#f1f5f9', fontSize:32, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:2, textAlign:'center', outline:'none' }}/>
          </div>
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#64748b', borderRadius:50, padding:'12px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:13, letterSpacing:1 }}>CANCEL</button>
          <button onClick={()=>bothFilled&&sA!==sB&&onSubmit(parseInt(scoreA),parseInt(scoreB))}
            disabled={!bothFilled||sA===sB}
            style={{ flex:2, background:bothFilled&&sA!==sB?'linear-gradient(135deg,#14532d,#166534)':'rgba(255,255,255,0.05)', border:`1.5px solid ${bothFilled&&sA!==sB?'#4ade80':'rgba(255,255,255,0.1)'}`, color:bothFilled&&sA!==sB?'#4ade80':'#334155', borderRadius:50, padding:'12px', cursor:bothFilled&&sA!==sB?'pointer':'not-allowed', fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:1 }}>
            CONFIRM →
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TournamentDetail({ tournamentId, onBack, currentUser }) {
  const [tournament, setTournament] = useState(null)
  const [teams, setTeams]           = useState([])
  const [matches, setMatches]       = useState([])
  const [playerMap, setPlayerMap]   = useState({})
  const [loading, setLoading]       = useState(true)
  const [logMatch, setLogMatch]     = useState(null)
  const [logging, setLogging]       = useState(false)
  const [winner, setWinner]         = useState(null)
  const { logGame } = useGameLogger()

  useEffect(() => { loadAll() }, [tournamentId])

  async function loadAll() {
    const [{ data:t }, { data:teams }, { data:m }, { data:tp }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', tournamentId).single(),
      supabase.from('tournament_teams').select('*').eq('tournament_id', tournamentId).order('seed'),
      supabase.from('tournament_matches').select('*').eq('tournament_id', tournamentId).order('scheduled_order'),
      supabase.from('tournament_players').select('player_id').eq('tournament_id', tournamentId),
    ])
    setTournament(t)
    setTeams(teams||[])
    setMatches(m||[])
    if (tp?.length) {
      const { data:players } = await supabase.from('players').select('*').in('id', tp.map(x=>x.player_id))
      setPlayerMap(Object.fromEntries((players||[]).map(p=>[p.id,p])))
    }
    if (t?.status==='completed' && t?.winner_team_id) {
      setWinner((teams||[]).find(t=>t.id===t.winner_team_id))
    }
    setLoading(false)
  }

  async function submitScore(match, scoreA, scoreB) {
    setLogging(true)
    const teamA = teams.find(t=>t.id===match.team_a_id)
    const teamB = teams.find(t=>t.id===match.team_b_id)
    const winnerTeam = scoreA>scoreB ? 'A' : 'B'
    const winnerTeamId = scoreA>scoreB ? match.team_a_id : match.team_b_id

    // Log actual game for ELO
    const playerIdsA = [teamA?.player1_id, teamA?.player2_id].filter(Boolean)
    const playerIdsB = [teamB?.player1_id, teamB?.player2_id].filter(Boolean)
    const gameResult = await logGame(playerIdsA, playerIdsB, scoreA, scoreB, tournament?.group_id)

    // Update match
    await supabase.from('tournament_matches').update({
      score_a: scoreA, score_b: scoreB,
      winner_team_id: winnerTeamId, status: 'completed',
      game_id: gameResult?.game?.id || null,
    }).eq('id', match.id)

    // Update team stats
    await supabase.from('tournament_teams').update({ wins: (winnerTeam==='A'?teamA.wins:teamB.wins)+1, losses: (winnerTeam==='A'?teamB.losses:teamA.losses)+1 })
      .eq('id', winnerTeamId)

    // Advance knockout bracket
    if (tournament?.format==='knockout') {
      const round = match.round
      const matchIdx = matches.filter(m=>m.round===round).findIndex(m=>m.id===match.id)
      const nextRoundMatch = matches.find(m=>m.round===round+1 && m.match_number===Math.floor(matchIdx/2)+1+matches.filter(m=>m.round<round+1).length)
      if (nextRoundMatch) {
        const slot = matchIdx%2===0 ? 'team_a_id' : 'team_b_id'
        await supabase.from('tournament_matches').update({ [slot]: winnerTeamId }).eq('id', nextRoundMatch.id)
      }
    }

    // Check if tournament complete
    const { data: remaining } = await supabase.from('tournament_matches').select('id').eq('tournament_id', tournamentId).neq('status','completed').neq('status','bye')
    if (remaining?.length === 0) {
      await supabase.from('tournaments').update({ status:'completed', winner_team_id: winnerTeamId, completed_at: new Date().toISOString() }).eq('id', tournamentId)
    }

    setLogMatch(null)
    await loadAll()
    setLogging(false)
  }

  if (loading) return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'#060d14', display:'flex', alignItems:'center', justifyContent:'center', color:'#4ade80', fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:3 }}>
      LOADING TOURNAMENT...
    </div>
  )

  const completedMatches = matches.filter(m=>m.status==='completed').length
  const totalMatches     = matches.filter(m=>m.status!=='bye').length
  const pct = totalMatches>0 ? Math.round(completedMatches/totalMatches*100) : 0
  const rounds = [...new Set(matches.map(m=>m.round))].sort()
  const maxRound = Math.max(...rounds)

  // Standings for Round Robin
  const standings = tournament?.format==='round_robin' || tournament?.format==='group_knockout'
    ? [...teams].sort((a,b)=>b.wins-a.wins||(a.losses-b.losses))
    : null

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', overflowY:'auto' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes card-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes winner-pulse{0%,100%{box-shadow:0 0 20px rgba(255,215,0,0.3)}50%{box-shadow:0 0 50px rgba(255,215,0,0.7)}}
      `}</style>

      {logMatch && <ScoreModal match={logMatch} teams={teams} playerMap={playerMap} onClose={()=>setLogMatch(null)} onSubmit={(sA,sB)=>submitScore(logMatch,sA,sB)}/>}

      {/* Hero */}
      <div style={{ position:'relative', height:180, flexShrink:0, overflow:'hidden' }}>
        <img src={COURT_BG} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(6,13,20,0.4),rgba(6,13,20,1))' }}/>
        <div style={{ position:'absolute', inset:0, padding:'14px 16px' }}>
          <button onClick={onBack} style={{ background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.12)', color:'#94a3b8', borderRadius:20, padding:'5px 12px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700 }}>← Back</button>
        </div>
        <div style={{ position:'absolute', bottom:16, left:16, right:16 }}>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:tournament?.status==='completed'?'rgba(255,215,0,0.15)':'rgba(74,222,128,0.15)', color:tournament?.status==='completed'?'#ffd700':'#4ade80', border:`1px solid ${tournament?.status==='completed'?'rgba(255,215,0,0.3)':'rgba(74,222,128,0.3)'}`, fontWeight:700, letterSpacing:1 }}>
              {tournament?.status==='completed'?'🏆 COMPLETED':'🔴 LIVE'}
            </span>
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(255,255,255,0.08)', color:'#94a3b8', fontWeight:700, letterSpacing:1 }}>
              {tournament?.format?.replace('_',' ').toUpperCase()}
            </span>
          </div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:'#fff', letterSpacing:2, lineHeight:1 }}>{tournament?.name}</div>
          {/* Progress */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
            <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.1)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:'#4ade80', borderRadius:2, transition:'width 0.5s' }}/>
            </div>
            <span style={{ fontSize:10, color:'#64748b', flexShrink:0 }}>{completedMatches}/{totalMatches} matches</span>
          </div>
        </div>
      </div>

      <div style={{ padding:'16px 16px 32px' }}>

        {/* Winner Banner */}
        {tournament?.status==='completed' && (
          <div style={{ background:'linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,215,0,0.04))', border:'1.5px solid rgba(255,215,0,0.4)', borderRadius:20, padding:'20px 16px', marginBottom:20, textAlign:'center', animation:'winner-pulse 2s ease-in-out infinite' }}>
            <div style={{ fontSize:40, marginBottom:8 }}>🏆</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:'rgba(255,215,0,0.6)', letterSpacing:3, marginBottom:4 }}>TOURNAMENT CHAMPION</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:'#ffd700', letterSpacing:2 }}>
              {teams.find(t=>t.id===tournament?.winner_team_id)?.name||'WINNER'}
            </div>
          </div>
        )}

        {/* Round Robin Standings */}
        {standings && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10, color:'#475569', letterSpacing:2, fontWeight:700, marginBottom:10 }}>⚔️ STANDINGS</div>
            {standings.map((t,i)=>(
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', marginBottom:6, background:i===0?'rgba(255,215,0,0.06)':'rgba(255,255,255,0.02)', border:`1px solid ${i===0?'rgba(255,215,0,0.2)':'rgba(255,255,255,0.06)'}`, borderRadius:12 }}>
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:i===0?'#ffd700':'#334155', width:24, textAlign:'center' }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
                <span style={{ flex:1, fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:'#f1f5f9', letterSpacing:0.5 }}>{t.name}</span>
                <div style={{ display:'flex', gap:6 }}>
                  {[{v:t.wins,l:'W',c:'#4ade80'},{v:t.losses,l:'L',c:'#f87171'}].map(s=>(
                    <div key={s.l} style={{ textAlign:'center', background:'rgba(0,0,0,0.3)', borderRadius:6, padding:'3px 8px' }}>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:s.c }}>{s.v}</div>
                      <div style={{ fontSize:8, color:'#475569' }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Matches by round */}
        {rounds.map(round => {
          const roundMatches = matches.filter(m=>m.round===round)
          const label = getRoundName(round, maxRound, tournament?.format)
          return (
            <div key={round} style={{ marginBottom:20 }}>
              <div style={{ fontSize:10, color:'#475569', letterSpacing:2, fontWeight:700, marginBottom:10 }}>{label}</div>
              {roundMatches.filter(m=>m.status!=='bye').map((m,i)=>{
                const tA = teams.find(t=>t.id===m.team_a_id)
                const tB = teams.find(t=>t.id===m.team_b_id)
                const done = m.status==='completed'
                const canLog = tA && tB && !done
                return (
                  <div key={m.id} onClick={()=>canLog&&!logging&&setLogMatch(m)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'12px', marginBottom:8, background:done?'rgba(255,255,255,0.02)':canLog?'rgba(74,222,128,0.04)':'rgba(255,255,255,0.02)', border:`1px solid ${done?'rgba(255,255,255,0.06)':canLog?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.06)'}`, borderRadius:14, cursor:canLog?'pointer':'default', animation:`card-in 0.3s ease-out ${i*0.05}s both` }}>
                    <TeamChip team={tA} playerMap={playerMap} won={done&&m.winner_team_id===m.team_a_id} lost={done&&m.winner_team_id===m.team_b_id}/>
                    <div style={{ textAlign:'center', flexShrink:0, minWidth:44 }}>
                      {done ? (
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#f1f5f9', letterSpacing:2 }}>{m.score_a}–{m.score_b}</div>
                      ) : (
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, color:canLog?'#4ade80':'#334155', letterSpacing:1 }}>{canLog?'TAP':'VS'}</div>
                      )}
                    </div>
                    <TeamChip team={tB} playerMap={playerMap} won={done&&m.winner_team_id===m.team_b_id} lost={done&&m.winner_team_id===m.team_a_id}/>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}