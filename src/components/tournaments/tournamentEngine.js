// src/components/tournaments/tournamentEngine.js
// Bracket generation logic for all 4 formats

export function generateMatches(teams, format, gameType) {
  switch(format) {
    case 'knockout':      return generateKnockout(teams)
    case 'round_robin':   return generateRoundRobin(teams)
    case 'group_knockout':return generateGroupKnockout(teams)
    case 'king_of_court': return generateKingOfCourt(teams)
    default: return []
  }
}

// ── Knockout ──────────────────────────────────────────────────
export function generateKnockout(teams) {
  // Pad to next power of 2 with byes
  const n = nextPowerOf2(teams.length)
  const seeded = [...teams]
  while (seeded.length < n) seeded.push(null) // null = bye

  const matches = []
  let matchNum = 1
  const totalRounds = Math.log2(n)

  // Round 1
  for (let i = 0; i < n; i += 2) {
    matches.push({
      round: 1, match_number: matchNum++,
      team_a_id: seeded[i]?.id || null,
      team_b_id: seeded[i+1]?.id || null,
      status: seeded[i] && seeded[i+1] ? 'pending' : 'bye',
      scheduled_order: matchNum,
    })
  }

  // Placeholder rounds 2..N (populated as winners advance)
  for (let r = 2; r <= totalRounds; r++) {
    const matchesInRound = n / Math.pow(2, r)
    for (let m = 0; m < matchesInRound; m++) {
      matches.push({
        round: r, match_number: matchNum++,
        team_a_id: null, team_b_id: null,
        status: 'pending',
        scheduled_order: matchNum,
      })
    }
  }
  return matches
}

// ── Round Robin ───────────────────────────────────────────────
export function generateRoundRobin(teams) {
  const matches = []
  let matchNum = 1
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        round: 1, match_number: matchNum++,
        team_a_id: teams[i].id,
        team_b_id: teams[j].id,
        status: 'pending',
        scheduled_order: matchNum,
      })
    }
  }
  return matches
}

// ── Group Stage + Knockout ────────────────────────────────────
export function generateGroupKnockout(teams) {
  const groupSize = teams.length <= 8 ? 3 : 4
  const groups = []
  for (let i = 0; i < teams.length; i += groupSize) {
    groups.push(teams.slice(i, i + groupSize))
  }

  const matches = []
  let matchNum = 1

  groups.forEach((group, gi) => {
    const label = String.fromCharCode(65 + gi)
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        matches.push({
          round: 1, match_number: matchNum++,
          group_label: label,
          team_a_id: group[i].id,
          team_b_id: group[j].id,
          status: 'pending',
          scheduled_order: matchNum,
        })
      }
    }
  })

  // Placeholder KO matches
  const koTeams = groups.length * 2
  for (let m = 0; m < koTeams / 2; m++) {
    matches.push({
      round: 2, match_number: matchNum++,
      group_label: 'KO',
      team_a_id: null, team_b_id: null,
      status: 'pending', scheduled_order: matchNum,
    })
  }
  return matches
}

// ── King of Court ─────────────────────────────────────────────
export function generateKingOfCourt(teams) {
  // First match: teams[0] vs teams[1], teams[2..] in queue
  const matches = []
  matches.push({
    round: 1, match_number: 1,
    team_a_id: teams[0]?.id,
    team_b_id: teams[1]?.id,
    status: 'active',
    scheduled_order: 1,
    group_label: 'KOC',
  })
  return matches
}

// ── Helpers ───────────────────────────────────────────────────
function nextPowerOf2(n) {
  let p = 1
  while (p < n) p *= 2
  return p
}

export function getRoundName(round, totalRounds, format) {
  if (format === 'round_robin') return 'Round Robin'
  if (format === 'group_knockout') {
    if (round === 1) return 'Group Stage'
    if (round === totalRounds) return 'Final'
    return 'Knockout'
  }
  if (round === totalRounds) return 'Final'
  if (round === totalRounds - 1) return 'Semi-Final'
  if (round === totalRounds - 2) return 'Quarter-Final'
  return `Round ${round}`
}

export function getRecommendedFormat(playerCount, timeMins) {
  if (playerCount <= 4 && timeMins <= 60)  return 'knockout'
  if (playerCount <= 6 && timeMins <= 120) return 'round_robin'
  if (playerCount >= 6)                    return 'group_knockout'
  return 'round_robin'
}

export function getTimeSettings(timeMins) {
  if (timeMins <= 60)  return { target_score: 15, best_of: 1 }
  if (timeMins <= 120) return { target_score: 21, best_of: 1 }
  return { target_score: 21, best_of: 3 }
}