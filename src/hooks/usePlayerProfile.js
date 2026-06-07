// src/hooks/usePlayerProfile.js — v2 with skills fetching
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'

export function usePlayerProfile(playerId) {
  const [player,     setPlayer]     = useState(null)
  const [games,      setGames]      = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [skills,     setSkills]     = useState([])  // raw game_skills rows
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast,      setToast]      = useState(null)
  const [hasNewGame, setHasNewGame] = useState(false)
  const isFirstLoad = useRef(true)

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else if (isFirstLoad.current) setLoading(true)

    const [{ data: p }, { data: g }, { data: ap }, { data: sk }] = await Promise.all([
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
      supabase
        .from('game_skills')
        .select('*')
        .eq('player_id', playerId),
    ])

    if (p) setPlayer(p)
    if (g) setGames(g)
    if (ap) setAllPlayers(ap)
    if (sk) setSkills(sk)

    setLoading(false)
    setRefreshing(false)
    isFirstLoad.current = false
  }, [playerId])

  useEffect(() => { fetchAll(false) }, [fetchAll])

  // Realtime — detect new games
  useEffect(() => {
    const channel = supabase
      .channel(`profile-watch-${playerId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'games' }, (payload) => {
        const g = payload.new
        const involves = g.team_a_ids?.includes(playerId) || g.team_b_ids?.includes(playerId)
        showToast(involves ? '🏸 You were in a new game — tap refresh' : '📋 New game logged — tap refresh', involves ? 'green' : 'gray')
        setHasNewGame(true)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_skills' }, (payload) => {
        if (payload.new.player_id === playerId) {
          setHasNewGame(true)
          showToast('⚡ New skill tagged — tap refresh', 'green')
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [playerId])

  async function refresh() {
    setHasNewGame(false)
    await fetchAll(true)
    showToast('✅ Profile updated!', 'green')
  }

  function showToast(msg, type = 'green') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  return {
    player, games, allPlayers, skills,
    loading, refreshing,
    toast, hasNewGame,
    refresh,
  }
}