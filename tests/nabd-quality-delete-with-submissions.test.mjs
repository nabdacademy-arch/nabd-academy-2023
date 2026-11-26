import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const read = file => readFileSync(new URL("../"+file,import.meta.url),"utf8");
const director=read("assets/js/quality-director.js");
const page=read("quality-exams.html");
const db=read("supabase/migrations/20261115_nabd_quality_delete_exam_with_answers.sql");
new Script(director);
assert.match(director,/rpc\("nabd_quality_delete_exam",\{p_exam:x\.id\}\)/);
assert.doesNotMatch(director,/if\(count>0\)throw Error/,"No more refuse deletion with submissions");
assert.doesNotMatch(director,/x\.status==="published" && new Date\(x\.closes_at\)>new Date\(\)\)\{/,"Active exams should be deletable after confirmation");
assert.match(director,/window\.confirm\(first\)/);
assert.match(director,/window\.confirm\("تأكيد نهائي للحذف الكامل:/);
assert.match(director,/data\.deleted_exams!==1/,"Explicit confirmation from server");
assert.match(director,/source_path/,"Safe source file cleanup");
assert.match(page,/<script src="assets\/js\/quality-director\.js(?:\?v=\d+)?"><\/script>/);
assert.match(page,/حتى مع وجود إجابات ودرجات/);
assert.match(db,/security definer/);
assert.match(db,/set search_path = ''/);
assert.match(db,/from public\.nabd_exam_owner o where o\.user_id=v_uid/);
assert.match(db,/where e\.id=p_exam and e\.created_by=v_uid/);
assert.match(db,/for update;/);
const submissionDelete=db.indexOf("delete from public.nabd_quality_submissions s");
const examDelete=db.indexOf("delete from public.nabd_quality_exams e");
assert.ok(submissionDelete>0&&examDelete>submissionDelete,"Delete dependent submissions before exam");
assert.match(db,/delete from public\.nabd_quality_proctor_events/);
assert.match(db,/delete from public\.nabd_quality_proctor_settings/);
assert.match(db,/revoke all on function public\.nabd_quality_delete_exam\(uuid\) from public, anon, authenticated/);
assert.match(db,/grant execute on function public\.nabd_quality_delete_exam\(uuid\) to authenticated/);
assert.doesNotMatch(db,/drop table|truncate table|alter table public\.nabd_quality_submissions/i);
console.log("Director-only, confirmed, transactional exam delete with submissions: PASS");

const deletion = director.slice(director.indexOf("async function deleteExam("), director.indexOf("const closingExams"));
for (const [references, shouldRemove, failure] of [
  [[], true], [[{id:"other"}], false], [null, false], [{}, false], [undefined, false],
  [[], false, "lookup"], [[], true, "storage"], [[], true, "refresh"]
]) {
  const calls = [];
  const query = {select(){return this;}, eq(){return this;}, limit(){if(failure==="lookup")throw Error("Offline");return {data:references};}};
  const context = {
    director:{}, window:{confirm:()=>true}, editingId:null, bucket:"test",
    client:{
      rpc:async()=>({data:{ok:true, exam_id:"sample", deleted_exams:1}}),
      from:()=>query,
      storage:{from:()=>({remove(paths){calls.push(...paths);if(failure==="storage")throw Error("Offline");return {error:null};}})}
    },
    loadExams:async()=>{if(failure==="refresh")throw Error("Offline");},
    status:(id,message,kind)=>{context.last={message,kind};},
    trigger:{disabled:false}
  };
  await new Script(deletion+';deleteExam({id:"sample",title:"Sample",source_path:"lecture.pdf"},trigger)').runInNewContext(context);
  assert.deepEqual(calls,shouldRemove?["lecture.pdf"]:[]);
  assert.equal(context.last.kind,"success");
  assert.equal(context.last.message.includes("تعذّر تحديث قائمة الامتحانات"),failure==="refresh");
  if(failure==="storage"||failure==="lookup")assert.match(context.last.message,/تعذّر تأكيد تنظيف/);
  assert.equal(context.trigger.disabled,false);
}
