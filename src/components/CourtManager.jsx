// src/components/CourtManager.jsx
// Admin-only court management screen
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { getAvatarUrl } from '../utils/avatars'

function getLevel(wins) {
  if (wins >= 50) return { aura:'#ffd700', emoji:'👑' }
  if (wins >= 30) return { aura:'#c084fc', emoji:'⚡' }
  if (wins >= 15) return { aura:'#38bdf8', emoji:'🔥' }
  if (wins >= 5)  return { aura:'#4ade80', emoji:'⚔️' }
  return            { aura:'#94a3b8', emoji:'🎯' }
}

function Av({ id, size=40, aura='#4ade8055' }) {
  const [err, setErr] = useState(false)
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', border:`1.5px solid ${aura}`, background:'#1a2a1a', flexShrink:0 }}>
      {!err
        ? <img src={getAvatarUrl(id)} width={size} height={size} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setErr(true)}/>
        : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.4,color:aura}}>?</div>
      }
    </div>
  )
}

// ── Court detail screen ────────────────────────────────────────
function CourtDetail({ court, allPlayers, onBack, onUpdated }) {
  const [members, setMembers]       = useState([])
  const [showAdd, setShowAdd]       = useState(false)
  const [removing, setRemoving]     = useState(null)
  const [adding, setAdding]         = useState(null)
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => { loadMembers() }, [court.id])

  async function loadMembers() {
    setLoading(true)
    const { data } = await supabase
      .from('group_members')
      .select('player_id')
      .eq('group_id', court.id)
    if (data) {
      const ids = data.map(r => r.player_id)
      setMembers(ids)
    }
    setLoading(false)
  }

  async function removePlayer(pid) {
    setRemoving(pid)
    await supabase.from('group_members')
      .delete()
      .eq('group_id', court.id)
      .eq('player_id', pid)
    await loadMembers()
    onUpdated && onUpdated()
    setRemoving(null)
  }

  async function addPlayer(pid) {
    setAdding(pid)
    await supabase.from('group_members')
      .insert({ group_id: court.id, player_id: pid })
    await loadMembers()
    onUpdated && onUpdated()
    setAdding(null)
  }

  const memberPlayers = allPlayers.filter(p => members.includes(p.id))
  const nonMembers    = allPlayers.filter(p => !members.includes(p.id)
    && p.display_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
      {/* Header */}
      <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:'50%', width:34, height:34, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>←</button>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#f1f5f9', letterSpacing:2, lineHeight:1 }}>🏟️ {court.name}</div>
          <div style={{ fontSize:11, color:'#475569', fontFamily:"'Rajdhani',sans-serif", marginTop:2 }}>{memberPlayers.length} player{memberPlayers.length!==1?'s':''} · PIN: {court.pin||'1234'}</div>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={{ marginLeft:'auto', background: showAdd?'rgba(74,222,128,0.15)':'rgba(74,222,128,0.08)', border:`1px solid ${showAdd?'rgba(74,222,128,0.5)':'rgba(74,222,128,0.2)'}`, color:'#4ade80', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>
          {showAdd ? '✕ Close' : '+ Add Players'}
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>

        {/* Add players panel */}
        {showAdd && (
          <div style={{ background:'rgba(74,222,128,0.05)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:14, padding:'12px', marginBottom:16 }}>
            <div style={{ fontSize:11, color:'#4ade80', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:1, marginBottom:10 }}>ADD PLAYERS TO COURT</div>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search players..."
              style={{ width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'9px 12px', color:'#f1f5f9', fontSize:14, fontFamily:"'Rajdhani',sans-serif", outline:'none', marginBottom:10 }}
            />
            {nonMembers.length === 0
              ? <div style={{ fontSize:13, color:'#334155', fontFamily:"'Rajdhani',sans-serif", textAlign:'center', padding:'8px 0' }}>All players already in this court</div>
              : nonMembers.map(p => {
                  const lv = getLevel(p.total_wins||0)
                  return (
                    <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', marginBottom:6, background:'rgba(255,255,255,0.02)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)' }}>
                      <Av id={p.id} size={34} aura={lv.aura}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, letterSpacing:1, color:'#f1f5f9' }}>{p.display_name}</div>
                        <div style={{ fontSize:10, color:lv.aura, fontFamily:"'Rajdhani',sans-serif" }}>{lv.emoji} {p.total_wins||0}W</div>
                      </div>
                      <button
                        onClick={() => addPlayer(p.id)}
                        disabled={adding===p.id}
                        style={{ background:'rgba(74,222,128,0.15)', border:'1px solid rgba(74,222,128,0.35)', color:'#4ade80', borderRadius:20, padding:'5px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, opacity:adding===p.id?0.5:1 }}>
                        {adding===p.id ? '...' : 'Add'}
                      </button>
                    </div>
                  )
                })
            }
          </div>
        )}

        {/* Current members */}
        <div style={{ fontSize:11, color:'#475569', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:10, fontFamily:"'Rajdhani',sans-serif" }}>
          Current Players ({memberPlayers.length})
        </div>

        {loading && <div style={{ textAlign:'center', color:'#334155', padding:24, fontFamily:"'Rajdhani',sans-serif" }}>Loading...</div>}

        {!loading && memberPlayers.length === 0 && (
          <div style={{ textAlign:'center', color:'#334155', padding:24, fontFamily:"'Rajdhani',sans-serif", fontSize:14 }}>
            No players yet — tap Add Players
          </div>
        )}

        {memberPlayers.map(p => {
          const lv = getLevel(p.total_wins||0)
          return (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 12px', marginBottom:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14 }}>
              <Av id={p.id} size={42} aura={lv.aura}/>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:1, color:'#f1f5f9', lineHeight:1 }}>{p.display_name}</div>
                <div style={{ fontSize:11, color:lv.aura, fontFamily:"'Rajdhani',sans-serif", marginTop:2 }}>{lv.emoji} {p.total_wins||0}W · {p.total_games||0} games</div>
              </div>
              <button
                onClick={() => removePlayer(p.id)}
                disabled={removing===p.id}
                style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.25)', color:'#f87171', borderRadius:20, padding:'5px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, opacity:removing===p.id?0.5:1, flexShrink:0 }}>
                {removing===p.id ? '...' : 'Remove'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Court list screen ──────────────────────────────────────────
function CourtList({ courts, allPlayers, memberCounts, onSelectCourt, onCreateCourt, creating, newCourtName, setNewCourtName, createError }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
      <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#f1f5f9', letterSpacing:2, lineHeight:1 }}>Court Manager</div>
        <div style={{ fontSize:11, color:'#475569', fontFamily:"'Rajdhani',sans-serif", marginTop:2 }}>{courts.length} courts · tap to manage</div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
        {courts.map(c => (
          <div key={c.id} onClick={() => onSelectCourt(c)}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', marginBottom:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, cursor:'pointer', transition:'all 0.15s' }}>
            <div style={{ width:42, height:42, borderRadius:12, background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🏟️</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:1, color:'#f1f5f9', lineHeight:1 }}>{c.name}</div>
              <div style={{ fontSize:11, color:'#64748b', fontFamily:"'Rajdhani',sans-serif", marginTop:2 }}>
                {memberCounts[c.id]||0} players · PIN {c.pin||'1234'}
              </div>
            </div>
            {/* Stacked member avatars */}
            <div style={{ display:'flex', flexShrink:0 }}>
              {(allPlayers.filter(p => (memberCounts[c.id+'_ids']||[]).includes(p.id))).slice(0,3).map((p,i) => (
                <div key={p.id} style={{ width:24, height:24, borderRadius:'50%', overflow:'hidden', border:'1.5px solid #060d14', marginLeft:i>0?-6:0, background:'#1a2a1a' }}>
                  <img src={getAvatarUrl(p.id)} width={24} height={24} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                </div>
              ))}
            </div>
            <div style={{ color:'#334155', fontSize:16, flexShrink:0 }}>›</div>
          </div>
        ))}

        {courts.length === 0 && (
          <div style={{ textAlign:'center', color:'#334155', padding:40, fontFamily:"'Rajdhani',sans-serif" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🏟️</div>
            No courts yet — create one below
          </div>
        )}
      </div>

      {/* Create court CTA */}
      <div style={{ padding:'12px 16px 28px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', gap:8 }}>
          <input
            value={newCourtName} onChange={e => setNewCourtName(e.target.value)}
            onKeyDown={e => e.key==='Enter' && onCreateCourt()}
            placeholder="New court name..."
            style={{ flex:1, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:12, padding:'11px 14px', color:'#f1f5f9', fontSize:14, fontFamily:"'Rajdhani',sans-serif", outline:'none' }}
          />
          <button onClick={onCreateCourt} disabled={creating||!newCourtName.trim()}
            style={{ background:newCourtName.trim()?'linear-gradient(135deg,#14532d,#166534)':'rgba(255,255,255,0.05)', border:`1px solid ${newCourtName.trim()?'#4ade80':'rgba(255,255,255,0.1)'}`, color:newCourtName.trim()?'#4ade80':'#475569', borderRadius:12, padding:'11px 18px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:15, letterSpacing:1, flexShrink:0 }}>
            {creating ? '...' : 'CREATE'}
          </button>
        </div>
        {createError && <div style={{ fontSize:11, color:'#f87171', marginTop:6, fontFamily:"'Rajdhani',sans-serif" }}>⚠ {createError}</div>}
      </div>
    </div>
  )
}

// ── Main CourtManager ──────────────────────────────────────────
export default function CourtManager({ onClose, currentUserId }) {
  const [courts, setCourts]           = useState([])
  const [allPlayers, setAllPlayers]   = useState([])
  const [memberCounts, setMemberCounts] = useState({})
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [newCourtName, setNewCourtName] = useState('')
  const [creating, setCreating]       = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [{ data: g }, { data: p }, { data: gm }] = await Promise.all([
      supabase.from('groups').select('*').order('name'),
      supabase.from('players').select('*').order('total_wins', { ascending: false }),
      supabase.from('group_members').select('*'),
    ])
    if (g) setCourts(g)
    if (p) setAllPlayers(p)
    if (gm && g) {
      const counts = {}
      g.forEach(court => {
        const ids = gm.filter(m => m.group_id === court.id).map(m => m.player_id)
        counts[court.id] = ids.length
        counts[court.id + '_ids'] = ids
      })
      setMemberCounts(counts)
    }
  }

  async function handleCreateCourt() {
    if (!newCourtName.trim()) return
    setCreating(true); setCreateError('')
    try {
      const { data: newCourt, error } = await supabase
        .from('groups').insert({ name: newCourtName.trim(), pin: '1234' }).select().single()
      if (error) throw error
      // Auto-add admin to new court
      await supabase.from('group_members').insert({ group_id: newCourt.id, player_id: currentUserId })
      setNewCourtName('')
      await loadAll()
    } catch (err) {
      setCreateError(err.message || 'Failed to create court')
    }
    setCreating(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');`}</style>

      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid rgba(74,222,128,0.1)', background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', flexShrink:0 }}>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>
          ← Back
        </button>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#4ade80', letterSpacing:3 }}>
          {selectedCourt ? selectedCourt.name.toUpperCase() : 'ALL COURTS'}
        </span>
        {selectedCourt && (
          <span style={{ fontSize:11, color:'#334155', fontFamily:"'Rajdhani',sans-serif", marginLeft:'auto' }}>Admin only</span>
        )}
      </div>

      {selectedCourt
        ? <CourtDetail
            court={selectedCourt}
            allPlayers={allPlayers}
            onBack={() => setSelectedCourt(null)}
            onUpdated={loadAll}
          />
        : <CourtList
            courts={courts}
            allPlayers={allPlayers}
            memberCounts={memberCounts}
            onSelectCourt={setSelectedCourt}
            onCreateCourt={handleCreateCourt}
            creating={creating}
            newCourtName={newCourtName}
            setNewCourtName={setNewCourtName}
            createError={createError}
          />
      }
    </div>
  )
}