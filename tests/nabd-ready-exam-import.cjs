"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {transformSync}=require("esbuild");

const read=name=>fs.readFileSync(path.join(__dirname,"..",name),"utf8");
const html=read("quality-exams.html");
const js=read("assets/js/quality-director.js");
const student=read("assets/js/quality-student.js");
const importer=read("supabase/functions/nabd-quality-import/index.ts");
new vm.Script(js,{filename:"quality-director.js"});
assert.match(html,/id="ql-import-file"/);
assert.match(html,/id="ql-import-exam"/);
assert.match(html,/id="ql-import-status"/);
assert.match(html,/id="ql-paper-import"/);
assert.match(js,/client\.functions\.invoke\("nabd-quality-import"/);
assert.match(js,/readReadyExam\(file\)/);
assert.match(js,/importedFile=file/);
assert.match(js,/if\(pdf\.numPages>10\)throw Error/,"Never sample only some scanned pages");
assert.match(js,/if\(q\.type==="mcq"&&\(!Number\.isInteger\(q\.answer_key\)/,
  "Missing answer keys must block save");
assert.match(js,/q\.answer_key===null\?null:/,"Don't assume the first option is correct");
assert.match(js,/sourcePath=uploaded\|\|\(importedFile\?null:editingSourcePath\)/,
  "Non-PDF imports should not retain previous source PDF");
assert.match(student,/Array\.isArray\(q\.options\)\?q\.options:/,
  "Student portal should support variable MCQ option counts");
assert.match(importer,/DIRECTOR_ONLY/);
assert.match(importer,/nabd_exam_owner/);
assert.match(importer,/if\(raw\.length>6500000\)/);
assert.match(importer,/answer_key MUST be null unless an explicit separate answer key/);
assert.match(importer,/images\.length!==body\.page_count/,"The server rejects omitted scanned pages");
let handler=null;
const sandbox={
  console,Response,AbortController,setTimeout,clearTimeout,crypto:globalThis.crypto,
  Deno:{env:{get:()=>""},serve:fn=>{handler=fn}},
  createClient:()=>{throw Error("This is a pure unit test");}
};
const entry=importer.replace(/^import \{ createClient \} from "jsr:@supabase\/supabase-js@2";\s*/,"")
  +"\n;globalThis.testNormalize=normalize;";
vm.runInNewContext(transformSync(entry,{loader:"ts",target:"es2022",format:"iife"}).code,sandbox);
const normalize=sandbox.testNormalize;
assert.equal(typeof normalize,"function");
assert.equal(typeof handler,"function");
const exact="Which nerve supplies the sternocleidomastoid? (EXCEPT is not part of this question)";
const imported=normalize({questions:[
 {type:"mcq",prompt:exact,options:["Accessory","Vagus","Glossopharyngeal","Trigeminal","Hypoglossal"],answer_key:null},
 {type:"true_false",prompt:"The cochlea is a component of the inner ear.",answer_key:false},
 {type:"matching",prompt:"Match the columns of cranial nerves",left_items:["CN I","CN II"],right_items:["Optic","Olfactory"],answer_key:null},
 {type:"fill_blank",prompt:"The opening is known as ___",answer_key:null},
 {type:"essay",prompt:"Describe the pathway of the oculomotor nerve.",answer_key:null}
],warnings:["No separate answer key in uploaded file"]});
assert.equal(imported.questions.length,5);
assert.equal(imported.questions[0].prompt,exact);
assert.equal(imported.questions[0].options.length,5);
assert.equal(imported.questions[0].answer_key,null,"No invented MCQ key");
assert.equal(imported.questions[1].answer_key,false,"Explicit false key retained");
assert.equal(imported.questions[2].answer_key.length,2);
assert.ok(imported.questions[2].answer_key.every(v=>v===null));
assert.equal(imported.questions[3].answer_key,null);
assert.equal(imported.questions[4].answer_key,null);
assert.equal(imported.warnings.length,1);
assert.throws(()=>normalize({questions:[]}),/NO_VALID_QUESTIONS/);
assert.throws(()=>normalize({questions:[{type:"mcq",prompt:"What happens next?",options:["A"]}]}),
  /INVALID_QUESTION_FORMAT/);
assert.throws(()=>normalize({questions:Array.from({length:41},()=>({
 type:"essay",prompt:"Describe an original mechanism"
}))}),/NO_VALID_QUESTIONS/);
console.log("Ready-made NABD exam import: faithful question fields, missing-key safety, role guard and student compatibility PASS");
