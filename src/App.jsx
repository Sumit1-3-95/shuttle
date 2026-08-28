// src/App.jsx
import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import LoginScreen from './components/LoginScreen'
import Dashboard from './components/Dashboard'
import PlayerProfile from './components/PlayerProfile'
import OnboardingScreen from './components/OnboardingScreen'

export default function App() {
  const { currentUser, loading } = useAuth()
  const [profileState, setProfileState] = useState(null) // { id, groupId }
  const [showOnboarding, setShowOnboarding] = useState(false)
  // For game chip click: navigate to games tab with highlighted game
  const [gameNav, setGameNav] = useState(null) // { gameId }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#060d14', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',sans-serif", color:'#4ade80', fontSize:24, letterSpacing:4 }}>
      🏸 LOADING...
    </div>
  )

  if (!currentUser) {
    if (showOnboarding) return (
      <OnboardingScreen onComplete={() => setShowOnboarding(false)}/>
    )
    return <LoginScreen onRegister={() => setShowOnboarding(true)}/>
  }

  if (profileState) return (
    <PlayerProfile
      playerId={profileState.id}
      groupId={profileState.groupId}
      onBack={() => setProfileState(null)}
      onGameChipClick={(gameId) => {
        setProfileState(null) // close profile
        setGameNav({ gameId, tab: 'games' }) // signal Dashboard to open games tab
      }}
    />
  )

  return (
    <Dashboard
      onOpenProfile={(id, groupId) => setProfileState({ id, groupId })}
      gameNav={gameNav}
      onGameNavHandled={() => setGameNav(null)}
    />
  )
}