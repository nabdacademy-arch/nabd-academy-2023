-- Bilingual NABD official documents: immutable evidence snapshots, signed institutional attribution.
-- Existing documents retain their historical fields; new issuances capture verified roles and courses.
begin;
alter table public.nabd_official_documents
 add column if not exists subject_details jsonb not null default '{}'::jsonb,
 add column if not exists signatory_name text,
 add column if not exists signatory_kind text not null default 'issuer'
   check (signatory_kind in ('director','issuer'));
alter table public.nabd_official_documents
 drop constraint if exists nabd_document_subject_details_object;
alter table public.nabd_official_documents
 add constraint nabd_document_subject_details_object
 check (jsonb_typeof(subject_details) = 'object' and pg_column_size(subject_details) < 16000);
grant select on table public.certificates to service_role;
grant select on table public.courses to service_role;
grant select on table public.enrollments to service_role;
comment on column public.nabd_official_documents.subject_details is
  'Server-only snapshot of verified profile role, active council appointments, valid certificates and ongoing enrollments at issuance, never supplied by browser.';
comment on column public.nabd_official_documents.signatory_name is
  'Name printed as authenticated electronic issuer/director attribution at original issuance. No fabricated handwriting.';
commit;