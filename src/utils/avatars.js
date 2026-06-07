// src/utils/avatars.js
// 12 custom sticker-style character avatars
// Each player gets a deterministic character based on their player ID hash
// Same player always gets same character across sessions

const CHARACTERS = [
  { id: 'wolf',         file: '/avatars/wolf.jpg',         name: 'Dark Wolf' },
  { id: 'kakashi',      file: '/avatars/kakashi.jpg',      name: 'Kakashi' },
  { id: 'black-panther',file: '/avatars/black-panther.jpg',name: 'Black Panther' },
  { id: 'luffy',        file: '/avatars/luffy.jpg',        name: 'Luffy' },
  { id: 'itachi',       file: '/avatars/itachi.jpg',       name: 'Itachi' },
  { id: 'deadpool',     file: '/avatars/deadpool.jpg',     name: 'Deadpool' },
  { id: 'witcher',      file: '/avatars/witcher.jpg',      name: 'Witcher' },
  { id: 'dr-strange',   file: '/avatars/dr-strange.jpg',   name: 'Dr. Strange' },
  { id: 'spiderman',    file: '/avatars/spiderman.jpg',    name: 'Spider-Man' },
  { id: 'batman',       file: '/avatars/batman.jpg',       name: 'Batman' },
  { id: 'deadpool2',    file: '/avatars/deadpool2.jpg',    name: 'Deadpool 2' },
  { id: 'wolverine',    file: '/avatars/wolverine.jpg',    name: 'Wolverine' },
]

// Stable hash — same playerId always returns same index
function hashId(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function getAvatarUrl(playerId) {
  const char = CHARACTERS[hashId(playerId) % CHARACTERS.length]
  return char.file
}

export function getCharacterName(playerId) {
  const char = CHARACTERS[hashId(playerId) % CHARACTERS.length]
  return char.name
}