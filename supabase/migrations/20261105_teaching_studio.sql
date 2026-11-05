-- Additive migration; requires existing profiles, courses and enrollments.
-- Review against live schema and take a backup before applying as database owner.
begin;
create function public.nabd_teaching_is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin');
$$;
revoke all on function public.nabd_teaching_is_admin() from public,anon;
grant execute on function public.nabd_teaching_is_admin() to authenticated;
create table public.nabd_teaching_assignments (
 lecturer_id uuid not null references auth.users(id) on delete cascade, course_id text not null,
 display_name text not null check(char_length(btrim(display_name)) between 1 and 160),
 active boolean not null default true, created_at timestamptz not null default now(), primary key(lecturer_id,course_id)
);
create table public.nabd_teaching_records (
 id uuid primary key default gen_random_uuid(), lecturer_id uuid not null references auth.users(id) on delete cascade,
 course_id text not null, kind text not null check(kind in ('session','resource')),
 title text not null check(char_length(btrim(title)) between 1 and 200),
 objective text not null check(char_length(btrim(objective)) between 1 and 2000),
 description text not null default '' check(char_length(description)<=6000),
 reference text not null default '' check(char_length(reference)<=2000),
 resource_url text not null default '' check(resource_url='' or (resource_url ~ '^https?://' and char_length(resource_url)<=2000)),
 starts_at timestamptz, status text not null default 'draft' check(status in ('draft','published')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- Accept existing UUID/numeric course IDs without changing the courses schema.
create function public.nabd_teaching_validate_course() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.courses where id::text=new.course_id) then raise exception 'Unknown course' using errcode='23503'; end if;
 if TG_TABLE_NAME='nabd_teaching_records' then
  if TG_OP='UPDATE' then
   if new.lecturer_id<>old.lecturer_id or new.created_at<>old.created_at or new.id<>old.id then raise exception 'Record identity cannot change'; end if;
  end if;
  new.updated_at=now();
 end if;
 return new;
end;$$;
revoke all on function public.nabd_teaching_validate_course() from public,anon,authenticated;
create trigger teaching_assignment_course before insert or update on public.nabd_teaching_assignments for each row execute function public.nabd_teaching_validate_course();
create trigger teaching_record_course before insert or update on public.nabd_teaching_records for each row execute function public.nabd_teaching_validate_course();
create index teaching_page on public.nabd_teaching_records(created_at desc,id);
create index teaching_course on public.nabd_teaching_records(course_id,status);
alter table public.nabd_teaching_assignments enable row level security;
alter table public.nabd_teaching_records enable row level security;
revoke all on public.nabd_teaching_assignments,public.nabd_teaching_records from public,anon,authenticated;
grant select,insert,update on public.nabd_teaching_assignments,public.nabd_teaching_records to authenticated;
create policy assignments_read on public.nabd_teaching_assignments for select to authenticated using (lecturer_id=(select auth.uid()) or (select public.nabd_teaching_is_admin()));
create policy assignments_create on public.nabd_teaching_assignments for insert to authenticated with check ((select public.nabd_teaching_is_admin()));
create policy assignments_update on public.nabd_teaching_assignments for update to authenticated using ((select public.nabd_teaching_is_admin())) with check ((select public.nabd_teaching_is_admin()));
create policy teaching_read on public.nabd_teaching_records for select to authenticated using (
 (select public.nabd_teaching_is_admin())
 or (lecturer_id=(select auth.uid()) and exists(select 1 from public.nabd_teaching_assignments a where a.lecturer_id=(select auth.uid()) and a.course_id=nabd_teaching_records.course_id and a.active))
 or (status='published' and exists(select 1 from public.enrollments e where e.student_id=(select auth.uid()) and e.course_id::text=nabd_teaching_records.course_id))
);
create policy teaching_create on public.nabd_teaching_records for insert to authenticated with check (
 lecturer_id=(select auth.uid()) and ((select public.nabd_teaching_is_admin()) or exists(select 1 from public.nabd_teaching_assignments a where a.lecturer_id=(select auth.uid()) and a.course_id=nabd_teaching_records.course_id and a.active))
);
create policy teaching_update on public.nabd_teaching_records for update to authenticated using (
 (select public.nabd_teaching_is_admin()) or (lecturer_id=(select auth.uid()) and exists(select 1 from public.nabd_teaching_assignments a where a.lecturer_id=(select auth.uid()) and a.course_id=nabd_teaching_records.course_id and a.active))
) with check (
 (select public.nabd_teaching_is_admin()) or (lecturer_id=(select auth.uid()) and exists(select 1 from public.nabd_teaching_assignments a where a.lecturer_id=(select auth.uid()) and a.course_id=nabd_teaching_records.course_id and a.active))
);
commit;
