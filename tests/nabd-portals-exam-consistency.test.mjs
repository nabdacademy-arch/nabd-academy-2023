import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";

const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");
const home=read("index.html");
const start=home.indexOf('<div class="neo-site"');
const end=home.indexOf('<div id="nabdLegacyShell"');
assert.ok(start!==-1 && end>start, "Modern home and original archived experience both remain");
const compact=home.slice(start,end);
const pathways=compact.slice(compact.indexOf('<div class="neo-programs">'),compact.indexOf('<div class="neo-student-shortcuts"'));
const cards=[...pathways.matchAll(/<a class="neo-program(?: [^"]*)?" href="([^"]+)"/g)].map(x=>x[1]);
assert.deepEqual(cards, ["academy.html","nabd-moodle.html","nabd-global-research.html","scholarships.html"],
  "Four public pathways: education, student hub, research and scholarships");
assert.match(compact,/class="neo-student-shortcuts"/);
assert.match(compact,/class="neo-staff-services"/);
for(const route of ["portal.html","student-exams.html","learning/","scholarship-manager.html","research-manager.html","quality-exams.html"]){
  assert.ok(compact.includes('href="' + route + '"'), "Preserve accessible route " + route);
}
assert.match(compact,/data-neo-ar="للطلاب: وصول مباشر"/);
assert.match(compact,/data-neo-en="Students: quick access"/);
assert.ok(home.includes('id="nabdLegacyShell" hidden'),"Never remove archived portal features");

const director=read("assets/js/quality-director.js");
const student=read("assets/js/quality-student.js");
const studentPage=read("student-exams.html");
const directorPage=read("quality-exams.html");
const grade=read("supabase/functions/nabd-quality-autograde/index.ts");
const examSQL=read("supabase/migrations/20261112_nabd_quality_exams.sql");
const marksSQL=read("supabase/migrations/20261113_nabd_exam_marks_per_question.sql");

for(const [name,source] of [["quality-director.js",director],["quality-student.js",student]]){
  new Script(source,{filename:name});
}
assert.match(studentPage,/href="nabd-moodle.html"/);
assert.match(directorPage,/href="nabd-moodle.html"/);
assert.match(studentPage,/تسليم الإجابات للتقييم/);
assert.match(student,/Submit answers for assessment/);
assert.doesNotMatch(studentPage,/النتائج لا تُحتسب آليًا/,"The grading bot is available");
assert.doesNotMatch(directorPage,/التقييم النهائي بشري/,"Avoid contradictory promises");

assert.match(grade,/const maximum=entry\.questions\.length/,"AI grade maximum equals question count");
assert.match(grade,/maximum_points:1/,"Each question has one possible point");
assert.match(director,/input\.max=String\(totalMarks\)/,"Manual grade maximum equals question count");
assert.match(student,/nabd_quality_student_history_v2/,"Student result history has question counts");
assert.match(marksSQL,/SCORE_EXCEEDS_QUESTION_COUNT/,"Database enforces maximum");
assert.match(director,/if\(count>0\)throw Error\(/,"Guard against deleting student attempts");
assert.match(examSQL,/references public\.nabd_quality_exams\(id\) on delete restrict/,"DB forbids deleting exams with results");
assert.match(director,/\.eq\("created_by",director\.id\)/,"Delete is scoped to the director");
assert.match(director,/\.eq\("status",x\.status\)/,"Delete detects changed publication state");

console.log("NABD homepage, student portal links, grading notices, score limits and deletion safeguards: OK");
