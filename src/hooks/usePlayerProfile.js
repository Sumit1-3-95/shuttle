// src/hooks/usePlayerProfile.js
// All data fetching + realtime detection for a player profile
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'

export function usePlayerProfile(playerId) {
  const [player,     setPlayer]     = useState(null)
  const [games,      setGames]      = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast,      setToast]      = useState(null) // { msg, type }
  const [hasNewGame, setHasNewGame] = useState(false)
  const isFirstLoad = useRef(true)

  // ── Core fetch ───────────────────────────────────────────
  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else if (isFirstLoad.current) setLoading(true)

    const [{ data: p }, { data: g }, { data: ap }] = await Promise.all([
      supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single(),
      supabase
        .from('games')
        .select('*')
        .or(`team_a_ids.cs.{${playerId}},team_b_ids.cs.{${playerId}}`)
        .eq('is_reverted', false)
        .order('played_at', { ascending: true }),
      supabase
        .from('players')
        .select('id, display_name, total_wins'),
    ])

    if (p) setPlayer(p)
    if (g) setGames(g)
    if (ap) setAllPlayers(ap)

    setLoading(false)
    setRefreshing(false)
    isFirstLoad.current = false
  }, [playerId])

  // ── Initial load ─────────────────────────────────────────
  useEffect(() => {
    fetchAll(false)
  }, [fetchAll])

  // ── Realtime — detect new games, show toast ──────────────
  useEffect(() => {
    const channel = supabase
      .channel(`profile-watch-${playerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'games' },
        (payload) => {
          const g = payload.new
          const involves = (
            g.team_a_ids?.includes(playerId) ||
            g.team_b_ids?.includes(playerId)
          )
          // Show toast regardless — any game affects leaderboard
          // but flag differently if this player was involved
          if (involves) {
            showToast('🏸 You were in a new game — tap refresh', 'green')
          } else {
            showToast('📋 New game logged — tap refresh', 'gray')
          }
          setHasNewGame(true)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [playerId])

  // ── Manual refresh ───────────────────────────────────────
  async function refresh() {
    setHasNewGame(false)
    await fetchAll(true)
    showToast('✅ Profile updated!', 'green')
  }

  // ── Toast helper — auto-dismisses after 3s ───────────────
  function showToast(msg, type = 'green') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  return {
    player, games, allPlayers,
    loading, refreshing,
    toast, hasNewGame,
    refresh,
  }
}