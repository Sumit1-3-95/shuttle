// src/App.jsx — v4 with onboarding flow
import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import LoginScreen from './components/LoginScreen'
import Dashboard from './components/Dashboard'
import PlayerProfile from './components/PlayerProfile'
import OnboardingScreen from './components/OnboardingScreen'
import { supabase } from './supabaseClient'

export default function App() {
  const { currentUser, loading } = useAuth()
  const [profileId, setProfileId] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [groups, setGroups] = useState([])

  // Load groups for onboarding
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
        onComplete={(username) => {
          setShowOnboarding(false)
          // username=null means they clicked "Sign in" — go back to login
          // username=string means they just registered — go to login with prefilled name
        }}
      />
    )
    return <LoginScreen onRegister={() => setShowOnboarding(true)}/>
  }

  if (profileId) return (
    <PlayerProfile playerId={profileId} onBack={() => setProfileId(null)}/>
  )

  return <Dashboard onOpenProfile={(id) => setProfileId(id)}/>
}