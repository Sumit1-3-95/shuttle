// src/components/EditGameModal.jsx — v2
// Edit score + teams
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { getAvatarUrl } from '../utils/avatars'

function Av({ player, size=32, selected }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', border:`2px solid ${selected?'#4ade80':'rgba(255,255,255,0.15)'}`, background:'#1a2a1a', flexShrink:0 }}>
      <img src={player.profile_pic||getAvatarUrl(player.id)} style={{ width:'100%', height:'100%', objectFit:'cover' }}
        onError={e=>{ e.target.onerror=null; e.target.src=getAvatarUrl(player.id) }}/>
    </div>
  )
}

export default function EditGameModal({ game, players, onClose, onSave }) {
  const playerMap   = Object.fromEntries((players||[]).map(p=>[p.id,p]))
  const isSingles   = (game.team_a_ids?.length===1)
  const maxPerTeam  = isSingles ? 1 : 2

  const [tab, setTab]     = useState('score') // 'score' | 'teams'
  const [scoreA, setScoreA] = useState(String(game.score_a||''))
  const [scoreB, setScoreB] = useState(String(game.score_b||''))
  const [teamA, setTeamA]   = useState([...game.team_a_ids||[]])
  const [teamB, setTeamB]   = useState([...game.team_b_ids||[]])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const sA = parseInt(scoreA)||0, sB = parseInt(scoreB)||0
  const scoreValid = scoreA!=='' && scoreB!=='' && sA!==sB
  const teamsValid = teamA.length>0 && teamB.length>0 &&
    !teamA.some(id=>teamB.includes(id))

  function togglePlayer(pid) {
    const inA = teamA.includes(pid)
    const inB = teamB.includes(pid)
    if (inA) { setTeamA(prev=>prev.filter(x=>x!==pid)); return }
    if (inB) { setTeamB(prev=>prev.filter(x=>x!==pid)); return }
    if (teamA.length < maxPerTeam) setTeamA(prev=>[...prev, pid])
    else if (teamB.length < maxPerTeam) setTeamB(prev=>[...prev, pid])
  }

  async function handleSave() {
    if (!scoreValid) { setError('Scores must be filled and different'); return }
    if (!teamsValid) { setError('Teams must have players and no overlap'); return }
    setSaving(true); setError('')
    // Update teams + score
    const winner = sA>sB ? 'A' : 'B'
    const { error: err } = await supabase.from('games').update({
      team_a_ids: teamA,
      team_b_ids: teamB,
      score_a: sA,
      score_b: sB,
      winner_team: winner,
    }).eq('id', game.id)
    if (err) { setError(err.message); setSaving(false); return }
    await onSave(sA, sB)
    setSaving(false)
  }

  const inp = { width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.5)', border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'12px', color:'#f1f5f9', fontSize:28, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:2, textAlign:'center', outline:'none' }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'flex-end', justifyContent:'center', fontFamily:"'Rajdhani',sans-serif" }}>
      <div style={{ background:'#0a1628', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px 20px 0 0', padding:'20px 16px 32px', width:'100%', maxWidth:440 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#f1f5f9', letterSpacing:2 }}>EDIT GAME</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:20 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {[{id:'score',l:'Edit Score'},{id:'teams',l:'Edit Teams'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, padding:'8px', borderRadius:10, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700,
              background:tab===t.id?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.04)',
              border:tab===t.id?'1px solid rgba(74,222,128,0.35)':'1px solid rgba(255,255,255,0.08)',
              color:tab===t.id?'#4ade80':'#475569' }}>{t.l}</button>
          ))}
        </div>

        {/* Score tab */}
        {tab==='score' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:'#4ade80', fontWeight:700, letterSpacing:1, textAlign:'center', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {teamA.map(id=>playerMap[id]?.display_name?.split(' ')[0]||'?').join(' & ')}
                </div>
                <input value={scoreA} onChange={e=>{ if(/^\d{0,2}$/.test(e.target.value)){setScoreA(e.target.value);setError('')} }}
                  type="number" inputMode="numeric" placeholder="0" autoFocus
                  style={{ ...inp, borderColor:sA>sB&&scoreValid?'rgba(74,222,128,0.5)':sA<sB&&scoreValid?'rgba(248,113,113,0.4)':'rgba(255,255,255,0.15)' }}/>
              </div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#334155', marginTop:20 }}>—</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:'#60a5fa', fontWeight:700, letterSpacing:1, textAlign:'center', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {teamB.map(id=>playerMap[id]?.display_name?.split(' ')[0]||'?').join(' & ')}
                </div>
                <input value={scoreB} onChange={e=>{ if(/^\d{0,2}$/.test(e.target.value)){setScoreB(e.target.value);setError('')} }}
                  type="number" inputMode="numeric" placeholder="0"
                  style={{ ...inp, borderColor:sB>sA&&scoreValid?'rgba(74,222,128,0.5)':sB<sA&&scoreValid?'rgba(248,113,113,0.4)':'rgba(255,255,255,0.15)' }}/>
              </div>
            </div>
          </div>
        )}

        {/* Teams tab */}
        {tab==='teams' && (
          <div>
            {/* Current teams */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
              {[{label:'TEAM A', ids:teamA, color:'#4ade80'},{label:'TEAM B', ids:teamB, color:'#60a5fa'}].map(t=>(
                <div key={t.label} style={{ background:'rgba(0,0,0,0.3)', border:`1px solid ${t.color}22`, borderRadius:12, padding:'10px' }}>
                  <div style={{ fontSize:10, color:t.color, fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>{t.label}</div>
                  {t.ids.map(id=>(
                    <div key={id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                      <Av player={playerMap[id]||{id}} size={26} selected/>
                      <span style={{ fontSize:12, color:'#f1f5f9', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{playerMap[id]?.display_name||'?'}</span>
                    </div>
                  ))}
                  {t.ids.length===0 && <div style={{ fontSize:11, color:'#334155' }}>Empty</div>}
                </div>
              ))}
            </div>
            <div style={{ fontSize:10, color:'#475569', letterSpacing:1.5, fontWeight:700, marginBottom:8 }}>TAP PLAYERS TO REASSIGN</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
              {players.map(p=>{
                const inA = teamA.includes(p.id)
                const inB = teamB.includes(p.id)
                return (
                  <div key={p.id} onClick={()=>{ togglePlayer(p.id); setError('') }}
                    style={{ padding:'8px 4px', borderRadius:10, cursor:'pointer', textAlign:'center',
                      background:inA?'rgba(74,222,128,0.1)':inB?'rgba(96,165,250,0.1)':'rgba(255,255,255,0.03)',
                      border:inA?'1px solid rgba(74,222,128,0.3)':inB?'1px solid rgba(96,165,250,0.3)':'1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ margin:'0 auto 4px', width:32, height:32 }}>
                      <Av player={p} size={32} selected={inA||inB}/>
                    </div>
                    <div style={{ fontSize:11, color:inA?'#4ade80':inB?'#60a5fa':'#94a3b8', fontFamily:"'Bebas Neue',sans-serif", letterSpacing:0.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.display_name}</div>
                    {inA&&<div style={{ fontSize:8, color:'#4ade80', marginTop:2 }}>A</div>}
                    {inB&&<div style={{ fontSize:8, color:'#60a5fa', marginTop:2 }}>B</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {error && <div style={{ fontSize:12, color:'#f87171', textAlign:'center', margin:'10px 0' }}>⚠ {error}</div>}

        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button onClick={onClose} style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#64748b', borderRadius:50, padding:'12px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:13, letterSpacing:1 }}>CANCEL</button>
          <button onClick={handleSave} disabled={!scoreValid||!teamsValid||saving}
            style={{ flex:2, background:(scoreValid&&teamsValid)?'linear-gradient(135deg,#14532d,#166534)':'rgba(255,255,255,0.05)', border:`1.5px solid ${(scoreValid&&teamsValid)?'#4ade80':'rgba(255,255,255,0.1)'}`, color:(scoreValid&&teamsValid)?'#4ade80':'#334155', borderRadius:50, padding:'12px', cursor:(scoreValid&&teamsValid)?'pointer':'not-allowed', fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:1, opacity:saving?0.6:1 }}>
            {saving?'SAVING...':'SAVE CHANGES →'}
          </button>
        </div>
      </div>
    </div>
  )
}