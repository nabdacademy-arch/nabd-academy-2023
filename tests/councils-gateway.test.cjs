"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const client=read("assets/js/councils.js");
const page=read("councils.html");
const css=read("assets/css/councils.css");
const sql=read("supabase/migrations/20261121_nabd_councils_network.sql");

test("eight different non-executive council codes are present",()=>{
 const found=[...client.matchAll(/\{code:"([a-z_]+)",icon:/g)].map(x=>x[1]);
 assert.deepEqual(found,["trustees","academic","research","students","international","quality","digital","humanitarian"]);
 assert.ok(!found.includes("executive"));
});
test("portal requires real Supabase auth and active appointed membership",()=>{
 assert.match(client,/auth\.getUser\(\)/);
 assert.match(client,/signInWithPassword/);
 assert.match(client,/ownMemberships\(\)\.length/);
 assert.match(client,/state\.records=\[\]/);
 assert.match(page,/id="workspace"[^>]+hidden/);
 assert.doesNotMatch(client,/localStorage\.setItem\(["'](?:isAdmin|councilMember|role)/i);
});
test("records are protected with row-level security and no anon grants",()=>{
 for(const table of ["nabd_council_memberships","nabd_council_records"]){
  assert.ok(sql.includes("alter table public."+table+" enable row level security"));
  assert.ok(sql.includes("revoke all on table public."+table+" from public,anon,authenticated"));
 }
 assert.match(sql,/created_by=\(select auth\.uid\(\)\)/);
 assert.match(sql,/create policy nabd_councils_record_read/);
 assert.match(sql,/create policy nabd_councils_membership_add/);
 assert.match(sql,/select public\.is_admin\(\)/);
});
test("councils route is connected without replacing the existing pathways",()=>{
 assert.match(read("academy.html"),/href="councils\.html"/);
 assert.match(read("assets/js/academic-core.js"),/"councils\.html","leadership"/);
 assert.match(read("assets/js/nabd-signature.js"),/"councils\.html"/);
 assert.match(page,/assets\/js\/supabase-client\.js/);
 assert.ok(css.length>3000);
});
test("both languages and mobile styles are present",()=>{
 assert.match(page,/lang="ar"/);
 assert.match(page,/data-en=/);
 assert.match(client,/document\.documentElement\.dir/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/prefers-reduced-motion/);
});
