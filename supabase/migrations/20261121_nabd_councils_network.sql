-- NABD Councils Network: eight non-executive councils, isolated from /portal.
-- Additive migration. Council membership is explicit and only admins can grant it.
begin;

create table if not exists public.nabd_council_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  council_code text not null check (council_code in (
    'trustees','academic','research','students',
    'international','quality','digital','humanitarian'
  )),
  position text not null default 'member'
    check (position in ('member','chair','vice_chair','secretary')),
  active boolean not null default true,
  appointed_at timestamptz not null default now(),
  primary key (user_id,council_code)
);

create index if not exists nabd_council_memberships_active_idx
  on public.nabd_council_memberships (council_code,user_id) where active;

create table if not exists public.nabd_council_records (
  id uuid primary key default gen_random_uuid(),
  council_code text not null check (council_code in (
    'trustees','academic','research','students',
    'international','quality','digital','humanitarian'
  )),
  kind text not null check (kind in (
    'meeting','decision','task','proposal','announcement'
  )),
  title text not null check (char_length(btrim(title)) between 3 and 180),
  body text not null default '' check (char_length(body) <= 6000),
  status text not null default 'open'
    check (status in ('draft','open','in_progress','approved','closed')),
  due_at date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists nabd_council_records_feed_idx
  on public.nabd_council_records (council_code,created_at desc);

alter table public.nabd_council_memberships enable row level security;
alter table public.nabd_council_records enable row level security;

revoke all on table public.nabd_council_memberships from public,anon,authenticated;
revoke all on table public.nabd_council_records from public,anon,authenticated;
grant select,insert,delete on table public.nabd_council_memberships to authenticated;
grant update (position,active) on table public.nabd_council_memberships to authenticated;
grant select,insert on table public.nabd_council_records to authenticated;
grant update (status) on table public.nabd_council_records to authenticated;

create policy nabd_councils_membership_read on public.nabd_council_memberships
  for select to authenticated
  using (user_id=(select auth.uid()) or (select public.is_admin()));

create policy nabd_councils_membership_add on public.nabd_council_memberships
  for insert to authenticated
  with check ((select public.is_admin()));

create policy nabd_councils_membership_edit on public.nabd_council_memberships
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy nabd_councils_membership_remove on public.nabd_council_memberships
  for delete to authenticated
  using ((select public.is_admin()));

create policy nabd_councils_record_read on public.nabd_council_records
  for select to authenticated
  using (
    (select public.is_admin()) or exists (
      select 1 from public.nabd_council_memberships m
      where m.user_id=(select auth.uid())
        and m.council_code=nabd_council_records.council_code and m.active
    )
  );

create policy nabd_councils_record_add on public.nabd_council_records
  for insert to authenticated
  with check (
    created_by=(select auth.uid())
    and status in ('draft','open')
    and (
      (select public.is_admin()) or exists (
        select 1 from public.nabd_council_memberships m
        where m.user_id=(select auth.uid())
          and m.council_code=nabd_council_records.council_code and m.active
      )
    )
  );

-- Only a chair/vice-chair of this council (or an administrator) may approve/close records.
-- UPDATE privileges are limited to the status column, preventing record reassignment.
create policy nabd_councils_record_status on public.nabd_council_records
  for update to authenticated
  using (
    (select public.is_admin()) or exists (
      select 1 from public.nabd_council_memberships m
      where m.user_id=(select auth.uid())
        and m.council_code=nabd_council_records.council_code
        and m.active and m.position in ('chair','vice_chair')
    )
  )
  with check (
    (select public.is_admin()) or exists (
      select 1 from public.nabd_council_memberships m
      where m.user_id=(select auth.uid())
        and m.council_code=nabd_council_records.council_code
        and m.active and m.position in ('chair','vice_chair')
    )
  );

comment on table public.nabd_council_memberships is
  'Approved membership only for the eight non-executive councils; never self-service.';
comment on table public.nabd_council_records is
  'Council-scoped records; RLS blocks student, lecturer and nonmember read access.';

commit;

-- First members are NOT inserted automatically. Approve them in the members-only
-- portal using an existing administrator account, or via reviewed SQL.
