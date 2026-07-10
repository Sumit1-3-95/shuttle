// src/components/RecalcRatings.jsx
// Admin-only tool to recalculate all ratings from scratch (Option A)
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { recalcAllRatings, getInitialRating } from '../utils/ratingEngine'

export default function RecalcRatings({ onClose }) {
  const [log, setLog]       = useState([])
  const [running, setRunning] = useState(false)
  const [done, setDone]     = useState(false)

  function addLog(msg) { setLog(prev => [...prev, msg]) }

  async function runRecalc() {
    setRunning(true); setLog([])
    try {
      addLog('Fetching all players...')
      const { data: players } = await supabase.from('players').select('*')
      addLog(`Found ${players.length} players`)

      addLog('Fetching all games (chronological)...')
      const { data: games } = await supabase.from('games')
        .select('*').eq('is_reverted', false).order('played_at', { ascending: true })
      addLog(`Found ${games.length} games`)

      addLog('Computing initial ratings from onboarding data...')
      const playersWithInit = players.map(p => ({
        ...p,
        initial_rating: getInitialRating({
          skillLevel:   p.skill_level || 'beginner',
          isCompetitive: p.is_competitive || false,
          frequency:    p.play_frequency || 'once',
        })
      }))

      addLog('Recalculating all ratings...')
      const { playerStates, gameResults } = recalcAllRatings(games, playersWithInit)
      addLog(`Calculated ${gameResults.length} game results`)

      addLog('Clearing old rating history...')
      await supabase.from('rating_history').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      addLog('Updating player ratings...')
      await Promise.all(Object.entries(playerStates).map(([id, s]) =>
        supabase.from('players').update({
          rating_doubles:       s.rating_doubles,
          rating_singles:       s.rating_singles,
          rating_doubles_games: s.doubles_games,
          rating_singles_games: s.singles_games,
        }).eq('id', id)
      ))

      addLog('Updating game rating deltas...')
      await Promise.all(gameResults.map(r =>
        supabase.from('games').update({
          rating_delta_a: r.delta_a,
          rating_delta_b: r.delta_b,
          is_singles: r.is_singles,
        }).eq('id', r.game_id)
      ))

      addLog('✅ Recalculation complete!')
      setDone(true)
    } catch (err) {
      addLog('❌ Error: ' + err.message)
    }
    setRunning(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', padding:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer' }}>← Back</button>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#f87171', letterSpacing:3 }}>⚠ RECALCULATE ALL RATINGS</span>
      </div>

      <div style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:16, fontSize:13, color:'#f87171' }}>
        This will recalculate every player's rating from scratch using all historical games. This cannot be undone.
      </div>

      {!running && !done && (
        <button onClick={runRecalc}
          style={{ background:'linear-gradient(135deg,#7f1d1d,#991b1b)', border:'1.5px solid #f87171', color:'#f87171', borderRadius:50, padding:'14px', fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:2, cursor:'pointer', marginBottom:16 }}>
          START RECALCULATION
        </button>
      )}

      <div style={{ flex:1, overflowY:'auto', background:'rgba(0,0,0,0.4)', borderRadius:12, padding:14, fontFamily:'monospace', fontSize:12, color:'#4ade80' }}>
        {log.map((l,i) => <div key={i} style={{ marginBottom:4 }}>{l}</div>)}
        {running && <div style={{ color:'#fbbf24' }}>Processing...</div>}
      </div>

      {done && (
        <button onClick={onClose}
          style={{ marginTop:12, background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', borderRadius:50, padding:'14px', fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:2, cursor:'pointer' }}>
          DONE — CLOSE
        </button>
      )}
    </div>
  )
}