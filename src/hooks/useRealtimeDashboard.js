// ============================================================
// src/hooks/useRealtimeDashboard.js
// Subscribe to live game updates — dashboard stays in sync
// on ALL connected devices automatically
// ============================================================
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useRealtimeDashboard() {
  const [players,     setPlayers]     = useState([])
  const [recentGames, setRecentGames] = useState([])
  const [loading,     setLoading]     = useState(true)

  // Initial data fetch
  async function fetchAll() {
    const [{ data: p }, { data: g }] = await Promise.all([
      supabase
        .from('players')
        .select('*')
        .order('total_wins', { ascending: false }),
      supabase
        .from('games')
        .select('*')
        .eq('is_reverted', false)
        .order('played_at', { ascending: false })
        .limit(20),
    ])
    if (p) setPlayers(p)
    if (g) setRecentGames(g)
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()

    // Subscribe to new game inserts — fires on every connected browser
    const channel = supabase
      .channel('realtime-games')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'games' },
        async () => {
          // A new game was logged — re-fetch everything
          // (stats trigger has already run by the time we get here)
          await fetchAll()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games' },
        async () => {
          // A game was reverted — re-fetch
          await fetchAll()
        }
      )
      .subscribe()

    // Cleanup on unmount
    return () => { supabase.removeChannel(channel) }
  }, [])

  return { players, recentGames, loading, refetch: fetchAll }
}