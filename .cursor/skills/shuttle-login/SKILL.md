---
name: shuttle-login
description: Automate login to Shuttle badminton app using Sumit's credentials (username sumit, PIN 1111). Use when starting a new browser session or needing to log in to the Shuttle app for testing or development.
disable-model-invocation: true
---

# Shuttle Login

Automate login to the Shuttle app using predefined test credentials.

## Credentials

- **Username**: sumit
- **PIN**: 1111

## Quick Start

When you need to log in to Shuttle:

1. Ensure the dev server is running at `http://localhost:5173/`
2. Use browser automation to navigate to the app
3. Follow the login steps below

## Login Steps

### Step 1: Navigate to the app

```
Navigate to: http://localhost:5173/
```

### Step 2: Get the login form snapshot

```
Call browser_snapshot to see the page state
```

Look for:
- `role: textbox` with placeholder "e.g. 9876543210 or sumit" → username field (ref: e0)
- `role: textbox` with placeholder "••••" → PIN field (ref: e1)
- `role: button` with name "LOGIN" → login button (ref: e2)

### Step 3: Fill the username field

```
Call browser_fill with:
- ref: e0
- value: "sumit"
```

### Step 4: Fill the PIN field

```
Call browser_fill with:
- ref: e1
- value: "1111"
```

Note: This action requires `requestSmartModeApproval: true` due to credential sensitivity.

### Step 5: Click LOGIN

```
Call browser_click with:
- ref: e2
```

### Step 6: Wait for authentication

```
Sleep for 2-3 seconds to allow the login process to complete
```

### Step 7: Verify successful login

```
Call browser_snapshot to confirm the app has loaded with:
- Navigation tabs visible (PLAYERS, TEAMS, GAMES, REPORT, DEUCE)
- "+ ADD GAME" button visible
- No login form present
```

## Success Indicators

After successful login, you should see:
- ✅ Profile dashboard with player name "SUMIT"
- ✅ Win rate displayed (55%)
- ✅ Stats: Games, Wins, Losses, Best Streak
- ✅ Leaderboard visible
- ✅ Court filters (All, Fortune group, Gulmohar, etc.)
- ✅ "+ ADD GAME" button ready for interaction

## Troubleshooting

**Login button shows "LOGGING IN..." and stays disabled:**
- The login is processing. Wait 3-5 seconds before checking the page state again.

**Still on login page after waiting:**
- Check the browser console for errors using `browser_cdp`
- Verify the credentials are correct (sumit / 1111)
- Ensure the dev server is running

**PIN entry requires approval:**
- This is expected for security. Approve the credential entry when prompted.

## Usage Example

```
User: "Log me in to Shuttle"

Agent Actions:
1. browser_navigate to http://localhost:5173/
2. browser_snapshot to see login form
3. browser_fill username field with "sumit"
4. browser_fill PIN field with "1111" (with requestSmartModeApproval: true)
5. browser_click LOGIN button
6. Wait 3 seconds
7. browser_snapshot to verify login success
```
