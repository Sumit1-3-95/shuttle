// src/hooks/useGameLogger.js — v2 with admin delete + edit
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

  async function logGame(teamA, teamB, scoreA, scoreB) {
    const winner = scoreA > scoreB ? 'A' : 'B'
    const { data, error } = await supabase
      .from('games')
      .insert({
        team_a_ids: teamA,
        team_b_ids: teamB,
        score_a: scoreA,
        score_b: scoreB,
        winner_team: winner,
        logged_by: currentUser.id,
        played_at: new Date().toISOString(),
        is_reverted: false,
      })
      .select()
      .single()
    if (error) return { success: false, message: error.message }
    return { success: true, game: data }
  }

  async function deleteGame(gameId) {
    // 1. Get the game first
    const { data: game, error: fetchErr } = await supabase
      .from('games').select('*').eq('id', gameId).single()
    if (fetchErr) return { success: false, message: fetchErr.message }
    if (game.is_reverted) return { success: false, message: 'Already reverted' }

    // 2. Reverse stats for all 4 players
    const allPlayers = [...game.team_a_ids, ...game.team_b_ids]
    for (const pid of allPlayers) {
      const inA = game.team_a_ids.includes(pid)
      const won = game.winner_team === (inA ? 'A' : 'B')
      const ownScore = inA ? game.score_a : game.score_b
      const oppScore = inA ? game.score_b : game.score_a

      const { data: p } = await supabase.from('players').select('*').eq('id', pid).single()
      if (!p) continue

      await supabase.from('players').update({
        total_games:     Math.max(0, p.total_games - 1),
        total_wins:      Math.max(0, p.total_wins - (won ? 1 : 0)),
        total_losses:    Math.max(0, p.total_losses - (won ? 0 : 1)),
        points_scored:   Math.max(0, p.points_scored - ownScore),
        points_conceded: Math.max(0, p.points_conceded - oppScore),
      }).eq('id', pid)
    }

    // 3. Delete game_skills for this game
    await supabase.from('game_skills').delete().eq('game_id', gameId)

    // 4. Delete the game itself
    const { error: delErr } = await supabase.from('games').delete().eq('id', gameId)
    if (delErr) return { success: false, message: delErr.message }

    return { success: true }
  }

  async function updateGameScore(gameId, newScoreA, newScoreB) {
    // 1. Get existing game
    const { data: game, error: fetchErr } = await supabase
      .from('games').select('*').eq('id', gameId).single()
    if (fetchErr) return { success: false, message: fetchErr.message }

    const oldWinner = game.winner_team
    const newWinner = newScoreA > newScoreB ? 'A' : 'B'

    // 2. Reverse old stats
    const allPlayers = [...game.team_a_ids, ...game.team_b_ids]
    for (const pid of allPlayers) {
      const inA = game.team_a_ids.includes(pid)
      const oldWon = oldWinner === (inA ? 'A' : 'B')
      const oldOwn = inA ? game.score_a : game.score_b
      const oldOpp = inA ? game.score_b : game.score_a

      const { data: p } = await supabase.from('players').select('*').eq('id', pid).single()
      if (!p) continue

      // Apply new stats
      const newWon = newWinner === (inA ? 'A' : 'B')
      const newOwn = inA ? newScoreA : newScoreB
      const newOpp = inA ? newScoreB : newScoreA

      await supabase.from('players').update({
        total_wins:      Math.max(0, p.total_wins - (oldWon?1:0) + (newWon?1:0)),
        total_losses:    Math.max(0, p.total_losses - (oldWon?0:1) + (newWon?0:1)),
        points_scored:   Math.max(0, p.points_scored - oldOwn + newOwn),
        points_conceded: Math.max(0, p.points_conceded - oldOpp + newOpp),
      }).eq('id', pid)
    }

    // 3. Update the game
    const { error: updErr } = await supabase.from('games').update({
      score_a: newScoreA,
      score_b: newScoreB,
      winner_team: newWinner,
    }).eq('id', gameId)

    if (updErr) return { success: false, message: updErr.message }
    return { success: true }
  }

  return { getPlayers, logGame, deleteGame, updateGameScore }
}