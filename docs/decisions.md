# Shuttle — Architecture Decisions

Lightweight decision log. Add entries when making non-obvious choices.

---

## ADR-001: JavaScript over TypeScript

**Status:** Accepted (current state)

**Context:** README mentions TypeScript, but the codebase is plain JavaScript (`.js`/`.jsx`).

**Decision:** Stay on JavaScript for now. Use JSDoc on complex functions. Migrate to TypeScript only when explicitly planned.

**Consequences:** No compile-time type safety. Agents should not introduce `.ts` files unprompted.

---

## ADR-002: Supabase as BaaS (no custom backend)

**Status:** Accepted

**Context:** Need fast iteration for MVP with realtime, storage, and Postgres.

**Decision:** Use Supabase client directly from the React SPA. No Express/Fastify/Edge Functions layer.

**Consequences:** Business logic lives in hooks and `ratingEngine.js`. Security depends on Supabase RLS policies (not in this repo). All queries are visible in client code.

---

## ADR-003: Custom PIN auth (not Supabase Auth)

**Status:** Accepted

**Context:** Players login with phone/username + 4-digit PIN, familiar to the target community.

**Decision:** Store `pin_hash` on `players` table. Hash/compare with `bcryptjs` in the browser. Session in `localStorage` as `shuttle_user`.

**Consequences:** Unusual pattern — agents must not assume Supabase Auth SDK. PIN security depends on RLS and bcrypt cost factor.

---

## ADR-004: Elo rating engine in `ratingEngine.js`

**Status:** Accepted

**Context:** Ratings are core product value. Need singles/doubles tracks, calibration, participation bonus.

**Decision:** Pure functions in `src/utils/ratingEngine.js`. Called by `useGameLogger.js` on write and `RecalcRatings.jsx` for admin recalculation.

**Consequences:** Single source of truth for rating math. Changes here affect all players — test carefully.

---

## ADR-005: Court-scoped stats computed client-side

**Status:** Accepted

**Context:** Players belong to multiple courts. Global `players.total_wins` doesn't reflect per-court performance.

**Decision:** `useCourtData` and `usePlayerProfile` recompute stats from filtered games rather than relying on denormalized player fields.

**Consequences:** Court leaderboard numbers may differ from global player record. Legacy untagged games included when all participants are court members.

---

## ADR-006: Inline styles (no CSS framework)

**Status:** Accepted

**Context:** Rapid UI iteration for mobile-first gaming aesthetic.

**Decision:** Inline `style={{}}` objects + per-component `<style>` blocks. No Tailwind or component library.

**Consequences:** `getLevel()`, avatar wrappers, and input styles are duplicated across files. Consistent look requires matching existing patterns.

---

## ADR-007: No client-side router

**Status:** Accepted

**Context:** MVP is a single-screen mobile app with overlay navigation.

**Decision:** Screen state in `App.jsx` and `Dashboard.jsx` via `useState`. No react-router.

**Consequences:** No deep links or browser back-button navigation. Adding a router would be a deliberate migration.

---

## ADR-008: Racquet Ninja as embedded module

**Status:** Accepted

**Context:** Partner academy (Racquet Ninja) needs drills, schedule, tournaments within Shuttle.

**Decision:** Self-contained module at `src/components/racquet-ninja/` with own tables (`rn_*`). Accessed via overlay from Dashboard.

**Consequences:** RN features are partner-specific. Do not conflate with core Shuttle MVP unless explicitly scoped.

---

## ADR-009: Dual progression systems

**Status:** Accepted (technical debt)

**Context:** UI shows both win-based tiers (ROOKIE → LEGEND) and Elo rating tiers.

**Decision:** Both coexist. `getLevel()` uses `total_wins`; `getRatingTier()` uses Elo rating.

**Consequences:** Can confuse users and agents. Future consolidation possible but not planned yet.
