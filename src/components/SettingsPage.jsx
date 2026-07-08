// src/components/SettingsPage.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function SettingsPage({ currentUser, onClose }) {
  const [gamePreference, setGamePreference] = useState('doubles')
  const [saving, setSaving]                 = useState(false)
  const [saved, setSaved]                   = useState(false)

  useEffect(() => {
    supabase.from('player_settings').select('*').eq('player_id', currentUser.id).single()
      .then(({ data }) => { if (data) setGamePreference(data.game_preference) })
  }, [])

  async function save(pref) {
    setGamePreference(pref)
    setSaving(true)
    await supabase.from('player_settings').upsert({
      player_id: currentUser.id, game_preference: pref, updated_at: new Date().toISOString()
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid rgba(74,222,128,0.1)', flexShrink:0 }}>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>← Back</button>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#4ade80', letterSpacing:3 }}>SETTINGS</span>
        {saved && <span style={{ marginLeft:'auto', fontSize:12, color:'#4ade80' }}>✓ Saved</span>}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'20px 16px' }}>
        {/* Game Preference */}
        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:11, color:'#64748b', letterSpacing:2, fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Game Preference</div>
          <div style={{ fontSize:12, color:'#334155', marginBottom:14 }}>Default mode when logging a game</div>

          <div style={{ display:'flex', gap:10 }}>
            {[
              { id:'doubles', label:'Doubles', desc:'2v2', icon:'👥' },
              { id:'singles', label:'Singles', desc:'1v1', icon:'👤' },
            ].map(opt => (
              <div key={opt.id} onClick={()=>save(opt.id)}
                style={{ flex:1, padding:'16px 12px', borderRadius:14, cursor:'pointer', textAlign:'center', transition:'all 0.2s',
                  background: gamePreference===opt.id ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.03)',
                  border: gamePreference===opt.id ? '1.5px solid rgba(74,222,128,0.5)' : '1px solid rgba(255,255,255,0.08)',
                }}>
                <div style={{ fontSize:28, marginBottom:8 }}>{opt.icon}</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color: gamePreference===opt.id?'#4ade80':'#f1f5f9', letterSpacing:1 }}>{opt.label}</div>
                <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>{opt.desc}</div>
                {gamePreference===opt.id && <div style={{ fontSize:10, color:'#4ade80', marginTop:6, fontWeight:700 }}>✓ DEFAULT</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Account info */}
        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:11, color:'#64748b', letterSpacing:2, fontWeight:700, textTransform:'uppercase', marginBottom:12 }}>Account</div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, color:'#475569' }}>Display Name</span>
            <span style={{ fontSize:13, color:'#f1f5f9', fontWeight:700 }}>{currentUser.displayName}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, color:'#475569' }}>Role</span>
            <span style={{ fontSize:13, color:'#4ade80', fontWeight:700, textTransform:'uppercase' }}>{currentUser.role||'Player'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}