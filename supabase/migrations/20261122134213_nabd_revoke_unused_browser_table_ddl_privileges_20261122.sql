-- Applied to production 2026-11-22 as migration 20261122134213.
-- RLS does not protect TRUNCATE. Browser roles should never own these DDL-style rights.
-- SELECT, INSERT, UPDATE, DELETE and all explicit RLS rules remain unchanged.
REVOKE TRUNCATE, TRIGGER, REFERENCES
  ON ALL TABLES IN SCHEMA public
  FROM anon, authenticated;
