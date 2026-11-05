import assert from "node:assert/strict";
import {handleTutor as modular} from "../../supabase/functions/nabd-tutor/index.ts";
import {handleTutor as standalone} from "../../supabase/manual/nabd-tutor.ts";
import {tutorFailure,tutorFailureText} from "../core.mjs";
const config={SUPABASE_URL:"https://academy.test",SUPABASE_ANON_KEY:"pub",GROQ_API_KEY:"secret-groq"};
const env=name=>config[name];
const request=()=>new Request("https://edge.test/functions/v1/smart-processor",{
 method:"POST",headers:{Authorization:"Bearer student","Content-Type":"application/json",Origin:"https://nabdacademy-arch.github.io"},
 body:JSON.stringify({question:"Describe the heart",language:"en"})
});
const cases=[
 {status:401,upstream:"invalid_api_key",code:"PROVIDER_KEY_INVALID",http:502},
 {status:403,upstream:"permission_denied",code:"PROVIDER_PERMISSION_DENIED",http:502},
 {status:404,upstream:"model_not_found",code:"PROVIDER_MODEL_UNAVAILABLE",http:502},
 {status:429,upstream:"rate_limit_exceeded",code:"PROVIDER_RATE_LIMIT",http:429},
 {status:429,upstream:"credit_balance_exhausted",code:"PROVIDER_QUOTA_EXHAUSTED",http:503},
 {status:400,upstream:"bad_request",code:"PROVIDER_REQUEST_REJECTED",http:502},
 {status:500,upstream:"server_error",code:"PROVIDER_UPSTREAM_ERROR",http:502},
 {status:503,upstream:"server_overloaded",code:"PROVIDER_UPSTREAM_ERROR",http:502},
 {status:418,upstream:"unknown",code:"PROVIDER_HTTP_ERROR",http:502}
];
for(const handler of [modular,standalone]){
 for(const sample of cases){
  const fetcher=async url=>{
   if(url.endsWith("/auth/v1/user"))return Response.json({id:"student"});
   if(url.endsWith("take_tutor_slot"))return Response.json(true);
   if(url.includes("api.groq.com"))return Response.json({error:{code:sample.upstream,message:"PRIVATE_PROVIDER_ERROR"}},{status:sample.status});
   throw Error("Unexpected request");
  };
  const response=await handler(request(),env,fetcher);
  assert.equal(response.status,sample.http);
  assert.equal(response.headers.get("x-nabd-tutor-version"),"3");
  const payload=await response.json();
  assert.equal(payload.code,sample.code);
  assert.equal(payload.upstream_status,sample.status);
  assert(!JSON.stringify(payload).includes("PRIVATE_PROVIDER_ERROR"));
  const failure=await tutorFailure({error:{name:"FunctionsHttpError",context:Response.json(payload,{status:response.status})}});
  assert.equal(failure.code,sample.code);
  for(const language of ["ar","en"])assert(tutorFailureText(failure,language).includes(sample.code));
 }
 const noJson=async url=>url.endsWith("/auth/v1/user")?Response.json({id:"student"}):url.endsWith("take_tutor_slot")?Response.json(true):new Response("<html>bad</html>",{status:200});
 const malformed=await handler(request(),env,noJson);
 assert.equal((await malformed.json()).code,"PROVIDER_INVALID_RESPONSE");
 const network=async url=>{
  if(url.endsWith("/auth/v1/user"))return Response.json({id:"student"});
  if(url.endsWith("take_tutor_slot"))return Response.json(true);
  throw new Error("hidden credentials");
 };
 const broken=await handler(request(),env,network);
 assert.equal((await broken.json()).code,"PROVIDER_CONNECTION_ERROR");
}
console.log("PASS: legacy v2 diagnostic contract remains compatible with v3 Groq and standalone Supabase file.");
