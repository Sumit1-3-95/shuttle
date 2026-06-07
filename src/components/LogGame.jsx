// src/components/LogGame.jsx — v7
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGameLogger } from '../hooks/useGameLogger'
import CourtBackground from './CourtBackground'
import { getAvatarUrl } from '../utils/avatars'
import { supabase } from '../supabaseClient'

function getLevel(wins) {
  if (wins >= 50) return { name:'LEGEND',    aura:'#ffd700', glow:'rgba(255,215,0,0.6)',   power:100 }
  if (wins >= 30) return { name:'ELITE',     aura:'#c084fc', glow:'rgba(192,132,252,0.6)', power:80 }
  if (wins >= 15) return { name:'SMASH PRO', aura:'#38bdf8', glow:'rgba(56,189,248,0.6)',  power:60 }
  if (wins >= 5)  return { name:'CONTENDER', aura:'#4ade80', glow:'rgba(74,222,128,0.6)',  power:40 }
  return            { name:'ROOKIE',     aura:'#94a3b8', glow:'rgba(148,163,184,0.4)', power:20 }
}

const SKILLS_DEF = [
  { key:'bullet_smash',   label:'Smash',   icon:'💥', type:'skill' },
  { key:'killer_drop',    label:'Drop',    icon:'🎯', type:'skill' },
  { key:'service_streak', label:'Service', icon:'🔥', type:'skill' },
  { key:'unforced_error', label:'Error',   icon:'😬', type:'flaw' },
  { key:'nervous_net',    label:'Net',     icon:'😰', type:'flaw' },
  { key:'forced_out',     label:'Out',     icon:'💨', type:'flaw' },
]

function PAv({ player, size=60, float=false, dim=false }) {
  const level = getLevel(player.total_wins||0)
  const [err, setErr] = useState(false)
  return (
    <div style={{ textAlign:'center', opacity:dim?0.4:1, animation:float?'float-player 2s ease-in-out infinite':'none' }}>
      <div style={{ position:'relative', width:size, height:size, margin:'0 auto 4px' }}>
        <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', border:`2.5px solid ${level.aura}`, boxShadow:`0 0 12px ${level.glow}`, background:'#1a2a1a' }}>
          {!err
            ? <img src={getAvatarUrl(player.id)} width={size} height={size} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setErr(true)}/>
            : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Bebas Neue',sans-serif",fontSize:size*0.4,color:level.aura}}>{player.display_name.charAt(0)}</div>
          }
        </div>
        <div style={{ position:'absolute', bottom:-2, left:'50%', transform:'translateX(-50%)', width:size*0.7, height:3, background:'rgba(0,0,0,0.5)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${level.power}%`, background:level.aura }}/>
        </div>
      </div>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:Math.max(10,size*0.17), letterSpacing:1, color:'#f1f5f9', lineHeight:1 }}>{player.display_name}</div>
    </div>
  )
}

// ── Skills overlay — court style 2x2 ─────────────────────────
function SkillsSheet({ playerMap, teamA, teamB, winner, onSubmit, onSkip }) {
  const [sel, setSel] = useState({})

  function toggle(pid, key) {
    setSel(prev => {
      const s = new Set(prev[pid]||[])
      s.has(key) ? s.delete(key) : s.add(key)
      return { ...prev, [pid]: s }
    })
  }

  const anySelected = Object.values(sel).some(s => s.size > 0)

  // Team A top, Team B bottom — each side has 2 players
  return (
    <div style={{ position:'absolute', inset:0, zIndex:60, display:'flex', flexDirection:'column', animation:'sheet-fade 0.3s ease-out' }}>

      {/* Court background */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
        <CourtBackground style={{ height:'100%' }}/>
        <div style={{ position:'absolute', inset:0, background:'rgba(6,13,20,0.82)' }}/>
      </div>

      {/* Content */}
      <div style={{ position:'relative', zIndex:1, flex:1, display:'flex', flexDirection:'column', padding:'14px 14px 0' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:'#f1f5f9', letterSpacing:2 }}>Tag Highlights</div>
            <div style={{ fontSize:11, color:'#475569', fontFamily:"'Rajdhani',sans-serif" }}>Optional · tap any standout moments</div>
          </div>
          <button onClick={onSkip} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#475569', borderRadius:20, padding:'5px 12px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700 }}>Skip</button>
        </div>

        {/* Court split: Team A top, Team B bottom */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10, minHeight:0 }}>

          {/* Team A row */}
          <div style={{ flex:1, display:'flex', gap:8, alignItems:'stretch' }}>
            {/* Team A label — left */}
            <div style={{ display:'flex', alignItems:'center', width:20 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:10, color:'#4ade8066', letterSpacing:2, writingMode:'vertical-rl', transform:'rotate(180deg)' }}>TEAM A</div>
            </div>
            {teamA.map(pid => {
              const p = playerMap[pid]; if (!p) return null
              const level = getLevel(p.total_wins||0)
              const pSel = sel[pid]||new Set()
              return (
                <div key={pid} style={{ flex:1, background:'rgba(74,222,128,0.04)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:12, padding:'8px 8px 6px', display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                  <PAv player={p} size={44}/>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, justifyContent:'center' }}>
                    {SKILLS_DEF.map(s => {
                      const on = pSel.has(s.key)
                      const isSkill = s.type==='skill'
                      return (
                        <button key={s.key} onClick={()=>toggle(pid,s.key)} style={{
                          display:'flex', alignItems:'center', gap:2, padding:'3px 6px',
                          borderRadius:20, border:`1px solid ${on?(isSkill?'#4ade80':'#f87171'):'rgba(255,255,255,0.1)'}`,
                          background:on?(isSkill?'rgba(74,222,128,0.2)':'rgba(248,113,113,0.2)'):'rgba(0,0,0,0.3)',
                          color:on?(isSkill?'#4ade80':'#f87171'):'#475569',
                          fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700,
                          cursor:'pointer', transition:'all 0.15s',
                        }}>
                          <span style={{fontSize:10}}>{s.icon}</span>
                          <span>{s.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Net divider */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 4px' }}>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }}/>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:10, color:'#1e3a2f', letterSpacing:2 }}>NET</div>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }}/>
          </div>

          {/* Team B row */}
          <div style={{ flex:1, display:'flex', gap:8, alignItems:'stretch' }}>
            <div style={{ display:'flex', alignItems:'center', width:20 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:10, color:'#60a5fa66', letterSpacing:2, writingMode:'vertical-rl', transform:'rotate(180deg)' }}>TEAM B</div>
            </div>
            {teamB.map(pid => {
              const p = playerMap[pid]; if (!p) return null
              const pSel = sel[pid]||new Set()
              return (
                <div key={pid} style={{ flex:1, background:'rgba(96,165,250,0.04)', border:'1px solid rgba(96,165,250,0.15)', borderRadius:12, padding:'8px 8px 6px', display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                  <PAv player={p} size={44}/>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, justifyContent:'center' }}>
                    {SKILLS_DEF.map(s => {
                      const on = pSel.has(s.key)
                      const isSkill = s.type==='skill'
                      return (
                        <button key={s.key} onClick={()=>toggle(pid,s.key)} style={{
                          display:'flex', alignItems:'center', gap:2, padding:'3px 6px',
                          borderRadius:20, border:`1px solid ${on?(isSkill?'#4ade80':'#f87171'):'rgba(255,255,255,0.1)'}`,
                          background:on?(isSkill?'rgba(74,222,128,0.2)':'rgba(248,113,113,0.2)'):'rgba(0,0,0,0.3)',
                          color:on?(isSkill?'#4ade80':'#f87171'):'#475569',
                          fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700,
                          cursor:'pointer', transition:'all 0.15s',
                        }}>
                          <span style={{fontSize:10}}>{s.icon}</span>
                          <span>{s.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ position:'relative', zIndex:1, padding:'10px 14px 24px' }}>
        <button onClick={()=>onSubmit(sel)} style={{
          width:'100%',
          background: anySelected?'linear-gradient(135deg,#14532d,#166534)':'rgba(255,255,255,0.04)',
          border:`1.5px solid ${anySelected?'#4ade80':'rgba(255,255,255,0.1)'}`,
          color: anySelected?'#4ade80':'#475569',
          fontFamily:"'Bebas Neue',sans-serif", fontSize:19, letterSpacing:3,
          padding:'15px', borderRadius:50, cursor:'pointer', transition:'all 0.2s',
        }}>SUBMIT</button>
      </div>
    </div>
  )
}

export default function LogGame({ onClose, onGameLogged }) {
  const { currentUser } = useAuth()
  const { getPlayers, logGame } = useGameLogger()

  const [players, setPlayers]           = useState([])
  const [teamA, setTeamA]               = useState([])
  const [teamB, setTeamB]               = useState([])
  const [selectingFor, setSelectingFor] = useState('A')
  const [scoreA, setScoreA]             = useState('')
  const [scoreB, setScoreB]             = useState('')
  const [step, setStep]                 = useState(1)
  const [showSkills, setShowSkills]     = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [winner, setWinner]             = useState(null)
  const [gameId, setGameId]             = useState(null)
  const [countA, setCountA]             = useState(0)
  const [countB, setCountB]             = useState(0)

  useEffect(() => { getPlayers().then(r => { if (r.success) setPlayers(r.data) }) }, [])

  useEffect(() => {
    if (step!==3||!winner) return
    const tA=parseInt(scoreA)||0, tB=parseInt(scoreB)||0; let f=0
    const t=setInterval(()=>{ f++; setCountA(Math.round((f/40)*tA)); setCountB(Math.round((f/40)*tB)); if(f>=40) clearInterval(t) },30)
    return ()=>clearInterval(t)
  },[step,winner])

  function togglePlayer(pid) {
    if (selectingFor==='A') {
      if (teamA.includes(pid)) { setTeamA(teamA.filter(x=>x!==pid)); return }
      if (teamB.includes(pid)) return
      if (teamA.length<2) { const nA=[...teamA,pid]; setTeamA(nA); if(nA.length===2) setSelectingFor('B') }
    } else {
      if (teamB.includes(pid)) { setTeamB(teamB.filter(x=>x!==pid)); return }
      if (teamA.includes(pid)) return
      if (teamB.length<2) setTeamB([...teamB,pid])
    }
  }

  function handleScoreAChange(val) { setScoreA(val); if(val&&!scoreB) setScoreB('21') }
  function handleScoreBChange(val) { setScoreB(val); if(val&&!scoreA) setScoreA('21') }

  const playerMap = Object.fromEntries(players.map(p=>[p.id,p]))
  const canProceed = teamA.length===2&&teamB.length===2
  function teamLabel(team) { return team.map(pid=>playerMap[pid]?.display_name||'?').join(' · ') }

  async function handleSubmit() {
    const sA=parseInt(scoreA),sB=parseInt(scoreB)
    if (isNaN(sA)||isNaN(sB)||sA<0||sB<0) { setError('Enter valid scores'); return }
    if (sA===sB) { setError('Scores cannot be equal'); return }
    setLoading(true); setError('')
    const result = await logGame(teamA, teamB, sA, sB)
    setLoading(false)
    if (!result.success) { setError(result.message); return }
    setGameId(result.game?.id); setWinner(sA>sB?'A':'B'); setShowSkills(true)
  }

  async function handleSkillsSubmit(selected) {
    if (gameId && selected) {
      const rows=[]
      Object.entries(selected).forEach(([pid,keys])=>{
        keys.forEach(key=>{
          const meta=SKILLS_DEF.find(s=>s.key===key)
          if(meta) rows.push({game_id:gameId,player_id:pid,skill_key:key,skill_type:meta.type,logged_by:currentUser.id})
        })
      })
      if(rows.length>0) await supabase.from('game_skills').insert(rows)
    }
    setShowSkills(false); setStep(3)
    setTimeout(()=>{ onGameLogged&&onGameLogged() },4000)
  }

  const winTeam=winner==='A'?teamA:teamB
  const loseTeam=winner==='A'?teamB:teamA

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, fontFamily:"'Rajdhani',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes float-player{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes celebrate-in{0%{transform:scale(0.4) rotate(-8deg);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @keyframes confetti-drop{0%{transform:translateY(-10px) rotate(0);opacity:1}100%{transform:translateY(120px) rotate(540deg);opacity:0}}
        @keyframes panel-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes player-land{from{transform:translateY(-20px) scale(0.8);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
        @keyframes score-pop{0%{transform:scale(1)}50%{transform:scale(1.18)}100%{transform:scale(1)}}
        @keyframes sheet-fade{from{opacity:0}to{opacity:1}}
        .pc{border-radius:12px;padding:8px 4px;cursor:pointer;transition:all 0.2s;text-align:center;border:1px solid rgba(255,255,255,0.1);background:rgba(0,0,0,0.45);}
        .pc:hover{transform:translateY(-2px);}
        .pc.a{background:rgba(74,222,128,0.18);border-color:rgba(74,222,128,0.55);}
        .pc.b{background:rgba(96,165,250,0.18);border-color:rgba(96,165,250,0.55);}
        .pc.d{opacity:0.2;cursor:not-allowed;pointer-events:none;}
        .sb{background:rgba(0,0,0,0.7);border:2px solid rgba(255,255,255,0.15);color:#f1f5f9;font-family:'Bebas Neue',sans-serif;font-size:64px;text-align:center;border-radius:16px;width:100px;outline:none;padding:6px 0;-webkit-appearance:none;transition:border 0.2s;}
        .sb:focus{border-color:#4ade80;box-shadow:0 0 20px rgba(74,222,128,0.25);}
        .cb{width:100%;background:linear-gradient(135deg,#14532d,#166534);border:1.5px solid #4ade80;color:#4ade80;font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:3px;padding:16px;border-radius:50px;cursor:pointer;transition:all 0.2s;}
        .cb:disabled{opacity:0.35;cursor:not-allowed;}
        .tt{flex:1;padding:12px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.1);background:rgba(0,0,0,0.45);color:#475569;font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;cursor:pointer;transition:all 0.2s;}
        .tt.a{background:rgba(74,222,128,0.15);border-color:#4ade80;color:#4ade80;}
        .tt.b{background:rgba(96,165,250,0.15);border-color:#60a5fa;color:#60a5fa;}
      `}</style>

      {/* Skills overlay */}
      {showSkills && (
        <SkillsSheet playerMap={playerMap} teamA={teamA} teamB={teamB} winner={winner}
          onSubmit={handleSkillsSubmit} onSkip={()=>handleSkillsSubmit({})}/>
      )}

      {/* CELEBRATE */}
      {step===3&&winner&&(
        <div style={{position:'absolute',inset:0,zIndex:80,background:'rgba(0,0,0,0.9)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20}}>
          {Array.from({length:24}).map((_,i)=>(
            <div key={i} style={{position:'absolute',top:`${5+Math.random()*35}%`,left:`${Math.random()*100}%`,fontSize:20,animation:`confetti-drop ${0.7+Math.random()*1.3}s ease-in ${Math.random()*0.4}s forwards`}}>
              {['🏸','⭐','✨','💫','🎯','💥'][i%6]}
            </div>
          ))}
          <div style={{textAlign:'center',animation:'celebrate-in 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',width:'100%',maxWidth:360}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:'#64748b',letterSpacing:4}}>WINNER</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:72,color:'#ffd700',letterSpacing:5,lineHeight:1,textShadow:'0 0 40px rgba(255,215,0,0.8)',marginBottom:4}}>TEAM {winner}!</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:48,color:'#4ade80',letterSpacing:8,marginBottom:20,animation:'score-pop 0.4s ease-out 0.4s both'}}>{countA} — {countB}</div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:'#ffd700',letterSpacing:2,marginBottom:10,fontWeight:700,fontFamily:"'Rajdhani',sans-serif"}}>🏆 WINNERS</div>
              <div style={{display:'flex',gap:20,justifyContent:'center'}}>
                {winTeam.map(pid=>playerMap[pid]&&<div key={pid} style={{animation:'float-player 1.5s ease-in-out infinite'}}><PAv player={playerMap[pid]} size={76} float/></div>)}
              </div>
            </div>
            <div>
              <div style={{fontSize:10,color:'#475569',letterSpacing:2,marginBottom:8,fontFamily:"'Rajdhani',sans-serif"}}>RUNNERS UP</div>
              <div style={{display:'flex',gap:14,justifyContent:'center'}}>
                {loseTeam.map(pid=>playerMap[pid]&&<PAv key={pid} player={playerMap[pid]} size={44} dim/>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1 TEAMS */}
      {step===1&&!showSkills&&(
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column'}}>
          <div style={{flex:1,position:'relative',minHeight:0}}>
            <CourtBackground style={{height:'100%'}}>
              <button onClick={onClose} style={{position:'absolute',top:12,right:12,zIndex:20,background:'rgba(0,0,0,0.6)',border:'1px solid rgba(255,255,255,0.15)',color:'#94a3b8',borderRadius:'50%',width:34,height:34,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>

              {/* Team A label — top LEFT */}
              <div style={{position:'absolute',top:12,left:14,zIndex:5}}>
                <div style={{background:'rgba(0,0,0,0.65)',borderRadius:10,padding:'5px 12px',border:'1px solid rgba(74,222,128,0.35)',display:'inline-block'}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:'#4ade80',letterSpacing:2,lineHeight:1}}>TEAM A</div>
                  {teamA.length>0&&<div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:11,color:'rgba(74,222,128,0.8)',fontWeight:600,marginTop:1}}>{teamLabel(teamA)}</div>}
                </div>
              </div>

              {/* Team A players — upper court, clear of label */}
              <div style={{position:'absolute',top:'22%',left:0,right:0,display:'flex',justifyContent:'center',gap:28}}>
                {teamA.map((pid,i)=>playerMap[pid]&&(
                  <div key={pid} style={{animation:`player-land 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i*0.1}s both`}}>
                    <PAv player={playerMap[pid]} size={66} float/>
                  </div>
                ))}
              </div>

              {/* Team B label — bottom LEFT, above players */}
              <div style={{position:'absolute',bottom:'36%',left:14,zIndex:5}}>
                <div style={{background:'rgba(0,0,0,0.65)',borderRadius:10,padding:'5px 12px',border:'1px solid rgba(96,165,250,0.35)',display:'inline-block'}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:'#60a5fa',letterSpacing:2,lineHeight:1}}>TEAM B</div>
                  {teamB.length>0&&<div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:11,color:'rgba(96,165,250,0.8)',fontWeight:600,marginTop:1}}>{teamLabel(teamB)}</div>}
                </div>
              </div>

              {/* Team B players — lower court */}
              <div style={{position:'absolute',bottom:'16%',left:0,right:0,display:'flex',justifyContent:'center',gap:28}}>
                {teamB.map((pid,i)=>playerMap[pid]&&(
                  <div key={pid} style={{animation:`player-land 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i*0.1}s both`}}>
                    <PAv player={playerMap[pid]} size={66} float/>
                  </div>
                ))}
              </div>
            </CourtBackground>
          </div>

          {/* Bottom panel */}
          <div style={{background:'rgba(6,13,20,0.98)',borderTop:'1px solid rgba(74,222,128,0.15)',borderRadius:'22px 22px 0 0',padding:'16px 14px 24px',animation:'panel-up 0.3s ease-out'}}>
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              <button className={`tt${selectingFor==='A'?' a':''}`} onClick={()=>setSelectingFor('A')}>TEAM A {teamA.length}/2{teamA.length===2?' ✓':''}</button>
              <button className={`tt${selectingFor==='B'?' b':''}`} onClick={()=>setSelectingFor('B')}>TEAM B {teamB.length}/2{teamB.length===2?' ✓':''}</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
              {players.map(p=>{
                const inA=teamA.includes(p.id),inB=teamB.includes(p.id)
                const disabled=(selectingFor==='A'&&inB)||(selectingFor==='B'&&inA)
                const level=getLevel(p.total_wins||0)
                return(
                  <div key={p.id} className={`pc${inA?' a':inB?' b':''}${disabled?' d':''}`} onClick={()=>!disabled&&togglePlayer(p.id)}>
                    <div style={{width:42,height:42,borderRadius:'50%',overflow:'hidden',border:`2px solid ${(inA||inB)?level.aura:level.aura+'44'}`,margin:'0 auto 5px',background:'#1a2a1a',position:'relative'}}>
                      <img src={getAvatarUrl(p.id)} width={42} height={42} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                      <div style={{position:'absolute',bottom:0,left:0,right:0,height:2.5,background:'rgba(0,0,0,0.5)'}}>
                        <div style={{height:'100%',width:`${level.power}%`,background:level.aura}}/>
                      </div>
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:inA?'#4ade80':inB?'#60a5fa':'#94a3b8',fontFamily:"'Rajdhani',sans-serif"}}>{p.display_name}</div>
                    <div style={{fontSize:9,color:level.aura}}>{p.total_wins||0}W</div>
                  </div>
                )
              })}
            </div>
            <button className="cb" disabled={!canProceed} onClick={()=>setStep(2)}>
              {canProceed?'ENTER SCORE →':`SELECT ${(2-teamA.length)+(2-teamB.length)} MORE`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 SCORE */}
      {step===2&&!showSkills&&(
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
          <div style={{flex:1,position:'relative',minHeight:0}}>
            <CourtBackground style={{height:'100%'}}>
              {/* Team A — top left label + players */}
              <div style={{position:'absolute',top:12,left:14,zIndex:5}}>
                <div style={{background:'rgba(0,0,0,0.65)',borderRadius:10,padding:'5px 12px',border:'1px solid rgba(74,222,128,0.35)',display:'inline-block'}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:'#4ade80',letterSpacing:2,lineHeight:1}}>TEAM A</div>
                  <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:11,color:'rgba(74,222,128,0.8)',fontWeight:600,marginTop:1}}>{teamLabel(teamA)}</div>
                </div>
              </div>
              <div style={{position:'absolute',top:'22%',left:0,right:0,display:'flex',justifyContent:'center',gap:24}}>
                {teamA.map(pid=>playerMap[pid]&&<div key={pid} style={{animation:'float-player 2s ease-in-out infinite'}}><PAv player={playerMap[pid]} size={56}/></div>)}
              </div>
              {/* Team B — bottom left label + players */}
              <div style={{position:'absolute',bottom:'36%',left:14,zIndex:5}}>
                <div style={{background:'rgba(0,0,0,0.65)',borderRadius:10,padding:'5px 12px',border:'1px solid rgba(96,165,250,0.35)',display:'inline-block'}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:'#60a5fa',letterSpacing:2,lineHeight:1}}>TEAM B</div>
                  <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:11,color:'rgba(96,165,250,0.8)',fontWeight:600,marginTop:1}}>{teamLabel(teamB)}</div>
                </div>
              </div>
              <div style={{position:'absolute',bottom:'14%',left:0,right:0,display:'flex',justifyContent:'center',gap:24}}>
                {teamB.map(pid=>playerMap[pid]&&<div key={pid} style={{animation:'float-player 2s ease-in-out infinite 0.5s'}}><PAv player={playerMap[pid]} size={56}/></div>)}
              </div>
            </CourtBackground>
          </div>

          <div style={{background:'rgba(6,13,20,0.98)',borderTop:'1px solid rgba(74,222,128,0.15)',borderRadius:'22px 22px 0 0',padding:'20px 16px 30px',animation:'panel-up 0.3s ease-out'}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,color:'#64748b',letterSpacing:3,textAlign:'center',marginBottom:16}}>FINAL SCORE</div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginBottom:14}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:'#4ade80',letterSpacing:2,marginBottom:8}}>TEAM A</div>
                <input className="sb" type="number" inputMode="numeric" pattern="[0-9]*" min="0" max="99" value={scoreA} onChange={e=>handleScoreAChange(e.target.value)} placeholder="21" autoFocus/>
              </div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:'#1e3a2f',marginTop:22}}>—</div>
              <div style={{textAlign:'center'}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:'#60a5fa',letterSpacing:2,marginBottom:8}}>TEAM B</div>
                <input className="sb" type="number" inputMode="numeric" pattern="[0-9]*" min="0" max="99" value={scoreB} onChange={e=>handleScoreBChange(e.target.value)} placeholder="14"/>
              </div>
            </div>
            {scoreA&&scoreB&&scoreA!==scoreB&&(
              <div style={{textAlign:'center',marginBottom:12,fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:'#4ade80',letterSpacing:2}}>
                🏆 TEAM {parseInt(scoreA)>parseInt(scoreB)?'A':'B'} WINS
              </div>
            )}
            {error&&<div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:10,padding:10,marginBottom:12,fontSize:13,color:'#fca5a5',textAlign:'center'}}>❌ {error}</div>}
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setStep(1)} style={{flex:1,background:'transparent',border:'1px solid #1e293b',color:'#475569',borderRadius:50,padding:14,cursor:'pointer',fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:2}}>← BACK</button>
              <button className="cb" style={{flex:2}} disabled={!scoreA||!scoreB||loading} onClick={handleSubmit}>
                {loading?'SAVING...':'DECLARE WINNER 🏆'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}