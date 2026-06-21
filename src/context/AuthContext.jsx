// src/context/AuthContext.jsx — v4
// Login by phone number OR username, + PIN
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import bcrypt from 'bcryptjs'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('shuttle_user')
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  async function login(identifier, pin) {
    const query = identifier.trim()
    let player = null

    // 1. Try phone number (digits only)
    const digitsOnly = query.replace(/\D/g, '')
    if (digitsOnly.length >= 10) {
      const { data } = await supabase
        .from('players').select('*').eq('phone', digitsOnly).single()
      if (data) player = data
    }

    // 2. Try username
    if (!player) {
      const { data } = await supabase
        .from('players').select('*').eq('username', query.toLowerCase()).single()
      if (data) player = data
    }

    // 3. Try display name (fallback)
    if (!player) {
      const { data } = await supabase
        .from('players').select('*').ilike('display_name', query).single()
      if (data) player = data
    }

    if (!player) return { success: false, message: 'Player not found' }

    const match = await bcrypt.compare(pin, player.pin_hash)
    if (!match) return { success: false, message: 'Wrong PIN' }

    const user = {
      id:          player.id,
      username:    player.username,
      displayName: player.display_name,
      role:        player.role,
      isAdmin:     player.role === 'admin',
    }
    setCurrentUser(user)
    localStorage.setItem('shuttle_user', JSON.stringify(user))
    return { success: true }
  }

  function logout() {
    setCurrentUser(null)
    localStorage.removeItem('shuttle_user')
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}