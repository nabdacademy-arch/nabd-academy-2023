-- Add one-time issuer-attested English name spelling, including existing documents.
-- Original Arabic subject name, issuer, issuance time, and reference number never change.
begin;
alter table public.nabd_official_documents
  add column if not exists subject_name_en text,
  add column if not exists english_name_added_by uuid references auth.users(id) on delete set null,
  add column if not exists english_name_added_at timestamptz;
alter table public.nabd_official_documents
  drop constraint if exists nabd_official_documents_subject_name_en_format;
alter table public.nabd_official_documents
  add constraint nabd_official_documents_subject_name_en_format
  check (subject_name_en is null or (
    char_length(subject_name_en) between 3 and 160
    and subject_name_en ~ '^[A-Za-z][A-Za-z .''-]{2,159}$'
  ));
comment on column public.nabd_official_documents.subject_name_en is
  'English spelling attested by the authenticated authorized issuer; NOT machine guessed from Arabic. Existing Arabic names remain immutable.';
comment on column public.nabd_official_documents.english_name_added_by is
  'Authenticated issuer/administrator who attested the English spelling; populated once at issuance or legacy addendum.';
commit;