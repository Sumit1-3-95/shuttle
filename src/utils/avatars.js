// src/utils/avatars.js
// Deterministic anime avatar assignment — same player always gets same character
// Uses DiceBear anime API (free, no auth, SVG based)

const ANIME_POOL = [
  // Seeds that produce distinct chibi anime characters via DiceBear
  'naruto-uzumaki', 'monkey-luffy', 'goku-saiyan', 'ichigo-kurosaki',
  'edward-elric', 'eren-yeager', 'levi-ackerman', 'killua-zoldyck',
  'rem-rezero', 'zero-two', 'hinata-shoyo', 'tanjiro-kamado',
]

// Returns a stable DiceBear avatar URL for a player
export function getAvatarUrl(playerId, style = 'avataaars') {
  // Hash playerId to pick a seed
  let hash = 0
  for (let i = 0; i < playerId.length; i++) {
    hash = ((hash << 5) - hash) + playerId.charCodeAt(i)
    hash |= 0
  }
  const seed = ANIME_POOL[Math.abs(hash) % ANIME_POOL.length]
  // DiceBear v9 — avataaars style looks anime/cartoon
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear`
}

// Fallback — initials avatar
export function getInitialsAvatar(name) {
  return name?.charAt(0)?.toUpperCase() || '?'
}