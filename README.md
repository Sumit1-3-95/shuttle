# Shuttle

Shuttle is building the identity and reputation layer for badminton players. Players record matches, compete within playing groups (Courts), build ratings and performance history, and eventually discover opponents of comparable skill.

## Quick Start

```bash
npm install
cp .env.example .env   # add your Supabase credentials
npm run dev
```

After clone, run `npm install` once — that installs the Husky pre-commit hook. Commits then auto-run ESLint on staged `.js`/`.jsx` files and are blocked if any errors are found.

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

## Local preview & bug reports

- **Cursor agent preview:** enable **Settings → Tools & MCP → Browser Automation → Browser Tab**, keep `npm run dev` running, then the agent can open `http://localhost:5173` inside Cursor after UI changes.
- **Collaborator (browser):** if something breaks while using `npm run dev`, use **Copy for AI** on the red banner (or full-screen error page), paste into an AI chat, and ask for a fix. Vite’s red compile overlay can also be selected and copied the same way.
