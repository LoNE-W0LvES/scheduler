# HR Task Planner — Online Edition

A multi-user HR task management application with Supabase backend.

## Features

- **Multi-user support** — Each user has their own data, notes, and task history
- **Authentication** — Sign up / Sign in with email and password
- **Admin panel** — Manage locked routines and user roles
- **Real-time sync** — Data automatically saves to the cloud
- **Dark mode** — Toggle between light and dark themes
- **Task tracking** — Weekly view, calendar view, and tracker view

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth)
- **Hosting:** Vercel / Netlify / any static hosting

## Development Setup

1. **Install dependencies:**
   ```bash
   cd client
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the `client/` directory:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```
   The built files will be in `client/dist/`

## Database Schema

The app uses the following Supabase tables:

- `profiles` — User profiles (linked to auth.users), stores display name, role, theme
- `locked_routines` — System-wide locked routines (admin managed)
- `custom_routines` — User-specific custom routines
- `months_data` — User's month data (week state, tracker state)
- `notes` — User notes and reminders
- `monthly_archives` — Archived month snapshots

## User Roles

- **User** — Can manage their own tasks, notes, custom routines
- **Admin** — Can additionally manage locked routines and user roles

## Migration from USB Edition

If migrating from the old USB edition:

1. Export your `data.json` file
2. Create accounts in the new system
3. Use the Admin panel to recreate locked routines
4. Manually transfer notes and tasks

---

Built with React + Vite + Tailwind CSS + Supabase
