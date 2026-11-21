-- Saved Open Doors translations are public study materials; generating new translations is still founder-only.
begin;
grant select on table public.open_doors_question_translations to anon, authenticated;
create policy "NABD Open Doors public stored translations"
on public.open_doors_question_translations
for select to anon, authenticated using (true);
revoke insert, update, delete on public.open_doors_question_translations from anon;
commit;