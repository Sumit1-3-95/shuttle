// src/components/racquet-ninja/RacquetNinja.jsx — v2
// Clean branding home page
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import RN_Players     from './RN_Players'
import RN_Drills      from './RN_Drills'
import RN_Schedule    from './RN_Schedule'
import RN_Tournaments from './RN_Tournaments'
import RN_About       from './RN_About'

// Unsplash images — replace with real photos later
const HERO_IMG     = 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80' // shuttlecock close-up
const PLAYERS_IMG  = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80' // community
const DRILLS_IMG   = 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&q=80' // badminton action
const SCHEDULE_IMG = 'https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=600&q=80' // court top-down
const TOURN_IMG    = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80' // trophy / competition
const ABOUT_IMG    = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&q=80' // coach / training

function ImageCard({ img, title, subtitle, badge, badgeColor='#4ade80', accentColor='#4ade80', onClick }) {
  return (
    <div onClick={onClick} style={{ position:'relative', borderRadius:18, overflow:'hidden', cursor:'pointer', aspectRatio:'1/1' }}>
      {/* Background image */}
      <img src={img} alt={title} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
        onError={e=>{ e.target.style.display='none' }}/>
      {/* Gradient overlay */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,rgba(6,13,20,0.3) 0%,rgba(6,13,20,0.75) 60%,rgba(6,13,20,0.95) 100%)' }}/>
      {/* Accent top line */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${accentColor},transparent)` }}/>
      {/* Badge */}
      {badge && (
        <div style={{ position:'absolute', top:10, right:10, fontSize:9, padding:'2px 8px', borderRadius:20, background:`${badgeColor}22`, color:badgeColor, border:`1px solid ${badgeColor}44`, fontWeight:700, fontFamily:"'Rajdhani',sans-serif", letterSpacing:1 }}>{badge}</div>
      )}
      {/* Text */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'12px 14px' }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#fff', letterSpacing:2, lineHeight:1, marginBottom:3 }}>{title}</div>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', lineHeight:1.3 }}>{subtitle}</div>
      </div>
    </div>
  )
}

export default function RacquetNinja({ onClose, currentUser, currentPlayer }) {
  const [page, setPage]         = useState(null)
  const [isMember, setIsMember] = useState(false)
  const [rnRole, setRnRole]     = useState(null)
  const [drillCount, setDrillCount] = useState(0)

  useEffect(() => {
    if (currentPlayer) {
      setIsMember(!!currentPlayer.is_rn_member)
      setRnRole(currentPlayer.rn_role || null)
    }
    supabase.from('rn_drills').select('id', { count:'exact', head:true }).eq('is_active', true)
      .then(({ count }) => setDrillCount(count||0))
  }, [currentPlayer])

  const isCoach = rnRole === 'coach' || rnRole === 'admin'

  if (page === 'players')     return <RN_Players     onBack={()=>setPage(null)} currentUserId={currentUser?.id} isMember={isMember}/>
  if (page === 'drills')      return <RN_Drills      onBack={()=>setPage(null)} currentUserId={currentUser?.id} isMember={isMember} isCoach={isCoach}/>
  if (page === 'schedule')    return <RN_Schedule    onBack={()=>setPage(null)} currentUserId={currentUser?.id} isMember={isMember} isCoach={isCoach}/>
  if (page === 'tournaments') return <RN_Tournaments onBack={()=>setPage(null)} currentUserId={currentUser?.id} isMember={isMember}/>
  if (page === 'about')       return <RN_About       onBack={()=>setPage(null)}/>

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'#060d14', display:'flex', flexDirection:'column', fontFamily:"'Rajdhani',sans-serif", color:'#f1f5f9', overflowY:'auto' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes ninja-glow { 0%,100%{opacity:0.6} 50%{opacity:1} }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
      `}</style>

      {/* ── HERO ── */}
      <div style={{ position:'relative', height:340, flexShrink:0, overflow:'hidden' }}>
        {/* Hero background image */}
        <img src={HERO_IMG} alt="Racquet Ninja" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
          onError={e=>e.target.style.display='none'}/>
        {/* Dark overlay — heavier at bottom */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(6,13,20,0.4) 0%, rgba(6,13,20,0.7) 50%, rgba(6,13,20,1) 100%)' }}/>

        {/* Close button */}
        <button onClick={onClose} style={{ position:'absolute', top:14, right:16, zIndex:2, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.12)', color:'#94a3b8', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, backdropFilter:'blur(8px)' }}>✕</button>

        {/* Logo + title */}
        <div style={{ position:'absolute', bottom:28, left:16, right:16, zIndex:2 }}>
          {/* Membership badge */}
          <div style={{ marginBottom:10 }}>
            {isMember ? (
              <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:'rgba(74,222,128,0.15)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.3)', fontWeight:700, letterSpacing:1 }}>
                ● {isCoach ? 'COACH' : 'MEMBER'}
              </span>
            ) : (
              <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,0.06)', color:'#475569', border:'1px solid rgba(255,255,255,0.1)', fontWeight:700, letterSpacing:1 }}>
                VISITOR
              </span>
            )}
          </div>

          {/* Name with green highlight on NINJA */}
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", lineHeight:0.95, marginBottom:8 }}>
            <div style={{ fontSize:48, color:'#ffffff', letterSpacing:5 }}>RACQUET</div>
            <div style={{ fontSize:48, letterSpacing:5, display:'inline-block', position:'relative' }}>
              <span style={{ color:'#4ade80', textShadow:'0 0 30px rgba(74,222,128,0.5)' }}>NINJA</span>
              {/* Underline accent */}
              <div style={{ position:'absolute', bottom:-4, left:0, right:0, height:3, background:'linear-gradient(90deg,#4ade80,transparent)', borderRadius:2 }}/>
            </div>
          </div>

          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', letterSpacing:3, fontWeight:700 }}>BADMINTON ACADEMY</div>
        </div>
      </div>

      {/* ── SECTION CARDS ── */}
      <div style={{ padding:'20px 16px 32px', flex:1 }}>
        {/* Tagline */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:'#334155', letterSpacing:2, fontWeight:700, textTransform:'uppercase' }}>Train. Play. Dominate.</div>
        </div>

        {/* 2×2 grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <ImageCard
            img={PLAYERS_IMG}
            title="COMMUNITY"
            subtitle="RN players & coaches"
            accentColor="#4ade80"
            onClick={()=>setPage('players')}
          />
          <ImageCard
            img={DRILLS_IMG}
            title="TRAINING"
            subtitle={`${drillCount} drills — warm up to cool down`}
            accentColor="#60a5fa"
            onClick={()=>setPage('drills')}
          />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <ImageCard
            img={TOURN_IMG}
            title="TOURNAMENTS"
            subtitle="Compete and climb ranks"
            accentColor="#fbbf24"
            badge="SOON"
            badgeColor="#fbbf24"
            onClick={()=>setPage('tournaments')}
          />
          <ImageCard
            img={SCHEDULE_IMG}
            title="BOOK A MATCH"
            subtitle="Sessions & open challenges"
            accentColor="#c084fc"
            badge={isMember ? null : 'MEMBERS'}
            badgeColor="#c084fc"
            onClick={()=>setPage('schedule')}
          />
        </div>

        {/* Join CTA for non-members */}
        {!isMember && (
          <div style={{ marginTop:20, padding:'14px 16px', background:'linear-gradient(135deg,rgba(74,222,128,0.08),rgba(74,222,128,0.03))', border:'1px solid rgba(74,222,128,0.15)', borderRadius:16, textAlign:'center' }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:'#4ade80', letterSpacing:2, marginBottom:4 }}>JOIN RACQUET NINJA</div>
            <div style={{ fontSize:12, color:'#475569' }}>DM us on Instagram or WhatsApp to enroll and unlock all features</div>
          </div>
        )}
      </div>
    </div>
  )
}