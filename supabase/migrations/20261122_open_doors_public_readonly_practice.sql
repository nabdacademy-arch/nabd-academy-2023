-- Open Doors public training: public READ access to courseware only.
-- Question authoring, member identity, attempts, and paid AI grading are not public.
begin;
grant select on table public.open_doors_questions to anon, authenticated;
grant select on table public.open_doors_sources to anon, authenticated;
grant select on table public.open_doors_patterns to anon, authenticated;

create policy "NABD Open Doors public practice questions"
on public.open_doors_questions
for select to anon, authenticated using (true);

create policy "NABD Open Doors public source references"
on public.open_doors_sources
for select to anon, authenticated using (true);

create policy "NABD Open Doors public patterns"
on public.open_doors_patterns
for select to anon, authenticated using (true);

-- Never grant public writes or private attempts. Existing owner RLS remains intact.
revoke insert, update, delete on public.open_doors_questions from anon;
revoke insert, update, delete on public.open_doors_sources from anon;
revoke insert, update, delete on public.open_doors_patterns from anon;
revoke all on public.open_doors_attempts from anon;
commit;