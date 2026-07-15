# Shuttle Testing Automation Guide

## Quick Start

### 1. Start the Dev Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173/`

### 2. Use the Login Skill
Ask the agent to use the **shuttle-login** skill:

```
/login-shuttle
```

Or simply say:
```
Login to Shuttle using sumit / 1111
```

The agent will automatically:
- Navigate to the app
- Fill in credentials
- Click login
- Verify successful authentication

## Credentials

| Field | Value |
|-------|-------|
| Username | sumit |
| PIN | 1111 |

## What You Can Test After Login

### UI Navigation
- ✅ PLAYERS tab - view all players
- ✅ TEAMS tab - manage doubles pairs
- ✅ GAMES tab - view match history
- ✅ REPORT tab - performance analytics
- ✅ DEUCE tab - tiebreaker management

### Core Features
- ✅ "+ ADD GAME" button - log new matches
- ✅ Leaderboard - player rankings
- ✅ Court filters - switch between playing groups
- ✅ Player profiles - view individual stats
- ✅ Win rate - display accuracy

### Data
- **Player**: Sumit
- **Games Played**: 44
- **Wins**: 24
- **Losses**: 20
- **Win Rate**: 55%
- **Rating**: 1877 ELO
- **Best Streak**: 7

## Automated Login Flow

When you ask to login, the agent will:

1. **Navigate** to `http://localhost:5173/`
2. **Get page snapshot** to find form fields
3. **Fill username** field with "sumit"
4. **Fill PIN** field with "1111" (requires approval for security)
5. **Click LOGIN** button
6. **Wait 2-3 seconds** for authentication
7. **Verify success** by checking for dashboard elements

## Browser Automation Capabilities

After login, I can:

| Action | Example |
|--------|---------|
| Click buttons | Click "+ ADD GAME" |
| Fill forms | Enter game scores |
| Navigate tabs | Switch to TEAMS view |
| Scroll page | Scroll to see more players |
| Take screenshots | Capture UI states |
| Extract data | Read leaderboard rankings |
| Type text | Enter player names |

## Skill Location

```
.cursor/skills/shuttle-login/SKILL.md
```

This skill contains:
- Step-by-step login procedure
- Field identification by DOM refs
- Troubleshooting guide
- Success criteria

## Hooks Configuration

```
.cursor/hooks.json
```

Provides session initialization and command availability.

## Commands Reference

### Available in Conversation

- **"Login to Shuttle"** → Uses shuttle-login skill
- **"Can you test [feature]?"** → Test any UI feature
- **"Take a screenshot"** → Capture current state
- **"Click [button name]"** → Interact with UI
- **"Navigate to [tab]"** → Switch tabs

## Need Help?

Check the skill documentation:
```bash
cat .cursor/skills/shuttle-login/SKILL.md
```

Or ask the agent:
```
/login-shuttle
```
