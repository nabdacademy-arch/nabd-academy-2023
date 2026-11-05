/* npm install --prefix /tmp/nabd-db-check --cache /tmp/nabd-npm-cache @electric-sql/pglite
   NODE_PATH=/tmp/nabd-db-check/node_modules node tests/teaching-studio.database.cjs */
const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;
 create table auth.users(id uuid primary key);create table public.profiles(id uuid primary key,role text);
 create table public.courses(id uuid primary key);create table public.enrollments(student_id uuid,course_id uuid);
 insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003'),('00000000-0000-0000-0000-000000000004');
 insert into profiles values ('00000000-0000-0000-0000-000000000001','admin');
 insert into courses values ('10000000-0000-0000-0000-000000000001'),('10000000-0000-0000-0000-000000000002');
 insert into enrollments values ('00000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001');
 grant select on courses,enrollments to authenticated;`);
 await db.exec(fs.readFileSync('supabase/migrations/20261105_teaching_studio.sql','utf8'));
 const actor=async n=>db.exec(`reset role;set role authenticated;set request.jwt.claim.sub='00000000-0000-0000-0000-00000000000${n}'`);
 const count=async()=>Number((await db.query('select count(*) as n from nabd_teaching_records')).rows[0].n);
 const denied=async sql=>{let rejected=false;try{await db.exec(sql)}catch{rejected=true}assert(rejected,sql)};
 await actor(1);await db.exec(`insert into nabd_teaching_assignments(lecturer_id,course_id,display_name) values ('00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','محاضر')`);
 await actor(2);
 await db.exec(`insert into nabd_teaching_records(lecturer_id,course_id,kind,title,objective,status) values ('00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','session','جلسة','هدف','published'),('00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','resource','مسودة','هدف','draft')`);
 assert.equal(await count(),2);
 await denied(`insert into nabd_teaching_assignments(lecturer_id,course_id,display_name) values ('00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','تصعيد')`);
 await denied(`update nabd_teaching_records set course_id='10000000-0000-0000-0000-000000000002'`);
 await denied(`update nabd_teaching_records set lecturer_id='00000000-0000-0000-0000-000000000001'`);
 await denied(`update nabd_teaching_records set resource_url='javascript:alert(1)'`);
 await actor(3);assert.equal(await count(),1,'enrolled student sees only published');
 await db.exec(`update nabd_teaching_records set title='غير مسموح'`);
 await actor(4);assert.equal(await count(),0,'unrelated account sees no records');
 await actor(1);assert.equal(await count(),2);await db.exec(`update nabd_teaching_assignments set active=false`);
 await denied(`insert into nabd_teaching_assignments(lecturer_id,course_id,display_name) values ('00000000-0000-0000-0000-000000000002','missing','خطأ')`);
 await actor(2);assert.equal(await count(),0,'revoked lecturer loses access');
 await actor(3);assert.equal(await count(),1,'published student materials retained');
 const rows=await db.query("select title from nabd_teaching_records");assert.equal(rows.rows[0].title,'جلسة','student could not modify');
 await db.exec('reset role;set role anon');await denied('select * from nabd_teaching_records');
 await db.close();console.log('PASS: SQL migration, admin assignment, lecturer isolation, enrolled student published access, revocation, forbidden updates, URL safety, anonymous denial');
})().catch(e=>{console.error(e);process.exit(1)});
