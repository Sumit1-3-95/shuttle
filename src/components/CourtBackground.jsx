// src/components/CourtBackground.jsx
// Realistic top-down badminton court — wood floor + proper line markings

export default function CourtBackground({ children, style = {} }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <svg
        width="100%" height="100%"
        viewBox="0 0 420 680"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden="true"
      >
        <defs>
          {/* Wood floor gradient */}
          <linearGradient id="wood-floor" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#1a4a1a"/>
            <stop offset="40%" stopColor="#1d5c1d"/>
            <stop offset="100%" stopColor="#174717"/>
          </linearGradient>
          {/* Subtle wood grain pattern */}
          <pattern id="wood-grain" x="0" y="0" width="60" height="4" patternUnits="userSpaceOnUse">
            <rect width="60" height="4" fill="none"/>
            <line x1="0" y1="1" x2="60" y2="1" stroke="#ffffff" strokeWidth="0.3" opacity="0.04"/>
            <line x1="0" y1="3" x2="60" y2="3" stroke="#000000" strokeWidth="0.3" opacity="0.03"/>
          </pattern>
          {/* Court surface shadow at edges */}
          <radialGradient id="court-vignette" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="transparent"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.35)"/>
          </radialGradient>
          {/* Line glow */}
          <filter id="line-glow">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ── Outer boundary (full area incl surround) ── */}
        <rect width="420" height="680" fill="#8B4513"/>

        {/* ── Court surface ── */}
        <rect x="30" y="30" width="360" height="620" fill="url(#wood-floor)" rx="2"/>
        <rect x="30" y="30" width="360" height="620" fill="url(#wood-grain)" rx="2"/>
        <rect x="30" y="30" width="360" height="620" fill="url(#court-vignette)" rx="2"/>

        {/* ── Court lines (white, slightly glowing) ── */}
        <g stroke="#ffffff" fill="none" filter="url(#line-glow)" strokeLinecap="round">

          {/* Outer boundary lines */}
          <rect x="50" y="50" width="320" height="580" strokeWidth="2.5" opacity="0.95"/>

          {/* Singles sidelines (inner) */}
          <line x1="90"  y1="50"  x2="90"  y2="630" strokeWidth="1.5" opacity="0.7"/>
          <line x1="330" y1="50"  x2="330" y2="630" strokeWidth="1.5" opacity="0.7"/>

          {/* Center line (vertical, service boxes) */}
          <line x1="210" y1="172" x2="210" y2="508" strokeWidth="1.5" opacity="0.7"/>

          {/* Short service lines */}
          <line x1="50" y1="172" x2="370" y2="172" strokeWidth="1.5" opacity="0.85"/>
          <line x1="50" y1="508" x2="370" y2="508" strokeWidth="1.5" opacity="0.85"/>

          {/* Long service line for doubles (back boundary) */}
          <line x1="50" y1="86"  x2="370" y2="86"  strokeWidth="1.5" opacity="0.6"/>
          <line x1="50" y1="594" x2="370" y2="594" strokeWidth="1.5" opacity="0.6"/>

          {/* Net line (center) */}
          <line x1="50" y1="340" x2="370" y2="340" strokeWidth="2" opacity="0.5" strokeDasharray="6 4"/>
        </g>

        {/* ── Net ── */}
        <g>
          {/* Net shadow */}
          <rect x="42" y="343" width="336" height="8" rx="2" fill="rgba(0,0,0,0.4)"/>
          {/* Net band */}
          <rect x="44" y="333" width="332" height="14" rx="3" fill="#e8e0d0" opacity="0.92"/>
          {/* Net mesh lines (vertical) */}
          {Array.from({length:28}).map((_,i) => (
            <line key={i}
              x1={50 + i*12} y1="333"
              x2={50 + i*12} y2="347"
              stroke="#c0b8a8" strokeWidth="0.8" opacity="0.6"
            />
          ))}
          {/* Net mesh lines (horizontal) */}
          <line x1="44" y1="337" x2="376" y2="337" stroke="#c0b8a8" strokeWidth="0.8" opacity="0.5"/>
          <line x1="44" y1="341" x2="376" y2="341" stroke="#c0b8a8" strokeWidth="0.8" opacity="0.5"/>
          <line x1="44" y1="345" x2="376" y2="345" stroke="#c0b8a8" strokeWidth="0.8" opacity="0.5"/>
          {/* Net posts */}
          <rect x="38" y="320" width="8" height="40" rx="2" fill="#b0a898" opacity="0.9"/>
          <rect x="374" y="320" width="8" height="40" rx="2" fill="#b0a898" opacity="0.9"/>
          {/* Net top tape (white band) */}
          <rect x="44" y="333" width="332" height="3" rx="1" fill="white" opacity="0.95"/>
        </g>

        {/* ── Team labels ── */}
        <text x="210" y="220" textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="11"
          fontFamily="'Bebas Neue', sans-serif" letterSpacing="3">TEAM A</text>
        <text x="210" y="480" textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="11"
          fontFamily="'Bebas Neue', sans-serif" letterSpacing="3">TEAM B</text>

        {/* ── Corner accent marks ── */}
        {[[50,50],[370,50],[50,630],[370,630]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="white" opacity="0.6"/>
        ))}
      </svg>

      {/* Children rendered on top of court */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  )
}