import assert from "node:assert/strict";
import {handleTutor} from "../../supabase/functions/nabd-tutor/index.ts";
import {generateWithFreeProviders} from "../../supabase/functions/nabd-tutor/provider-router.mjs";
const base={SUPABASE_URL:"https://academy.test",SUPABASE_ANON_KEY:"public-test",GROQ_API_KEY:"groq-secret",GEMINI_API_KEY:"gemini-secret"};
const env=name=>base[name];
const image="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9X91J4IAAAAASUVORK5CYII=";
const req=(image=null)=>new Request("https://edge.test/functions/v1/smart-processor",{
 method:"POST",headers:{Authorization:"Bearer user-learner",Origin:"https://nabdacademy-arch.github.io"},
 body:JSON.stringify({question:"اشرح صورة تشريحية تعليمية",image})
});
const groq="https://api.groq.com/openai/v1/chat/completions";
const gemini="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
function buildFake({groqStatus=200,geminiStatus=200,geminiSafety=false}={}){
 const calls=[];
 return {calls,fetcher:async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith("/auth/v1/user"))return Response.json({id:"learner"});
  if(url.endsWith("take_tutor_slot"))return Response.json(true);
  if(url===groq)return groqStatus===200
   ?Response.json({choices:[{message:{content:"Groq strong reasoning"}}]})
   :Response.json({error:{code:"rate_limit_exceeded",message:"private"}} ,{status:groqStatus});
  if(url===gemini)return geminiStatus===200
   ?Response.json(geminiSafety?{candidates:[{finishReason:"SAFETY"}]}:{candidates:[{content:{parts:[{text:"Gemini multimodal answer"}]}}]})
   :Response.json({error:{status:"RESOURCE_EXHAUSTED",message:"private"}},{status:geminiStatus});
  throw Error("Not allowed: "+url);
 }};
}
// Prefer 120B Groq for all text prompts when present.
let mock=buildFake();
let res=await handleTutor(req(),env,mock.fetcher);
assert.equal(res.status,200);
let output=await res.json();assert.equal(output.provider,"groq");assert.equal(output.answer,"Groq strong reasoning");
assert.equal(mock.calls.filter(x=>x.url===groq).length,1);
assert.equal(mock.calls.filter(x=>x.url===gemini).length,0);
const groqBody=JSON.parse(mock.calls.find(x=>x.url===groq).options.body);
assert.equal(groqBody.model,"openai/gpt-oss-120b");
assert(!JSON.stringify(groqBody).includes("groq-secret"));
assert(!JSON.stringify(groqBody).includes("user-learner"));
// Provider 429 automatically routes to Gemini without another student quota charge.
mock=buildFake({groqStatus:429});
res=await handleTutor(req(),env,mock.fetcher);
assert.equal(res.status,200);
output=await res.json();assert.equal(output.provider,"gemini");
assert.equal(mock.calls.filter(x=>x.url.includes("take_tutor_slot")).length,1);
assert.equal(mock.calls.filter(x=>x.url===gemini).length,1);
// Images use Gemini only and preserve sanitized image parts.
mock=buildFake();
res=await handleTutor(req(image),env,mock.fetcher);
assert.equal(res.status,200);
output=await res.json();assert.equal(output.provider,"gemini");
assert.equal(mock.calls.filter(x=>x.url===groq).length,0);
const geminiCall=mock.calls.find(x=>x.url===gemini);
const geminiBody=JSON.parse(geminiCall.options.body);
assert.equal(geminiBody.contents[0].parts[1].inline_data.mime_type,"image/png");
assert.equal(geminiCall.options.headers["x-goog-api-key"],"gemini-secret");
assert(!JSON.stringify(geminiBody).includes("gemini-secret"));
// Groq only: basic questions work; images need Gemini configured.
const onlyGroq=name=>name==="GEMINI_API_KEY"?undefined:env(name);
mock=buildFake();
res=await handleTutor(req(image),onlyGroq,mock.fetcher);
assert.equal(res.status,503);assert.equal((await res.json()).code,"IMAGE_PROVIDER_UNAVAILABLE");
assert.equal(mock.calls.filter(c=>c.url===gemini).length,0);
// Gemini only supports Arabic text and diagrams without Groq.
const onlyGemini=name=>name==="GROQ_API_KEY"?undefined:env(name);
mock=buildFake();
res=await handleTutor(req(),onlyGemini,mock.fetcher);
assert.equal((await res.json()).provider,"gemini");
// Gemini safety refusal should not route to any other provider.
mock=buildFake({geminiSafety:true});
res=await handleTutor(req(image),env,mock.fetcher);
assert.equal(res.status,422);assert.equal((await res.json()).code,"PROVIDER_SAFETY_BLOCK");
// Both free tiers saturated: surface final 429 with sanitized info.
mock=buildFake({groqStatus:429,geminiStatus:429});
res=await handleTutor(req(),env,mock.fetcher);
assert.equal(res.status,429);assert.equal((await res.json()).code,"PROVIDER_RATE_LIMIT");
// Helper also supports explicit Gemini primary without leaking keys.
mock=buildFake();
const result=await generateWithFreeProviders({env:name=>name==="NABD_TUTOR_PRIMARY"?"gemini":env(name),fetcher:mock.fetcher,question:"Hello",system:"For education only"});
assert.equal(result.provider,"gemini");
console.log("PASS: free-tier Groq primary, Gemini fallback/vision, privacy, safety refusal, single quota charge, secondary-only routing.");
