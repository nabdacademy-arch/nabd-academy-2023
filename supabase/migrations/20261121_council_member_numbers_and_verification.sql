-- NABD Councils Network: permanent council member numbers and unguessable QR verification tokens.
-- Membership numbers are allocated atomically within each council; QR token is not a password.
begin;

create table if not exists public.nabd_council_number_counters (
  council_code text primary key check (council_code in (
    'trustees','academic','research','students','international','quality','digital','humanitarian'
  )),
  last_number bigint not null default 0 check (last_number >= 0)
);
alter table public.nabd_council_number_counters enable row level security;
revoke all on public.nabd_council_number_counters from public,anon,authenticated;
insert into public.nabd_council_number_counters(council_code,last_number) values
  ('trustees',0),('academic',0),('research',0),('students',0),
  ('international',0),('quality',0),('digital',0),('humanitarian',0)
on conflict (council_code) do nothing;

alter table public.nabd_council_memberships
  add column if not exists member_code text,
  add column if not exists verify_token uuid;

create or replace function public.nabd_issue_council_identity()
returns trigger language plpgsql security definer
set search_path = ''
as $fn$
declare n bigint;
declare prefix text;
begin
  prefix := case new.council_code
    when 'trustees' then 'TRU'
    when 'academic' then 'ACA'
    when 'research' then 'RES'
    when 'students' then 'STU'
    when 'international' then 'INT'
    when 'quality' then 'QUA'
    when 'digital' then 'DIG'
    when 'humanitarian' then 'HUM'
    else null end;
  if prefix is null then raise exception 'Invalid council code' using errcode='23514'; end if;
  -- Atomic UPDATE serializes concurrent assignments to the same council.
  update public.nabd_council_number_counters
    set last_number = last_number + 1
    where council_code = new.council_code
    returning last_number into n;
  if n is null then raise exception 'Council sequence is not configured'; end if;
  new.member_code := 'NABD-NCN-' || prefix || '-' || lpad(n::text,greatest(length(n::text),4),'0');
  new.verify_token := gen_random_uuid();
  return new;
end;
$fn$;

revoke all on function public.nabd_issue_council_identity() from public,anon,authenticated;

drop trigger if exists nabd_council_identity_on_insert on public.nabd_council_memberships;
create trigger nabd_council_identity_on_insert
  before insert on public.nabd_council_memberships
  for each row execute function public.nabd_issue_council_identity();

-- Backfill legacy members, ordered by appointment date, without changing their existing memberships.
do $backfill$
declare m record; n bigint; prefix text;
begin
  for m in
    select user_id,council_code
    from public.nabd_council_memberships
    where member_code is null or verify_token is null
    order by council_code,appointed_at,user_id
  loop
    prefix := case m.council_code
      when 'trustees' then 'TRU' when 'academic' then 'ACA'
      when 'research' then 'RES' when 'students' then 'STU'
      when 'international' then 'INT' when 'quality' then 'QUA'
      when 'digital' then 'DIG' when 'humanitarian' then 'HUM' end;
    update public.nabd_council_number_counters
      set last_number=last_number+1 where council_code=m.council_code
      returning last_number into n;
    update public.nabd_council_memberships
      set member_code=coalesce(member_code,'NABD-NCN-'||prefix||'-'||lpad(n::text,greatest(length(n::text),4),'0')),
          verify_token=coalesce(verify_token,gen_random_uuid())
      where user_id=m.user_id and council_code=m.council_code;
  end loop;
end;
$backfill$;

alter table public.nabd_council_memberships
  alter column member_code set not null,
  alter column verify_token set not null;

create unique index if not exists nabd_council_membership_number_unique
  on public.nabd_council_memberships(member_code);
create unique index if not exists nabd_council_membership_token_unique
  on public.nabd_council_memberships(verify_token);

alter table public.nabd_council_memberships
  drop constraint if exists nabd_council_member_code_format;
alter table public.nabd_council_memberships
  add constraint nabd_council_member_code_format
  check (member_code ~ '^NABD-NCN-(TRU|ACA|RES|STU|INT|QUA|DIG|HUM)-[0-9]{4,}$');

-- Existing UPDATE grants permit only position and active changes; identifiers remain immutable.
revoke update (member_code,verify_token) on public.nabd_council_memberships from authenticated;
comment on column public.nabd_council_memberships.member_code is
  'Permanent, sequential within each council, non-secret public-facing membership number.';
comment on column public.nabd_council_memberships.verify_token is
  'Unpredictable QR verification token; never use as a login credential.';
commit;