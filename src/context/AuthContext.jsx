// ============================================================
// src/context/AuthContext.jsx
// Provides currentUser to the whole app
// Handles login (PIN check) and logout
// ============================================================
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import bcrypt from 'bcryptjs'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading]         = useState(true)

  // On app load — restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('shuttle_user')
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)) }
      catch { localStorage.removeItem('shuttle_user') }
    }
    setLoading(false)
  }, [])

  // LOGIN: username + raw 4-digit PIN
  async function login(username, pin) {
    // 1. Fetch the player row by username
    const { data, error } = await supabase
      .from('players')
      .select('id, username, display_name, pin_hash, role, level, avatar_style')
      .eq('username', username.toLowerCase().trim())
      .single()

    if (error || !data) {
      return { success: false, message: 'Player not found' }
    }

    // 2. Compare entered PIN against stored bcrypt hash
    const match = await bcrypt.compare(pin, data.pin_hash)
    if (!match) {
      return { success: false, message: 'Wrong PIN' }
    }

    // 3. Store session (never store pin_hash)
    const session = {
      id:           data.id,
      username:     data.username,
      displayName:  data.display_name,
      role:         data.role,
      level:        data.level,
      avatarStyle:  data.avatar_style,
    }
    localStorage.setItem('shuttle_user', JSON.stringify(session))
    setCurrentUser(session)
    return { success: true }
  }

  // LOGOUT
  function logout() {
    localStorage.removeItem('shuttle_user')
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook — use anywhere: const { currentUser, login, logout } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}