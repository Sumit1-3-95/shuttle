// src/App.jsx — v5 with court-scoped player profile
import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import LoginScreen from './components/LoginScreen'
import Dashboard from './components/Dashboard'
import PlayerProfile from './components/PlayerProfile'
import OnboardingScreen from './components/OnboardingScreen'
import { supabase } from './supabaseClient'
import { useEffect } from 'react'

export default function App() {
  const { currentUser, loading } = useAuth()
  const [profileState, setProfileState] = useState(null) // { id, groupId }
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [groups, setGroups] = useState([])

  useEffect(() => {
    supabase.from('groups').select('*').order('name')
      .then(({ data }) => { if (data) setGroups(data) })
  }, [])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#060d14', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue', sans-serif", color:'#4ade80', fontSize:24, letterSpacing:4 }}>
      🏸 LOADING...
    </div>
  )

  if (!currentUser) {
    if (showOnboarding) return (
      <OnboardingScreen
        groups={groups}
        onComplete={() => setShowOnboarding(false)}
      />
    )
    return <LoginScreen onRegister={() => setShowOnboarding(true)}/>
  }

  if (profileState) return (
    <PlayerProfile
      playerId={profileState.id}
      groupId={profileState.groupId}
      onBack={() => setProfileState(null)}
    />
  )

  return (
    <Dashboard
      onOpenProfile={(id, groupId) => setProfileState({ id, groupId })}
    />
  )
}