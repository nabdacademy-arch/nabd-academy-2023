-- NABD Academy / AI Tutor: focused quota RPC repair.
-- Safe to run once or re-run in the Supabase SQL Editor by the project owner.
-- Does NOT execute supabase/activate_nabd.sql, migrate student data, or touch OpenAI billing.
--
-- The Edge Function calls POST /rest/v1/rpc/nabd_learning_take_tutor_slot
-- with the signed-in student's JWT and a publishable/anon API key.
-- A signed-in user may invoke only this boolean RPC; the private counter is never readable.
begin;

create schema if not exists nabd_learning_private;

-- Create only the missing quota counter. If it already exists, leave its rows intact.
create table if not exists nabd_learning_private.tutor_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  minute timestamptz not null,
  hits integer not null check (hits between 1 and 6)
);

-- Reject a conflicting table definition instead of silently modifying another schema.
do $quota_shape$
begin
  if not exists (
    select 1 from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'nabd_learning_private'
      and c.relname = 'tutor_usage'
      and c.relkind in ('r', 'p')
  ) or (
    select pg_catalog.count(*)
    from pg_catalog.pg_attribute a
    where a.attrelid = 'nabd_learning_private.tutor_usage'::pg_catalog.regclass
      and a.attnum > 0 and not a.attisdropped
      and (
        (a.attname = 'user_id' and a.atttypid = 'pg_catalog.uuid'::pg_catalog.regtype) or
        (a.attname = 'minute'  and a.atttypid = 'pg_catalog.timestamptz'::pg_catalog.regtype) or
        (a.attname = 'hits'    and a.atttypid = 'pg_catalog.int4'::pg_catalog.regtype)
      )
  ) <> 3 then
    raise exception 'NABD tutor quota table has an unexpected definition; review it before applying a repair';
  end if;
end;
$quota_shape$;

-- No client role may read, write or enumerate quota counters directly.
revoke all on schema nabd_learning_private from public, anon, authenticated;
revoke all on table nabd_learning_private.tutor_usage from public, anon, authenticated;
alter table nabd_learning_private.tutor_usage enable row level security;

-- The PostgREST RPC runs as the SQL Editor/database function owner.
-- auth.uid() always selects the authenticated JWT user; no user_id parameter is accepted.
-- ON CONFLICT is atomic even under concurrent requests.
create or replace function public.nabd_learning_take_tutor_slot()
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $quota_function$
declare
  v_user_id uuid := (select auth.uid());
  v_minute timestamptz := pg_catalog.date_trunc('minute', pg_catalog.clock_timestamp());
  v_hits integer;
begin
  if v_user_id is null then
    return false;
  end if;

  insert into nabd_learning_private.tutor_usage as counter (user_id, minute, hits)
  values (v_user_id, v_minute, 1)
  on conflict (user_id) do update
    set minute = excluded.minute,
        hits = case when counter.minute = excluded.minute
                    then counter.hits + 1 else 1 end
    where counter.minute <> excluded.minute
       or counter.hits < 6
  returning hits into v_hits;

  return v_hits is not null;
end;
$quota_function$;

-- Default function privileges may permit PUBLIC, so revoke explicitly first.
revoke all on function public.nabd_learning_take_tutor_slot()
  from public, anon, authenticated;
grant execute on function public.nabd_learning_take_tutor_slot()
  to authenticated;

commit;

-- Non-consuming diagnostic (run separately after the transaction):
-- select
--   to_regclass('nabd_learning_private.tutor_usage') is not null as quota_table_exists,
--   to_regprocedure('public.nabd_learning_take_tutor_slot()') is not null as rpc_exists,
--   has_function_privilege('authenticated', 'public.nabd_learning_take_tutor_slot()', 'EXECUTE') as authenticated_can_call,
--   has_function_privilege('anon', 'public.nabd_learning_take_tutor_slot()', 'EXECUTE') as anon_can_call,
--   has_schema_privilege('authenticated', 'nabd_learning_private', 'USAGE') as private_schema_exposed;
-- Expected: true, true, true, false, false.
