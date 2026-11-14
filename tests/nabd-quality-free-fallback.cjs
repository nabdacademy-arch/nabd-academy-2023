"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {transformSync}=require("esbuild");

function loadFunction(filename,expose){
  const raw=fs.readFileSync(path.resolve(__dirname,"..",filename),"utf8");
  const src=raw.replace(/^import \{\s*createClient\s*\} from "jsr:@supabase\/supabase-js@2";\s*/,"")
    +"\n;globalThis.testFn="+expose+";";
  const records=[], envNames={
    GEMINI_API_KEY:"mock-gemini",GROQ_API_KEY:"mock-groq",OPENROUTER_API_KEY:"mock-openrouter"
  };
  let responseFor=()=>({status:429});
  const sandbox={
    console,Response,TextEncoder,TextDecoder,crypto:globalThis.crypto,
    setTimeout,clearTimeout,AbortController,URL,
    Deno:{env:{get:(name)=>envNames[name]||""},serve:()=>{}},
    createClient:()=>{throw Error("not part of offline provider tests");},
    fetch:async(url,opts)=>{
      const provider=url.includes("openrouter.ai")?"openrouter":
        url.includes("generativelanguage.googleapis.com")?"gemini":"groq";
      const body=JSON.parse(opts.body);
      records.push({provider,model:body.model||url.split("/models/")[1]?.split(":generateContent")[0]});
      const response=responseFor(provider,body);
      return {ok:response.status>=200&&response.status<300,status:response.status,
        json:async()=>response.data||{}};
    }
  };
  vm.runInNewContext(transformSync(src,{loader:"ts",target:"es2022",format:"iife"}).code,sandbox);
  return {
    fn:sandbox.testFn,records,envNames,
    setResponse:(next)=>{responseFor=next;}
  };
}
function generatedQuestion(){
 return {type:"mcq",prompt:"Which structure is part of the nervous system?",
   options:["Brain","Liver","Spleen","Kidney"],answer_key:0,
   source_excerpt:"The brain is part of the nervous system."};
}
function generatedResponse(){
 return {choices:[{message:{content:JSON.stringify({questions:[generatedQuestion()]})}}]};
}
function importResponse(){
 return {choices:[{message:{content:JSON.stringify({questions:[
   {type:"mcq",prompt:"What is the main function of the heart?",
     options:["Pumping blood","Digesting food"],answer_key:null}
 ]})}}]};
}
(async()=>{
 const generate=loadFunction("supabase/functions/nabd-quality-generate/index.ts","providerCall");
 assert.equal(typeof generate.fn,"function");
 generate.setResponse((provider)=>{
   if(provider!=="openrouter")return {status:429};
   return {status:200,data:generatedResponse()};
 });
 const outcome=await generate.fn("The brain is part of the nervous system; the liver is not.",
   ["mcq"],"en","Anatomy",null,0);
 assert.equal(outcome.questions.length,1);
 assert.equal(outcome.provider,"openrouter:free");
 assert.equal(outcome.questions[0].answer_key,0);
 assert.ok(generate.records.some(row=>row.provider==="groq"));
 assert.ok(generate.records.some(row=>row.provider==="gemini"));
 assert.equal(generate.records.at(-1).provider,"openrouter");
 assert.equal(generate.records.at(-1).model,"openrouter/free");
 assert.ok(!generate.records.some(row=>row.provider==="openrouter"&&row.model!=="openrouter/free"),
   "Never silently choose paid OpenRouter models.");

 const importFn=loadFunction("supabase/functions/nabd-quality-import/index.ts","modelExtract");
 importFn.setResponse(provider=>provider==="openrouter"?
   {status:200,data:importResponse()}:{status:429});
 const doc=await importFn.fn("What is the main function of the heart?",[],"Exam 1");
 assert.equal(doc.provider,"openrouter:free");
 assert.equal(doc.questions[0].answer_key,null,"Never invent answer keys");
 assert.equal(doc.questions[0].options[0],"Pumping blood");
 assert.equal(importFn.records.at(-1).model,"openrouter/free");

 const noKey=loadFunction("supabase/functions/nabd-quality-generate/index.ts","providerCall");
 noKey.envNames.OPENROUTER_API_KEY="";
 noKey.setResponse(()=>({status:429}));
 await assert.rejects(noKey.fn("Text",["mcq"],"en","Topic",null,0),/AI_RATE_LIMITED/);
 assert.ok(!noKey.records.some(row=>row.provider==="openrouter"),
   "Do not call a provider without a configured secret.");

 console.log("Quality AI free-provider failover, no paid OpenRouter models, answer integrity: PASS");
})().catch(e=>{console.error(e);process.exitCode=1});
