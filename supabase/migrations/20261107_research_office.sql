-- REVIEW-ONLY: DO NOT APPLY TO PRODUCTION WITHOUT BACKUP, SCHEMA REVIEW,
-- STAGING RLS TESTS, SECURITY ADVISOR REVIEW AND OPERATOR APPROVAL.
-- Private internal research/outreach tracking; not a public partners list.
-- Requires existing public.is_admin() function checked against verified profiles.role.
begin;

create table if not exists public.nabd_research_outreach (
  id uuid primary key default gen_random_uuid(),
  institution text not null check (char_length(btrim(institution)) between 2 and 180),
  country text not null default '',
  purpose text not null default '',
  status text not null default 'draft' check (status in ('draft','sent','acknowledged','in_review','replied','exploring','closed')),
  reference_code text not null default '',
  contact_email text not null default '',
  last_contact_on date,
  follow_up_on date,
  internal_notes text not null default '',
  evidence_url text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists nabd_research_outreach_followup_idx
  on public.nabd_research_outreach (follow_up_on, status);

alter table public.nabd_research_outreach enable row level security;
alter table public.nabd_research_outreach force row level security;
revoke all on public.nabd_research_outreach from public, anon, authenticated;
grant select, insert, update on public.nabd_research_outreach to authenticated;

drop policy if exists nabd_research_outreach_admin_select on public.nabd_research_outreach;
create policy nabd_research_outreach_admin_select on public.nabd_research_outreach
  for select to authenticated using ((select public.is_admin()));
drop policy if exists nabd_research_outreach_admin_insert on public.nabd_research_outreach;
create policy nabd_research_outreach_admin_insert on public.nabd_research_outreach
  for insert to authenticated
  with check ((select public.is_admin()) and created_by = (select auth.uid()));
drop policy if exists nabd_research_outreach_admin_update on public.nabd_research_outreach;
create policy nabd_research_outreach_admin_update on public.nabd_research_outreach
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

comment on table public.nabd_research_outreach is
 'Strictly internal research partnership outreach tracker; never expose via public site pages.';

commit;

-- OPERATOR VALIDATION (staging before production):
-- 1. anon SELECT/INSERT/UPDATE/DELETE must be denied.
-- 2. signed-in non-admin SELECT/INSERT/UPDATE/DELETE must be denied.
-- 3. verified admin can select, insert, update; delete must be denied.
-- 4. check credentials, logs, RLS advisor, backups, rollback strategy.
-- 5. insert actual outreach cases through authorized admin UI, not through public repository.
