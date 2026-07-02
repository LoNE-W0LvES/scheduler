# HR Task Planner

A modern, multi-user HR task management application with Supabase backend.

## Features

- **4-Week Fixed Cycle** — Predictable work weeks (Days 1-7, 8-14, 15-21, 22-28)
- **Multi-user Support** — Each user has their own data and workspace
- **Authentication** — Secure sign up/sign in with email and password
- **Admin Panel** — Manage locked routines and user roles
- **Real-time Sync** — Data automatically saves to Supabase
- **Modern UI** — Gradient headers, smooth animations, dark mode
- **Task Tracking** — Weekly view, calendar view, and tracker view

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth)

## Development

```bash
cd client
npm install
npm run dev
```

## Build

```bash
cd client
npm run build
```

Output: `client/dist/`

## Database Schema

- `profiles` — User accounts with roles (admin/user)
- `locked_routines` — Admin-managed system routines
- `custom_routines` — User-specific routines
- `months_data` — Monthly task/tracker state per user
- `notes` — User reminders
- `monthly_archives` — Archived snapshots

## Environment Variables

Required in `client/.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
