# Production Operations Tracker

An iPad-first production tracking application for post-harvest operations. The
current complete workflow covers trim production, including employee assignment,
weight entry, session summaries, archive management, and exports.

## Current Architecture

- React 19, TypeScript, and Vite
- Tailwind CSS v4 and Ant Design
- React Router
- Browser `localStorage` for the current application data
- PDF and spreadsheet exports

The application is being prepared for a future Supabase backend. Supabase is not
currently connected to the active user workflow.

## Requirements

- Node.js `26.0.0`
- npm `11.12.1`

Using `nvm` is recommended but not required. With `nvm` installed, the repository
selects the correct Node.js version from `.nvmrc`.

## Local Setup

```bash
nvm install
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:5173`. Landscape mode is recommended on iPad.

The Supabase variables in `.env.local` may remain empty while the application
uses its current local-storage workflow. Never commit `.env.local`.

## Project Commands

```bash
npm run dev      # Start the local Vite development server
npm run lint     # Run ESLint
npm run build    # Type-check and create the production build
npm run check    # Run lint and build
npm run preview  # Preview the production build locally
```

Run `npm run check` before opening a pull request.

## Main Workflows

### 1. Start Session

- Select facility, room, and employees
- Employee cards show `#ID`, legal name, and nickname
- Search by employee ID, legal name, or nickname

### 2. Live Session

- **Left:** employee cards with weight totals (Regular / Stick / Smalls / Total)
- **Right:** Entry tab for fast weight input (whole grams only) + category buttons that save instantly
- **Breakdown tab:** per-employee entry list by category with subtotals
- **Recent Entries:** last 20 entries with edit and delete

### 3. Session Complete

- Facility, room, date, duration
- Employee production summary (weights only)
- Export CSV, Excel, or Google Sheets for payroll handoff

### 4. Archive and Settings

- Review and edit completed sessions
- Preserve an audit trail for archive changes
- Manage facilities, rooms, supervisors, and employees
- Import and export local backups

## Development Workflow

Create a branch from an up-to-date `main`:

```bash
git switch main
git pull origin main
git switch -c feature/short-description
```

After making changes:

```bash
npm run check
git add -A
git commit -m "Describe the change"
git push -u origin feature/short-description
```

Open a pull request into `main`. CI must pass before merging. Delete the feature
branch after the pull request is merged.

## Continuous Integration

GitHub Actions runs on every pull request and on pushes to `main`. The workflow:

1. Uses the Node.js version declared in `.nvmrc`
2. Installs locked dependencies with `npm ci`
3. Runs ESLint
4. Runs the TypeScript and Vite production build
