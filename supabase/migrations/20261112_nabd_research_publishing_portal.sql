-- NABD Research Publishing Portal · staff-only writing, public published papers
-- This migration does NOT grant any user publishing privileges automatically.
begin;

create table if not exists public.nabd_research_publishers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  granted_at timestamptz not null default now()
);
alter table public.nabd_research_publishers enable row level security;
create policy "Research publishers can view their own active permission"
  on public.nabd_research_publishers for select to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.nabd_research_publishers from anon, authenticated;
grant select on public.nabd_research_publishers to authenticated;

create table if not exists public.nabd_research_papers (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 240),
  abstract text not null check (char_length(btrim(abstract)) between 10 and 12000),
  author_name text check (author_name is null or char_length(btrim(author_name)) between 2 and 160),
  pdf_path text not null unique check (pdf_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.pdf$'),
  status text not null default 'published' check (status in ('published','archived')),
  published_by uuid not null references auth.users(id) on delete restrict,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint research_pdf_owner_path check (split_part(pdf_path,'/',1) = published_by::text)
);
create index if not exists nabd_research_papers_public_idx on public.nabd_research_papers (published_at desc) where status='published';
create index if not exists nabd_research_papers_owner_idx on public.nabd_research_papers (published_by,published_at desc);
alter table public.nabd_research_papers enable row level security;

create policy "Published research is publicly readable and authors can manage own"
 on public.nabd_research_papers for select to anon, authenticated
 using (status='published' or
   (published_by = (select auth.uid()) and exists (
     select 1 from public.nabd_research_publishers rp
       where rp.user_id=(select auth.uid()) and rp.active=true)));
create policy "Only authorized research staff can publish"
 on public.nabd_research_papers for insert to authenticated
 with check (published_by=(select auth.uid()) and exists (
     select 1 from public.nabd_research_publishers rp
       where rp.user_id=(select auth.uid()) and rp.active=true));
create policy "Authorized researcher edits own papers"
 on public.nabd_research_papers for update to authenticated
 using (published_by=(select auth.uid()) and exists (
     select 1 from public.nabd_research_publishers rp
       where rp.user_id=(select auth.uid()) and rp.active=true))
 with check (published_by=(select auth.uid()) and exists (
     select 1 from public.nabd_research_publishers rp
       where rp.user_id=(select auth.uid()) and rp.active=true));
revoke all on public.nabd_research_papers from anon, authenticated;
grant select on public.nabd_research_papers to anon, authenticated;
grant insert,update on public.nabd_research_papers to authenticated;

-- Private bucket: visitors can sign a short-lived link ONLY for a published paper.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
 values ('nabd-research-pdfs','nabd-research-pdfs',false,15728640,array['application/pdf'])
 on conflict (id) do nothing;

create policy "Public may read PDF only for published NABD papers"
 on storage.objects for select to anon,authenticated
 using (bucket_id='nabd-research-pdfs' and (
   exists (select 1 from public.nabd_research_papers p
     where p.pdf_path=storage.objects.name and p.status='published')
   or (split_part(name,'/',1)=(select auth.uid())::text and exists (
     select 1 from public.nabd_research_publishers rp
       where rp.user_id=(select auth.uid()) and rp.active=true))
 ));
create policy "Only authorized research staff may upload PDF"
 on storage.objects for insert to authenticated
 with check (bucket_id='nabd-research-pdfs'
   and split_part(name,'/',1)=(select auth.uid())::text
   and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.pdf$'
   and exists (select 1 from public.nabd_research_publishers rp
     where rp.user_id=(select auth.uid()) and rp.active=true));
create policy "Research staff can remove their own PDFs"
 on storage.objects for delete to authenticated
 using (bucket_id='nabd-research-pdfs'
   and split_part(name,'/',1)=(select auth.uid())::text
   and exists (select 1 from public.nabd_research_publishers rp
     where rp.user_id=(select auth.uid()) and rp.active=true));

commit;

-- After creating an Auth user, grant access in the Supabase SQL editor using
-- their exact UUID, never their password:
-- insert into public.nabd_research_publishers (user_id,active)
-- values ('THE-USER-UUID', true)
-- on conflict (user_id) do update set active=true;
