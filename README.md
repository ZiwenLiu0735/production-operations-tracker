# TrimTrack — Cannabis Trim Production Tracking (MVP V0.2)

iPad-first production tracking for cannabis trim room supervisors. Fast weight entry and production tracking — not payroll calculation.

## Run locally

```bash
npm install
npm run dev
```

Open at `http://localhost:5173` (landscape on iPad recommended).

## Screens

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

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router · SheetJS (xlsx)
