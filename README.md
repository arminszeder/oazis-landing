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
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

   `SUPABASE_URL` is the **Project URL**, not the dashboard link in your address
   bar. Neither variable is `NEXT_PUBLIC_*`, on purpose: those are inlined at
   build time and never reach the browser this way.

3. **Run.**

   ```
   npm install
   npm run dev
   ```

## Deploy

Push to GitHub, import in Vercel, add the same two env vars under
*Settings → Environment Variables* with **Production** ticked, then redeploy —
Vercel applies variables only to builds made after they were added.

Check a deploy with `curl https://<site>/api/health`. It reports whether the
variables are set and the database is reachable, without echoing any values.

## How registration works

The form posts JSON to `app/api/register/route.ts`. That route runs on the
server, revalidates every field (categories, sizes, phone, pair-vs-solo
requirements), drops honeypot submissions, throttles to 5 posts per IP per
minute, and inserts with the service key. RLS has no policies, so the anon key
can neither read nor write — the route is the only way in.

## The organiser dashboard

`/admin` is where the team works the list. Built for a phone, because that is
what you have on you at the club.

- **Nevezések.** Every entry as a card: tap the number to call, one tap to move
  someone between Új / Megkeresve / Fizetett / Lemondva, a free-text note per
  entry. Search covers names, phone numbers and notes.
- **Párosítás.** Solo entrants by category. Tap two names to pair them, tap a
  formed pair to split it. The link is symmetric and stored in `paired_with`,
  so nothing the entrant submitted is overwritten.
- **Összesítés.** Entries and players per category, status tally, fees collected
  against fees outstanding, shirt sizes totalled for the printer, and a CSV
  download.

Every change is stamped with `updated_by` and `updated_at`, so "who marked this
one paid" has an answer. Writes are optimistic and roll back visibly if the
server rejects them.

### Setting it up

1. Run `supabase/migrations/0002_admin.sql` in the Supabase SQL editor. It adds
   `updated_at`, `updated_by` and `paired_with`, and rebuilds
   `registration_overview` to match. Safe to run twice.

2. Set `ADMIN_PASSWORD` in `.env.local` and in Vercel (Production ticked, then
   redeploy). Give that password to the organisers.

Login asks for a name alongside the password. It is not authentication, it is
attribution: it decides whose name lands on the changes. The session cookie is
signed with a key derived from the password, so changing the password in Vercel
signs everyone out, and that is how you take access away from someone.

For a club of a handful of organisers over a few weeks this is the right amount
of ceremony. If entries ever needed per-person permissions or a real audit
trail, this is where you would swap in Supabase Auth.

`registration_overview` in the Supabase table editor stays available as the
raw read-only view.

## Changing the tournament details

`lib/tournament.ts` holds categories, start times, sizes, entry fee, venue and
phone number — the page, the form and the API validation all read from it.
Category names are also in the SQL `check` constraint, so renaming one means
touching both.
