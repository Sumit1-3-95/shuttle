# Shuttle Agent Commands

Custom agent commands for testing and automation in the Shuttle badminton app.

## Available Commands

### /login-shuttle

Automatically log in to the Shuttle app with test credentials.

**Usage:**
```
/login-shuttle
```

**What it does:**
1. Navigates to `http://localhost:5173/`
2. Fills in username: `sumit`
3. Fills in PIN: `1111`
4. Clicks the LOGIN button
5. Waits for authentication to complete
6. Verifies successful login

**Credentials:**
- **Username**: sumit
- **PIN**: 1111

**Success indicators:**
- Redirected to dashboard
- Profile card visible with "SUMIT" name
- Win rate displayed (55%)
- Leaderboard visible
- "+ ADD GAME" button available

**Related skill:**
- See `.cursor/skills/shuttle-login/SKILL.md` for detailed automation instructions

## Testing Quick Start

After logging in, you can:
- Click "+ ADD GAME" to log a match
- Navigate tabs: PLAYERS, TEAMS, GAMES, REPORT, DEUCE
- Click on leaderboard entries to view player profiles
- Use court filter buttons (All, Fortune group, etc.)

## Development

These commands are powered by:
- **Skill**: `.cursor/skills/shuttle-login/SKILL.md` — detailed login automation
- **Hooks**: `.cursor/hooks.json` — session hooks (if needed)

To modify credentials or behavior, edit the skill file directly.
