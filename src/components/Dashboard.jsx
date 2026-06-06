// src/components/Dashboard.jsx — Full Hype Redesign
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRealtimeDashboard } from '../hooks/useRealtimeDashboard'
import LogGame from './LogGame'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&family=Teko:wght@300;400;500;600;700&display=swap');`

function getLevel(wins) {
  if (wins >= 50) return { name:'LEGEND',    tier:5, aura:'#ffd700', bg:'#2a1f00', glow:'rgba(255,215,0,0.4)',   emoji:'👑' }
  if (wins >= 30) return { name:'ELITE',     tier:4, aura:'#c084fc', bg:'#1a0f2e', glow:'rgba(192,132,252,0.4)', emoji:'⚡' }
  if (wins >= 15) return { name:'SMASH PRO', tier:3, aura:'#38bdf8', bg:'#001f2e', glow:'rgba(56,189,248,0.4)',  emoji:'🔥' }
  if (wins >= 5)  return { name:'CONTENDER', tier:2, aura:'#4ade80', bg:'#001a0f', glow:'rgba(74,222,128,0.35)', emoji:'⚔️' }
  return            { name:'ROOKIE',     tier:1, aura:'#94a3b8', bg:'#111827', glow:'rgba(148,163,184,0.2)', emoji:'🎯' }
}

function PlayerCard({ player, rank, onClick }) {
  const level = getLevel(player.total_wins || 0)
  const winPct = player.total_games > 0 ? Math.round((player.total_wins / player.total_games) * 100) : 0
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick && onClick(player)}
      style={{
        position: 'relative',
        background: level.bg,
        border: `1.5px solid ${hovered ? level.aura : level.aura + '44'}`,
        borderRadius: 16,
        padding: '16px 14px 14px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: hovered ? `0 12px 40px ${level.glow}, 0 0 0 1px ${level.aura}33` : `0 4px 16px rgba(0,0,0,0.4)`,
        overflow: 'hidden',
      }}>

      {/* Holographic shine overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 16,
        background: hovered
          ? `linear-gradient(135deg, ${level.aura}15 0%, transparent 50%, ${level.aura}08 100%)`
          : 'transparent',
        transition: 'all 0.3s',
        pointerEvents: 'none',
      }}/>

      {/* Rank badge */}
      <div style={{
        position: 'absolute', top: 10, left: 10,
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 13, color: rank <= 3 ? level.aura : '#334155',
        letterSpacing: 1,
      }}>#{rank}</div>

      {/* Streak badge */}
      {player.current_streak >= 3 && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.5)',
          borderRadius: 20, padding: '2px 7px',
          fontSize: 11, fontWeight: 700, color: '#fb923c',
          fontFamily: "'Rajdhani', sans-serif",
        }}>🔥{player.current_streak}</div>
      )}

      {/* Avatar circle */}
      <div style={{
        width: 56, height: 56, borderRadius: '50%', margin: '16px auto 10px',
        background: `radial-gradient(circle at 35% 35%, ${level.aura}33, ${level.aura}11)`,
        border: `2px solid ${level.aura}88`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, fontWeight: 700,
        fontFamily: "'Bebas Neue', sans-serif",
        color: level.aura,
        boxShadow: hovered ? `0 0 20px ${level.glow}` : 'none',
        transition: 'box-shadow 0.3s',
        position: 'relative',
      }}>
        {player.display_name.charAt(0)}
        {/* Level tier glow ring for tier 4+ */}
        {level.tier >= 4 && (
          <div style={{
            position: 'absolute', inset: -4, borderRadius: '50%',
            border: `1px solid ${level.aura}`,
            animation: 'spin-ring 4s linear infinite',
            borderTopColor: 'transparent', borderRightColor: 'transparent',
          }}/>
        )}
      </div>

      {/* Name */}
      <div style={{
        textAlign: 'center', fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 20, letterSpacing: 2, color: '#f1f5f9', marginBottom: 2,
      }}>{player.display_name}</div>

      {/* Level badge */}
      <div style={{
        textAlign: 'center', marginBottom: 10,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
          padding: '2px 8px', borderRadius: 20,
          background: `${level.aura}18`, color: level.aura,
          border: `1px solid ${level.aura}44`,
          fontFamily: "'Rajdhani', sans-serif",
        }}>{level.emoji} {level.name}</span>
      </div>

      {/* Win rate bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${winPct}%`,
            background: `linear-gradient(90deg, ${level.aura}88, ${level.aura})`,
            borderRadius: 2,
            transition: 'width 1s ease',
          }}/>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        {[
          { label: 'W', val: player.total_wins || 0, color: '#4ade80' },
          { label: 'L', val: player.total_losses || 0, color: '#f87171' },
          { label: '%', val: winPct, color: level.aura },
        ].map(s => (
          <div key={s.label} style={{
            textAlign: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '5px 2px',
          }}>
            <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 18, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 9, color: '#475569', letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ShuttlecockTrail({ active }) {
  if (!active) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          fontSize: 28,
          animation: `shuttle-fly-${i % 3} ${0.8 + i * 0.2}s ease-out ${i * 0.1}s forwards`,
          top: `${20 + Math.random() * 60}%`,
          left: '-40px',
        }}>🏸</div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { currentUser, logout } = useAuth()
  const { players, recentGames, loading, refetch } = useRealtimeDashboard()
  const [tab, setTab]               = useState('cards')
  const [showLogGame, setShowLogGame] = useState(false)
  const [newGame, setNewGame]        = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  // Trigger shuttlecock animation on new game
  function handleGameLogged() {
    refetch()
    setShowLogGame(false)
    setNewGame(true)
    setTimeout(() => setNewGame(false), 2000)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060d14',
      fontFamily: "'Rajdhani', sans-serif",
      color: '#f1f5f9',
      paddingBottom: 100,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        ${FONTS}
        @keyframes spin-ring { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes shuttle-fly-0 { 0%{left:-40px;top:30%;opacity:1;transform:rotate(-20deg) scale(1)} 100%{left:110%;top:10%;opacity:0;transform:rotate(20deg) scale(0.5)} }
        @keyframes shuttle-fly-1 { 0%{left:-40px;top:50%;opacity:1;transform:rotate(0deg) scale(1.2)} 100%{left:110%;top:40%;opacity:0;transform:rotate(40deg) scale(0.4)} }
        @key* shuttle-fly-2 { 0%{left:-40px;top:70%;opacity:1;transform:rotate(10deg)} 100%{left:110%;top:60%;opacity:0;transform:rotate(-20deg) scale(0.6)} }
        @keyframes shuttle-fly-2 { 0%{left:-40px;top:70%;opacity:1;transform:rotate(10deg)} 100%{left:110%;top:60%;opacity:0;transform:rotate(-20deg) scale(0.6)} }
        @keyframes card-in { from{opacity:0;transform:translateY(20px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes pulse-fab { 0%,100%{box-shadow:0 8px 32px rgba(74,222,128,0.3)} 50%{box-shadow:0 8px 48px rgba(74,222,128,0.6), 0 0 0 8px rgba(74,222,128,0.1)} }
        @keyframes slide-up { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes court-line-in { from{opacity:0} to{opacity:1} }
        .tab-btn { background:none; border:none; color:#475569; font-family:'Rajdhani',sans-serif;
          font-size:13px; font-weight:700; letter-spacing:1.5px; padding:10px 16px;
          cursor:pointer; border-bottom:2px solid transparent; transition:all 0.2s;
          text-transform:uppercase; }
        .tab-btn.active { color:#4ade80; border-bottom-color:#4ade80; }
        .log-fab { position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
          background:linear-gradient(135deg,#14532d,#166534,#15803d);
          border:1.5px solid #4ade80; color:#4ade80;
          font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:4px;
          padding:16px 48px; border-radius:50px; cursor:pointer;
          animation: pulse-fab 2.5s ease-in-out infinite;
          transition:transform 0.2s; white-space:nowrap; }
        .log-fab:hover { transform:translateX(-50%) translateY(-3px) scale(1.04); }
        .game-row:hover { background:rgba(255,255,255,0.05) !important; }
      `}</style>

      {/* Court lines background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <svg width="100%" height="100%" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice">
          <rect width="800" height="900" fill="#060d14"/>
          <g opacity="0.04" stroke="#4ade80" fill="none">
            <rect x="40" y="40" width="720" height="820" strokeWidth="1.5"/>
            <rect x="90" y="40" width="620" height="820" strokeWidth="0.8"/>
            <line x1="400" y1="40" x2="400" y2="860" strokeWidth="2"/>
            <line x1="40" y1="450" x2="760" y2="450" strokeWidth="2"/>
            <line x1="40" y1="220" x2="760" y2="220" strokeWidth="0.8"/>
            <line x1="40" y1="680" x2="760" y2="680" strokeWidth="0.8"/>
            <line x1="400" y1="220" x2="400" y2="680" strokeWidth="0.8"/>
          </g>
        </svg>
      </div>

      <ShuttlecockTrail active={newGame} />

      {/* Player detail overlay */}
      {selectedPlayer && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 80,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
          animation: 'card-in 0.3s ease-out',
        }} onClick={() => setSelectedPlayer(null)}>
          <div style={{
            background: getLevel(selectedPlayer.total_wins||0).bg,
            border: `2px solid ${getLevel(selectedPlayer.total_wins||0).aura}`,
            borderRadius: 24, padding: 28, width: '100%', maxWidth: 340,
            boxShadow: `0 0 80px ${getLevel(selectedPlayer.total_wins||0).glow}`,
          }} onClick={e => e.stopPropagation()}>
            {(() => {
              const level = getLevel(selectedPlayer.total_wins || 0)
              const winPct = selectedPlayer.total_games > 0
                ? Math.round((selectedPlayer.total_wins / selectedPlayer.total_games) * 100) : 0
              return <>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%', margin: '0 auto 12px',
                    background: `radial-gradient(circle, ${level.aura}33, ${level.aura}11)`,
                    border: `3px solid ${level.aura}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, fontFamily: "'Bebas Neue', sans-serif", color: level.aura,
                    boxShadow: `0 0 30px ${level.glow}`,
                  }}>{selectedPlayer.display_name.charAt(0)}</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 3, color: '#f1f5f9' }}>
                    {selectedPlayer.display_name}
                  </div>
                  <div style={{ fontSize: 12, color: level.aura, letterSpacing: 2, fontWeight: 700 }}>
                    {level.emoji} {level.name}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Total Wins', val: selectedPlayer.total_wins || 0, color: '#4ade80' },
                    { label: 'Total Games', val: selectedPlayer.total_games || 0, color: '#60a5fa' },
                    { label: 'Win Rate', val: `${winPct}%`, color: level.aura },
                    { label: 'Best Streak', val: `🔥${selectedPlayer.best_streak || 0}`, color: '#f97316' },
                    { label: 'Pts Scored', val: selectedPlayer.points_scored || 0, color: '#4ade80' },
                    { label: 'Pts Conceded', val: selectedPlayer.points_conceded || 0, color: '#f87171' },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: '10px 12px',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ fontSize: 10, color: '#475569', letterSpacing: 1, marginBottom: 3 }}>{s.label}</div>
                      <div style={{ fontFamily: "'Teko', sans-serif", fontSize: 22, color: s.color, fontWeight: 600 }}>{s.val}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSelectedPlayer(null)} style={{
                  width: '100%', background: 'transparent',
                  border: `1px solid ${level.aura}44`, color: '#64748b',
                  borderRadius: 20, padding: '10px', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13,
                }}>Close</button>
              </>
            })()}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 10,
        padding: '16px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(74,222,128,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>🏸</span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#4ade80', letterSpacing: 4 }}>SHUTTLE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
            borderRadius: 20, padding: '5px 12px', fontSize: 13, color: '#4ade80', fontWeight: 600,
          }}>{currentUser.displayName}</div>
          <button onClick={logout} style={{
            background: 'transparent', border: '1px solid #1e293b',
            color: '#334155', borderRadius: 20, padding: '5px 12px',
            cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
          }}>Out</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 20px',
      }}>
        {[
          { id: 'cards', label: '⚡ Players' },
          { id: 'recent', label: '📋 Games' },
        ].map(t => (
          <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 10, padding: '20px 16px 0' }}>

        {/* PLAYER CARDS TAB — Pokemon grid */}
        {tab === 'cards' && (
          <div>
            {/* Top 3 podium strip */}
            {players.length >= 3 && (
              <div style={{
                display: 'flex', gap: 8, marginBottom: 20,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 16, padding: '12px 14px',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: 11, color: '#334155', letterSpacing: 1, textTransform: 'uppercase', marginRight: 4, fontWeight: 700 }}>Top 3</span>
                {players.slice(0, 3).map((p, i) => {
                  const level = getLevel(p.total_wins || 0)
                  const medals = ['🥇', '🥈', '🥉']
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1,
                      background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '6px 10px',
                      border: `1px solid ${level.aura}22`,
                    }}>
                      <span style={{ fontSize: 14 }}>{medals[i]}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: level.aura, lineHeight: 1 }}>{p.display_name}</div>
                        <div style={{ fontSize: 10, color: '#475569' }}>{p.total_wins || 0}W</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', color: '#334155', padding: 40, fontSize: 14 }}>Loading...</div>
            )}

            {/* Card grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 12,
            }}>
              {players.map((p, idx) => (
                <div key={p.id} style={{ animation: `card-in 0.4s ease-out ${idx * 0.06}s both` }}>
                  <PlayerCard player={p} rank={idx + 1} onClick={setSelectedPlayer} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECENT GAMES TAB */}
        {tab === 'recent' && (
          <div style={{ animation: 'slide-up 0.3s ease-out' }}>
            {recentGames.length === 0 && !loading && (
              <div style={{ textAlign: 'center', color: '#1e293b', padding: '60px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏸</div>
                <div style={{ fontSize: 14, color: '#334155' }}>No games yet — tap LOG GAME below!</div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentGames.map((g, i) => (
                <div key={g.id} className="game-row" style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 14, padding: '14px 16px',
                  animation: `slide-up 0.25s ease-out ${i * 0.04}s both`,
                  transition: 'background 0.2s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: '#334155', fontFamily: "'Rajdhani', sans-serif" }}>
                      {new Date(g.played_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {' · '}
                      {new Date(g.played_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: 'rgba(74,222,128,0.1)', color: '#4ade80',
                      border: '1px solid rgba(74,222,128,0.2)',
                    }}>TEAM {g.winner_team} WON</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: 15, fontWeight: 700,
                      color: g.winner_team === 'A' ? '#4ade80' : '#475569',
                    }}>Team A</span>
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif", fontSize: 32,
                      color: '#f1f5f9', letterSpacing: 4,
                    }}>{g.score_a} — {g.score_b}</span>
                    <span style={{
                      fontSize: 15, fontWeight: 700,
                      color: g.winner_team === 'B' ? '#4ade80' : '#475569',
                    }}>Team B</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating LOG GAME button */}
      <button className="log-fab" onClick={() => setShowLogGame(true)}>
        + LOG GAME
      </button>

      {showLogGame && (
        <LogGame
          onClose={() => setShowLogGame(false)}
          onGameLogged={handleGameLogged}
        />
      )}
    </div>
  )
}