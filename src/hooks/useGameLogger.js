// src/hooks/useGameLogger.js — v6 with rating system
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { calcMatchRatings } from '../utils/ratingEngine'

export function useGameLogger() {
  const { currentUser } = useAuth()

  async function getPlayers() {
    const { data, error } = await supabase
      .from('players').select('*').order('rating_doubles', { ascending: false })
    if (error) return { success: false, message: error.message }
    return { success: true, data }
  }

  async function logGame(teamA, teamB, scoreA, scoreB, groupId = null) {
    const winner    = scoreA > scoreB ? 'A' : 'B'
    const isSingles = teamA.length === 1 && teamB.length === 1
    const ratingKey = isSingles ? 'rating_singles' : 'rating_doubles'
    const gamesKey  = isSingles ? 'rating_singles_games' : 'rating_doubles_games'

    // Fetch current ratings for all players
    const allIds = [...teamA, ...teamB]
    const { data: playerRows } = await supabase
      .from('players').select('*').in('id', allIds)
    const pm = Object.fromEntries((playerRows||[]).map(p => [p.id, p]))

    const teamAData = teamA.map(id => ({
      id,
      rating: pm[id]?.[ratingKey] || 900,
      games_played: pm[id]?.[gamesKey] || 0,
    }))
    const teamBData = teamB.map(id => ({
      id,
      rating: pm[id]?.[ratingKey] || 900,
      games_played: pm[id]?.[gamesKey] || 0,
    }))

    // Calculate new ratings
    const { teamA: updA, teamB: updB, deltaA, deltaB } = calcMatchRatings(teamAData, teamBData, winner, isSingles)

    // Insert game
    const { data: game, error } = await supabase.from('games').insert({
      team_a_ids:  teamA,
      team_b_ids:  teamB,
      score_a:     scoreA,
      score_b:     scoreB,
      winner_team: winner,
      logged_by:   currentUser.id,
      played_at:   new Date().toISOString(),
      is_reverted: false,
      group_id:    groupId || null,
      is_singles:  isSingles,
      rating_delta_a: deltaA,
      rating_delta_b: deltaB,
    }).select().single()

    if (error) return { success: false, message: error.message }

    // Update player ratings + game counts
    const allUpdates = [...updA, ...updB].map(p =>
      supabase.from('players').update({
        [ratingKey]: p.newRating,
        [gamesKey]: (pm[p.id]?.[gamesKey] || 0) + 1,
      }).eq('id', p.id)
    )

    // Insert rating history
    const historyRows = [...updA, ...updB].map(p => ({
      player_id:     p.id,
      game_id:       game.id,
      rating_before: p.rating,
      rating_after:  p.newRating,
      delta:         p.delta,
      game_type:     isSingles ? 'singles' : 'doubles',
    }))

    await Promise.all([
      ...allUpdates,
      supabase.from('rating_history').insert(historyRows),
    ])

    return { success: true, game }
  }

  async function deleteGame(gameId) {
    // Reverse rating changes by restoring rating_before from history
    const { data: game } = await supabase.from('games').select('*').eq('id', gameId).single()
    if (game) {
      const { data: history } = await supabase.from('rating_history').select('*').eq('game_id', gameId)
      if (history?.length) {
        const isSingles = game.is_singles
        const ratingKey = isSingles ? 'rating_singles' : 'rating_doubles'
        const gamesKey  = isSingles ? 'rating_singles_games' : 'rating_doubles_games'
        // Fetch current game counts to decrement
        const pids = history.map(h => h.player_id)
        const { data: playerRows } = await supabase.from('players').select('id,' + ratingKey + ',' + gamesKey).in('id', pids)
        const pm = Object.fromEntries((playerRows||[]).map(p => [p.id, p]))
        await Promise.all(history.map(h =>
          supabase.from('players').update({
            [ratingKey]: h.rating_before,
            [gamesKey]: Math.max(0, (pm[h.player_id]?.[gamesKey] || 1) - 1),
          }).eq('id', h.player_id)
        ))
        await supabase.from('rating_history').delete().eq('game_id', gameId)
      }
    }
    // game_skills may not exist — ignore error
    try { await supabase.from('game_skills').delete().eq('game_id', gameId) } catch(e) {}
    const { error } = await supabase.from('games').delete().eq('id', gameId)
    if (error) return { success: false, message: error.message }
    return { success: true }
  }

  async function updateGameScore(gameId, newScoreA, newScoreB) {
    const { data: game, error: fetchErr } = await supabase.from('games').select('*').eq('id', gameId).single()
    if (fetchErr) return { success: false, message: fetchErr.message }

    const allIds = [...(game.team_a_ids||[]), ...(game.team_b_ids||[])]
    const { data: playerRows } = await supabase.from('players').select('*').in('id', allIds)
    const playerMap = Object.fromEntries((playerRows||[]).map(p=>[p.id,p]))

    const oldWinner = game.winner_team
    const newWinner = newScoreA > newScoreB ? 'A' : 'B'

    const updates = allIds.map(pid => {
      const p = playerMap[pid]; if (!p) return null
      const inA       = game.team_a_ids.includes(pid)
      const oldWon    = oldWinner === (inA?'A':'B')
      const newWon    = newWinner === (inA?'A':'B')
      const oldOwn    = inA ? game.score_a : game.score_b
      const oldOpp    = inA ? game.score_b : game.score_a
      const newOwn    = inA ? newScoreA : newScoreB
      const newOpp    = inA ? newScoreB : newScoreA
      const newWins   = Math.max(0,(p.total_wins||0)-(oldWon?1:0)+(newWon?1:0))
      const newLosses = Math.max(0,(p.total_losses||0)-(oldWon?0:1)+(newWon?0:1))
      const level     = newWins>=50?5:newWins>=30?4:newWins>=15?3:newWins>=5?2:1
      return supabase.from('players').update({
        total_wins: newWins, total_losses: newLosses,
        points_scored:   Math.max(0,(p.points_scored||0)-oldOwn+newOwn),
        points_conceded: Math.max(0,(p.points_conceded||0)-oldOpp+newOpp),
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