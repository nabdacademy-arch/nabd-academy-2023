import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const adminPage=read("quality-exams.html");
const studentPage=read("student-exams.html");
const director=read("assets/js/quality-proctor-director.js");
const student=read("assets/js/quality-proctor-student.js");
const studentExam=read("assets/js/quality-student.js");
const migration=read("supabase/migrations/20261115_nabd_quality_exam_proctor.sql");

for(const [name,text] of [["director",director],["student",student],["student exam",studentExam]])
  new Script(text,{filename:name+".js"});
for(const id of ["ql-proctor-panel","ql-proctor-state","ql-proctor-exam","ql-proctor-start",
 "ql-proctor-stop","ql-proctor-refresh","ql-proctor-log","ql-proctor-status"])
  assert.ok(adminPage.includes('id="'+id+'"'),"Director page missing "+id);
assert.match(studentPage,/id="ql-proctor-student-notice"/);
assert.match(adminPage,/quality-proctor-director\.js/);
assert.match(studentPage,/quality-proctor-student\.js/);

for(const name of ["nabd_quality_proctor_toggle","nabd_quality_proctor_student_state",
 "nabd_quality_proctor_report","nabd_quality_proctor_dashboard"])
  assert.ok(migration.includes("function public."+name+"("),"Missing RPC "+name);
assert.match(migration,/alter table public\.nabd_quality_proctor_events enable row level security/);
assert.match(migration,/revoke all on public\.nabd_quality_proctor_events from public,anon,authenticated/);
assert.match(migration,/where p\.id=v_uid and p\.role='student'/);
assert.match(migration,/where o\.user_id=v_uid/);
assert.match(migration,/values \(p_exam,v_uid,p_signal\)/,
  "Events must derive student ID from auth.uid(), not a client field");
assert.match(migration,/detected_at timestamptz not null default now\(\)/,
  "Server timestamps events");
assert.match(migration,/v_count>=120/,"Per student exam rate cap");
assert.match(migration,/nabd-quality-proctor-purge-30d/,"Short privacy retention");
assert.doesNotMatch(migration,/grant (?:all|select|insert|update|delete) on public\.nabd_quality_proctor_events to authenticated/i);
assert.match(student,/nabd_quality_proctor_report/);
assert.match(student,/document\.addEventListener\("visibilitychange"/);
assert.match(student,/window\.addEventListener\("blur"/);
assert.match(student,/event\.key==="PrintScreen"/);
assert.match(student,/document\.addEventListener\("copy"/);
assert.match(studentExam,/nabd:exam-open/);
assert.equal((studentExam.match(/nabd:exam-end/g)||[]).length,3,
  "Monitoring stops on exit, successful submission, and timeout");
assert.match(director,/nabd_quality_proctor_toggle/);
assert.match(director,/nabd_quality_proctor_dashboard/);
assert.match(director,/textContent=String\(text\)/);
assert.doesNotMatch(director+student,/getUserMedia|getDisplayMedia|MediaRecorder/,
  "Privacy: monitoring never activates camera, microphone or screen capture");
assert.doesNotMatch(director+student,/human_score\s*=|ai_score\s*=/,
  "Alerts must never change marks");
console.log("NABD proctor: role scope, server timestamps, short retention, UI wiring, fair-use boundaries PASS");
