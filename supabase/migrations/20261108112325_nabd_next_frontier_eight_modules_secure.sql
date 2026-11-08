
-- NABD NEXT FRONTIER / 8 integrated educational initiatives. Only real reviewed records may go public.
create table if not exists public.nfx_evidence_entries(
 id uuid primary key default gen_random_uuid(),
 claim_ar text not null check(length(btrim(claim_ar)) between 15 and 1200),
 claim_en text not null check(length(btrim(claim_en)) between 15 and 1200),
 topic text not null check(length(btrim(topic)) between 3 and 90),
 source_title text not null check(length(btrim(source_title)) between 6 and 220),
 source_url text not null check(source_url ~ '^https://[^[:space:]]{4,600}$'),
 relation text not null default 'context' check(relation in('supports','questions','context')),
 status text not null default 'draft' check(status in('draft','published')),
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.nfx_congress_submissions(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check(length(btrim(display_name)) between 4 and 120),
 title text not null check(length(btrim(title)) between 10 and 180),
 abstract text not null check(length(btrim(abstract)) between 40 and 2500),
 track text not null default 'education' check(track in('education','research','innovation')),
 public_consent boolean not null default false check(public_consent = true),
 status text not null default 'submitted' check(status in('submitted','reviewing','accepted','rejected')),
 created_at timestamptz not null default now()
);
create table if not exists public.nfx_manuscripts(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(btrim(title)) between 10 and 220),
 abstract text not null check(length(btrim(abstract)) between 60 and 3000),
 study_type text not null default 'review' check(study_type in('review','research','case_education','methods')),
 public_consent boolean not null default false check(public_consent = true),
 status text not null default 'submitted' check(status in('submitted','reviewing','accepted','rejected','published')),
 editor_note text not null default '' check(length(editor_note) <= 1000),
 created_at timestamptz not null default now()
);
create table if not exists public.nfx_mentor_profiles(
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(length(btrim(display_name)) between 4 and 120),
 expertise text not null check(length(btrim(expertise)) between 4 and 160),
 bio text not null check(length(btrim(bio)) between 30 and 1000),
 public_consent boolean not null default false check(public_consent = true),
 status text not null default 'pending' check(status in('pending','approved','hidden')),
 created_at timestamptz not null default now()
);
create table if not exists public.nfx_mentor_requests(
 id uuid primary key default gen_random_uuid(),
 learner_id uuid not null references auth.users(id) on delete cascade,
 mentor_id uuid not null references public.nfx_mentor_profiles(user_id) on delete cascade,
 goal text not null check(length(btrim(goal)) between 15 and 750),
 status text not null default 'requested' check(status in('requested','accepted','declined')),
 created_at timestamptz not null default now(),
 unique(learner_id,mentor_id),
 check(learner_id<>mentor_id)
);
create table if not exists public.nfx_innovation_projects(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 team_name text not null check(length(btrim(team_name)) between 3 and 100),
 title text not null check(length(btrim(title)) between 8 and 180),
 problem text not null check(length(btrim(problem)) between 30 and 1300),
 solution text not null check(length(btrim(solution)) between 30 and 1600),
 public_consent boolean not null default false check(public_consent = true),
 status text not null default 'submitted' check(status in('submitted','shortlisted','showcased','rejected')),
 created_at timestamptz not null default now()
);
create table if not exists public.nfx_badge_requests(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 record_type text not null check(record_type in('skill','certificate')),
 record_reference text not null check(length(btrim(record_reference)) between 5 and 120),
 description text not null check(length(btrim(description)) between 10 and 600),
 status text not null default 'requested' check(status in('requested','reviewing','rejected','ready')),
 created_at timestamptz not null default now()
);
create table if not exists public.nfx_quest_attempts(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 quest_id text not null check(quest_id in('cells','heart','method')),
 correct_count integer not null check(correct_count between 0 and 10),
 total_count integer not null check(total_count between 1 and 10),
 created_at timestamptz not null default now(),
 check(correct_count<=total_count)
);
create table if not exists public.nfx_observatory_records(
 id uuid primary key default gen_random_uuid(),
 indicator_ar text not null check(length(btrim(indicator_ar)) between 6 and 180),
 indicator_en text not null check(length(btrim(indicator_en)) between 6 and 180),
 location_label text not null check(length(btrim(location_label)) between 3 and 110),
 period_label text not null check(length(btrim(period_label)) between 4 and 55),
 figure numeric not null check(figure>=0 and figure<1000000000000),
 units text not null check(length(btrim(units)) between 1 and 45),
 source_title text not null check(length(btrim(source_title)) between 6 and 160),
 source_url text not null check(source_url ~ '^https://[^[:space:]]{4,600}$'),
 status text not null default 'draft' check(status in('draft','published')),
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists nfx_evidence_status_created on public.nfx_evidence_entries(status,created_at desc);
create index if not exists nfx_congress_owner_status on public.nfx_congress_submissions(user_id,status);
create index if not exists nfx_manuscripts_owner_status on public.nfx_manuscripts(user_id,status);
create index if not exists nfx_mentors_status on public.nfx_mentor_profiles(status);
create index if not exists nfx_mentor_requests_owner on public.nfx_mentor_requests(learner_id,status);
create index if not exists nfx_mentor_requests_mentor on public.nfx_mentor_requests(mentor_id,status);
create index if not exists nfx_innovation_owner on public.nfx_innovation_projects(user_id,status);
create index if not exists nfx_badges_owner on public.nfx_badge_requests(user_id,status);
create index if not exists nfx_quest_owner on public.nfx_quest_attempts(user_id,created_at desc);
create index if not exists nfx_observatory_status on public.nfx_observatory_records(status,created_at desc);
alter table public.nfx_evidence_entries enable row level security;
alter table public.nfx_congress_submissions enable row level security;
alter table public.nfx_manuscripts enable row level security;
alter table public.nfx_mentor_profiles enable row level security;
alter table public.nfx_mentor_requests enable row level security;
alter table public.nfx_innovation_projects enable row level security;
alter table public.nfx_badge_requests enable row level security;
alter table public.nfx_quest_attempts enable row level security;
alter table public.nfx_observatory_records enable row level security;
revoke all on public.nfx_evidence_entries,public.nfx_congress_submissions,public.nfx_manuscripts,public.nfx_mentor_profiles,public.nfx_mentor_requests,public.nfx_innovation_projects,public.nfx_badge_requests,public.nfx_quest_attempts,public.nfx_observatory_records from public,anon,authenticated;
-- Public catalogue: only reviewed/published rows survive RLS.
grant select on public.nfx_evidence_entries,public.nfx_congress_submissions,public.nfx_manuscripts,public.nfx_mentor_profiles,public.nfx_innovation_projects,public.nfx_observatory_records to anon,authenticated;
grant select on public.nfx_mentor_requests,public.nfx_badge_requests,public.nfx_quest_attempts to authenticated;
-- Client cannot submit decisions, editor notes, statuses or verified records.
grant insert(user_id,display_name,title,abstract,track,public_consent) on public.nfx_congress_submissions to authenticated;
grant insert(user_id,title,abstract,study_type,public_consent) on public.nfx_manuscripts to authenticated;
grant insert(user_id,display_name,expertise,bio,public_consent) on public.nfx_mentor_profiles to authenticated;
grant insert(learner_id,mentor_id,goal) on public.nfx_mentor_requests to authenticated;
grant insert(user_id,team_name,title,problem,solution,public_consent) on public.nfx_innovation_projects to authenticated;
grant insert(user_id,record_type,record_reference,description) on public.nfx_badge_requests to authenticated;
grant insert(user_id,quest_id,correct_count,total_count) on public.nfx_quest_attempts to authenticated;
-- Staff writes under server RLS via actual admin account, never by user-supplied role claims.
grant insert,update on public.nfx_evidence_entries,public.nfx_observatory_records to authenticated;
grant update(status) on public.nfx_congress_submissions,public.nfx_innovation_projects,public.nfx_mentor_profiles,public.nfx_mentor_requests,public.nfx_badge_requests to authenticated;
grant update(status,editor_note) on public.nfx_manuscripts to authenticated;
create policy nfx_evidence_read on public.nfx_evidence_entries for select to anon,authenticated using(status='published' or (select public.is_admin()));
create policy nfx_evidence_admin_add on public.nfx_evidence_entries for insert to authenticated with check((select public.is_admin()));
create policy nfx_evidence_admin_change on public.nfx_evidence_entries for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy nfx_congress_read on public.nfx_congress_submissions for select to anon,authenticated using((status='accepted' and public_consent) or (auth.uid()=user_id) or (select public.is_admin()));
create policy nfx_congress_owner_add on public.nfx_congress_submissions for insert to authenticated with check(user_id=(select auth.uid()) and status='submitted' and public_consent=true);
create policy nfx_congress_admin_review on public.nfx_congress_submissions for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy nfx_manuscript_read on public.nfx_manuscripts for select to anon,authenticated using((status='published' and public_consent) or (auth.uid()=user_id) or (select public.is_admin()));
create policy nfx_manuscript_owner_add on public.nfx_manuscripts for insert to authenticated with check(user_id=(select auth.uid()) and status='submitted' and editor_note='' and public_consent=true);
create policy nfx_manuscript_admin_review on public.nfx_manuscripts for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy nfx_mentor_profiles_read on public.nfx_mentor_profiles for select to anon,authenticated using((status='approved' and public_consent) or (user_id=(select auth.uid())) or (select public.is_admin()));
create policy nfx_mentor_profiles_apply on public.nfx_mentor_profiles for insert to authenticated with check(user_id=(select auth.uid()) and status='pending' and public_consent=true);
create policy nfx_mentor_profiles_staff_review on public.nfx_mentor_profiles for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy nfx_mentor_requests_read on public.nfx_mentor_requests for select to authenticated using((learner_id=(select auth.uid())) or (mentor_id=(select auth.uid()) and status='accepted') or (select public.is_admin()));
create policy nfx_mentor_requests_create on public.nfx_mentor_requests for insert to authenticated with check(learner_id=(select auth.uid()) and status='requested' and mentor_id<>(select auth.uid()) and exists(select 1 from public.nfx_mentor_profiles p where p.user_id=mentor_id and p.status='approved'));
create policy nfx_mentor_requests_admin_review on public.nfx_mentor_requests for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy nfx_innovations_read on public.nfx_innovation_projects for select to anon,authenticated using((status='showcased' and public_consent) or (user_id=(select auth.uid())) or (select public.is_admin()));
create policy nfx_innovations_submit on public.nfx_innovation_projects for insert to authenticated with check(user_id=(select auth.uid()) and status='submitted' and public_consent=true);
create policy nfx_innovations_admin_review on public.nfx_innovation_projects for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy nfx_badges_read on public.nfx_badge_requests for select to authenticated using(user_id=(select auth.uid()) or (select public.is_admin()));
create policy nfx_badges_request on public.nfx_badge_requests for insert to authenticated with check(user_id=(select auth.uid()) and status='requested');
create policy nfx_badges_staff_review on public.nfx_badge_requests for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy nfx_quests_own_read on public.nfx_quest_attempts for select to authenticated using(user_id=(select auth.uid()) or (select public.is_admin()));
create policy nfx_quests_own_add on public.nfx_quest_attempts for insert to authenticated with check(user_id=(select auth.uid()));
create policy nfx_observatory_read on public.nfx_observatory_records for select to anon,authenticated using(status='published' or (select public.is_admin()));
create policy nfx_observatory_admin_add on public.nfx_observatory_records for insert to authenticated with check((select public.is_admin()));
create policy nfx_observatory_admin_change on public.nfx_observatory_records for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
comment on table public.nfx_quest_attempts is 'Practice-only self-reported score; must never be used as an official credential or examination grade.';
comment on table public.nfx_badge_requests is 'Packaging/review requests only; ready is not an issued or cryptographically signed Open Badge.';
comment on table public.nfx_manuscripts is 'Editorial submission register; published status needs human editor and peer review, not a DOI.';
