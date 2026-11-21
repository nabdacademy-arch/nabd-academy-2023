-- NABD Official Documents: fixed, immutable templates and admin-approved issuers.
-- Sensitive content is never part of QR verification response.
begin;
create table if not exists public.nabd_document_issuer_permissions (
 user_id uuid primary key references auth.users(id) on delete cascade,
 allowed_types text[] not null default '{}',
 active boolean not null default true,
 granted_by uuid references auth.users(id) on delete set null,
 granted_at timestamptz not null default now(),
 constraint nabd_doc_permission_types_check check (
   allowed_types <@ array['statement','permit','report','treatment_request','consultation_request','complaint']::text[]
 )
);
create table if not exists public.nabd_official_documents (
 id bigint generated always as identity primary key,
 verify_token uuid not null unique default gen_random_uuid(),
 doc_type text not null check(doc_type in ('statement','permit','report','treatment_request','consultation_request','complaint')),
 subject_user_id uuid not null references auth.users(id),
 subject_name text not null check(char_length(btrim(subject_name)) between 2 and 160),
 subject_kind text not null check(subject_kind in ('student','member','other')),
 issuer_user_id uuid not null references auth.users(id),
 issuer_name text not null check(char_length(btrim(issuer_name)) between 2 and 160),
 issued_at timestamptz not null default now(),
 status text not null default 'issued' check(status in ('issued','void')),
 voided_at timestamptz,
 voided_by uuid references auth.users(id)
);
create index if not exists nabd_official_docs_issuer_idx on public.nabd_official_documents(issuer_user_id,issued_at desc);
create index if not exists nabd_official_docs_subject_idx on public.nabd_official_documents(subject_user_id,issued_at desc);
alter table public.nabd_document_issuer_permissions enable row level security;
alter table public.nabd_official_documents enable row level security;
revoke all on table public.nabd_document_issuer_permissions from public,anon,authenticated;
revoke all on table public.nabd_official_documents from public,anon,authenticated;
comment on table public.nabd_document_issuer_permissions is 'Admins delegate fixed document categories to authorized operators; only backend service role may access.';
comment on table public.nabd_official_documents is 'Immutable issued facts and authoritative revocation state. Only server action can create/void/read. No medical records or prescriptions.';
commit;