// ============================================================
// src/hooks/useGameLogger.js
// All game-related DB operations in one place
// ============================================================
import { supabase } from '../supabaseClient'
import { useAuth }  from '../context/AuthContext'

export function useGameLogger() {
  const { currentUser } = useAuth()

  // ---- LOG A NEW GAME ----------------------------------------
  // teamA, teamB: arrays of 2 player UUIDs each
  // scoreA, scoreB: integers
  async function logGame(teamA, teamB, scoreA, scoreB) {
    if (!currentUser) return { success: false, message: 'Not logged in' }

    const winnerTeam = scoreA > scoreB ? 'A' : 'B'

    const { data, error } = await supabase
      .from('games')
      .insert({
        team_a_ids:  teamA,
        team_b_ids:  teamB,
        score_a:     scoreA,
        score_b:     scoreB,
        winner_team: winnerTeam,
        logged_by:   currentUser.id,
        played_at:   new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return { success: false, message: error.message }

    // The DB trigger handles stat updates automatically
    return { success: true, game: data }
  }

  // ---- FETCH ALL PLAYERS (for team selection) ----------------
  async function getPlayers() {
    const { data, error } = await supabase
      .from('players')
      .select('id, username, display_name, total_wins, total_games, current_streak, best_streak, points_scored, points_conceded, level, avatar_style')
      .order('total_wins', { ascending: false })

    if (error) return { success: false, data: [] }
    return { success: true, data }
  }

  // ---- FETCH RECENT GAMES ------------------------------------
  async function getRecentGames(limit = 20) {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('is_reverted', false)
      .order('played_at', { ascending: false })
      .limit(limit)

    if (error) return { success: false, data: [] }
    return { success: true, data }
  }

  // ---- ADMIN: REVERT A GAME ----------------------------------
  async function revertGame(gameId) {
    if (currentUser?.role !== 'admin') {
      return { success: false, message: 'Admin only' }
    }

    // 1. Fetch original game for audit trail
    const { data: original } = await supabase
      .from('games').select('*').eq('id', gameId).single()

    // 2. Soft-delete: mark as reverted
    const { error } = await supabase
      .from('games')
      .update({ is_reverted: true })
      .eq('id', gameId)

    if (error) return { success: false, message: error.message }

    // 3. Write audit log manually
    await supabase.from('audit_log').insert({
      game_id:    gameId,
      action:     'game_reverted',
      changed_by: currentUser.id,
      old_values: original,
      new_values: { is_reverted: true },
    })

    // 4. NOTE: Full stat recalculation after revert is handled
    //    by calling a Supabase Edge Function (next phase)
    return { success: true }
  }

  return { logGame, getPlayers, getRecentGames, revertGame }
}