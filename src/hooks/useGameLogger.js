// src/hooks/useGameLogger.js — v5 with group_id tagging
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useGameLogger() {
  const { currentUser } = useAuth()

  async function getPlayers() {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('total_wins', { ascending: false })
    if (error) return { success: false, message: error.message }
    return { success: true, data }
  }

  async function logGame(teamA, teamB, scoreA, scoreB, groupId = null) {
    const winner = scoreA > scoreB ? 'A' : 'B'
    const { data, error } = await supabase
      .from('games')
      .insert({
        team_a_ids:  teamA,
        team_b_ids:  teamB,
        score_a:     scoreA,
        score_b:     scoreB,
        winner_team: winner,
        logged_by:   currentUser.id,
        played_at:   new Date().toISOString(),
        is_reverted: false,
        group_id:    groupId || null,
      })
      .select()
      .single()
    if (error) return { success: false, message: error.message }
    return { success: true, game: data }
  }

  async function deleteGame(gameId) {
    await supabase.from('game_skills').delete().eq('game_id', gameId)
    const { error } = await supabase.from('games').delete().eq('id', gameId)
    if (error) return { success: false, message: error.message }
    return { success: true }
  }

  async function updateGameScore(gameId, newScoreA, newScoreB) {
    const { data: game, error: fetchErr } = await supabase
      .from('games').select('*').eq('id', gameId).single()
    if (fetchErr) return { success: false, message: fetchErr.message }

    const allPlayerIds = [...(game.team_a_ids||[]), ...(game.team_b_ids||[])]
    const { data: playerRows } = await supabase.from('players').select('*').in('id', allPlayerIds)
    const playerMap = Object.fromEntries((playerRows||[]).map(p=>[p.id,p]))

    const oldWinner = game.winner_team
    const newWinner = newScoreA > newScoreB ? 'A' : 'B'

    const updates = allPlayerIds.map(pid => {
      const p = playerMap[pid]; if (!p) return null
      const inA      = game.team_a_ids.includes(pid)
      const oldWon   = oldWinner === (inA ? 'A' : 'B')
      const newWon   = newWinner === (inA ? 'A' : 'B')
      const oldOwn   = inA ? game.score_a : game.score_b
      const oldOpp   = inA ? game.score_b : game.score_a
      const newOwn   = inA ? newScoreA : newScoreB
      const newOpp   = inA ? newScoreB : newScoreA
      const newWins  = Math.max(0, (p.total_wins||0) - (oldWon?1:0) + (newWon?1:0))
      const newLosses= Math.max(0, (p.total_losses||0) - (oldWon?0:1) + (newWon?0:1))
      const level    = newWins>=50?5:newWins>=30?4:newWins>=15?3:newWins>=5?2:1
      return supabase.from('players').update({
        total_wins:      newWins,
        total_losses:    newLosses,
        points_scored:   Math.max(0, (p.points_scored||0)   - oldOwn + newOwn),
        points_conceded: Math.max(0, (p.points_conceded||0) - oldOpp + newOpp),
        level,
      }).eq('id', pid)
    }).filter(Boolean)

    await Promise.all(updates)
    const { error } = await supabase.from('games').update({
      score_a: newScoreA, score_b: newScoreB, winner_team: newWinner,
    }).eq('id', gameId)
    if (error) return { success: false, message: error.message }
    return { success: true }
  }

  return { getPlayers, logGame, deleteGame, updateGameScore }
}