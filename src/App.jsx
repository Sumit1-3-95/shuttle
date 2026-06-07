// src/App.jsx
import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import LoginScreen from './components/LoginScreen'
import Dashboard from './components/Dashboard'
import PlayerProfile from './components/PlayerProfile'

export default function App() {
  const { currentUser, loading } = useAuth()
  const [profileId, setProfileId] = useState(null)

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#060d14', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue', sans-serif", color:'#4ade80', fontSize:24, letterSpacing:4 }}>
      🏸 LOADING...
    </div>
  )

  if (!currentUser) return <LoginScreen/>

  if (profileId) return (
    <PlayerProfile
      playerId={profileId}
      onBack={() => setProfileId(null)}
    />
  )

  return (
    <Dashboard onOpenProfile={(id) => setProfileId(id)}/>
  )
}