// src/components/CourtManager.jsx — v2
// Full court creation flow with player management
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

function Av({ id, size=40, aura='#4ade8055', profilePic=null }) {
  const [err, setErr] = useState(false)
  const src = profilePic && !err ? profilePic : getAvatarUrl(id)
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', border:`1.5px solid ${aura}`, background:'#1a2a1a', flexShrink:0 }}>
      {!err
        ? <img src={src} width={size} height={size} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setErr(true)}/>
        : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.4,color:aura}}>?</div>
      }
    </div>
  )
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function generateUsername(name, phone) {
  const base = name.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'') || 'player'
  return base + (phone ? phone.slice(-3) : Math.floor(Math.random()*900+100))
}

// ── Create Court Screen ────────────────────────────────────────
function CreateCourt({ onBack, currentUserId, onCreated }) {
  const [courtName, setCourtName] = useState('')
  const [creating, setCreating]   = useState(false)
  const [error, setError]         = useState('')

  async function handleCreate() {
    const name = courtName.trim()
    if (!name) { setError('Enter a court name'); return }
    setCreating(true); setError('')

    // Check name uniqueness
    const { data: existing } = await supabase
      .from('groups').select('id').ilike('name', name).single()
    if (existing) { setError('A court with this name already exists'); setCreating(false); return }

    const code = generateCode()
    const { data: newCourt, error: err } = await supabase
      .from('groups')
      .insert({ name, court_code: code, pin: DEFAULT_PIN })
      .select().single()

    if (err) { setError(err.message); setCreating(false); return }

    // Add creator as member + admin
    await supabase.from('group_members').insert({ group_id: newCourt.id, player_id: currentUserId })
    await supabase.from('players').update({ role: 'admin' }).eq('id', currentUserId)

    onCreated(newCourt)
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'20px 16px' }}>
      <button onClick={onBack} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, textAlign:'left', marginBottom:20, padding:0 }}>← Back</button>

      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'#f1f5f9', letterSpacing:2, marginBottom:6 }}>Create New Court</div>
      <div style={{ fontSize:13, color:'#475569', marginBottom:28, fontFamily:"'Rajdhani',sans-serif" }}>A unique court code will be generated automatically</div>

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, color:'#64748b', letterSpacing:1.5, fontWeight:700, textTransform:'uppercase', marginBottom:8, fontFamily:"'Rajdhani',sans-serif" }}>Court Name</div>
        <input
          value={courtName}
          onChange={e => { setCourtName(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="e.g. Lotus Court 3"
          autoFocus
          style={{ width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.4)', border:'1.5px solid rgba(255,255,255,0.12)', borderRadius:14, padding:'14px 16px', color:'#f1f5f9', fontSize:16, fontFamily:"'Rajdhani',sans-serif", outline:'none' }}
        />
        {error && <div style={{ fontSize:12, color:'#f87171', marginTop:6, fontFamily:"'Rajdhani',sans-serif" }}>⚠ {error}</div>}
      </div>

      <button onClick={handleCreate} disabled={creating || !courtName.trim()}
        style={{ width:'100%', background: courtName.trim() ? 'linear-gradient(135deg,#14532d,#166534)' : 'rgba(255,255,255,0.05)', border:`1.5px solid ${courtName.trim()?'#4ade80':'rgba(255,255,255,0.1)'}`, color: courtName.trim()?'#4ade80':'#475569', borderRadius:50, padding:'15px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:3, opacity:creating?0.6:1 }}>
        {creating ? 'CREATING...' : 'CREATE COURT →'}
      </button>
    </div>
  )
}

// ── Court Detail Screen ────────────────────────────────────────
function CourtDetail({ court, allPlayers, currentUserId, onBack, onUpdated }) {
  const [members, setMembers]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [showAdd, setShowAdd]     = useState(false)
  const [addName, setAddName]     = useState('')
  const [addPhone, setAddPhone]   = useState('')
  const [addError, setAddError]   = useState('')
  const [addSuccess, setAddSuccess] = useState('')
  const [adding, setAdding]       = useState(false)
  const [removing, setRemoving]   = useState(null)
  const [copied, setCopied]       = useState(false)

  useEffect(() => { loadMembers() }, [court.id])

  async function loadMembers() {
    setLoading(true)
    const { data } = await supabase
      .from('group_members').select('player_id').eq('group_id', court.id)
    if (data) {
      const ids = data.map(r => r.player_id)
      const { data: players } = await supabase.from('players').select('*').in('id', ids)
      setMembers(players || [])
    }
    setLoading(false)
  }

  async function handleAddPlayer() {
    const name  = addName.trim()
    const phone = addPhone.trim().replace(/\D/g,'')

    if (!name)              { setAddError('Enter player name'); return }
    if (phone.length !== 10){ setAddError('Enter valid 10-digit phone'); return }

    setAdding(true); setAddError(''); setAddSuccess('')

    try {
      // Check if phone already registered
      const { data: existing } = await supabase
        .from('players').select('*').eq('phone', phone).single()

      let playerId

      if (existing) {
        // Old user — just add to court
        playerId = existing.id
        setAddSuccess(`${existing.display_name} already exists — added to court!`)
      } else {
        // New user — create with default PIN 1234
        const pinHash = await bcrypt.hash(DEFAULT_PIN, 10)
        const username = generateUsername(name, phone)
        const { data: newPlayer, error } = await supabase.from('players').insert({
          username, display_name: name, phone,
          pin_hash: pinHash,
          total_games:0, total_wins:0, total_losses:0,
          points_scored:0, points_conceded:0, level:1, role:'player',
        }).select().single()
        if (error) throw error
        playerId = newPlayer.id
        setAddSuccess(`${name} added! They can log in with phone ${phone} and PIN ${DEFAULT_PIN}`)
      }

      // Check if already in court
      const { data: inCourt } = await supabase.from('group_members')
        .select('player_id').eq('group_id', court.id).eq('player_id', playerId).single()

      if (!inCourt) {
        await supabase.from('group_members').insert({ group_id: court.id, player_id: playerId })
      }

      setAddName(''); setAddPhone('')
      await loadMembers()
      onUpdated && onUpdated()
    } catch (err) {
      setAddError(err.message || 'Something went wrong')
    }
    setAdding(false)
  }

  async function removePlayer(pid) {
    if (!window.confirm('Remove player from this court?')) return
    setRemoving(pid)
    await supabase.from('group_members').delete().eq('group_id', court.id).eq('player_id', pid)
    await loadMembers()
    onUpdated && onUpdated()
    setRemoving(null)
  }

  function copyLink() {
    navigator.clipboard.writeText(APP_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inp = { width:'100%', boxSizing:'border-box', background:'rgba(0,0,0,0.4)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px 14px', color:'#f1f5f9', fontSize:15, fontFamily:"'Rajdhani',sans-serif", outline:'none' }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
      {/* Header */}
      <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <button onClick={onBack} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, padding:0 }}>← Back</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#f1f5f9', letterSpacing:2, lineHeight:1 }}>🏟️ {court.name}</div>
            <div style={{ fontSize:11, color:'#475569', fontFamily:"'Rajdhani',sans-serif", marginTop:2 }}>{members.length} players</div>
          </div>
        </div>

        {/* Court code card */}
        <div style={{ background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.25)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:10, color:'#4ade80', letterSpacing:2, fontWeight:700, fontFamily:"'Rajdhani',sans-serif" }}>COURT CODE</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:'#4ade80', letterSpacing:4, lineHeight:1 }}>{court.court_code}</div>
            <div style={{ fontSize:11, color:'#475569', fontFamily:"'Rajdhani',sans-serif" }}>Share to invite players</div>
          </div>
          <button onClick={copyLink} style={{ background: copied?'rgba(74,222,128,0.2)':'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', color:'#4ade80', borderRadius:20, padding:'8px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>
            {copied ? '✓ Copied!' : '🔗 Copy Link'}
          </button>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>

        {/* Add player section */}
        <div style={{ background:'rgba(74,222,128,0.04)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:14, padding:'14px', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: showAdd?12:0 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:'#4ade80', letterSpacing:1 }}>+ Add Players</div>
            <button onClick={() => { setShowAdd(v=>!v); setAddError(''); setAddSuccess('') }} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:18 }}>
              {showAdd ? '▲' : '▼'}
            </button>
          </div>

          {showAdd && (
            <div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:10 }}>
                <input value={addName} onChange={e=>{ setAddName(e.target.value); setAddError('') }}
                  placeholder="Player name" style={inp}/>
                <input value={addPhone} onChange={e=>{ if(/^\d{0,10}$/.test(e.target.value)) { setAddPhone(e.target.value); setAddError('') } }}
                  placeholder="10-digit phone number" type="tel" inputMode="numeric" maxLength={10} style={inp}/>
              </div>

              {/* Info note */}
              <div style={{ background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.15)', borderRadius:10, padding:'10px 12px', marginBottom:10 }}>
                <div style={{ fontSize:12, color:'#60a5fa', fontFamily:"'Rajdhani',sans-serif", lineHeight:1.5 }}>
                  ℹ️ New players can log in with their <strong>phone number</strong> and default PIN <strong>{DEFAULT_PIN}</strong>
                </div>
              </div>

              {addError   && <div style={{ fontSize:12, color:'#f87171', marginBottom:8, fontFamily:"'Rajdhani',sans-serif" }}>⚠ {addError}</div>}
              {addSuccess && <div style={{ fontSize:12, color:'#4ade80', marginBottom:8, fontFamily:"'Rajdhani',sans-serif" }}>✓ {addSuccess}</div>}

              <button onClick={handleAddPlayer} disabled={adding || !addName.trim() || addPhone.length!==10}
                style={{ width:'100%', background: (addName.trim()&&addPhone.length===10) ? 'linear-gradient(135deg,#14532d,#166534)' : 'rgba(255,255,255,0.05)', border:`1px solid ${(addName.trim()&&addPhone.length===10)?'#4ade80':'rgba(255,255,255,0.1)'}`, color:(addName.trim()&&addPhone.length===10)?'#4ade80':'#475569', borderRadius:50, padding:'12px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2, opacity:adding?0.6:1 }}>
                {adding ? 'ADDING...' : 'ADD TO COURT'}
              </button>

              {/* Copy link CTA */}
              <button onClick={copyLink} style={{ width:'100%', marginTop:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b', borderRadius:50, padding:'11px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>
                {copied ? '✓ Link Copied!' : '🔗 Copy Court Link to Share'}
              </button>
            </div>
          )}
        </div>

        {/* Members list */}
        <div style={{ fontSize:11, color:'#475569', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:10, fontFamily:"'Rajdhani',sans-serif" }}>
          Players ({members.length})
        </div>

        {loading && <div style={{ textAlign:'center', color:'#334155', padding:20 }}>Loading...</div>}

        {!loading && members.length === 0 && (
          <div style={{ textAlign:'center', color:'#334155', padding:24, fontFamily:"'Rajdhani',sans-serif" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>👥</div>
            No players yet — add some above
          </div>
        )}

        {members.map(p => {
          const lv = getLevel(p.total_wins||0)
          return (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 12px', marginBottom:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14 }}>
              <Av id={p.id} size={40} aura={lv.aura} profilePic={p.profile_pic}/>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:1, color:'#f1f5f9', lineHeight:1 }}>{p.display_name}</div>
                <div style={{ fontSize:11, color:'#475569', fontFamily:"'Rajdhani',sans-serif", marginTop:2 }}>
                  {p.phone ? `📱 ${p.phone}` : p.username}
                </div>
              </div>
              {p.id !== currentUserId && (
                <button onClick={() => removePlayer(p.id)} disabled={removing===p.id}
                  style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', color:'#f87171', borderRadius:20, padding:'4px 12px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, opacity:removing===p.id?0.5:1, flexShrink:0 }}>
                  {removing===p.id ? '...' : 'Remove'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Court List Screen ──────────────────────────────────────────
function CourtList({ courts, allPlayers, memberCounts, onSelectCourt, onCreateCourt }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
      <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#f1f5f9', letterSpacing:2 }}>Court Manager</div>
        <div style={{ fontSize:11, color:'#475569', fontFamily:"'Rajdhani',sans-serif", marginTop:2 }}>{courts.length} courts · tap to manage</div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
        {courts.length === 0 && (
          <div style={{ textAlign:'center', color:'#334155', padding:40, fontFamily:"'Rajdhani',sans-serif" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🏟️</div>
            No courts yet — create one below
          </div>
        )}
        {courts.map(c => (
          <div key={c.id} onClick={() => onSelectCourt(c)}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', marginBottom:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, cursor:'pointer' }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🏟️</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:1, color:'#f1f5f9', lineHeight:1 }}>{c.name}</div>
              <div style={{ fontSize:11, color:'#64748b', fontFamily:"'Rajdhani',sans-serif", marginTop:2 }}>
                {memberCounts[c.id]||0} players · Code: <span style={{ color:'#4ade80', letterSpacing:1 }}>{c.court_code||'—'}</span>
              </div>
            </div>
            <div style={{ color:'#334155', fontSize:18 }}>›</div>
          </div>
        ))}
      </div>

      {/* Create court CTA */}
      <div style={{ padding:'12px 16px 28px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onCreateCourt}
          style={{ width:'100%', background:'linear-gradient(135deg,#14532d,#166534)', border:'1.5px solid #4ade80', color:'#4ade80', borderRadius:50, padding:'14px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:2 }}>
          + CREATE NEW COURT
        </button>
      </div>
    </div>
  )
}

// ── Main CourtManager ──────────────────────────────────────────
export default function CourtManager({ onClose, currentUserId }) {
  const [view, setView]             = useState('list') // 'list'|'create'|'detail'
  const [courts, setCourts]         = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [memberCounts, setMemberCounts] = useState({})
  const [selectedCourt, setSelectedCourt] = useState(null)

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
        counts[court.id] = gm.filter(m => m.group_id === court.id).length
      })
      setMemberCounts(counts)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');`}</style>

      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid rgba(74,222,128,0.1)', background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)', flexShrink:0 }}>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>← Close</button>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#4ade80', letterSpacing:3 }}>
          {view==='list' ? 'ALL COURTS' : view==='create' ? 'NEW COURT' : (selectedCourt?.name||'').toUpperCase()}
        </span>
      </div>

      {view === 'list' && (
        <CourtList
          courts={courts}
          allPlayers={allPlayers}
          memberCounts={memberCounts}
          onSelectCourt={c => { setSelectedCourt(c); setView('detail') }}
          onCreateCourt={() => setView('create')}
        />
      )}

      {view === 'create' && (
        <CreateCourt
          currentUserId={currentUserId}
          onBack={() => setView('list')}
          onCreated={async (newCourt) => {
            await loadAll()
            setSelectedCourt(newCourt)
            setView('detail')
          }}
        />
      )}

      {view === 'detail' && selectedCourt && (
        <CourtDetail
          court={selectedCourt}
          allPlayers={allPlayers}
          currentUserId={currentUserId}
          onBack={() => setView('list')}
          onUpdated={loadAll}
        />
      )}
    </div>
  )
}