"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {transformSync}=require("esbuild");
const read=p=>fs.readFileSync(path.resolve(__dirname,"..",p),"utf8");

const student=read("assets/js/quality-student.js");
const html=read("student-exams.html");
const gradeBot=read("supabase/functions/nabd-quality-autograde/index.ts");
const migration=read("supabase/migrations/20261115_nabd_quality_reliable_exam_submit.sql");
new vm.Script(student);
assert.match(html,/quality-student\.js\?v=9/);
assert.match(student,/rpc\("nabd_quality_submit_exam"/,"student must use server-side transactional submit");
assert.match(student,/p_answers:answers/);
assert.match(student,/confirmSavedSubmission\(currentExam\.id\)/,"reconcile after dropped network response");
assert.match(student,/sessionStorage\.setItem/);
assert.match(student,/restoreDraft\(\)/,"restore locally captured answers");
assert.match(student,/clearDraft\(currentExam\.id\)/,"clear temporary answers after confirmed submit");
assert.match(student,/autoRetries<3/,"bounded auto retry");
assert.match(student,/ms<25000/,"auto submit begins with network buffer");
assert.doesNotMatch(student,/\.insert\(\{exam_id:exam\.id,student_id:student\.id,answers\}\)/,
  "bypass brittle browser-side direct insert route");
assert.match(migration,/security definer/);
assert.match(migration,/set search_path = ''/);
assert.match(migration,/p\.id=v_uid and p\.role='student'/);
assert.match(migration,/where s\.exam_id=p_exam and s\.student_id=v_uid/);
assert.match(migration,/and x\.opens_at<=now\(\) and x\.closes_at>now\(\)/);
assert.match(migration,/on conflict \(exam_id,student_id\) do nothing/);
assert.match(migration,/from jsonb_object_keys\(p_answers\)/,"reject unknown injected answers");
assert.match(migration,/grant execute on function public\.nabd_quality_submit_exam\(uuid,jsonb\)\s+to authenticated/);
assert.doesNotMatch(migration,/grant.*to anon/i);
assert.doesNotMatch(migration,/delete from public\.nabd_quality_submissions|update public\.nabd_quality_submissions/i,
  "must preserve existing answers and grades");
assert.match(gradeBot,/type:"groq",model:"openai\/gpt-oss-20b"/);
assert.match(gradeBot,/type:"openrouter",model:"openrouter\/free"/);
assert.match(gradeBot,/model:"openrouter\/free"/);
assert.doesNotMatch(gradeBot,/model:"openrouter\/auto"/);
assert.match(gradeBot,/p_review:outcome\.review/,"preserve human review threshold");

const transpiled=transformSync(gradeBot.replace(/^import \{createClient\} from "jsr:@supabase\/supabase-js@2";\s*/,"")+
 "\n;globalThis.testGrade=grade;",{loader:"ts",format:"iife",target:"es2022"}).code;
const context={
 console,crypto:globalThis.crypto,Response,AbortController,TextEncoder,setTimeout,clearTimeout,
 Deno:{env:{get:()=>""},serve:()=>{}},createClient:()=>{}
};
vm.runInNewContext(transpiled,context);
assert.equal(typeof context.testGrade,"function");
(async()=>{
 const entry={
  id:"submission",run_id:"test",title:"Medical exam",
  questions:[
   {id:"q1",type:"mcq",prompt:"Select the heart term",options:["Cardi","Nephro","Hepato","Derma"],answer_key:0},
   {id:"q2",type:"true_false",prompt:"Hypo means low",answer_key:true}
  ],
  answers:{q1:0,q2:"true"}
 };
 const graded=await context.testGrade(entry);
 assert.equal(graded.score,2,"one mark per question");
 assert.equal(graded.review,false,"objective grading requires no external AI");
 assert.equal(graded.breakdown.length,2);
 console.log("NABD student submission & deterministic grading integrity: PASS");
})().catch(e=>{console.error(e);process.exitCode=1});
