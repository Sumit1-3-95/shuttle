# Shuttle — Product

Shuttle is building the identity and reputation layer for badminton players.

## Vision

Every serious badminton player deserves a trusted, portable playing identity that reflects their true skill. Shuttle aims to become the default identity layer for badminton players.

## Target Users

Serious and semi-professional players who play weekly, care about improvement, enjoy competing with friends, and want to measure progress over time. Primary usage happens inside small badminton communities.

## Product Pillars

| Pillar | What it means |
|--------|---------------|
| **Identity** | Persistent player profiles built from real match history |
| **Reputation** | Credible ratings, stats, and rivalries — earned, not declared |
| **Competition** | Leaderboards, head-to-head records, court-level rivalry |
| **Progress** | Performance trends, streaks, rating history over time |
| **Discovery** | Find comparable players (Phase 2) |

## Core Concepts

### Player

An individual badminton player with a persistent identity, profile, ratings, match history, and performance statistics.

### Court

A private community of players who regularly play together. A Court is a **playing group** (stored as `groups` in the database), not a physical badminton court. Courts manage members, matches, and leaderboards.

### Team

A doubles pair participating together in a match. Teams exist within the context of a match.

### Match

A recorded badminton game between two players (singles) or two teams (doubles). Every statistic, rating, rivalry, and insight is derived from recorded matches.

### Rating

A numerical representation of playing strength derived from historical match data. The MVP uses an Elo-based system with participation incentives. Separate tracks for singles and doubles.

### Rivalry

Head-to-head history between two players or teams, including wins, losses, and performance insights.

## MVP Scope

### Included

- Player profiles
- Court (playing group) management
- Match logging
- Player ratings (Elo)
- Leaderboards
- Rivalries
- Performance trends
- Skill/flaw tagging after matches
- Training videos tab
- Racquet Ninja partner module (academy feature)

### Not in Scope

- Payments
- Platform tournament management
- AI-powered features
- Coaching features
- Multi-sport support

## Design Principles

- Every match should contribute to a player's long-term identity
- Ratings should reflect playing strength while encouraging regular participation
- Logging matches should be fast and frictionless
- Statistics should be earned through real gameplay, not self-declared achievements
- Every feature should strengthen a player's reputation and credibility
- Mobile-first experience
- Simplicity is preferred over feature richness

## Product Flow

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
