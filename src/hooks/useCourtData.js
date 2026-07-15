// src/hooks/useCourtData.js — v2 filters by group_id (exact court match)
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

export function useCourtData(groupId) {
  const [courtPlayers, setCourtPlayers] = useState([])
  const [courtGames,   setCourtGames]   = useState([])
  const [loading,      setLoading]      = useState(true)

  const load = useCallback(async () => {
    if (!groupId || groupId === 'player_default' || groupId === 'all') {
      setLoading(false)
      return
    }
    setLoading(true)

    // 1. Get player IDs in this court
    const { data: members } = await supabase
      .from('group_members')
      .select('player_id')
      .eq('group_id', groupId)

    if (!members?.length) {
      setCourtPlayers([])
      setCourtGames([])
      setLoading(false)
      return
    }

    const courtPlayerIds = members.map(m => m.player_id)
    const playerIdSet = new Set(courtPlayerIds)

    // 2. Fetch players + games tagged to this court
    const [{ data: allPlayers }, { data: taggedGames }] = await Promise.all([
      supabase.from('players').select('*').in('id', courtPlayerIds),
      // Primary: games tagged with this group_id
      supabase.from('games')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_reverted', false)
        .order('played_at', { ascending: false }),
    ])

    // Fallback for old games without group_id: include if ALL 4 players are in court
    // and group_id is null (untagged legacy game)
    const { data: untaggedGames } = await supabase
      .from('games')
      .select('*')
      .is('group_id', null)
      .eq('is_reverted', false)
      .order('played_at', { ascending: false })

    const legacyCourtGames = (untaggedGames||[]).filter(g => {
      const ids = [...(g.team_a_ids||[]), ...(g.team_b_ids||[])]
      return ids.every(id => playerIdSet.has(id))
    })

    // Merge tagged + legacy, deduplicate by id
    const allCourtGames = [...(taggedGames||[]), ...legacyCourtGames]
    const seen = new Set()
    const courtOnlyGames = allCourtGames.filter(g => {
      if (seen.has(g.id)) return false
      seen.add(g.id)
      return true
    }).sort((a,b) => new Date(b.played_at) - new Date(a.played_at))

    // 3. Compute court-scoped stats from scratch
    const statsMap = {}
    courtPlayerIds.forEach(pid => {
      statsMap[pid] = {
        total_games:0, total_wins:0, total_losses:0,
        points_scored:0, points_conceded:0,
        current_streak:0, best_streak:0,
      }
    })

    // Process in chronological order for correct streaks
    const chronoGames = [...courtOnlyGames].reverse()
    chronoGames.forEach(g => {
      const allIds = [...(g.team_a_ids||[]), ...(g.team_b_ids||[])]
      allIds.forEach(pid => {
        if (!statsMap[pid]) return
        const inA = (g.team_a_ids||[]).includes(pid)
        const won = g.winner_team === (inA ? 'A' : 'B')
        statsMap[pid].total_games++
        statsMap[pid].points_scored   += inA ? g.score_a : g.score_b
        statsMap[pid].points_conceded += inA ? g.score_b : g.score_a
        if (won) {
          statsMap[pid].total_wins++
          statsMap[pid].current_streak++
          statsMap[pid].best_streak = Math.max(statsMap[pid].best_streak, statsMap[pid].current_streak)
        } else {
          statsMap[pid].total_losses++
          statsMap[pid].current_streak = 0
        }
      })
    })

    // 4. Merge base player info with court-computed stats
    const enriched = (allPlayers||[]).map(p => ({
      ...p,
      total_games:     statsMap[p.id]?.total_games     || 0,
      total_wins:      statsMap[p.id]?.total_wins      || 0,
      total_losses:    statsMap[p.id]?.total_losses    || 0,
      points_scored:   statsMap[p.id]?.points_scored   || 0,
      points_conceded: statsMap[p.id]?.points_conceded || 0,
      current_streak:  statsMap[p.id]?.current_streak  || 0,
      best_streak:     statsMap[p.id]?.best_streak     || 0,
    })).sort((a,b) => b.total_wins - a.total_wins || b.total_games - a.total_games)

    setCourtPlayers(enriched)
    setCourtGames(courtOnlyGames)
    setLoading(false)
  }, [groupId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch when groupId changes
    void load()
  }, [load])

  return { courtPlayers, courtGames, loading, refetch: load }
}