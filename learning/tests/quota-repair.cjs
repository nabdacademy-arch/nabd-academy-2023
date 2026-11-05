// Focused Supabase tutor quota repair checks using PGlite.
// Run: NODE_PATH=/tmp/nabd-quota-test/node_modules node learning/tests/quota-repair.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
const sql=fs.readFileSync('supabase/manual/fix_tutor_quota.sql','utf8');
const uid=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
async function makeDb(){
  const db=new PGlite();
  await db.exec(
    "create role anon;create role authenticated;create schema auth;"+
    "create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;"+
    "grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;"+
    "create table auth.users(id uuid primary key);"+
    "insert into auth.users values ('"+uid(1)+"'),('"+uid(2)+"');"
  );
  return db;
}
async function signIn(db,user){
  await db.exec('reset role');
  await db.exec('set role authenticated');
  await db.exec("set request.jwt.claim.sub='"+uid(user)+"'");
}
async function signOut(db){
  await db.exec('reset role');
  await db.exec("set request.jwt.claim.sub=''");
}
async function allowed(db){
  return (await db.query('select public.nabd_learning_take_tutor_slot() as allowed')).rows[0].allowed;
}
async function denied(db,query){
  await assert.rejects(()=>db.exec(query),/permission denied|42501|must be owner/i);
}
(async()=>{
  const db=await makeDb();
  try{
    // Works without re-running the full LMS activation.
    await db.exec(sql);
    await db.exec(sql);
    const status=(await db.query(
      "select "+
      "to_regclass('nabd_learning_private.tutor_usage') is not null as quota_table_exists,"+
      "to_regprocedure('public.nabd_learning_take_tutor_slot()') is not null as rpc_exists,"+
      "has_function_privilege('authenticated','public.nabd_learning_take_tutor_slot()','EXECUTE') as student_can_call,"+
      "has_function_privilege('anon','public.nabd_learning_take_tutor_slot()','EXECUTE') as anon_can_call,"+
      "has_schema_privilege('authenticated','nabd_learning_private','USAGE') as private_schema_exposed"
    )).rows[0];
    assert.deepEqual(status,{
      quota_table_exists:true,rpc_exists:true,student_can_call:true,
      anon_can_call:false,private_schema_exposed:false
    });
    await signIn(db,1);
    for(let n=0;n<6;n++)assert.equal(await allowed(db),true,'first six calls allowed');
    assert.equal(await allowed(db),false,'seventh call blocked');
    await denied(db,'select * from nabd_learning_private.tutor_usage');
    await denied(db,"insert into nabd_learning_private.tutor_usage values('"+uid(2)+"',now(),1)");

    // Re-running does not reset existing usage.
    await signOut(db);
    await db.exec(sql);
    await signIn(db,1);
    assert.equal(await allowed(db),false,'existing quota preserved');

    // Per-user isolation.
    await signIn(db,2);
    assert.equal(await allowed(db),true,'independent user quota');
    await signOut(db);
    assert.equal((await db.query("select count(*)::integer as n from nabd_learning_private.tutor_usage")).rows[0].n,2);
    assert.equal((await db.query("select hits from nabd_learning_private.tutor_usage where user_id='"+uid(1)+"'")).rows[0].hits,6);

    // Simulate new minute in an isolated DB.
    await db.exec("update nabd_learning_private.tutor_usage set minute=pg_catalog.now()-interval '2 minutes' where user_id='"+uid(1)+"'");
    await signIn(db,1);
    assert.equal(await allowed(db),true,'new minute resets window');
    await signOut(db);
    assert.equal((await db.query("select hits from nabd_learning_private.tutor_usage where user_id='"+uid(1)+"'")).rows[0].hits,1);

    // No JWT: false, no counter.
    await db.exec('set role authenticated');
    await db.exec("set request.jwt.claim.sub=''");
    assert.equal(await allowed(db),false);
    await signOut(db);
    assert.equal((await db.query("select count(*)::integer as n from nabd_learning_private.tutor_usage")).rows[0].n,2);

    // Anonymous cannot execute the RPC.
    await db.exec('set role anon');
    await denied(db,'select public.nabd_learning_take_tutor_slot()');
    console.log('PASS: quota RPC install, re-run safety, 6/min/user, minute reset, identity and private counter isolation');
  }finally{await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
