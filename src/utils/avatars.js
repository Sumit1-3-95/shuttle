// src/utils/avatars.js — v4 with new character images
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

function hashId(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function getAvatarUrl(playerId) {
  return CHARACTERS[hashId(playerId) % CHARACTERS.length].file
}

export function getCharacterName(playerId) {
  return CHARACTERS[hashId(playerId) % CHARACTERS.length].name
}