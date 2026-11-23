
-- NABD Cortex: isolated, founder-controlled agent orchestration foundation.
-- Existing academic records and existing automations are deliberately untouched.
create table if not exists public.nabd_cortex_settings (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default false,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
insert into public.nabd_cortex_settings(id,enabled) values(1,false) on conflict(id) do nothing;

create table if not exists public.nabd_cortex_sources (
  id uuid primary key default gen_random_uuid(),
  domain text not null check(domain in ('administration','finance','medical','crisis','cybersecurity','education')),
  title text not null,
  publisher text not null,
  official_url text not null unique check(official_url ~ '^https://'),
  retrieval_mode text not null default 'metadata_only' check (retrieval_mode in ('metadata_only','live_link','full_ingest')),
  licence_note text not null default 'Review source terms before ingesting any full text',
  verified_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.nabd_cortex_runs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  agent text not null check(agent in ('operations','finance','medical','crisis','cybersecurity','education')),
  risk text not null check(risk in ('low','medium','high')),
  outcome text not null check(outcome in ('advisory','requires_human','blocked')),
  engine text not null check(engine in ('policy_only','llm_assisted')),
  sources_count integer not null default 0 check(sources_count >= 0),
  created_at timestamptz not null default now()
);
create index if not exists nabd_cortex_runs_actor_created_idx on public.nabd_cortex_runs(actor_id,created_at desc);

create table if not exists public.nabd_cortex_tasks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.nabd_cortex_runs(id) on delete restrict,
  actor_id uuid not null,
  domain text not null,
  title text not null,
  status text not null check(status in ('logged_low_risk','needs_review','approved_for_planning','rejected')),
  -- These tasks are only internal plans; approval never executes a financial/clinical operation.
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists nabd_cortex_tasks_status_created_idx on public.nabd_cortex_tasks(status,created_at desc);

create table if not exists public.nabd_cortex_audit (
  id bigint generated always as identity primary key,
  actor_id uuid,
  event_type text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.nabd_cortex_settings enable row level security;
alter table public.nabd_cortex_sources enable row level security;
alter table public.nabd_cortex_runs enable row level security;
alter table public.nabd_cortex_tasks enable row level security;
alter table public.nabd_cortex_audit enable row level security;

revoke all on public.nabd_cortex_settings, public.nabd_cortex_sources, public.nabd_cortex_runs, public.nabd_cortex_tasks, public.nabd_cortex_audit from public,anon,authenticated;
grant select on public.nabd_cortex_settings, public.nabd_cortex_sources, public.nabd_cortex_runs, public.nabd_cortex_tasks, public.nabd_cortex_audit to authenticated;
grant all on public.nabd_cortex_settings, public.nabd_cortex_sources, public.nabd_cortex_runs, public.nabd_cortex_tasks, public.nabd_cortex_audit to service_role;
grant usage,select on sequence public.nabd_cortex_audit_id_seq to service_role;

create policy cortex_settings_admin_read on public.nabd_cortex_settings
  for select to authenticated using (public.is_admin() or coalesce(nabd_portal_private.nabd_current_portal_role()::text,'')='founder');
create policy cortex_sources_admin_read on public.nabd_cortex_sources
  for select to authenticated using (public.is_admin() or coalesce(nabd_portal_private.nabd_current_portal_role()::text,'')='founder');
create policy cortex_runs_admin_read on public.nabd_cortex_runs
  for select to authenticated using (public.is_admin() or coalesce(nabd_portal_private.nabd_current_portal_role()::text,'')='founder');
create policy cortex_tasks_admin_read on public.nabd_cortex_tasks
  for select to authenticated using (public.is_admin() or coalesce(nabd_portal_private.nabd_current_portal_role()::text,'')='founder');
create policy cortex_audit_admin_read on public.nabd_cortex_audit
  for select to authenticated using (public.is_admin() or coalesce(nabd_portal_private.nabd_current_portal_role()::text,'')='founder');

create or replace function public.nabd_cortex_set_enabled(p_enabled boolean)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not exists(
    select 1 from public.portal_profiles
    where user_id=auth.uid() and role='founder' and is_active
  ) then
    raise exception 'Founder authorization required' using errcode='42501';
  end if;
  update public.nabd_cortex_settings
    set enabled=p_enabled,updated_by=auth.uid(),updated_at=now() where id=1;
  insert into public.nabd_cortex_audit(actor_id,event_type,detail)
    values(auth.uid(),'cortex.toggle',pg_catalog.jsonb_build_object('enabled',p_enabled));
  return pg_catalog.jsonb_build_object('enabled',p_enabled,'scope','nabd_cortex_only');
end; $$;

create or replace function public.nabd_cortex_review_task(p_task_id uuid,p_approved boolean)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_new text; v_rows integer;
begin
  if auth.uid() is null or not exists(
    select 1 from public.portal_profiles
    where user_id=auth.uid() and role='founder' and is_active
  ) then
    raise exception 'Founder authorization required' using errcode='42501';
  end if;
  v_new:=case when p_approved then 'approved_for_planning' else 'rejected' end;
  update public.nabd_cortex_tasks
    set status=v_new,reviewed_by=auth.uid(),reviewed_at=now()
    where id=p_task_id and status='needs_review';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'Task not pending review'; end if;
  insert into public.nabd_cortex_audit(actor_id,event_type,detail)
    values(auth.uid(),'cortex.task_review',pg_catalog.jsonb_build_object('task_id',p_task_id,'approved',p_approved,'execution','none'));
  return pg_catalog.jsonb_build_object('task_id',p_task_id,'status',v_new,'executed',false);
end; $$;

revoke all on function public.nabd_cortex_set_enabled(boolean) from public,anon;
revoke all on function public.nabd_cortex_review_task(uuid,boolean) from public,anon;
grant execute on function public.nabd_cortex_set_enabled(boolean), public.nabd_cortex_review_task(uuid,boolean) to authenticated;

insert into public.nabd_cortex_sources(domain,title,publisher,official_url,retrieval_mode,licence_note) values
('medical','WHO Guidelines','World Health Organization','https://www.who.int/publications/who-guidelines','metadata_only','Metadata and official link only; each publication needs separate licence and clinical review'),
('finance','Issued IFRS Accounting Standards','IFRS Foundation','https://www.ifrs.org/issued-standards/','metadata_only','Do not ingest copyrighted standards without permission'),
('administration','AI Risk Management Framework','NIST','https://www.nist.gov/itl/ai-risk-management-framework','live_link','Link to official framework; verify versions before institutional adoption'),
('cybersecurity','Cybersecurity Framework','NIST','https://www.nist.gov/cyberframework','live_link','Link to official cybersecurity framework'),
('crisis','Sendai Framework for Disaster Risk Reduction','UNDRR','https://www.undrr.org/publication/sendai-framework-disaster-risk-reduction-2015-2030','metadata_only','Link to official reference; check reuse restrictions'),
('education','WHO Publications','World Health Organization','https://www.who.int/publications','live_link','Links and metadata only until individual licences are checked')
on conflict(official_url) do nothing;
