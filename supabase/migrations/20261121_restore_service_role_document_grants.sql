-- Repair server-side Data API grants for NABD's protected document and council functions.
-- Service-role BYPASSRLS does not by itself grant SQL table/sequence privileges.
-- Do NOT grant any of these permissions to anon or authenticated.
begin;

-- The authenticated issuer must be resolved against the canonical server-side profile.
grant select on table public.profiles to service_role;

-- Document issuance and authorized-issuer delegation.
grant select, insert, update on table public.nabd_official_documents to service_role;
grant select, insert, update on table public.nabd_document_issuer_permissions to service_role;
grant usage on sequence public.nabd_official_documents_id_seq to service_role;

-- Membership classification and other council services share this service-role client.
grant select, insert, update on table public.nabd_council_memberships to service_role;
grant insert on table public.nabd_council_account_audit to service_role;
grant usage on sequence public.nabd_council_account_audit_id_seq to service_role;

-- No visitor/user table grants and no changes to RLS. Service keys remain server-only.
commit;