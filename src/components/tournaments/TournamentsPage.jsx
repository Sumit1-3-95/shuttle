// src/components/tournaments/TournamentsPage.jsx
// Tournament list + entry point
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import CreateTournament from './CreateTournament'
import TournamentDetail from './TournamentDetail'
import { getAvatarUrl } from '../../utils/avatars'

const COURT_BG = 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80'

const FORMAT_LABELS = {
  knockout:       { label:'Knockout',      color:'#f87171', icon:'⚡' },
  round_robin:    { label:'Round Robin',   color:'#60a5fa', icon:'🔄' },
  group_knockout: { label:'Group + KO',    color:'#fbbf24', icon:'🏆' },
  king_of_court:  { label:'King of Court', color:'#c084fc', icon:'👑' },
}

export default function TournamentsPage({ onBack, currentUser, players, groups, activeGroup }) {
  const [view, setView]           = useState('list') // 'list' | 'create' | 'detail'
  const [activeTournament, setActiveTournament] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('active')

  const court = groups?.find(g=>g.id===activeGroup)
  const groupPlayers = activeGroup && activeGroup!=='all'
    ? players.filter(p => p.group_ids?.includes(activeGroup) || players.includes(p))
    : players

  useEffect(() => { loadTournaments() }, [activeGroup])

  async function loadTournaments() {
    setLoading(true)
    let q = supabase.from('tournaments').select('*, tournament_matches(id,status), tournament_teams(id,name,wins)').order('created_at', { ascending:false })
    if (activeGroup && activeGroup!=='all') q = q.eq('group_id', activeGroup)
    const { data } = await q
    setTournaments(data||[])
    setLoading(false)
  }

  if (view==='create') return (
    <CreateTournament
      onBack={()=>setView('list')}
      onCreated={(id)=>{ setActiveTournament(id); setView('detail'); loadTournaments() }}
      currentUser={currentUser}
      groupId={activeGroup!=='all'?activeGroup:null}
      groupPlayers={groupPlayers}
      groupName={court?.name}
    />
  )

  if (view==='detail' && activeTournament) return (
    <TournamentDetail
      tournamentId={activeTournament}
      onBack={()=>{ setView('list'); loadTournaments() }}
      currentUser={currentUser}
    />
  )

  const active   = tournaments.filter(t=>t.status==='active')
  const completed = tournaments.filter(t=>t.status==='completed')
  const shown    = tab==='active' ? active : completed

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', overflowY:'auto' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes card-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08)}
      `}</style>

      {/* Hero */}
      <div style={{ position:'relative', height:200, flexShrink:0, overflow:'hidden' }}>
        <img src={COURT_BG} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,rgba(6,13,20,0.3) 0%,rgba(6,13,20,0.95) 100%)' }}/>
        {/* SVG court overlay */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.12 }} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
          <rect x="20" y="10" width="360" height="180" fill="none" stroke="#4ade80" strokeWidth="1.5"/>
          <line x1="200" y1="10" x2="200" y2="190" stroke="#4ade80" strokeWidth="1.5"/>
          <line x1="20" y1="100" x2="380" y2="100" stroke="#4ade80" strokeWidth="1"/>
          <ellipse cx="200" cy="100" rx="40" ry="40" fill="none" stroke="#4ade80" strokeWidth="1"/>
        </svg>
        <div style={{ position:'absolute', inset:0, padding:'14px 16px' }}>
          <button onClick={onBack} style={{ background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.12)', color:'#94a3b8', borderRadius:20, padding:'5px 12px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700 }}>← Back</button>
        </div>
        <div style={{ position:'absolute', bottom:20, left:16, right:16 }}>
          <div style={{ fontSize:10, color:'#4ade80', letterSpacing:4, fontWeight:700, marginBottom:4 }}>
            {court?.name?.toUpperCase()||'ALL COURTS'}
          </div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:'#fff', letterSpacing:4, lineHeight:1 }}>TOURNAMENTS</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:4 }}>{active.length} active · {completed.length} completed</div>
        </div>
      </div>

      {/* Create button */}
      <div style={{ padding:'16px 16px 0', flexShrink:0 }}>
        <button onClick={()=>setView('create')}
          style={{ width:'100%', background:'linear-gradient(135deg,rgba(74,222,128,0.15),rgba(74,222,128,0.06))', border:'1.5px solid rgba(74,222,128,0.3)', color:'#4ade80', borderRadius:16, padding:'14px', cursor:'pointer', fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:3, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>⚡</span> START NEW TOURNAMENT
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', margin:'16px 16px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        {[{id:'active',l:`Active (${active.length})`},{id:'completed',l:`Completed (${completed.length})`}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, padding:'10px', background:'none', border:'none', borderBottom:`2px solid ${tab===t.id?'#4ade80':'transparent'}`, color:tab===t.id?'#4ade80':'#475569', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, cursor:'pointer' }}>{t.l}</button>
        ))}
      </div>

      <div style={{ flex:1, padding:'12px 16px 32px', overflowY:'auto' }}>
        {loading && <div style={{ textAlign:'center', color:'#475569', padding:40 }}>Loading...</div>}

        {!loading && shown.length===0 && (
          <div style={{ textAlign:'center', padding:48 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🏆</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#334155', letterSpacing:2 }}>
              {tab==='active'?'NO ACTIVE TOURNAMENTS':'NO COMPLETED TOURNAMENTS'}
            </div>
            <div style={{ fontSize:12, color:'#1e293b', marginTop:8 }}>
              {tab==='active'?'Start one above!':'Finish a tournament to see results here'}
            </div>
          </div>
        )}

        {shown.map((t,i) => {
          const fmt = FORMAT_LABELS[t.format]||{label:t.format,color:'#4ade80',icon:'🏸'}
          const done = t.tournament_matches?.filter(m=>m.status==='completed').length||0
          const total = t.tournament_matches?.filter(m=>m.status!=='bye').length||0
          const pct = total>0?Math.round(done/total*100):0
          const topTeam = [...(t.tournament_teams||[])].sort((a,b)=>b.wins-a.wins)[0]
          const isCompleted = t.status==='completed'

          return (
            <div key={t.id} onClick={()=>{ setActiveTournament(t.id); setView('detail') }}
              style={{ marginBottom:12, background:'rgba(255,255,255,0.02)', border:`1px solid ${isCompleted?'rgba(255,215,0,0.15)':fmt.color+'22'}`, borderRadius:18, padding:'16px', cursor:'pointer', animation:`card-in 0.3s ease-out ${i*0.06}s both`, borderTop:`2px solid ${isCompleted?'#ffd70055':fmt.color+'66'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:19, color:'#f1f5f9', letterSpacing:1.5, lineHeight:1, marginBottom:5 }}>{t.name}</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:`${fmt.color}12`, color:fmt.color, border:`1px solid ${fmt.color}25`, fontWeight:700 }}>{fmt.icon} {fmt.label}</span>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(255,255,255,0.05)', color:'#475569', fontWeight:700 }}>
                      {t.game_type==='singles'?'👤 Singles':'👥 Doubles'}
                    </span>
                    {isCompleted && topTeam && (
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(255,215,0,0.1)', color:'#ffd700', border:'1px solid rgba(255,215,0,0.25)', fontWeight:700 }}>🏆 {topTeam.name}</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0, marginLeft:10 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:isCompleted?'#ffd700':'#4ade80' }}>{pct}%</div>
                  <div style={{ fontSize:9, color:'#334155', letterSpacing:1 }}>DONE</div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background:isCompleted?'#ffd700':'#4ade80', borderRadius:2 }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:10, color:'#334155' }}>
                <span>{done}/{total} matches played</span>
                <span>{new Date(t.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}