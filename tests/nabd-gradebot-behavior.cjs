"use strict";
const assert=require("node:assert/strict");
const {readFileSync}=require("node:fs");
const {resolve}=require("node:path");
const vm=require("node:vm");
const {transformSync}=require("esbuild");

// Compile and invoke the real Edge Function grade() with no live credentials.
const src=readFileSync(resolve(__dirname,"../supabase/functions/nabd-quality-autograde/index.ts"),"utf8")
  .replace(/^import \{createClient\} from "jsr:@supabase\/supabase-js@2";\s*/,"")
  +"\n;globalThis.qaGrade=grade;";
const sandbox={console,Response,TextEncoder,AbortController,setTimeout,clearTimeout,
 Deno:{env:{get:()=>""},serve:handler=>{sandbox.handler=handler}},
 createClient:()=>{throw Error("No production access allowed")}};
vm.runInNewContext(transformSync(src,{loader:"ts",target:"es2022",format:"iife"}).code,sandbox);
assert.equal(typeof sandbox.qaGrade,"function");
const questions=Array.from({length:20},(_,i)=>({
 id:"q"+i,type:"mcq",prompt:"Question "+i,options:["Correct","Wrong"],answer_key:0
}));
const answer=()=>Object.fromEntries(questions.map(q=>[q.id,0]));
const entry=(qs,answers)=>({id:"test",run_id:"local",title:"20 questions",questions:qs,answers});
(async()=>{
 const all=await sandbox.qaGrade(entry(questions,answer()));
 assert.equal(all.score,20);assert.equal(all.breakdown.length,20);assert.equal(all.review,false);
 const wrong=answer();for(const i of [2,5,17])wrong["q"+i]=1;
 const mixed=await sandbox.qaGrade(entry(questions,wrong));
 assert.equal(mixed.score,17);assert.equal(mixed.breakdown.filter(x=>x.earned_points===0).length,3);
 assert.ok(mixed.notes.includes("17/20"));
 const matching=[...questions];
 matching[19]={id:"q19",type:"matching",prompt:"Match structures",left_items:["A","B"],right_items:["X","Y"],answer_key:[0,1]};
 const part=answer();part.q19=[0,0];
 const partial=await sandbox.qaGrade(entry(matching,part));
 assert.equal(partial.score,19.5);assert.equal(partial.breakdown[19].maximum_points,1);
 const essay=[...questions];
 essay[19]={id:"q19",type:"essay",prompt:"Explain the mechanism",answer_key:"Approved reference",rubric:"Evidence"};
 const essayAnswers=answer();essayAnswers.q19="Different but reasoned response";
 const review=await sandbox.qaGrade(entry(essay,essayAnswers));
 assert.equal(review.score,null);assert.equal(review.review,true);
 await assert.rejects(()=>sandbox.qaGrade(entry([...questions,...questions,questions[0]],{})),/INVALID_EXAM/);
 assert.equal(typeof sandbox.handler,"function");
 console.log("NABD gradebot: 20/20, 17/20, 19.5/20, uncertain essay and size limits PASS");
})().catch(e=>{console.error(e);process.exitCode=1});
