// src/utils/ratingEngine.js
// ELO rating engine for Shuttle — lichess-style (800 base)

const K_FACTORS = {
  calibrating: 40,   // games 1-15
  active:      24,   // games 16-50
  established: 16,   // games 51+
}

const PARTICIPATION_BRACKETS = [
  { upTo: 10, bonus: 5 },
  { upTo: 20, bonus: 4 },
  { upTo: 30, bonus: 3 },
  { upTo: 40, bonus: 2 },
  { upTo: 50, bonus: 1 },
  { upTo: Infinity, bonus: 0 },
]

// Starting ratings based on onboarding
export const INITIAL_RATINGS = {
  beginner_recreational:   800,
  beginner_competitive:    950,
  intermediate_recreational: 1000,
  intermediate_competitive:  1150,
  advanced_recreational:   1200,
  advanced_competitive:    1400,
}

// Frequency modifier
export const FREQUENCY_BONUS = {
  once:  0,
  few:   25,
  daily: 50,
}

export function getInitialRating({ skillLevel, isCompetitive, frequency }) {
  const level = skillLevel || 'beginner'
  const comp  = isCompetitive ? 'competitive' : 'recreational'
  const key   = `${level}_${comp}`
  const base  = INITIAL_RATINGS[key] || 800
  const bonus = FREQUENCY_BONUS[frequency] || 0
  return base + bonus
}

function getKFactor(gamesPlayed) {
  if (gamesPlayed < 15)  return K_FACTORS.calibrating
  if (gamesPlayed < 50)  return K_FACTORS.active
  return K_FACTORS.established
}

function getParticipationBonus(gamesPlayed) {
  for (const b of PARTICIPATION_BRACKETS) {
    if (gamesPlayed < b.upTo) return b.bonus
  }
  return 0
}

function expectedScore(playerRating, opponentRating) {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
}

/**
 * Calculate rating change for a single player
 * @param {number} playerRating - current rating
 * @param {number} opponentRating - opponent's rating (or avg team rating)
 * @param {boolean} won - did this player win?
 * @param {number} gamesPlayed - total games played before this match
 * @returns {{ delta: number, newRating: number }}
 */
export function calcRatingChange(playerRating, opponentRating, won, gamesPlayed) {
  const K       = getKFactor(gamesPlayed)
  const exp     = expectedScore(playerRating, opponentRating)
  const actual  = won ? 1 : 0
  const eloDelta = Math.round(K * (actual - exp))
  const bonus    = won ? getParticipationBonus(gamesPlayed) : 0

  // Anti-sandbag: minimum 1 point lost per loss, minimum 1 point gained per win
  const rawDelta = eloDelta + bonus
  const delta = won
    ? Math.max(1, rawDelta)
    : Math.min(-1, rawDelta)

  return {
    delta,
    newRating: Math.max(100, playerRating + delta), // floor at 100
  }
}

/**
 * Calculate full match rating changes for all 4 (or 2) players
 * @param {Object[]} teamA - array of { id, rating, games_played }
 * @param {Object[]} teamB - array of { id, rating, games_played }
 * @param {string} winner - 'A' | 'B'
 * @param {boolean} isSingles
 * @returns {{ teamA: Object[], teamB: Object[], deltaA: number, deltaB: number }}
 */
export function calcMatchRatings(teamA, teamB, winner, isSingles) {
  void isSingles // reserved — singles/doubles share rating math today
  const avgA = Math.round(teamA.reduce((s, p) => s + p.rating, 0) / teamA.length)
  const avgB = Math.round(teamB.reduce((s, p) => s + p.rating, 0) / teamB.length)

  const wonA = winner === 'A'
  const wonB = winner === 'B'

  const updatedA = teamA.map(p => {
    const { delta, newRating } = calcRatingChange(p.rating, avgB, wonA, p.games_played)
    return { ...p, delta, newRating }
  })

  const updatedB = teamB.map(p => {
    const { delta, newRating } = calcRatingChange(p.rating, avgA, wonB, p.games_played)
    return { ...p, delta, newRating }
  })

  // Representative delta for game card display (use first player's delta)
  const deltaA = updatedA[0]?.delta || 0
  const deltaB = updatedB[0]?.delta || 0

  return { teamA: updatedA, teamB: updatedB, deltaA, deltaB }
}

/**
 * Recalculate ratings for all games from scratch (Option A)
 * Pass all games sorted by played_at ascending
 */
export function recalcAllRatings(games, players) {
  // Track current state per player
  const state = {}
  players.forEach(p => {
    state[p.id] = {
      rating_doubles: p.initial_rating || 900,
      rating_singles: p.initial_rating || 900,
      doubles_games:  0,
      singles_games:  0,
    }
  })

  const gameResults = []

  for (const g of games) {
    const isSingles = g.is_singles || (g.team_a_ids?.length === 1)
    const ratingKey = isSingles ? 'rating_singles' : 'rating_doubles'
    const gamesKey  = isSingles ? 'singles_games'  : 'doubles_games'

    const teamA = g.team_a_ids.map(id => ({
      id,
      rating: state[id]?.[ratingKey] || 900,
      games_played: state[id]?.[gamesKey] || 0,
    })).filter(p => state[p.id])

    const teamB = g.team_b_ids.map(id => ({
      id,
      rating: state[id]?.[ratingKey] || 900,
      games_played: state[id]?.[gamesKey] || 0,
    })).filter(p => state[p.id])

    if (!teamA.length || !teamB.length) continue

    const { teamA: updA, teamB: updB, deltaA, deltaB } = calcMatchRatings(teamA, teamB, g.winner_team, isSingles)

    // Apply updates
    ;[...updA, ...updB].forEach(p => {
      state[p.id][ratingKey] = p.newRating
      state[p.id][gamesKey]++
    })

    gameResults.push({
      game_id: g.id,
      delta_a: deltaA,
      delta_b: deltaB,
      is_singles: isSingles,
    })
  }

  return { playerStates: state, gameResults }
}

export function isCalibrating(gamesPlayed) {
  return gamesPlayed < 15
}

export function getRatingTier(rating) {
  if (rating >= 1800) return { name:'LEGEND',   color:'#ffd700', emoji:'👑' }
  if (rating >= 1500) return { name:'ELITE',     color:'#c084fc', emoji:'💜' }
  if (rating >= 1300) return { name:'ADVANCED',  color:'#38bdf8', emoji:'🔵' }
  if (rating >= 1100) return { name:'INTERMEDIATE', color:'#4ade80', emoji:'🟢' }
  if (rating >= 900)  return { name:'BEGINNER',  color:'#fb923c', emoji:'🟠' }
  return                     { name:'ROOKIE',    color:'#94a3b8', emoji:'⚪' }
}