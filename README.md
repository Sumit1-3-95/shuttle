# Shuttle

## Overview

Shuttle is building the identity and reputation layer for badminton players.

It enables players to record matches, build a trusted playing identity, measure performance over time, and discover opponents with comparable skill levels through data.

The current MVP focuses on helping badminton groups log games and automatically generate meaningful insights such as ratings, leaderboards, rivalries, and performance trends.

---

# Vision

Every serious badminton player deserves a trusted, portable playing identity that reflects their true skill.

A credible playing reputation motivates players to improve consistently, enables fair competition, and helps players discover opponents with similar ability wherever they play.

Shuttle aims to become the default identity layer for badminton players.

---

# Target Users

The current product is built for serious and semi-professional badminton players who:

- Play consistently every week.
- Care about improving their game.
- Enjoy competing with friends and regular opponents.
- Want to measure their progress over time.
- Prefer meaningful competition over casual play.

The primary usage happens inside small badminton communities where players regularly play with and against one another.

---

# Current MVP

The current version focuses on building the foundation of a player's badminton identity.

### Included

- Player Profiles
- Court (playing group) management
- Match logging
- Player ratings
- Leaderboards
- Rivalries
- Performance trends

### Not in Scope

- Payments
- Tournament management
- AI-powered features
- Coaching features
- Multi-sport support

---

# Product Flow

```text
Create Player Profile
        ↓
Join or Create a Court
        ↓
Play Matches
        ↓
Log Match Results
        ↓
Generate Ratings, Leaderboards & Rivalries
        ↓
Build a Trusted Playing Identity
```

---

# Core Concepts

## Player

An individual badminton player with a persistent identity, profile, ratings, match history, and performance statistics.

## Court

A private community of players who regularly play together.

A Court represents a playing group rather than a physical badminton court. It manages members, matches, and leaderboards.

## Team

A doubles pair participating together in a match.

Teams exist within the context of a match and consist of two players.

## Match

A recorded badminton game between two players (singles) or two teams (doubles).

Every statistic, rating, rivalry, and insight is derived from recorded matches.

## Rating

A numerical representation of a player's current playing strength derived from historical match data.

The MVP currently uses an Elo-based rating system with additional incentives for participation.

## Rivalry

The head-to-head history between two players or two teams, including wins, losses, and performance insights.

---

# Design Principles

- Every match should contribute to a player's long-term identity.
- Ratings should reflect playing strength while encouraging regular participation.
- Logging matches should be fast and frictionless.
- Statistics should be earned through real gameplay, not self-declared achievements.
- Every feature should strengthen a player's reputation and credibility.
- Mobile-first experience.
- Simplicity is preferred over feature richness.

---

# Technology Stack

> _(Update as the project evolves.)_

- React
- TypeScript
- Vite
- Tailwind CSS
- Firebase / Supabase _(update accordingly)_

---

# Running Locally

```bash
npm install
npm run dev
```

Required environment variables are available in `.env`.

---

# Project Structure

```
src/
components/
pages/
hooks/
services/
utils/
```

_(Update as the architecture evolves.)_

---

# Roadmap

### Phase 1 — Identity

- Player Profiles
- Match Logging
- Ratings
- Leaderboards
- Rivalries

### Phase 2 — Discovery

- Find players with similar ratings
- Better matchmaking
- Public player profiles

### Phase 3 — Ecosystem

- Academies
- Clubs
- Tournaments
- Multi-city player network

---

# Long-Term Goal

Shuttle is not intended to be just another score-tracking app.

The long-term vision is to become the trusted identity and reputation layer for badminton players, where a player's standing is earned through consistent competition and credible match history.