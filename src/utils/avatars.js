// src/utils/avatars.js
// Each of the 8 players gets a UNIQUE character
// Assignment is based on player's position in the leaderboard array
// (sorted by created_at in DB — stable order)
// Since you have 8 players and 12 characters, all are unique

const CHARACTERS = [
  { file: '/avatars/wolf.jpg',          name: 'Dark Wolf' },
  { file: '/avatars/kakashi.jpg',       name: 'Kakashi' },
  { file: '/avatars/black-panther.jpg', name: 'Black Panther' },
  { file: '/avatars/luffy.jpg',         name: 'Luffy' },
  { file: '/avatars/itachi.jpg',        name: 'Itachi' },
  { file: '/avatars/deadpool.jpg',      name: 'Deadpool' },
  { file: '/avatars/witcher.jpg',       name: 'Witcher' },
  { file: '/avatars/dr-strange.jpg',    name: 'Dr. Strange' },
  { file: '/avatars/spiderman.jpg',     name: 'Spider-Man' },
  { file: '/avatars/batman.jpg',        name: 'Batman' },
  { file: '/avatars/deadpool2.jpg',     name: 'Deadpool 2' },
  { file: '/avatars/wolverine.jpg',     name: 'Wolverine' },
]

// This map gets populated once when players are loaded
// playerId → character index (unique per player)
const assignedMap = {}

/**
 * Call this ONCE when you load the players array from Supabase.
 * Assigns each player a unique character in order.
 * players: array sorted by created_at (stable DB order)
 */
export function assignAvatars(players) {
  players.forEach((player, index) => {
    assignedMap[player.id] = index % CHARACTERS.length
  })
}

export function getAvatarUrl(playerId) {
  const idx = assignedMap[playerId] ?? 0
  return CHARACTERS[idx].file
}

export function getCharacterName(playerId) {
  const idx = assignedMap[playerId] ?? 0
  return CHARACTERS[idx].name
}