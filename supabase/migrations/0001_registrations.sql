-- Oázis Őszi Kupa 2026 — nevezések
--
-- Run this in the Supabase SQL editor (or `supabase db push`) before the first
-- registration comes in.
--
-- RLS is on with no policies, which means anon and authenticated can do nothing
-- at all. Only the service_role key gets through, and that key lives server-side
-- in the /api/register route. Reads happen in the Supabase dashboard.

create table if not exists registrations (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- 'pair' = van már párom, 'solo' = nincs még párom (we find them a partner)
  mode          text not null check (mode in ('pair', 'solo')),
  category      text not null check (category in ('Női', 'Kezdő', 'Középhaladó', 'Haladó')),

  p1_name       text not null check (length(trim(p1_name)) > 0),
  p1_phone      text not null check (length(trim(p1_phone)) > 0),
  p1_size       text not null check (p1_size in ('S', 'M', 'L', 'XL')),

  -- only collected in pair mode; the design asks for one phone number per team
  p2_name       text,
  p2_size       text check (p2_size in ('S', 'M', 'L', 'XL')),

  note          text,
  -- 'social' | 'messenger' | 'referral', any combination, possibly empty
  sources       text[] not null default '{}',
  newsletter    boolean not null default false,

  -- organiser workflow, edited by hand in the dashboard
  status        text not null default 'new' check (status in ('new', 'contacted', 'paid', 'cancelled')),
  organiser_note text,

  constraint pair_has_second_player check (
    mode <> 'pair' or (p2_name is not null and length(trim(p2_name)) > 0 and p2_size is not null)
  ),
  constraint solo_has_no_second_player check (
    mode <> 'solo' or (p2_name is null and p2_size is null)
  )
);

create index if not exists registrations_created_at_idx on registrations (created_at desc);
create index if not exists registrations_category_idx on registrations (category);

alter table registrations enable row level security;

-- Convenience view for the dashboard: one row per registration, newest first,
-- readable enough to export straight to the shirt printer.
--
-- Views are security *definer* by default, which would let them read straight
-- past the RLS above. security_invoker + the revokes below keep the anon key
-- locked out of the view as well as the table.
create or replace view registration_overview
with (security_invoker = on) as
select
  r.created_at,
  r.category,
  case r.mode when 'pair' then 'Van párja' else 'Párt keres' end as mode_label,
  r.p1_name,
  r.p1_phone,
  r.p1_size,
  r.p2_name,
  r.p2_size,
  r.note,
  array_to_string(r.sources, ', ') as sources,
  r.newsletter,
  r.status
from registrations r
order by r.created_at desc;

revoke all on registrations from anon, authenticated;
revoke all on registration_overview from anon, authenticated;

comment on table registrations is
  'Oázis Őszi Kupa 2026 nevezések. Írás csak a /api/register route-on át, service_role kulccsal.';
