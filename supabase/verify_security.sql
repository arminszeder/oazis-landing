-- Read-only security check. Paste into the Supabase SQL editor and read the
-- verdict column. Changes nothing.

-- 1. Is RLS on, and is it genuinely closed (no policies = nobody but service_role)?
select
  'RLS on registrations' as check,
  case
    when not c.relrowsecurity then 'FAIL — row level security is OFF'
    when p.n > 0 then 'REVIEW — RLS on, but ' || p.n || ' policy/policies exist'
    else 'PASS — RLS on, no policies, service_role only'
  end as verdict
from pg_class c
join pg_namespace ns on ns.oid = c.relnamespace
cross join lateral (
  select count(*) n from pg_policies where schemaname = 'public' and tablename = 'registrations'
) p
where ns.nspname = 'public' and c.relname = 'registrations'

union all

-- 2. Can the public API roles touch the table directly?
select
  'anon/authenticated grants on registrations',
  coalesce(
    'FAIL — ' || string_agg(distinct grantee || ':' || privilege_type, ', '),
    'PASS — no direct grants'
  )
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'registrations'
  and grantee in ('anon', 'authenticated')

union all

-- 3. Does the reporting view exist, and does it respect RLS?
select
  'registration_overview view',
  case
    when not exists (
      select 1 from pg_views where schemaname = 'public' and viewname = 'registration_overview'
    ) then 'MISSING — the create view statement never ran'
    when exists (
      select 1 from pg_class c
      join pg_namespace ns on ns.oid = c.relnamespace
      where ns.nspname = 'public' and c.relname = 'registration_overview'
        and c.reloptions @> array['security_invoker=true']
    ) then 'PASS — exists, security_invoker on'
    else 'FAIL — exists but runs as definer, which reads past RLS'
  end

union all

-- 4. Can the public API roles read the view?
select
  'anon/authenticated grants on registration_overview',
  coalesce(
    'FAIL — ' || string_agg(distinct grantee || ':' || privilege_type, ', '),
    'PASS — no direct grants'
  )
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'registration_overview'
  and grantee in ('anon', 'authenticated');
