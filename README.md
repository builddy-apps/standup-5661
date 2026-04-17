# StandUp

A beautiful, calming standing reminder app with animated stretch guides, streak tracking, and ambient sound notifications to help combat sedentary habits

Built with [Builddy](https://builddy.dev) — AI-powered app builder using GLM 5.1.

## Features

- Customizable circular timer with 20/30/45/60 minute intervals and smooth SVG gradient animation
- Full-screen animated reminder overlay with stretching character and randomized micro-exercise suggestions
- Daily progress ring showing stand goal completion percentage with color-coded feedback
- Weekly statistics bar chart showing standing patterns and trends
- Streak tracking with motivational messages for consecutive goal-meeting days
- Ambient notification sounds (singing bowl, birdsong, gentle chime) with Web Audio API
- One-click 5-minute snooze functionality
- Dark mode with smooth theme transitions and persistent preference
- Persistent settings and history in both localStorage and SQLite database

## Quick Start

### Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Docker

```bash
docker compose up
```

### Deploy to Railway/Render

1. Push this directory to a GitHub repo
2. Connect to Railway or Render
3. It auto-detects the Dockerfile
4. Done!

## Tech Stack

- **Frontend**: HTML/CSS/JS + Tailwind CSS
- **Backend**: Express.js
- **Database**: SQLite
- **Deployment**: Docker