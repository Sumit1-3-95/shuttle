// src/hooks/usePlayerProfile.js — v4 filters by group_id
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'

export function usePlayerProfile(playerId, groupId = null) {
  const [player,     setPlayer]     = useState(null)
  const [games,      setGames]      = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [skills,     setSkills]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast,      setToast]      = useState(null)
  const [hasNewGame, setHasNewGame] = useState(false)
  const isFirstLoad = useRef(true)

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else if (isFirstLoad.current) setLoading(true)

    const [{ data: p }, { data: ap }, { data: sk }] = await Promise.all([
      supabase.from('players').select('*').eq('id', playerId).single(),
      supabase.from('players').select('id, display_name, total_wins'),
      supabase.from('game_skills').select('*').eq('player_id', playerId),
    ])

    // Fetch games scoped to court
    let courtGames
    if (groupId && groupId !== 'all') {
      // 1. Games tagged with this court
      const { data: tagged } = await supabase
        .from('games').select('*')
        .eq('group_id', groupId)
        .or(`team_a_ids.cs.{${playerId}},team_b_ids.cs.{${playerId}}`)
        .eq('is_reverted', false)
        .order('played_at', { ascending: true })

      // 2. Legacy untagged games — check player membership
      const { data: members } = await supabase
        .from('group_members').select('player_id').eq('group_id', groupId)
      const courtPlayerIds = new Set((members||[]).map(m => m.player_id))

      const { data: untagged } = await supabase
        .from('games').select('*')
        .is('group_id', null)
        .or(`team_a_ids.cs.{${playerId}},team_b_ids.cs.{${playerId}}`)
        .eq('is_reverted', false)
        .order('played_at', { ascending: true })

      const legacy = (untagged||[]).filter(g => {
        const ids = [...(g.team_a_ids||[]), ...(g.team_b_ids||[])]
        return ids.every(id => courtPlayerIds.has(id))
      })

      // Merge + deduplicate
      const seen = new Set()
      courtGames = [...(tagged||[]), ...legacy].filter(g => {
        if (seen.has(g.id)) return false
        seen.add(g.id); return true
      }).sort((a,b) => new Date(a.played_at) - new Date(b.played_at))
    } else {
      // No court filter — fetch all player games
      const { data: allG } = await supabase
        .from('games').select('*')
        .or(`team_a_ids.cs.{${playerId}},team_b_ids.cs.{${playerId}}`)
        .eq('is_reverted', false)
        .order('played_at', { ascending: true })
      courtGames = allG || []
    }

    // Recompute stats from scoped games
    let total_games=0, total_wins=0, total_losses=0
    let points_scored=0, points_conceded=0
    let best_streak=0, temp=0

    courtGames.forEach(g => {
      const inA = (g.team_a_ids||[]).includes(playerId)
      const won = g.winner_team === (inA ? 'A' : 'B')
      total_games++
      points_scored   += inA ? g.score_a : g.score_b
      points_conceded += inA ? g.score_b : g.score_a
      if (won) { total_wins++; temp++; best_streak = Math.max(best_streak, temp) }
      else      { total_losses++; temp = 0 }
    })
    if (p) setPlayer({ ...p, total_games, total_wins, total_losses, points_scored, points_conceded, current_streak: temp, best_streak })
    setGames(courtGames)
    if (ap) setAllPlayers(ap)
    if (sk) setSkills(sk)

    setLoading(false)
    setRefreshing(false)
    isFirstLoad.current = false
  }, [playerId, groupId])

  function showToast(msg, type='green') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch when player/court changes
    void fetchAll(false)
  }, [fetchAll])

  useEffect(() => {
    const channel = supabase
      .channel(`profile-watch-${playerId}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'games' }, (payload) => {
        const g = payload.new
        const involves = g.team_a_ids?.includes(playerId) || g.team_b_ids?.includes(playerId)
        showToast(involves ? '🏸 New game — tap refresh' : '📋 New game logged', involves?'green':'gray')
        setHasNewGame(true)
      })
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'game_skills' }, (payload) => {
        if (payload.new.player_id === playerId) { setHasNewGame(true); showToast('⚡ New skill tagged — tap refresh', 'green') }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [playerId])

  async function refresh() {
    setHasNewGame(false)
    await fetchAll(true)
    showToast('✅ Profile updated!', 'green')
  }

  return { player, games, allPlayers, skills, loading, refreshing, toast, hasNewGame, refresh }
}