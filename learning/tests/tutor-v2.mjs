import assert from "node:assert/strict";
import {handleTutor as modular} from "../../supabase/functions/nabd-tutor/index.ts";
import {handleTutor as standalone} from "../../supabase/manual/nabd-tutor.ts";
import {tutorFailure,tutorFailureText} from "../core.mjs";
const env=name=>({SUPABASE_URL:"https://academy.test",SUPABASE_ANON_KEY:"public-test",OPENAI_API_KEY:"secret-test"}[name]);
const request=()=>new Request("https://edge.test/functions/v1/smart-processor",{
 method:"POST",headers:{Authorization:"Bearer student-test","Content-Type":"application/json",Origin:"https://nabdacademy-arch.github.io"},
 body:JSON.stringify({question:"Explain heart anatomy",language:"en"})
});
const providerCases=[
 {status:503,upstream:"server_is_overloaded",code:"PROVIDER_UPSTREAM_ERROR",http:502},
 {status:502,upstream:"bad_gateway",code:"PROVIDER_UPSTREAM_ERROR",http:502},
 {status:500,upstream:"server_error",code:"PROVIDER_UPSTREAM_ERROR",http:502},
 {status:429,upstream:"project_spend_limit_exceeded",code:"PROVIDER_QUOTA_EXHAUSTED",http:503},
 {status:429,upstream:"credit_balance_exhausted",code:"PROVIDER_QUOTA_EXHAUSTED",http:503},
 {status:429,upstream:"rate_limit_exceeded",code:"PROVIDER_RATE_LIMIT",http:429},
 {status:401,upstream:"invalid_api_key",code:"PROVIDER_KEY_INVALID",http:502},
 {status:422,upstream:"unprocessable",code:"PROVIDER_REQUEST_REJECTED",http:502},
 {status:418,upstream:"unknown",code:"PROVIDER_HTTP_ERROR",http:502}
];
const responses=[modular,standalone];
for(const handler of responses){
 for(const item of providerCases){
  const fetcher=async url=>{
   if(url.endsWith("/auth/v1/user"))return Response.json({id:"student-test"});
   if(url.endsWith("take_tutor_slot"))return Response.json(true);
   if(url.startsWith("https://api.openai.com/"))return Response.json({error:{code:item.upstream,message:"PRIVATE_PROVIDERMESSAGE"}},{status:item.status});
   throw new Error("Unexpected mocked endpoint");
  };
  const response=await handler(request(),env,fetcher);
  assert.equal(response.status,item.http,item.code);
  assert.equal(response.headers.get("x-nabd-tutor-version"),"2");
  const payload=await response.json();
  assert.equal(payload.code,item.code);
  assert.equal(payload.upstream_status,item.status);
  assert(!JSON.stringify(payload).includes("PRIVATE_PROVIDERMESSAGE"));
  assert(!JSON.stringify(payload).includes("secret-test"));
  const failure=await tutorFailure({error:{context:Response.json(payload,{status:response.status}),name:"FunctionsHttpError"}});
  assert.equal(failure.code,item.code);
  for(const l of ["ar","en"])assert(tutorFailureText(failure,l).includes(item.code));
 }
 const noJson=async url=>url.endsWith("/auth/v1/user")?Response.json({id:"student-test"}):url.endsWith("take_tutor_slot")?Response.json(true):new Response("<html>not json</html>",{status:200,headers:{"content-type":"text/html"}});
 const malformed=await handler(request(),env,noJson);
 assert.equal((await malformed.json()).code,"PROVIDER_INVALID_RESPONSE");
 const noNetwork=async url=>{
  if(url.endsWith("/auth/v1/user"))return Response.json({id:"student-test"});
  if(url.endsWith("take_tutor_slot"))return Response.json(true);
  throw new Error("secret network location");
 };
 const failed=await handler(request(),env,noNetwork);
 assert.equal(failed.status,502);
 assert.equal((await failed.json()).code,"PROVIDER_CONNECTION_ERROR");
}
console.log("PASS: v2 handler and paste-ready single-file twin classify upstream 502/503, 429 balance, 422 requests, invalid JSON and connectivity; never expose provider secrets.");
