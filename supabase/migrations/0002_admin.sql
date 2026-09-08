-- Oázis Őszi Kupa 2026 — a szervezői felülethez (/admin) kellő oszlopok.
--
-- Run this in the Supabase SQL editor after 0001. Safe to run twice.

alter table registrations
  -- Who last touched the row, and when. The dashboard asks for a name at login
  -- and stamps it here, so "ki írta rá, hogy fizetett?" has an answer.
  add column if not exists updated_at timestamptz,
  add column if not exists updated_by text,

  -- Two solo entrants the organisers put together. The link is symmetric: both
  -- rows point at each other, and unpairing clears both. Nothing is deleted or
  -- rewritten, so the original submission stays readable underneath.
  add column if not exists paired_with uuid references registrations (id) on delete set null;

do $$
begin
  -- Only solo entries can be paired up, and never with themselves.
  if not exists (select 1 from pg_constraint where conname = 'pairing_is_solo_only') then
    alter table registrations add constraint pairing_is_solo_only
      check (paired_with is null or (mode = 'solo' and paired_with <> id));
  end if;
end $$;

create unique index if not exists registrations_paired_with_idx
  on registrations (paired_with)
  where paired_with is not null;

-- Keep the dashboard view in step with the table. Columns can only be appended
-- to an existing view, hence the drop.
drop view if exists registration_overview;

create view registration_overview
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
  r.status,
  r.organiser_note,
  partner.p1_name as paired_with_name,
  r.updated_at,
  r.updated_by
from registrations r
left join registrations partner on partner.id = r.paired_with
order by r.created_at desc;

revoke all on registration_overview from anon, authenticated;
