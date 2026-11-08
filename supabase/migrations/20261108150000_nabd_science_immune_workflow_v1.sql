-- NABD Science Immune System v1: human-verified scientific change tracking.
-- Extends, but does not overwrite, NABD Evidence DNA / Knowledge Decay tables.
create table public.nsi_changes (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null check (char_length(btrim(title_ar)) between 12 and 200),
  title_en text not null check (char_length(btrim(title_en)) between 12 and 200),
  topic text not null check (char_length(btrim(topic)) between 3 and 120),
  previous_claim text not null check (char_length(btrim(previous_claim)) between 20 and 1500),
  current_evidence text not null check (char_length(btrim(current_evidence)) between 20 and 2000),
  source_title text not null check (char_length(btrim(source_title)) between 6 and 240),
  source_url text not null check (source_url ~ '^https://[^[:space:]<>"'']{4,600}$'),
  source_date date not null,
  evidence_source_id uuid references public.nabd_evidence_sources(id) on delete set null,
  severity text not null default 'review' check(severity in ('review','significant','urgent')),
  status text not null default 'draft' check(status in ('draft','review','published','withdrawn')),
  next_review_on date,
  review_note text not null default '' check(char_length(review_note) <= 1600),
  created_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nsi_published_review check(status not in ('published','withdrawn') or (reviewed_by is not null and reviewed_at is not null and char_length(btrim(review_note)) >= 20))
);
create index nsi_changes_status_date on public.nsi_changes(status,created_at desc);
create index nsi_changes_review_due on public.nsi_changes(next_review_on) where status='published';

create table public.nsi_impacts (
  id uuid primary key default gen_random_uuid(),
  change_id uuid not null references public.nsi_changes(id) on delete restrict,
  resource_kind text not null check(resource_kind in ('lesson','assessment','simulation','research','reference','other')),
  resource_title text not null check(char_length(btrim(resource_title)) between 5 and 220),
  resource_path text not null check(
    char_length(resource_path) between 5 and 260
    and resource_path ~ '^[a-z0-9_-]+(/[a-z0-9_-]+)*(\.html)?(#[a-z0-9_-]+)?$'
    and resource_path !~ '\.\.'
  ),
  action_status text not null default 'needs_review' check(action_status in ('needs_review','revised','retired','unaffected')),
  action_note text not null default '' check(char_length(action_note) <= 1200),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(change_id,resource_path)
);
create index nsi_impacts_change on public.nsi_impacts(change_id);

create table public.nsi_events (
  id bigint generated always as identity primary key,
  change_id uuid,
  entity text not null check(entity in ('change','impact')),
  entity_id uuid not null,
  action text not null check(action in ('INSERT','UPDATE')),
  old_state text,
  new_state text,
  actor_id uuid,
  happened_at timestamptz not null default now()
);
create index nsi_events_change_time on public.nsi_events(change_id,happened_at desc);

alter table public.nsi_changes enable row level security;
alter table public.nsi_impacts enable row level security;
alter table public.nsi_events enable row level security;
revoke all on public.nsi_changes,public.nsi_impacts,public.nsi_events from public,anon,authenticated;
revoke all on sequence public.nsi_events_id_seq from public,anon,authenticated;
grant select on public.nsi_changes,public.nsi_impacts to anon,authenticated;
grant select on public.nsi_events to authenticated;
grant insert,update on public.nsi_changes,public.nsi_impacts to authenticated;

create policy nsi_changes_read on public.nsi_changes for select to anon,authenticated
  using(status='published' or (select public.is_admin()));
create policy nsi_changes_admin_insert on public.nsi_changes for insert to authenticated
  with check((select public.is_admin()) and created_by=(select auth.uid()) and status='draft');
create policy nsi_changes_admin_update on public.nsi_changes for update to authenticated
  using((select public.is_admin())) with check((select public.is_admin()));
create policy nsi_impacts_read on public.nsi_impacts for select to anon,authenticated
  using((select public.is_admin()) or exists(select 1 from public.nsi_changes c where c.id=change_id and c.status='published'));
create policy nsi_impacts_admin_insert on public.nsi_impacts for insert to authenticated
  with check((select public.is_admin()));
create policy nsi_impacts_admin_update on public.nsi_impacts for update to authenticated
  using((select public.is_admin())) with check((select public.is_admin()));
create policy nsi_events_admin_read on public.nsi_events for select to authenticated
  using((select public.is_admin()));

-- Guard transitions and keep an immutable published scientific summary.
create schema if not exists nabd_science_private;
revoke all on schema nabd_science_private from public,anon,authenticated;
create function nabd_science_private.guard_change() returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  if old.status = 'withdrawn' then
    raise exception 'A withdrawn notice is immutable; create a new version.';
  end if;
  if old.status = 'published' then
    if new.status <> 'withdrawn' or (to_jsonb(new) - 'status' - 'updated_at') is distinct from (to_jsonb(old) - 'status' - 'updated_at') then
      raise exception 'Published notices are immutable; withdraw and create a new version.';
    end if;
  end if;
  if new.status='published' then
    if old.status <> 'review' then raise exception 'Human review is required before publication.'; end if;
    if not exists(select 1 from public.nsi_impacts i where i.change_id=old.id) then
      raise exception 'Map at least one affected resource before publishing.';
    end if;
    if new.reviewed_by <> auth.uid() or new.reviewed_at is null or char_length(btrim(new.review_note)) < 20 then
      raise exception 'Reviewer, timestamp and substantial review note required.';
    end if;
  end if;
  new.updated_at=now();
  return new;
end;
$$;
create trigger nsi_guard_change before update on public.nsi_changes
for each row execute function nabd_science_private.guard_change();

create function nabd_science_private.log_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
 insert into public.nsi_events(change_id,entity,entity_id,action,old_state,new_state,actor_id)
 values(
  case when tg_table_name='nsi_changes' then new.id else new.change_id end,
  case when tg_table_name='nsi_changes' then 'change' else 'impact' end,
  new.id,tg_op,
  case when tg_op='INSERT' then null
       when tg_table_name='nsi_changes' then old.status else old.action_status end,
  case when tg_table_name='nsi_changes' then new.status else new.action_status end,
  auth.uid()
 );
 return new;
end;
$$;
revoke all on function nabd_science_private.guard_change() from public,anon,authenticated;
revoke all on function nabd_science_private.log_change() from public,anon,authenticated;
create trigger nsi_audit_changes after insert or update on public.nsi_changes
for each row execute function nabd_science_private.log_change();
create trigger nsi_audit_impacts after insert or update on public.nsi_impacts
for each row execute function nabd_science_private.log_change();

comment on table public.nsi_changes is 'Manually verified scientific notices. No automated monitoring or automatic modification of learning material.';
comment on table public.nsi_impacts is 'Explicit mapping to actual teaching resources, with human correction status.';
comment on table public.nsi_events is 'Append-only change log written exclusively by trusted database triggers.';
