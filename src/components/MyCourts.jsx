// src/components/MyCourts.jsx — v2
// My Courts page — leave disabled, court detail with add players
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { getAvatarUrl } from '../utils/avatars'
import bcrypt from 'bcryptjs'

const APP_URL = 'https://shuttle-alpha-umber.vercel.app/'
const DEFAULT_PIN = '1234'

function getLevel(wins) {
  if (wins >= 50) return { aura:'#ffd700' }
  if (wins >= 30) return { aura:'#c084fc' }
  if (wins >= 15) return { aura:'#38bdf8' }
  if (wins >= 5)  return { aura:'#4ade80' }
  return            { aura:'#94a3b8' }
}

function Av({ id, size=36, aura='#4ade8055', profilePic=null }) {
  const [err, setErr] = useState(false)
  const src = profilePic && !err ? profilePic : getAvatarUrl(id)
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', border:'1.5px solid '+aura, background:'#1a2a1a', flexShrink:0 }}>
      <img src={src} width={size} height={size} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setErr(true)}/>
    </div>
  )
}

// ── Court Detail ───────────────────────────────────────────────
function CourtDetail({ court, currentUser, onBack, onUpdated }) {
  const [members, setMembers]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [players, setPlayers]     = useState([{ name:'', phone:'' }])
  const [adding, setAdding]       = useState(false)
  const [addMsg, setAddMsg]       = useState({ type:'', text:'' })
  const [copied, setCopied]       = useState(false)

  useEffect(() => { loadMembers() }, [court.id])

  async function loadMembers() {
    setLoading(true)
    const { data: gm } = await supabase.from('group_members').select('player_id').eq('group_id', court.id)
    if (gm) {
      const ids = gm.map(r => r.player_id)
      const { data: pl } = await supabase.from('players').select('*').in('id', ids)
      setMembers(pl || [])
    }
    setLoading(false)
  }

  async function removePlayer(pid) {
    if (!window.confirm('Remove this player from the court? Their game history stays.')) return
    await supabase.from('group_members').delete().eq('group_id', court.id).eq('player_id', pid)
    await loadMembers()
    onUpdated && onUpdated()
  }

  function updatePlayer(i, field, val) {
    setPlayers(prev => prev.map((p,idx) => idx===i ? {...p,[field]:val} : p))
  }
  function addRow() { setPlayers(prev => [...prev, { name:'', phone:'' }]) }
  function removeRow(i) { if (players.length > 1) setPlayers(prev => prev.filter((_,idx) => idx!==i)) }

  async function handleAdd() {
    const valid = players.filter(p => p.name.trim() && /^\d{10}$/.test(p.phone))
    if (!valid.length) { setAddMsg({ type:'error', text:'Enter at least one player with name and 10-digit phone' }); return }
    setAdding(true); setAddMsg({ type:'', text:'' })
    let added = 0
    for (const pl of valid) {
      try {
        const { data: existing } = await supabase.from('players').select('*').eq('phone', pl.phone).single()
        let playerId
        if (existing) {
          playerId = existing.id
        } else {
          const pinHash = await bcrypt.hash(DEFAULT_PIN, 10)
          const username = pl.name.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'') + pl.phone.slice(-3)
          const { data: newP, error } = await supabase.from('players').insert({
            username, display_name: pl.name.trim(), phone: pl.phone,
            pin_hash: pinHash,
            total_games:0, total_wins:0, total_losses:0,
            points_scored:0, points_conceded:0, level:1, role:'player',
          }).select().single()
          if (error) continue
          playerId = newP.id
        }
        const { data: inCourt } = await supabase.from('group_members')
          .select('player_id').eq('group_id', court.id).eq('player_id', playerId).single()
        if (!inCourt) {
          await supabase.from('group_members').insert({ group_id: court.id, player_id: playerId })
          added++
        }
      } catch(e) { continue }
    }
    setPlayers([{ name:'', phone:'' }])
    setAddMsg({ type:'success', text: `${added} player${added!==1?'s':''} added! Login: phone + PIN ${DEFAULT_PIN}` })
    await loadMembers()
    onUpdated && onUpdated()
    setAdding(false)
  }

  function copyLink() {
    navigator.clipboard.writeText(APP_URL)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const inp = { background:'rgba(0,0,0,0.4)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 12px', color:'#f1f5f9', fontSize:14, fontFamily:"'Rajdhani',sans-serif", outline:'none' }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
      {/* Header */}
      <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <button onClick={onBack} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, padding:0 }}>← Back</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:19, color:'#f1f5f9', letterSpacing:2, lineHeight:1 }}>🏟️ {court.name}</div>
            <div style={{ fontSize:11, color:'#475569', fontFamily:"'Rajdhani',sans-serif", marginTop:2 }}>{members.length} players · Code: <span style={{ color:'#4ade80', letterSpacing:1 }}>{court.court_code||'—'}</span></div>
          </div>
          <button onClick={copyLink} style={{ background: copied?'rgba(74,222,128,0.15)':'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.25)', color:'#4ade80', borderRadius:20, padding:'6px 12px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, flexShrink:0 }}>
            {copied ? '✓ Copied' : '🔗 Share'}
          </button>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
        {/* Add players */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:'#4ade80', letterSpacing:1.5, fontWeight:700, textTransform:'uppercase', marginBottom:10, fontFamily:"'Rajdhani',sans-serif" }}>Add Players</div>
          {players.map((p, i) => (
            <div key={i} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
              <input value={p.name} onChange={e=>updatePlayer(i,'name',e.target.value)}
                placeholder="Name" style={{ ...inp, flex:1 }}/>
              <input value={p.phone} onChange={e=>{ if(/^\d{0,10}$/.test(e.target.value)) updatePlayer(i,'phone',e.target.value) }}
                placeholder="Phone" type="tel" inputMode="numeric" maxLength={10}
                style={{ ...inp, flex:1, borderColor: p.phone.length===10?'rgba(74,222,128,0.5)':'rgba(255,255,255,0.1)', color: p.phone.length===10?'#4ade80':'#f1f5f9' }}/>
              {players.length > 1 && (
                <button onClick={()=>removeRow(i)} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:16, padding:'0 2px', flexShrink:0 }}>✕</button>
              )}
            </div>
          ))}
          <button onClick={addRow} style={{ background:'none', border:'none', color:'#4ade80', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, padding:'4px 0', display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:15 }}>+</span> Add another
          </button>
        </div>

        {/* Info */}
        <div style={{ background:'rgba(96,165,250,0.06)', border:'1px solid rgba(96,165,250,0.15)', borderRadius:10, padding:'9px 12px', marginBottom:12 }}>
          <div style={{ fontSize:12, color:'#60a5fa', fontFamily:"'Rajdhani',sans-serif" }}>
            ℹ️ New players log in with their <strong>phone number</strong> and PIN <strong>{DEFAULT_PIN}</strong>
          </div>
        </div>

        {addMsg.text && (
          <div style={{ fontSize:12, color:addMsg.type==='error'?'#f87171':'#4ade80', marginBottom:10, fontFamily:"'Rajdhani',sans-serif" }}>
            {addMsg.type==='error'?'⚠':'✓'} {addMsg.text}
          </div>
        )}

        {/* Members */}
        <div style={{ fontSize:11, color:'#475569', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:8, fontFamily:"'Rajdhani',sans-serif" }}>
          Current Players ({members.length})
        </div>
        {loading && <div style={{ color:'#334155', padding:16, textAlign:'center' }}>Loading...</div>}
        {members.map(m => {
          const lv = getLevel(m.total_wins||0)
          return (
            <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', marginBottom:6, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12 }}>
              <Av id={m.id} size={36} aura={lv.aura} profilePic={m.profile_pic}/>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:'#f1f5f9', letterSpacing:1 }}>{m.display_name}</div>
                <div style={{ fontSize:11, color:'#475569' }}>{m.phone ? `📱 ${m.phone}` : m.username}</div>
              </div>
              {m.id !== currentUser.id && (
                <button onClick={()=>removePlayer(m.id)}
                  style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', color:'#f87171', borderRadius:20, padding:'4px 12px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:11, fontWeight:700, flexShrink:0 }}>
                  Remove
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <div style={{ padding:'10px 16px 28px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:8, flexShrink:0 }}>
        <button onClick={handleAdd} disabled={adding}
          style={{ flex:2, background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', borderRadius:50, padding:'13px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2, opacity:adding?0.6:1 }}>
          {adding ? 'ADDING...' : 'ADD PLAYERS'}
        </button>
        <button onClick={copyLink}
          style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'#64748b', borderRadius:50, padding:'13px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>
          {copied ? '✓ Copied!' : '🔗 Copy Link'}
        </button>
      </div>
    </div>
  )
}

// ── Main MyCourts ──────────────────────────────────────────────
export default function MyCourts({ currentUser, onClose, initialView='my', onCreateCourt }) {
  const [myCourts, setMyCourts]       = useState([])
  const [allCourts, setAllCourts]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [view, setView]               = useState(initialView)
  const [selectedCourt, setSelectedCourt] = useState(null)
  // Join tab
  const [search, setSearch]           = useState('')
  const [code, setCode]               = useState('')
  const [codeMsg, setCodeMsg]         = useState({ type:'', text:'' })
  const [joining, setJoining]         = useState(false)

  useEffect(() => { load() }, [])
  useEffect(() => { setView(initialView) }, [initialView])

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
    if (!trimmed) { setCodeMsg({ type:'error', text:'Enter a court code' }); return }
    setJoining(true); setCodeMsg({ type:'', text:'' })
    const { data: court } = await supabase.from('groups').select('*').eq('court_code', trimmed).single()
    if (!court) { setCodeMsg({ type:'error', text:'Court not found — check the code' }); setJoining(false); return }
    const { data: existing } = await supabase.from('group_members').select('player_id').eq('group_id', court.id).eq('player_id', currentUser.id).single()
    if (existing) { setCodeMsg({ type:'error', text:'You are already in this court' }); setJoining(false); return }
    await supabase.from('group_members').insert({ group_id: court.id, player_id: currentUser.id })
    setCode(''); setCodeMsg({ type:'success', text:'Joined ' + court.name + '!' })
    await load(); setJoining(false)
  }

  async function joinCourt(courtId) {
    setJoining(courtId)
    await supabase.from('group_members').insert({ group_id: courtId, player_id: currentUser.id })
    await load(); setJoining(false)
  }

  const myCourtsSet = new Set(myCourts.map(c => c.id))
  const filteredCourts = allCourts.filter(c => !myCourtsSet.has(c.id) && c.name.toLowerCase().includes(search.toLowerCase()))
  const inp = { width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.4)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px 14px', color:'#f1f5f9', fontSize:14, fontFamily:"'Rajdhani',sans-serif", outline:'none' }

  // Court detail view
  if (selectedCourt) {
    return (
      <div style={{ position:'fixed', inset:0, zIndex:100, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');`}</style>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid rgba(74,222,128,0.1)', background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', flexShrink:0 }}>
          <button onClick={() => setSelectedCourt(null)} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>← Back</button>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#4ade80', letterSpacing:3 }}>COURT DETAILS</span>
        </div>
        <CourtDetail court={selectedCourt} currentUser={currentUser} onBack={()=>setSelectedCourt(null)} onUpdated={load}/>
      </div>
    )
  }

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
        {[{id:'my',label:'My Courts'},{id:'join',label:'Join a Court'}].map(t => (
          <button key={t.id} onClick={()=>setView(t.id)} style={{
            flex:1, padding:'12px', background:'none', border:'none',
            borderBottom:`2px solid ${view===t.id?'#4ade80':'transparent'}`,
            color:view===t.id?'#4ade80':'#475569',
            fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700, cursor:'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>

        {/* MY COURTS */}
        {view === 'my' && (
          <div>
            {loading && <div style={{ textAlign:'center', color:'#475569', padding:40 }}>Loading...</div>}
            {!loading && myCourts.length === 0 && (
              <div style={{ textAlign:'center', color:'#334155', padding:40 }}>
                <div style={{ fontSize:32, marginBottom:12 }}>🏟️</div>
                <div style={{ fontSize:14, marginBottom:16 }}>No courts yet</div>
                <button onClick={()=>setView('join')} style={{ background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', color:'#4ade80', borderRadius:20, padding:'8px 20px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700 }}>Find a Court →</button>
              </div>
            )}
            {myCourts.map(c => (
              <div key={c.id} onClick={() => setSelectedCourt(c)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', marginBottom:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, cursor:'pointer' }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🏟️</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:1, color:'#f1f5f9' }}>{c.name}</div>
                  <div style={{ fontSize:11, color:'#64748b', fontFamily:"'Rajdhani',sans-serif", marginTop:2 }}>
                    Code: <span style={{ color:'#4ade80', letterSpacing:1 }}>{c.court_code||'—'}</span>
                  </div>
                </div>
                <div style={{ color:'#334155', fontSize:18 }}>›</div>
              </div>
            ))}

            {/* Create Court CTA */}
            {!loading && (
              <button onClick={() => onCreateCourt && onCreateCourt()} style={{ width:'100%', marginTop:8, background:'rgba(74,222,128,0.05)', border:'1px dashed rgba(74,222,128,0.3)', color:'#4ade80', borderRadius:14, padding:'13px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span>＋</span> Create a New Court
              </button>
            )}
          </div>
        )}

        {/* JOIN A COURT */}
        {view === 'join' && (
          <div>
            <div style={{ background:'rgba(74,222,128,0.05)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:14, padding:'14px', marginBottom:16 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:'#4ade80', letterSpacing:2, marginBottom:10 }}>ENTER COURT CODE</div>
              <input value={code} onChange={e=>{ setCode(e.target.value.toUpperCase()); setCodeMsg({type:'',text:''}) }}
                onKeyDown={e=>e.key==='Enter'&&joinByCode()}
                placeholder="e.g. LOTUS1" maxLength={8}
                style={{ ...inp, color:'#4ade80', fontSize:18, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:3, marginBottom:8 }}/>
              {codeMsg.text && <div style={{ fontSize:12, color:codeMsg.type==='error'?'#f87171':'#4ade80', marginBottom:8 }}>{codeMsg.type==='error'?'⚠':'✓'} {codeMsg.text}</div>}
              <button onClick={joinByCode} disabled={joining===true||!code.trim()}
                style={{ width:'100%', background:code.trim()?'linear-gradient(135deg,#14532d,#166534)':'rgba(255,255,255,0.05)', border:`1px solid ${code.trim()?'#4ade80':'rgba(255,255,255,0.1)'}`, color:code.trim()?'#4ade80':'#475569', borderRadius:50, padding:'11px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:15, letterSpacing:2 }}>
                {joining===true ? 'JOINING...' : 'JOIN COURT'}
              </button>
            </div>

            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:'#64748b', letterSpacing:2, marginBottom:10 }}>OR BROWSE</div>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search courts..." style={{ ...inp, marginBottom:10 }}/>
            {filteredCourts.length === 0 && <div style={{ textAlign:'center', color:'#334155', padding:20, fontSize:13 }}>{search?'No courts match':'You are in all available courts'}</div>}
            {filteredCourts.map(c => (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', marginBottom:7, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12 }}>
                <span style={{ fontSize:18 }}>🏟️</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:'#f1f5f9' }}>{c.name}</div>
                  <div style={{ fontSize:11, color:'#475569' }}>Code: <span style={{ color:'#60a5fa' }}>{c.court_code||'—'}</span></div>
                </div>
                <button onClick={()=>joinCourt(c.id)} disabled={joining===c.id}
                  style={{ background:'rgba(74,222,128,0.12)', border:'1px solid rgba(74,222,128,0.35)', color:'#4ade80', borderRadius:20, padding:'5px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, opacity:joining===c.id?0.5:1 }}>
                  {joining===c.id ? '...' : 'Join'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}