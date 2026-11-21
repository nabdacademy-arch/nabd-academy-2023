-- NABD Research News: restore public visibility of published papers and their private-bucket PDFs.
-- Original mixed-role RLS policies referenced a private publisher table for anonymous visitors,
-- resulting in 42501 instead of showing the already-published research.
--
-- Separate public read from authenticated publisher privileges. Never grant anonymous access to
-- the publisher directory, unpublished papers or unpublished files.
begin;

drop policy if exists "Published research is publicly readable and authors can manage " on public.nabd_research_papers;

create policy "NABD research public published papers"
on public.nabd_research_papers
for select to anon, authenticated
using (status = 'published');

create policy "NABD research authors own papers"
on public.nabd_research_papers
for select to authenticated
using (
  published_by = (select auth.uid())
  and exists (
    select 1 from public.nabd_research_publishers rp
    where rp.user_id = (select auth.uid()) and rp.active = true
  )
);

drop policy if exists "Public may read PDF only for published NABD papers" on storage.objects;

create policy "NABD public research PDFs for published papers"
on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'nabd-research-pdfs'
  and exists (
    select 1 from public.nabd_research_papers p
    where p.pdf_path = name and p.status = 'published'
  )
);

create policy "NABD research publishers own PDF files"
on storage.objects
for select to authenticated
using (
  bucket_id = 'nabd-research-pdfs'
  and split_part(name, '/', 1) = ((select auth.uid())::text)
  and exists (
    select 1 from public.nabd_research_publishers rp
    where rp.user_id = (select auth.uid()) and rp.active = true
  )
);

-- Explicit grants for the public published listing; row visibility remains controlled by RLS.
grant select on public.nabd_research_papers to anon, authenticated;
-- Keep publisher grants as they were: NO SELECT privilege for anon.
revoke all on public.nabd_research_publishers from anon;

commit;