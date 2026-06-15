# Production Operations Tracker

An iPad-first production tracking application for post-harvest operations. The
current complete workflow covers trim production, including employee assignment,
weight entry, session summaries, archive management, and exports.

## Current Architecture

- React 19, TypeScript, and Vite
- Tailwind CSS v4 and Ant Design
- React Router
- Supabase Auth for user login and role-based access
- Supabase for facilities, rooms, employees, and supervisor profiles
- Supabase for creating production sessions and their initial participants
- Supabase for recording, updating, and deleting live trim weight entries
- Browser `localStorage` for live UI state and archives during the current migration phase
- PDF and spreadsheet exports

The backend migration is in progress. Authentication, master data, session
creation, and live trim weight entries use the hosted Supabase project. Session
completion, archives, and exports still use the existing browser-local workflow
until their repository layers are connected.

## Requirements

- Node.js `26.0.0`
- npm `11.12.1`

Using `nvm` is recommended but not required. With `nvm` installed, the repository
selects the correct Node.js version from `.nvmrc`.

Docker Desktop or another Docker-compatible runtime is required only when
running the complete Supabase stack locally.

## Local Setup

### 1. Install nvm on macOS

Install [Homebrew](https://brew.sh/) first if `brew --version` is not available.
Then install and configure nvm:

```bash
brew install nvm
mkdir -p "$HOME/.nvm"
```

Add the following lines to `~/.zshrc`:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$(brew --prefix nvm)/nvm.sh" ] && \. "$(brew --prefix nvm)/nvm.sh"
[ -s "$(brew --prefix nvm)/etc/bash_completion.d/nvm" ] && \. "$(brew --prefix nvm)/etc/bash_completion.d/nvm"
```

Reload the shell and verify the installation:

```bash
source "$HOME/.zshrc"
nvm --version
```

Developers who already have a working nvm installation can skip this section.

### 2. Clone And Run The Project

```bash
git clone https://github.com/ZiwenLiu0735/production-operations-tracker.git
cd production-operations-tracker
nvm install
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:5173`. Landscape mode is recommended on iPad.

Populate both Supabase variables in `.env.local`; authentication cannot start
without them. Never commit `.env.local`.

`npm ci` installs both the frontend dependencies and the project-local Supabase
CLI. Developers do not need to install the Supabase CLI globally.

## Project Commands

```bash
npm run dev      # Start the local Vite development server
npm run lint     # Run ESLint
npm run build    # Type-check and create the production build
npm run check    # Run lint and build
npm run preview  # Preview the production build locally
```

Run `npm run check` before opening a pull request.

## Supabase Development

The database schema is versioned in `supabase/migrations`. Do not make
untracked schema changes directly in the hosted project.

One-time setup for a developer who has access to the Supabase project:

```bash
npx supabase login
npx supabase link --project-ref ongpgudepsniirbqvdzc
```

Common local database commands:

```bash
npm run supabase:start       # Start the local Supabase stack
npm run supabase:status      # Show local service URLs and keys
npm run supabase:reset       # Rebuild the local database from migrations
npm run supabase:migrations  # Compare local and remote migration history
npm run supabase:types       # Regenerate TypeScript types from the linked project
npm run supabase:stop        # Stop the local Supabase stack
```

Link credentials and database passwords are stored locally and must never be
committed. See `docs/supabase-architecture.md` for the planned data model and
migration sequence.

Run `npm run supabase:types` after applying schema migrations. Commit the
generated `src/types/database.ts` file so frontend database queries and RPC
calls are checked against the current schema.

After merging database or Edge Function changes, deploy both parts from
`main`:

```bash
npx supabase db push
npx supabase functions deploy user-management
```

Cloudflare Pages must define `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` for both Preview and Production deployments.
Only the publishable browser key belongs in frontend environment variables;
never expose a Supabase secret or service-role key.

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
- View role-specific operator, supervisor, and admin directories
- Admins can create and manage Auth users, employee details, roles, and access
- Admins can manage facilities and rooms in Supabase

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
