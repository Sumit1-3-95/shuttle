# Shuttle — Roadmap

## Phase 1 — Identity (Current / MVP)

Building the foundation of a player's badminton identity.

| Feature | Status |
|---------|--------|
| Player profiles | ✅ Built |
| Court (group) management | ✅ Built |
| Match logging (singles + doubles) | ✅ Built |
| Elo ratings (singles + doubles tracks) | ✅ Built |
| Leaderboards (court-scoped) | ✅ Built |
| Rivalries / head-to-head | ✅ Built |
| Performance trends (charts) | ✅ Built |
| Skill/flaw tagging | ✅ Built |
| Onboarding with skill calibration | ✅ Built |
| PIN auth | ✅ Built |
| Training videos tab | ✅ Built |
| Report card | ✅ Built |
| Racquet Ninja partner module | ✅ Built (partner scope) |

### Known gaps / tech debt

- README and stack docs now corrected (see `docs/`)
- `.env` should be gitignored; use `.env.example`
- `Dashboard.jsx` is a large god component
- Duplicated helpers (`getLevel`, avatars) across files
- No automated tests for rating engine
- Dual progression systems (win tiers vs Elo tiers)
- Global vs court-scoped stats can diverge

---

## Phase 2 — Discovery

Help players find comparable opponents beyond their existing court.

| Feature | Status |
|---------|--------|
| Find players with similar ratings | 🔲 Planned |
| Better matchmaking | 🔲 Planned |
| Public player profiles | 🔲 Planned |

---

## Phase 3 — Ecosystem

Expand beyond individual courts into a broader badminton network.

| Feature | Status |
|---------|--------|
| Academies | 🔲 Planned (Racquet Ninja is early prototype) |
| Clubs | 🔲 Planned |
| Tournaments | 🔲 Planned |
| Multi-city player network | 🔲 Planned |

---

## Explicitly Out of Scope

- Payments
- Platform tournament management (beyond partner modules)
- AI-powered features
- Coaching features
- Multi-sport support

---

## Long-Term Goal

Shuttle is not a score-tracking app. The vision is to become the trusted identity and reputation layer for badminton players — where standing is earned through consistent competition and credible match history.
