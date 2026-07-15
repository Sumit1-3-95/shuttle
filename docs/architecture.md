# Shuttle — Architecture

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 19, JavaScript (JSX) |
| Build | Vite 8 |
| Styling | Inline styles + per-component CSS |
| Database | Supabase (Postgres) |
| Realtime | Supabase Realtime channels |
| Storage | Supabase Storage (`avatars` bucket) |
| Auth | Custom PIN auth (`bcryptjs` + `localStorage`) |
| PWA | `manifest.json`, portrait standalone |

No router, no state library, no UI framework, no test runner.

## High-Level Architecture

```text
┌─────────────────────────────────────────┐
│              React SPA                  │
│  ┌─────────┐  ┌──────────┐  ┌───────┐  │
│  │ App.jsx │→ │Dashboard │→ │ Hooks │  │
│  └─────────┘  └──────────┘  └───┬───┘  │
│       │                           │      │
│  ┌────┴────┐              ┌──────┴────┐  │
│  │AuthCtx  │              │ratingEng. │  │
│  └─────────┘              └───────────┘  │
└──────────────────┬──────────────────────┘
                   │ supabase-js
┌──────────────────┴──────────────────────┐
│              Supabase                     │
│  Postgres │ Realtime │ Storage            │
└───────────────────────────────────────────┘
```

## Folder Structure

```text
src/
├── App.jsx                 # Root screen routing (login → dashboard → profile)
├── main.jsx                # Entry + AuthProvider
├── supabaseClient.js       # Supabase client init
├── context/
│   └── AuthContext.jsx     # PIN login, session in localStorage
├── hooks/
│   ├── useCourtData.js     # Court-scoped players + games + stat recompute
│   ├── useGameLogger.js    # Match CRUD + rating updates
│   ├── usePlayerProfile.js # Profile data + court-scoped games + realtime
│   └── useRealtimeDashboard.js  # Global players + recent games + realtime
├── utils/
│   ├── ratingEngine.js     # Elo calculation (canonical)
│   └── avatars.js          # Stable character avatar assignment
└── components/
    ├── Dashboard.jsx       # Main app shell (~1,050 lines)
    ├── LogGame.jsx         # Match logging flow
    ├── PlayerProfile.jsx   # Player detail + charts + rivalries
    ├── CourtManager.jsx    # Admin court management
    ├── OnboardingScreen.jsx
    ├── LoginScreen.jsx
    ├── MyCourts.jsx
    ├── SettingsPage.jsx
    ├── ReportCard.jsx
    ├── TeamProfile.jsx
    ├── HowRatingWorks.jsx
    ├── RecalcRatings.jsx   # Admin rating recalculation
    └── racquet-ninja/      # Partner academy module
```

## Navigation

No URL routing. Screen state managed in components:

| Screen | Trigger |
|--------|---------|
| `LoginScreen` | No `currentUser` |
| `OnboardingScreen` | Registration flow |
| `Dashboard` | Authenticated default |
| `PlayerProfile` | `App.jsx` `profileState` |
| Overlays | `Dashboard` boolean state (`showLogGame`, `showMenu`, etc.) |

## Data Flow — Match Logging

```text
LogGame.jsx
    → useGameLogger.logGame()
        → fetch player ratings from `players`
        → calcMatchRatings() in ratingEngine.js
        → insert into `games`
        → update `players` ratings + game counts
        → insert `rating_history`
    → optional: insert `game_skills`
    → Supabase Realtime triggers dashboard/profile refresh
```

## Data Flow — Court-Scoped Stats

When a court is selected, `useCourtData` and `usePlayerProfile`:

1. Fetch games tagged with `group_id` OR legacy untagged games where all players are court members
2. Recompute `total_wins`, `total_losses`, streaks, points from those games
3. Override global `players` stats for display

This means court leaderboard stats may differ from global `players` table values.

## Supabase Schema (Core)

### `players`

Key fields: `id`, `username`, `display_name`, `phone`, `pin_hash`, `role`, `rating_doubles`, `rating_singles`, `rating_doubles_games`, `rating_singles_games`, `total_wins`, `total_losses`, `skill_level`, `is_competitive`, `play_frequency`, `profile_pic`, `is_rn_member`, `rn_role`

### `groups` (Courts)

`id`, `name`, `court_code`, `pin`

### `group_members`

`group_id`, `player_id`

### `games`

`team_a_ids`, `team_b_ids`, `score_a`, `score_b`, `winner_team`, `logged_by`, `played_at`, `group_id`, `is_singles`, `is_reverted`, `rating_delta_a`, `rating_delta_b`

### `rating_history`

`player_id`, `game_id`, `rating_before`, `rating_after`, `delta`, `game_type`

## Key Files Index

| Need to… | Start here |
|----------|------------|
| Change rating math | `src/utils/ratingEngine.js` |
| Change match logging | `src/hooks/useGameLogger.js` |
| Change login/auth | `src/context/AuthContext.jsx` |
| Change court stats | `src/hooks/useCourtData.js` |
| Change profile view | `src/components/PlayerProfile.jsx` |
| Change main UI shell | `src/components/Dashboard.jsx` |

## Environment

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

See `.env.example`. Never commit `.env`.

## Running Locally

```bash
npm install
cp .env.example .env   # fill in values
npm run dev
```
