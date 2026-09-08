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

## Reading entries

Supabase dashboard → Table editor → `registration_overview`. `status` on the
`registrations` table (`new` / `contacted` / `paid` / `cancelled`) and
`organiser_note` are there to be edited by hand as you work through the list.

## The Google Sheet mirror

The organising team reads entries in a Google Sheet that refreshes itself. Two
tabs, both fed by `app/api/export/route.ts`:

- **Nevezések (élő)** is a one-to-one mirror of the table, rewritten in full on
  every sync and sheet-protected so only the spreadsheet owner can type in it.
- **Csapat munkalap** starts as the same rows plus a few blank columns of the
  team's own. The sync only ever *appends* here, keyed on the registration id,
  so a pair the team swapped around by hand survives the next refresh.

That split is deliberate. Tab one always tells you what people actually
submitted, tab two is where reality gets tracked, and neither can quietly
overwrite the other.

### Setting it up

1. Generate a token with `openssl rand -hex 32`. Add it as `EXPORT_TOKEN` in
   Vercel under *Settings → Environment Variables* with **Production** ticked,
   and redeploy.

2. Create the spreadsheet, then *Extensions → Apps Script*, and paste
   `scripts/oazis-sheets-sync.gs` over the default file.

3. In the script's *Project Settings → Script Properties*, add:

   ```
   EXPORT_URL    https://<site>/api/export
   EXPORT_TOKEN  <the same token>
   ```

   Script properties are not visible to people who merely have edit access to
   the spreadsheet, which is why the token lives there and not in a cell.

4. Run `setUpSync` once. It grants the permissions, creates a 10 minute timer
   and does a first sync. An **Oázis** menu appears in the spreadsheet for
   syncing on demand.

5. Share the spreadsheet with the team as **editors**, by named address rather
   than "anyone with the link" — the rows carry phone numbers.

Adding a column to `COLUMNS` in the export route puts it in both tabs on the
next sync. Team columns are configured at the top of the `.gs` file.

### Caveats

- The working tab reflects a registration as it looked when it first appeared.
  Later changes made in Supabase, `status` included, show up on the live tab
  only.
- The export endpoint returns nothing at all without the token, and 401s if
  `EXPORT_TOKEN` is unset. Check it with
  `curl -H "x-export-token: <token>" https://<site>/api/export`.

## Changing the tournament details

`lib/tournament.ts` holds categories, start times, sizes, entry fee, venue and
phone number — the page, the form and the API validation all read from it.
Category names are also in the SQL `check` constraint, so renaming one means
touching both.
