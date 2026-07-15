# Shuttle

Shuttle is building the identity and reputation layer for badminton players. Players record matches, compete within playing groups (Courts), build ratings and performance history, and eventually discover opponents of comparable skill.

## Quick Start

```bash
npm install
cp .env.example .env   # add your Supabase credentials
npm run dev
```

## Tech Stack

- React 19 + Vite
- JavaScript (JSX)
- Supabase (Postgres, Realtime, Storage)
- Inline styles (mobile-first dark UI)

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/product.md](docs/product.md) | Vision, MVP scope, core concepts, design principles |
| [docs/architecture.md](docs/architecture.md) | Stack, folder structure, data flows, schema |
| [docs/decisions.md](docs/decisions.md) | Architecture decision records |
| [docs/roadmap.md](docs/roadmap.md) | What's built vs planned |

## Project Structure

```text
src/
├── context/       # AuthContext (PIN login)
├── hooks/         # Data fetching + business orchestration
├── utils/         # ratingEngine.js, avatars.js
└── components/    # UI (Dashboard, LogGame, PlayerProfile, …)
```

## Cursor Rules

AI agent guidance lives in `.cursor/rules/` — product context, engineering principles, frontend patterns, and data layer conventions.

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```
