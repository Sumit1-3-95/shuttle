// src/components/LogGame.jsx — Full Screen Court Takeover
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGameLogger } from '../hooks/useGameLogger'

function getLevel(wins) {
  if (wins >= 50) return { name:'LEGEND',    aura:'#ffd700', glow:'rgba(255,215,0,0.5)' }
  if (wins >= 30) return { name:'ELITE',     aura:'#c084fc', glow:'rgba(192,132,252,0.5)' }
  if (wins >= 15) return { name:'SMASH PRO', aura:'#38bdf8', glow:'rgba(56,189,248,0.5)' }
  if (wins >= 5)  return { name:'CONTENDER', aura:'#4ade80', glow:'rgba(74,222,128,0.5)' }
  return            { name:'ROOKIE',     aura:'#94a3b8', glow:'rgba(148,163,184,0.3)' }
}

function CourtPlayer({ player, side, size = 72 }) {
  const level = getLevel(player.total_wins || 0)
  return (
    <div style={{ textAlign: 'center', animation: 'player-drop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', margin: '0 auto 6px',
        background: `radial-gradient(circle at 35% 35%, ${level.aura}44, ${level.aura}11)`,
        border: `2.5px solid ${level.aura}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontFamily: "'Bebas Neue', sans-serif",
        color: level.aura, fontWeight: 700,
        boxShadow: `0 0 24px ${level.glow}, 0 0 8px ${level.glow}`,
        animation: 'float-player 2s ease-in-out infinite',
      }}>
        {player.display_name.charAt(0)}
      </div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: 1.5, color: '#f1f5f9' }}>
        {player.display_name}
      </div>
      <div style={{ fontSize: 10, color: level.aura, letterSpacing: 1 }}>{level.name}</div>
    </div>
  )
}

export default function LogGame({ onClose, onGameLogged }) {
  const { currentUser } = useAuth()
  const { getPlayers, logGame } = useGameLogger()

  const [players, setPlayers]       = useState([])
  const [teamA, setTeamA]           = useState([])
  const [teamB, setTeamB]           = useState([])
  const [selectingFor, setSelectingFor] = useState('A')
  const [scoreA, setScoreA]         = useState('')
  const [scoreB, setScoreB]         = useState('')
  const [step, setStep]             = useState(1)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [winner, setWinner]         = useState(null)
  const [shaking, setShaking]       = useState(false)
  const [countingA, setCountingA]   = useState(0)
  const [countingB, setCountingB]   = useState(0)

  useEffect(() => {
    getPlayers().then(r => { if (r.success) setPlayers(r.data) })
  }, [])

  // Animated score counter
  useEffect(() => {
    if (step !== 3 || !winner) return
    const targetA = parseInt(scoreA) || 0
    const targetB = parseInt(scoreB) || 0
    let frameA = 0, frameB = 0
    const total = 40
    const timer = setInterval(() => {
      frameA++; frameB++
      setCountingA(Math.round((frameA / total) * targetA))
      setCountingB(Math.round((frameB / total) * targetB))
      if (frameA >= total) clearInterval(timer)
    }, 30)
    return () => clearInterval(timer)
  }, [step, winner])

  function togglePlayer(pid) {
    if (selectingFor === 'A') {
      if (teamA.includes(pid)) { setTeamA(teamA.filter(x => x !== pid)); return }
      if (teamB.includes(pid)) return
      if (teamA.length < 2) setTeamA([...teamA, pid])
    } else {
      if (teamB.includes(pid)) { setTeamB(teamB.filter(x => x !== pid)); return }
      if (teamA.includes(pid)) return
      if (teamB.length < 2) setTeamB([...teamB, pid])
    }
  }

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))

  async function handleSubmit() {
    const sA = parseInt(scoreA), sB = parseInt(scoreB)
    if (isNaN(sA) || isNaN(sB) || sA < 0 || sB < 0) { setError('Enter valid scores'); return }
    if (sA === sB) { setError('Scores cannot be equal'); return }
    setLoading(true); setError('')
    const result = await logGame(teamA, teamB, sA, sB)
    setLoading(false)
    if (!result.success) { setError(result.message); return }
    const w = sA > sB ? 'A' : 'B'
    setWinner(w)
    setShaking(true)
    setTimeout(() => setShaking(false), 600)
    setStep(3)
    setTimeout(() => { onGameLogged && onGameLogged() }, 4000)
  }

  const canProceed = teamA.length === 2 && teamB.length === 2

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      fontFamily: "'Rajdhani', sans-serif",
      animation: 'court-enter 0.4s ease-out forwards',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&family=Teko:wght@400;500;600;700&display=swap');
        @keyframes court-enter { from{opacity:0;transform:scale(1.04)} to{opacity:1;transform:scale(1)} }
        @keyframes float-player { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes player-drop { from{transform:translateY(-30px) scale(0.8);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px) rotate(-1deg)} 40%{transform:translateX(8px) rotate(1deg)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
        @keyframes winner-burst { 0%{transform:scale(0.3) rotate(-10deg);opacity:0} 60%{transform:scale(1.08) rotate(2deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes confetti-drop { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(100px) rotate(540deg);opacity:0} }
        @keyframes slide-up-step { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes net-glow { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes score-pop { 0%{transform:scale(1)} 50%{transform:scale(1.15)} 100%{transform:scale(1)} }
        .player-chip { border-radius:12px; padding:10px 8px; cursor:pointer; transition:all 0.2s; text-align:center; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.03); }
        .player-chip:hover { transform:translateY(-2px); }
        .player-chip.in-a { background:rgba(74,222,128,0.12); border-color:rgba(74,222,128,0.4); }
        .player-chip.in-b { background:rgba(96,165,250,0.12); border-color:rgba(96,165,250,0.4); }
        .player-chip.disabled { opacity:0.25; cursor:not-allowed; }
        .score-box { background:rgba(0,0,0,0.5); border:2px solid rgba(255,255,255,0.1); color:#f1f5f9; font-family:'Bebas Neue',sans-serif; font-size:64px; text-align:center; border-radius:16px; width:100px; outline:none; padding:8px 0; transition:border 0.2s; }
        .score-box:focus { border-color:#4ade80; box-shadow:0 0 20px rgba(74,222,128,0.2); }
        .cta-btn { width:100%; background:linear-gradient(135deg,#14532d,#166534); border:1.5px solid #4ade80; color:#4ade80; font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:3px; padding:18px; border-radius:50px; cursor:pointer; transition:all 0.2s; }
        .cta-btn:hover:not(:disabled) { background:#166534; transform:translateY(-2px); box-shadow:0 8px 30px rgba(74,222,128,0.3); }
        .cta-btn:disabled { opacity:0.35; cursor:not-allowed; }
        .team-tab { flex:1; padding:12px; border-radius:12px; border:1.5px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.03); color:#475569; font-family:'Bebas Neue',sans-serif; font-size:18px; letter-spacing:2px; cursor:pointer; transition:all 0.2s; }
        .team-tab.a { background:rgba(74,222,128,0.12); border-color:#4ade80; color:#4ade80; }
        .team-tab.b { background:rgba(96,165,250,0.12); border-color:#60a5fa; color:#60a5fa; }
      `}</style>

      {/* Full court background */}
      <div style={{ position: 'absolute', inset: 0, background: '#061a0f' }}>
        <svg width="100%" height="100%" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice">
          <rect width="600" height="900" fill="#061a0f"/>
          <g stroke="#4ade80" fill="none">
            <rect x="30" y="30" width="540" height="840" strokeWidth="2" opacity="0.6"/>
            <rect x="70" y="30" width="460" height="840" strokeWidth="1" opacity="0.3"/>
            <line x1="300" y1="30" x2="300" y2="870" strokeWidth="2.5" opacity="0.7"/>
            <line x1="30" y1="210" x2="570" y2="210" strokeWidth="1" opacity="0.3"/>
            <line x1="30" y1="690" x2="570" y2="690" strokeWidth="1" opacity="0.3"/>
            <line x1="300" y1="210" x2="300" y2="690" strokeWidth="1" opacity="0.3"/>
            <line x1="30" y1="70" x2="570" y2="70" strokeWidth="1" opacity="0.15"/>
            <line x1="30" y1="830" x2="570" y2="830" strokeWidth="1" opacity="0.15"/>
          </g>
          {/* Net */}
          <rect x="290" y="0" width="20" height="900" fill="#22c55e" opacity="0.08"/>
          <rect x="294" y="0" width="12" height="900" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4" strokeDasharray="4 4"/>
          {/* Net center band */}
          <rect x="280" y="430" width="40" height="40" rx="4" fill="#1a3a1a" stroke="#4ade80" strokeWidth="1.5" opacity="0.8"/>
          <text x="300" y="456" textAnchor="middle" fill="#4ade80" fontSize="14" fontFamily="Bebas Neue" opacity="0.9">NET</text>
        </svg>
      </div>

      {/* Close button */}
      <button onClick={onClose} style={{
        position: 'absolute', top: 16, right: 16, zIndex: 60,
        background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)',
        color: '#64748b', borderRadius: '50%', width: 36, height: 36,
        cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>✕</button>

      {/* STEP 3 — WIN CELEBRATION */}
      {step === 3 && winner && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 70,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)',
          animation: shaking ? 'shake 0.6s ease-out' : 'none',
        }}>
          {/* Confetti burst */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${5 + Math.random() * 40}%`,
              left: `${Math.random() * 100}%`,
              fontSize: ['🏸','⭐','✨','🎯','💥'][i % 5],
              animation: `confetti-drop ${0.6 + Math.random() * 1.4}s ease-in ${Math.random() * 0.5}s forwards`,
            }}>{['🏸','⭐','✨','🎯','💥'][i % 5]}</div>
          ))}

          <div style={{ textAlign: 'center', animation: 'winner-burst 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#94a3b8', letterSpacing: 4, marginBottom: 4 }}>
              WINNER
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 80, color: '#ffd700',
              letterSpacing: 6, lineHeight: 1,
              textShadow: '0 0 40px rgba(255,215,0,0.8), 0 0 80px rgba(255,215,0,0.4)',
            }}>
              TEAM {winner}!
            </div>

            {/* Animated score */}
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: '#4ade80',
              letterSpacing: 8, margin: '12px 0',
              animation: 'score-pop 0.5s ease-out 0.3s both',
            }}>
              {countingA} — {countingB}
            </div>

            {/* Winning team avatars */}
            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 16 }}>
              {(winner === 'A' ? teamA : teamB).map(pid => {
                const p = playerMap[pid]
                if (!p) return null
                const level = getLevel(p.total_wins || 0)
                return (
                  <div key={pid} style={{ textAlign: 'center', animation: 'float-player 1.5s ease-in-out infinite' }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%', margin: '0 auto 8px',
                      background: `radial-gradient(circle, ${level.aura}44, ${level.aura}11)`,
                      border: `3px solid ${level.aura}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 30, fontFamily: "'Bebas Neue', sans-serif", color: level.aura,
                      boxShadow: `0 0 30px ${level.glow}`,
                    }}>{p.display_name.charAt(0)}</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{p.display_name}</div>
                    <div style={{ fontSize: 11, color: level.aura }}>{level.name}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 1 — TEAM SELECTION on court */}
      {step === 1 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column',
          animation: 'slide-up-step 0.3s ease-out',
        }}>
          {/* Court with players */}
          <div style={{ flex: 1, display: 'flex', position: 'relative', minHeight: 240 }}>
            {/* Team A side */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 3, color: '#4ade8088', marginBottom: 4 }}>
                TEAM A
              </div>
              {teamA.length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>Select 2 players</div>}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                {teamA.map(pid => playerMap[pid] && (
                  <CourtPlayer key={pid} player={playerMap[pid]} side="A" size={60}/>
                ))}
              </div>
            </div>

            {/* Team B side */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 3, color: '#60a5fa88', marginBottom: 4 }}>
                TEAM B
              </div>
              {teamB.length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>Select 2 players</div>}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                {teamB.map(pid => playerMap[pid] && (
                  <CourtPlayer key={pid} player={playerMap[pid]} side="B" size={60}/>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom panel */}
          <div style={{
            background: 'rgba(6,13,20,0.96)',
            borderTop: '1px solid rgba(74,222,128,0.15)',
            borderRadius: '24px 24px 0 0',
            padding: '20px 20px 32px',
            backdropFilter: 'blur(20px)',
          }}>
            {/* Team selector tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button className={`team-tab${selectingFor === 'A' ? ' a' : ''}`}
                onClick={() => setSelectingFor('A')}>
                TEAM A {teamA.length}/2
              </button>
              <button className={`team-tab${selectingFor === 'B' ? ' b' : ''}`}
                onClick={() => setSelectingFor('B')}>
                TEAM B {teamB.length}/2
              </button>
            </div>

            {/* Player chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              {players.map(p => {
                const inA = teamA.includes(p.id)
                const inB = teamB.includes(p.id)
                const disabled = (selectingFor === 'A' && inB) || (selectingFor === 'B' && inA)
                const level = getLevel(p.total_wins || 0)
                return (
                  <div key={p.id}
                    className={`player-chip${inA ? ' in-a' : inB ? ' in-b' : ''}${disabled ? ' disabled' : ''}`}
                    onClick={() => !disabled && togglePlayer(p.id)}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', margin: '0 auto 5px',
                      background: `${level.aura}18`, border: `1.5px solid ${(inA || inB) ? level.aura : level.aura + '44'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontFamily: "'Bebas Neue', sans-serif", color: level.aura,
                    }}>{p.display_name.charAt(0)}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: inA ? '#4ade80' : inB ? '#60a5fa' : '#64748b', letterSpacing: 0.5 }}>
                      {p.display_name}
                    </div>
                    <div style={{ fontSize: 9, color: level.aura, letterSpacing: 0.5 }}>{p.total_wins || 0}W</div>
                  </div>
                )
              })}
            </div>

            <button className="cta-btn" disabled={!canProceed} onClick={() => setStep(2)}>
              {canProceed ? 'NEXT — ENTER SCORE →' : `PICK ${2 - teamA.length + 2 - teamB.length} MORE PLAYERS`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — SCORE ENTRY */}
      {step === 2 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          animation: 'slide-up-step 0.3s ease-out',
        }}>
          {/* Teams on court (mini) */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#4ade8077', letterSpacing: 3, fontFamily: "'Bebas Neue', sans-serif", marginBottom: 10 }}>TEAM A</div>
              <div style={{ display: 'flex', gap: 12 }}>
                {teamA.map(pid => playerMap[pid] && <CourtPlayer key={pid} player={playerMap[pid]} size={52}/>)}
              </div>
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: '#1e3a2f', letterSpacing: 2 }}>VS</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#60a5fa77', letterSpacing: 3, fontFamily: "'Bebas Neue', sans-serif", marginBottom: 10 }}>TEAM B</div>
              <div style={{ display: 'flex', gap: 12 }}>
                {teamB.map(pid => playerMap[pid] && <CourtPlayer key={pid} player={playerMap[pid]} size={52}/>)}
              </div>
            </div>
          </div>

          {/* Score panel */}
          <div style={{
            background: 'rgba(6,13,20,0.96)', borderTop: '1px solid rgba(74,222,128,0.15)',
            borderRadius: '24px 24px 0 0', padding: '24px 20px 36px',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ fontSize: 12, color: '#334155', letterSpacing: 2, textAlign: 'center', marginBottom: 16, textTransform: 'uppercase', fontFamily: "'Rajdhani', sans-serif" }}>
              Enter Final Score
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#4ade80', letterSpacing: 1, marginBottom: 8, fontFamily: "'Bebas Neue', sans-serif" }}>TEAM A</div>
                <input className="score-box" type="number" min="0" max="99"
                  value={scoreA} onChange={e => setScoreA(e.target.value)} placeholder="21"/>
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: '#1e3a2f', marginTop: 20 }}>—</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#60a5fa', letterSpacing: 1, marginBottom: 8, fontFamily: "'Bebas Neue', sans-serif" }}>TEAM B</div>
                <input className="score-box" type="number" min="0" max="99"
                  value={scoreB} onChange={e => setScoreB(e.target.value)} placeholder="14"/>
              </div>
            </div>

            {scoreA && scoreB && scoreA !== scoreB && (
              <div style={{
                textAlign: 'center', marginBottom: 14, fontSize: 15, fontWeight: 700,
                color: '#4ade80', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2,
              }}>🏆 TEAM {parseInt(scoreA) > parseInt(scoreB) ? 'A' : 'B'} WINS</div>
            )}

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 10, marginBottom: 14, fontSize: 13, color: '#fca5a5', textAlign: 'center' }}>
                ❌ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, background: 'transparent', border: '1px solid #1e293b',
                color: '#475569', borderRadius: 50, padding: 14,
                cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2,
              }}>← BACK</button>
              <button className="cta-btn" style={{ flex: 2 }}
                disabled={!scoreA || !scoreB || loading}
                onClick={handleSubmit}>
                {loading ? 'SAVING...' : 'DECLARE WINNER 🏆'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}