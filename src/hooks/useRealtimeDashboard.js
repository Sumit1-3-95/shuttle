// src/hooks/useRealtimeDashboard.js
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { assignAvatars } from '../utils/avatars'

export function useRealtimeDashboard() {
  const [players,     setPlayers]     = useState([])
  const [recentGames, setRecentGames] = useState([])
  const [loading,     setLoading]     = useState(true)

  async function fetchAll() {
    const [{ data: p }, { data: g }] = await Promise.all([
      supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: true }), // stable order for avatar assignment
      supabase
        .from('games')
        .select('*')
        .eq('is_reverted', false)
        .order('played_at', { ascending: false })
        .limit(20),
    ])

    if (p) {
      assignAvatars(p)   // assign unique character to each player
      // re-sort by wins for leaderboard display
      setPlayers([...p].sort((a, b) => (b.total_wins || 0) - (a.total_wins || 0)))
    }
    if (g) setRecentGames(g)
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()

    const channel = supabase
      .channel('realtime-games')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'games' }, fetchAll)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games' }, fetchAll)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return { players, recentGames, loading, refetch: fetchAll }
}