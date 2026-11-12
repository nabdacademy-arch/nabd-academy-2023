-- Research PDF bucket raised to 50 MiB (also subject to Supabase project global limit).
begin;
update storage.buckets
set file_size_limit=52428800
where id='nabd-research-pdfs' and (file_size_limit is null or file_size_limit<52428800);
commit;
