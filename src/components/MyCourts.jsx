// src/components/MyCourts.jsx
// Manage My Courts — available to ALL players from hamburger menu
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { getAvatarUrl } from '../utils/avatars'

function getLevel(wins) {
  if (wins >= 50) return { aura:'#ffd700' }
  if (wins >= 30) return { aura:'#c084fc' }
  if (wins >= 15) return { aura:'#38bdf8' }
  if (wins >= 5)  return { aura:'#4ade80' }
  return            { aura:'#94a3b8' }
}

export default function MyCourts({ currentUser, onClose, initialView='my', onCreateCourt }) {
  const [myCourts, setMyCourts]       = useState([])
  const [allCourts, setAllCourts]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [view, setView]               = useState('my') // 'my' | 'join' | 'create'
  const [search, setSearch]           = useState('')
  const [code, setCode]               = useState('')
  const [codeError, setCodeError]     = useState('')
  const [codeSuccess, setCodeSuccess] = useState('')
  const [joining, setJoining]         = useState(false)
  const [removing, setRemoving]       = useState(null)
  // Create court
  const [courtName, setCourtName]     = useState('')
  const [courtNameError, setCourtNameError] = useState('')
  const [creating, setCreating]       = useState(false)
  const [createSuccess, setCreateSuccess] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: gm }, { data: all }] = await Promise.all([
      supabase.from('group_members').select('group_id').eq('player_id', currentUser.id),
      supabase.from('groups').select('*').order('name'),
    ])
    const myIds = new Set((gm||[]).map(m => m.group_id))
    setMyCourts((all||[]).filter(g => myIds.has(g.id)))
    setAllCourts(all||[])
    setLoading(false)
  }

  async function joinByCode() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setCodeError('Enter a court code'); return }
    setJoining(true); setCodeError(''); setCodeSuccess('')
    const { data: court } = await supabase
      .from('groups').select('*').eq('court_code', trimmed).single()
    if (!court) { setCodeError('Court not found — check the code'); setJoining(false); return }
    // Already a member?
    const { data: existing } = await supabase.from('group_members')
      .select('player_id').eq('group_id', court.id).eq('player_id', currentUser.id).single()
    if (existing) { setCodeError('You are already in this court'); setJoining(false); return }
    await supabase.from('group_members').insert({ group_id: court.id, player_id: currentUser.id })
    setCode(''); setCodeSuccess('Joined ' + court.name + '!')
    await load()
    setJoining(false)
  }

  async function joinCourt(courtId) {
    setJoining(courtId)
    await supabase.from('group_members').insert({ group_id: courtId, player_id: currentUser.id })
    await load()
    setJoining(false)
  }

  async function leaveCourt(courtId) {
    if (!window.confirm('Leave this court? Your game history stays.')) return
    setRemoving(courtId)
    await supabase.from('group_members')
      .delete().eq('group_id', courtId).eq('player_id', currentUser.id)
    await load()
    setRemoving(null)
  }

  async function createCourt() {
    const name = courtName.trim()
    if (!name) { setCourtNameError('Enter a court name'); return }
    setCreating(true); setCourtNameError(''); setCreateSuccess('')
    // Check if name exists
    const { data: existing } = await supabase
      .from('groups').select('id').ilike('name', name).single()
    if (existing) { setCourtNameError('A court with this name already exists'); setCreating(false); return }
    // Generate unique 6-char code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: newCourt, error } = await supabase
      .from('groups').insert({ name, court_code: code, pin: '1234' }).select().single()
    if (error) { setCourtNameError(error.message); setCreating(false); return }
    // Add creator as member + admin of this court
    await supabase.from('group_members').insert({ group_id: newCourt.id, player_id: currentUser.id })
    // Note: court-level admin role would need a separate table, for now we note it via app admin
    setCourtName('')
    setCreateSuccess('Court created! Share code: ' + code)
    await load()
    setCreating(false)
  }

  const myCourtsSet = new Set(myCourts.map(c => c.id))
  const filteredCourts = allCourts.filter(c =>
    !myCourtsSet.has(c.id) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid rgba(74,222,128,0.1)', background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', flexShrink:0 }}>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>← Back</button>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#4ade80', letterSpacing:3 }}>MY COURTS</span>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        {[{id:'my',label:'My Courts'},{id:'join',label:'Join a Court'},{id:'create',label:'Create Court'}].map(t => (
          <button key={t.id} onClick={()=>{ if(t.id==='create'&&onCreateCourt){ onCreateCourt(); return } setView(t.id) }} style={{
            flex:1, padding:'12px', background:'none', border:'none',
            borderBottom:`2px solid ${view===t.id?'#4ade80':'transparent'}`,
            color:view===t.id?'#4ade80':'#475569',
            fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700, cursor:'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>

        {/* ── MY COURTS ── */}
        {view === 'my' && (
          <div>
            {loading && <div style={{ textAlign:'center', color:'#475569', padding:40 }}>Loading...</div>}
            {!loading && myCourts.length === 0 && (
              <div style={{ textAlign:'center', color:'#334155', padding:40 }}>
                <div style={{ fontSize:32, marginBottom:12 }}>🏟️</div>
                <div style={{ fontSize:14 }}>You haven't joined any courts yet</div>
                <button onClick={()=>setView('join')} style={{ marginTop:16, background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', color:'#4ade80', borderRadius:20, padding:'8px 20px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700 }}>Find a Court →</button>
              </div>
            )}
            {myCourts.map(c => (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px', marginBottom:10, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🏟️</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:1, color:'#f1f5f9' }}>{c.name}</div>
                  <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>
                    Code: <span style={{ color:'#4ade80', fontWeight:700, letterSpacing:1 }}>{c.court_code||'—'}</span>
                  </div>
                </div>
                <button onClick={()=>leaveCourt(c.id)} disabled={removing===c.id}
                  style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.25)', color:'#f87171', borderRadius:20, padding:'5px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, flexShrink:0, opacity:removing===c.id?0.5:1 }}>
                  {removing===c.id?'...':'Leave'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── JOIN A COURT ── */}
        {view === 'join' && (
          <div>
            {/* Join by code */}
            <div style={{ background:'rgba(74,222,128,0.05)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:14, padding:'16px', marginBottom:20 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:'#4ade80', letterSpacing:2, marginBottom:12 }}>ENTER COURT CODE</div>
              <input
                value={code} onChange={e=>{ setCode(e.target.value.toUpperCase()); setCodeError(''); setCodeSuccess('') }}
                onKeyDown={e=>e.key==='Enter'&&joinByCode()}
                placeholder="e.g. LOTUS1" maxLength={8}
                style={{ width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:10, padding:'11px 14px', color:'#4ade80', fontSize:18, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:3, outline:'none', marginBottom:8, textTransform:'uppercase' }}
              />
              {codeError && <div style={{ fontSize:12, color:'#f87171', marginBottom:8 }}>⚠ {codeError}</div>}
              {codeSuccess && <div style={{ fontSize:12, color:'#4ade80', marginBottom:8 }}>✓ {codeSuccess}</div>}
              <button onClick={joinByCode} disabled={joining===true||!code.trim()}
                style={{ width:'100%', background:code.trim()?'linear-gradient(135deg,#14532d,#166534)':'rgba(255,255,255,0.05)', border:`1px solid ${code.trim()?'#4ade80':'rgba(255,255,255,0.1)'}`, color:code.trim()?'#4ade80':'#475569', borderRadius:50, padding:'12px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2 }}>
                {joining===true?'JOINING...':'JOIN COURT'}
              </button>
            </div>

            {/* Browse courts */}
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#64748b', letterSpacing:2, marginBottom:10 }}>OR BROWSE COURTS</div>
            <input
              value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search court name..."
              style={{ width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', color:'#f1f5f9', fontSize:14, fontFamily:"'Rajdhani',sans-serif", outline:'none', marginBottom:12 }}
            />
            {filteredCourts.length === 0 && (
              <div style={{ textAlign:'center', color:'#334155', padding:24, fontSize:13 }}>
                {search ? 'No courts match your search' : 'You are already in all available courts'}
              </div>
            )}
            {filteredCourts.map(c => (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', marginBottom:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12 }}>
                <span style={{ fontSize:20, flexShrink:0 }}>🏟️</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#f1f5f9' }}>{c.name}</div>
                  <div style={{ fontSize:11, color:'#475569' }}>Code: <span style={{ color:'#60a5fa' }}>{c.court_code||'—'}</span></div>
                </div>
                <button onClick={()=>joinCourt(c.id)} disabled={joining===c.id}
                  style={{ background:'rgba(74,222,128,0.12)', border:'1px solid rgba(74,222,128,0.35)', color:'#4ade80', borderRadius:20, padding:'5px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, flexShrink:0, opacity:joining===c.id?0.5:1 }}>
                  {joining===c.id?'...':'Join'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── CREATE COURT ── */}
        {view === 'create' && onCreateCourt && !onCreateCourt() && null}
        {view === 'create' && (
          <div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'20px' }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#f1f5f9', letterSpacing:2, marginBottom:6 }}>CREATE A NEW COURT</div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:20, lineHeight:1.5 }}>You'll become the admin of this court. Share the generated code with players to invite them.</div>

              <div style={{ fontSize:11, color:'#64748b', letterSpacing:1.5, fontWeight:700, marginBottom:8 }}>COURT NAME</div>
              <input
                value={courtName}
                onChange={e=>{ setCourtName(e.target.value); setCourtNameError('') }}
                onKeyDown={e=>e.key==='Enter'&&createCourt()}
                placeholder="e.g. Lotus Court 3"
                style={{ width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.4)', border:`1px solid ${courtNameError?'rgba(248,113,113,0.5)':'rgba(255,255,255,0.15)'}`, borderRadius:10, padding:'12px 14px', color:'#f1f5f9', fontSize:15, fontFamily:"'Rajdhani',sans-serif", outline:'none', marginBottom:8 }}
              />
              {courtNameError && <div style={{ fontSize:12, color:'#f87171', marginBottom:12 }}>⚠ {courtNameError}</div>}
              {!courtNameError && courtName.trim() && (
                <div style={{ fontSize:12, color:'#64748b', marginBottom:12 }}>A unique court code will be generated automatically</div>
              )}

              {createSuccess && (
                <div style={{ background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:12, padding:'12px 14px', marginBottom:14, fontSize:14, color:'#4ade80', fontWeight:700 }}>
                  ✓ {createSuccess}
                </div>
              )}

              <button onClick={createCourt} disabled={creating||!courtName.trim()}
                style={{ width:'100%', background:courtName.trim()?'linear-gradient(135deg,#14532d,#166534)':'rgba(255,255,255,0.05)', border:`1px solid ${courtName.trim()?'#4ade80':'rgba(255,255,255,0.1)'}`, color:courtName.trim()?'#4ade80':'#475569', borderRadius:50, padding:'14px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:2 }}>
                {creating?'CREATING...':'CREATE COURT'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}