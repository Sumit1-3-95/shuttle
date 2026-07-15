// src/components/racquet-ninja/RN_Players.jsx — v2
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { getRatingTier, isCalibrating } from '../../utils/ratingEngine'
import { getAvatarUrl } from '../../utils/avatars'

function PlayerDetailPage({ player, onBack }) {
  const tier    = getRatingTier(player.rating_doubles||1000)
  const calib   = isCalibrating(player.rating_doubles_games||0)
  const winPct  = player.total_games>0 ? Math.round(player.total_wins/player.total_games*100) : 0

  return (
    <div style={{ position:'fixed', inset:0, zIndex:220, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', overflowY:'auto' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');`}</style>
      {/* Hero */}
      <div style={{ position:'relative', background:'linear-gradient(160deg,#0a1a14,#060d14)', padding:'50px 20px 24px', textAlign:'center', flexShrink:0 }}>
        <button onClick={onBack} style={{ position:'absolute', top:14, left:16, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>← Back</button>
        {player.rn_role==='coach' && (
          <div style={{ position:'absolute', top:14, right:16, fontSize:9, padding:'3px 10px', borderRadius:20, background:'rgba(251,191,36,0.15)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.3)', fontWeight:700, letterSpacing:1 }}>COACH</div>
        )}
        <div style={{ width:80, height:80, borderRadius:'50%', overflow:'hidden', border:`3px solid ${tier.color}`, margin:'0 auto 14px', background:'#1a2a1a', boxShadow:`0 0 24px ${tier.color}44` }}>
          <img src={player.profile_pic||getAvatarUrl(player.id)} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{ e.target.onerror=null; e.target.src=getAvatarUrl(player.id) }}/>
        </div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:'#fff', letterSpacing:2, marginBottom:6 }}>{player.display_name}</div>
        <div style={{ display:'flex', justifyContent:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:`${tier.color}15`, color:tier.color, border:`1px solid ${tier.color}30`, fontWeight:700 }}>{tier.emoji} {tier.name}</span>
          <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:'rgba(74,222,128,0.1)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.25)', fontWeight:700 }}>RN {player.rn_role?.toUpperCase()||'MEMBER'}</span>
        </div>
      </div>

      <div style={{ padding:'16px 16px 32px' }}>
        {/* Rating cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
          {[{label:'DOUBLES ELO',val:calib?'?':player.rating_doubles||1000,c:tier.color},{label:'SINGLES ELO',val:player.rating_singles||1000,c:'#60a5fa'}].map(s=>(
            <div key={s.label} style={{ background:'rgba(0,0,0,0.4)', border:`1px solid ${s.c}22`, borderRadius:14, padding:'12px', textAlign:'center' }}>
              <div style={{ fontSize:9, color:'#475569', letterSpacing:1.5, fontWeight:700, marginBottom:4 }}>{s.label}</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:s.c }}>{s.val}</div>
            </div>
          ))}
        </div>
        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
          {[{v:player.total_games||0,l:'GAMES',c:'#93c5fd'},{v:player.total_wins||0,l:'WINS',c:'#4ade80'},{v:`${winPct}%`,l:'WIN RATE',c:'#fbbf24'}].map(s=>(
            <div key={s.l} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'10px 4px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:9, color:'#475569', letterSpacing:1, marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
        {/* Skill level */}
        {player.skill_level && (
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'12px 14px' }}>
            <div style={{ fontSize:9, color:'#475569', letterSpacing:2, fontWeight:700, marginBottom:6 }}>SKILL PROFILE</div>
            <div style={{ display:'flex', gap:10 }}>
              <span style={{ fontSize:12, color:'#94a3b8', textTransform:'capitalize' }}>🎯 {player.skill_level}</span>
              {player.play_frequency && <span style={{ fontSize:12, color:'#94a3b8' }}>📅 {player.play_frequency==='daily'?'5x/week':player.play_frequency==='few'?'2-3x/week':'1x/week'}</span>}
              {player.is_competitive && <span style={{ fontSize:12, color:'#fbbf24' }}>🏆 Competitive</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RN_Players({ onBack, currentUserId }) {
  const [players, setPlayers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter]     = useState('all')

  useEffect(() => {
    supabase.from('players').select('*').eq('is_rn_member', true).order('rating_doubles', { ascending:false })
      .then(({ data }) => { setPlayers(data||[]); setLoading(false) })
  }, [])

  if (selected) return <PlayerDetailPage player={selected} onBack={()=>setSelected(null)}/>

  const filtered = filter==='all' ? players : players.filter(p=>p.rn_role===filter)
  const coaches  = players.filter(p=>p.rn_role==='coach')
  const members  = players.filter(p=>p.rn_role!=='coach')

  return (
    <div style={{ position:'fixed', inset:0, zIndex:210, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes card-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderBottom:'1px solid rgba(74,222,128,0.1)', flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700 }}>← Back</button>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, color:'#4ade80', letterSpacing:3 }}>RN COMMUNITY</div>
          <div style={{ fontSize:10, color:'#334155' }}>{players.length} members · {coaches.length} coaches</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:6, padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
        {[{id:'all',l:'All'},{id:'coach',l:'Coaches'},{id:'member',l:'Players'}].map(f=>(
          <button key={f.id} onClick={()=>setFilter(f.id)} style={{ padding:'5px 14px', borderRadius:20, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700,
            background:filter===f.id?'rgba(74,222,128,0.1)':'transparent',
            border:filter===f.id?'1px solid rgba(74,222,128,0.35)':'1px solid rgba(255,255,255,0.08)',
            color:filter===f.id?'#4ade80':'#475569' }}>{f.l}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 32px' }}>
        {loading && <div style={{ textAlign:'center', color:'#475569', padding:40 }}>Loading...</div>}
        {!loading && filtered.length===0 && <div style={{ textAlign:'center', color:'#334155', padding:40 }}>No members yet</div>}
        {/* Coaches section */}
        {filter==='all' && coaches.length>0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:9, color:'#334155', letterSpacing:2, fontWeight:700, marginBottom:10 }}>COACHES</div>
            {coaches.map((p,i)=><PlayerRow key={p.id} player={p} idx={i} currentUserId={currentUserId} onTap={()=>setSelected(p)}/>)}
          </div>
        )}
        {/* Members */}
        {filter==='all' && <div style={{ fontSize:9, color:'#334155', letterSpacing:2, fontWeight:700, marginBottom:10 }}>PLAYERS</div>}
        {(filter==='all'?members:filtered).map((p,i)=><PlayerRow key={p.id} player={p} idx={i} currentUserId={currentUserId} onTap={()=>setSelected(p)}/>)}
      </div>
    </div>
  )
}

function PlayerRow({ player, idx, currentUserId, onTap }) {
  const tier   = getRatingTier(player.rating_doubles||1000)
  const calib  = isCalibrating(player.rating_doubles_games||0)
  const winPct = player.total_games>0?Math.round(player.total_wins/player.total_games*100):0
  const isCoach= player.rn_role==='coach'
  return (
    <div onClick={onTap} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', marginBottom:8, background:isCoach?'rgba(251,191,36,0.04)':'rgba(255,255,255,0.02)', border:`1px solid ${isCoach?'rgba(251,191,36,0.15)':'rgba(255,255,255,0.06)'}`, borderRadius:14, cursor:'pointer', animation:`card-in 0.3s ease-out ${idx*0.04}s both` }}>
      <div style={{ width:44, height:44, borderRadius:'50%', overflow:'hidden', border:`2px solid ${isCoach?'#fbbf24':tier.color}`, background:'#1a2a1a', flexShrink:0 }}>
        <img src={player.profile_pic||getAvatarUrl(player.id)} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{ e.target.onerror=null; e.target.src=getAvatarUrl(player.id) }}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:3 }}>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#f1f5f9', letterSpacing:0.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{player.display_name}</span>
          {isCoach && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, background:'rgba(251,191,36,0.12)', color:'#fbbf24', fontWeight:700, flexShrink:0 }}>COACH</span>}
          {player.id===currentUserId && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, background:'rgba(74,222,128,0.12)', color:'#4ade80', fontWeight:700, flexShrink:0 }}>YOU</span>}
        </div>
        <div style={{ fontSize:10, color:'#475569' }}>{tier.emoji} {tier.name} · {winPct}% WR</div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:tier.color }}>{calib?'?':player.rating_doubles||1000}</div>
        <div style={{ fontSize:9, color:'#334155', letterSpacing:1 }}>ELO</div>
      </div>
      <div style={{ fontSize:14, color:'#1e293b' }}>›</div>
    </div>
  )
}