"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const test=require("node:test");
const root=path.resolve(__dirname,"..","supabase","migrations");
function migration(file){return fs.readFileSync(path.join(root,file),"utf8");}

test("production migration versions and descriptions are checked into source control",()=>{
 const names=[
  "20261122133940_nabd_core_rls_performance_and_fk_indexes_20261122.sql",
  "20261122134039_nabd_remaining_rls_initplan_guard_20261122.sql",
  "20261122134111_nabd_remove_exact_duplicate_admin_rls_policies_20261122.sql",
  "20261122134213_nabd_revoke_unused_browser_table_ddl_privileges_20261122.sql"
 ];
 for(const name of names)assert.ok(fs.existsSync(path.join(root,name)),name);
});

test("owner, admin and student policy checks retain the same principals",()=>{
 const sql=migration("20261122133940_nabd_core_rls_performance_and_fk_indexes_20261122.sql");
 for(const name of ["profiles own/admin read","profiles own/admin update","students own enrollments","students own certificates",
   "Students can create own certificate claims","Students can view own certificate claims"])
  assert.ok(sql.includes('"'+name+'"'));
 assert.match(sql,/\(SELECT auth\.uid\(\)\)/);
 assert.match(sql,/\(SELECT public\.is_admin\(\)\)/);
 assert.match(sql,/status = 'pending'/);
});

test("core FK indexes only add non-unique lookup paths",()=>{
 const sql=migration("20261122133940_nabd_core_rls_performance_and_fk_indexes_20261122.sql");
 const indexes=sql.match(/CREATE INDEX IF NOT EXISTS /g)||[];
 assert.equal(indexes.length,6);
 assert.doesNotMatch(sql,/CREATE UNIQUE INDEX|DELETE\s+FROM|TRUNCATE\s+TABLE/i);
});

test("cleanup removes only the enumerated six duplicate policies",()=>{
 const sql=migration("20261122134111_nabd_remove_exact_duplicate_admin_rls_policies_20261122.sql");
 assert.equal((sql.match(/^DROP POLICY IF EXISTS /gm)||[]).length,6);
 assert.doesNotMatch(sql,/DROP TABLE|DROP FUNCTION|CASCADE/i);
});

test("browser roles lose only high-risk table DDL permissions",()=>{
 const sql=migration("20261122134213_nabd_revoke_unused_browser_table_ddl_privileges_20261122.sql");
 assert.match(sql,/REVOKE TRUNCATE, TRIGGER, REFERENCES/);
 assert.match(sql,/FROM anon, authenticated/);
 assert.doesNotMatch(sql,/REVOKE[^;]*(SELECT|INSERT|UPDATE|DELETE)/);
});
