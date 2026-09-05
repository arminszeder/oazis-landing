# Oázis Őszi Kupa 2026 — nevezési oldal

Next.js landing page for the Oázis Padel autumn tournament (Mosonmagyaróvár,
26–27 September). One page, one modal, registrations land in Supabase.

Built from the Claude Design export in `extracted/` — that folder is the source
mockup and is gitignored, not part of the build.

## Setup

1. **Supabase.** Create a project, open the SQL editor and run
   `supabase/migrations/0001_registrations.sql`. It creates the `registrations`
   table, turns on RLS with no policies, and adds a `registration_overview` view
   for reading entries in the table editor.

2. **Env.** Copy `.env.example` to `.env.local` and fill in from
   *Project Settings → API*:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

   The service key must stay server-side. Never rename it to `NEXT_PUBLIC_*`.

3. **Run.**

   ```
   npm install
   npm run dev
   ```

## Deploy

Push to GitHub, import in Vercel, add the same two env vars under
*Settings → Environment Variables*. No other configuration needed.

## How registration works

The form posts JSON to `app/api/register/route.ts`. That route runs on the
server, revalidates every field (categories, sizes, phone, pair-vs-solo
requirements), drops honeypot submissions, throttles to 5 posts per IP per
minute, and inserts with the service key. RLS has no policies, so the anon key
can neither read nor write — the route is the only way in.

## Reading entries

Supabase dashboard → Table editor → `registration_overview`. `status` on the
`registrations` table (`new` / `contacted` / `paid` / `cancelled`) and
`organiser_note` are there to be edited by hand as you work through the list.

## Changing the tournament details

`lib/tournament.ts` holds categories, start times, sizes, entry fee, venue and
phone number — the page, the form and the API validation all read from it.
Category names are also in the SQL `check` constraint, so renaming one means
touching both.
