// src/utils/avatars.js — v5 with bulletproof assignment
const CHARACTERS = [
  { file: '/avatars/goku2.jpg',      name: 'Goku'       },
  { file: '/avatars/batman2.jpg',    name: 'Batman'     },
  { file: '/avatars/deadpool3.jpg',  name: 'Deadpool'   },
  { file: '/avatars/ironman2.jpg',   name: 'Iron Man'   },
  { file: '/avatars/johnwick.jpg',   name: 'John Wick'  },
  { file: '/avatars/samurai.jpg',    name: 'Samurai'    },
  { file: '/avatars/spartan.jpg',    name: 'Spartan'    },
  { file: '/avatars/spiderman2.jpg', name: 'Spider-Man' },
  { file: '/avatars/starlord.jpg',   name: 'Star-Lord'  },
  { file: '/avatars/superman1.jpg',  name: 'Superman'   },
  { file: '/avatars/superman2.jpg',  name: 'Superman 2' },
  { file: '/avatars/wolverine2.jpg', name: 'Wolverine'  },
  { file: '/avatars/wolverine3.jpg', name: 'Wolverine 2'},
]

// Stable hash — same ID always returns same index
function hashId(str) {
  if (!str) return 0
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

// Stable per-player assignment map
// Populated once when players load via assignAvatars()
const assignedMap = {}

export function assignAvatars(players) {
  if (!players) return
  players.forEach((player, index) => {
    // Use index-based for existing players (stable order)
    // Use hash for new players not in the list
    assignedMap[player.id] = index % CHARACTERS.length
  })
}

export function getAvatarUrl(playerId) {
  if (!playerId) return CHARACTERS[0].file
  // If in assigned map use that, otherwise fall back to hash
  const idx = assignedMap[playerId] !== undefined
    ? assignedMap[playerId]
    : hashId(playerId) % CHARACTERS.length
  return CHARACTERS[idx].file
}

export function getCharacterName(playerId) {
  if (!playerId) return CHARACTERS[0].name
  const idx = assignedMap[playerId] !== undefined
    ? assignedMap[playerId]
    : hashId(playerId) % CHARACTERS.length
  return CHARACTERS[idx].name
}