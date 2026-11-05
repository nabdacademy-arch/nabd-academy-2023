import assert from "node:assert/strict";
import {handleTutor} from "../../supabase/functions/nabd-tutor/index.ts";
const ENV={SUPABASE_URL:"https://academy.test",SUPABASE_ANON_KEY:"public-test",GROQ_API_KEY:"groq-secret-test"};
const env=name=>ENV[name];
const req=(body,headers={})=>new Request("https://edge.test/functions/v1/smart-processor",{
 method:"POST",headers:{Authorization:"Bearer learner-test","Content-Type":"application/json",Origin:"https://nabdacademy-arch.github.io",...headers},body:JSON.stringify(body)
});
let calls=[];
const fake=async(url,options)=>{
 calls.push([url,options]);
 if(url.endsWith("/auth/v1/user"))return Response.json({id:"u1"});
 if(url.endsWith("take_tutor_slot"))return Response.json(true);
 if(url==="https://api.groq.com/openai/v1/chat/completions")return Response.json({choices:[{message:{content:"Educational explanation [medterms]"}}]});
 throw Error("Unexpected external endpoint: "+url);
};
assert.equal((await handleTutor(req({question:"Heart"},{Origin:"https://attacker.test"}),env,fake)).status,403);
assert.equal(calls.length,0);
assert.equal((await handleTutor(req({question:"Heart"},{Authorization:""}),env,fake)).status,401);
assert.equal((await handleTutor(req({question:"Heart"}),()=>null,fake)).status,503);
assert.equal((await handleTutor(req({question:"Heart",image:"data:image/png;base64,AAAA"}),env,fake)).status,400);
let r=await handleTutor(req({question:"Explain the heart",language:"en"}),env,fake);
assert.equal(r.status,200);
assert.equal(r.headers.get("cache-control"),"no-store");
assert.equal(r.headers.get("x-nabd-tutor-version"),"3");
const answer=await r.json();
assert.ok(answer.answer.includes("Educational"));
assert.equal(answer.provider,"groq");
assert.equal(answer.model,"openai/gpt-oss-120b");
const sent=JSON.parse(calls.find(([u])=>u.includes("api.groq.com"))[1].body);
assert.equal(sent.model,"openai/gpt-oss-120b");
assert.equal(sent.messages[1].content,"Explain the heart");
assert.ok(sent.messages[0].content.includes("not retrieved full texts"));
assert.ok(!JSON.stringify(sent).includes("learner-test"));
assert.equal(calls.filter(([u])=>u.includes("api.openai.com")).length,0);
r=await handleTutor(req({question:"Heart"}),env,(url,options)=>url.endsWith("take_tutor_slot")?Response.json(false):fake(url,options));
assert.equal(r.status,429);
r=await handleTutor(req({question:"Heart"}),env,async()=>new Response("Unauthorized",{status:401}));
assert.equal(r.status,401);
console.log("PASS: v3 Groq backend, CORS, authentication, local quota, sanitized secrets, no OpenAI dependency.");
