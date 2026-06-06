// src/App.jsx
import { useAuth } from './context/AuthContext'
import LoginScreen from './components/LoginScreen'
import Dashboard from './components/Dashboard'

export default function App() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f172a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Rajdhani, sans-serif', color: '#4ade80', fontSize: 20, letterSpacing: 2,
      }}>
        🏸 LOADING...
      </div>
    )
  }

  // Not logged in → show Login
  if (!currentUser) return <LoginScreen />

  // Logged in → show Dashboard
  return <Dashboard />
}