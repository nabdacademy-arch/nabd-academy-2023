import assert from "node:assert/strict";
import {tutorFailure,tutorFailureText} from "../core.mjs";
import {handleTutor} from "../../supabase/functions/nabd-tutor/index.ts";
const fakeHttp=(status,body)=>({error:{name:"FunctionsHttpError",context:Response.json(body,{status})}});
for(const [status,payload,code] of [
 [401,{code:401,message:"Invalid JWT"},"GATEWAY_INVALID_JWT"],
 [404,{code:"NOT_FOUND",message:"Requested function was not found"},"FUNCTION_NOT_FOUND"],
 [503,{error:"Tutor service has not been activated"},"CONFIG_MISSING"],
 [503,{error:"Tutor quota database is unavailable"},"QUOTA_DATABASE_UNAVAILABLE"],
 [429,{error:"Please wait before asking another question"},"TUTOR_RATE_LIMIT"],
 [503,{code:"IMAGE_PROVIDER_UNAVAILABLE"},"IMAGE_PROVIDER_UNAVAILABLE"],
 [422,{code:"PROVIDER_SAFETY_BLOCK"},"PROVIDER_SAFETY_BLOCK"],
 [429,{code:"PROVIDER_RATE_LIMIT"},"PROVIDER_RATE_LIMIT"],
 [502,{code:"PROVIDER_UPSTREAM_ERROR"},"PROVIDER_UPSTREAM_ERROR"],
 [502,{code:"PROVIDER_CONNECTION_ERROR"},"PROVIDER_CONNECTION_ERROR"],
 [503,{code:"PROVIDER_QUOTA_EXHAUSTED"},"PROVIDER_QUOTA_EXHAUSTED"],
 [502,{code:"PROVIDER_KEY_INVALID",message:"private-token <img src=x>"},"PROVIDER_KEY_INVALID"],
 [500,{code:"<img src=x>",error:"private-token"},"EDGE_FUNCTION_ERROR"],
 [400,{error:"toString"},"UNKNOWN_ERROR"]
]){
 const failure=await tutorFailure(fakeHttp(status,payload));
 assert.deepEqual(failure,{code,status});
 for(const language of ["ar","en"]){
  const msg=tutorFailureText(failure,language);
  assert(msg.includes(code));assert(msg.includes("HTTP "+status));
  assert(!msg.includes("private-token"));assert(!msg.includes("<img"));
 }
}
assert.equal((await tutorFailure({error:{name:"FunctionsFetchError"}})).code,"NETWORK_OR_CORS_ERROR");
assert.equal((await tutorFailure({data:{}})).code,"EMPTY_RESPONSE");
const base={SUPABASE_URL:"https://academy.test",SUPABASE_ANON_KEY:"old-public",GROQ_API_KEY:"demo-groq"};
const req=()=>new Request("https://edge.test/functions/v1/smart-processor",{method:"POST",headers:{Authorization:"Bearer student",Origin:"https://nabdacademy-arch.github.io"},body:JSON.stringify({question:"Explain circulation"})});
function fetcher(providerStatus=200,code="",keys=[]){
 return async(url,options)=>{
  if(url.endsWith("/auth/v1/user")){keys.push(options.headers.apikey);return Response.json({id:"student"})}
  if(url.endsWith("take_tutor_slot")){keys.push(options.headers.apikey);return Response.json(true)}
  if(url.includes("api.groq.com"))return providerStatus===200?Response.json({choices:[{message:{content:"Explanation"}}]}):Response.json({error:{code,message:"private-provider-response"}},{status:providerStatus});
  throw Error("Unknown endpoint");
 };
}
for(const [status,upstream,expectedHttp,expectedCode] of [
 [401,"invalid_api_key",502,"PROVIDER_KEY_INVALID"],
 [403,"permission_denied",502,"PROVIDER_PERMISSION_DENIED"],
 [429,"rate_limit_exceeded",429,"PROVIDER_RATE_LIMIT"],
 [429,"insufficient_quota",503,"PROVIDER_QUOTA_EXHAUSTED"],
 [429,"credit_balance_exhausted",503,"PROVIDER_QUOTA_EXHAUSTED"],
 [404,"model_not_found",502,"PROVIDER_MODEL_UNAVAILABLE"],
 [400,"bad_request",502,"PROVIDER_REQUEST_REJECTED"],
 [422,"invalid",502,"PROVIDER_REQUEST_REJECTED"],
 [500,"server_error",502,"PROVIDER_UPSTREAM_ERROR"]
]){
 const response=await handleTutor(req(),name=>base[name],fetcher(status,upstream));
 assert.equal(response.status,expectedHttp);
 const p=await response.json();
 assert.equal(p.code,expectedCode);
 assert.equal(p.upstream_status,status);
 assert(!JSON.stringify(p).includes("private-provider-response"));
}
const keys=[];
const modern=name=>name==="SUPABASE_PUBLISHABLE_KEYS"?JSON.stringify({default:"sb_publishable_test"}):base[name];
assert.equal((await handleTutor(req(),modern,fetcher(200,"",keys))).status,200);
assert.deepEqual(keys,["sb_publishable_test","sb_publishable_test"]);
const fallback=[];
assert.equal((await handleTutor(req(),name=>name==="SUPABASE_PUBLISHABLE_KEYS"?"broken":base[name],fetcher(200,"",fallback))).status,200);
assert.deepEqual(fallback,["old-public","old-public"]);
const timeout=await handleTutor(req(),name=>base[name],async()=>{throw new DOMException("private","TimeoutError")});
assert.equal(timeout.status,504);assert.equal((await timeout.json()).code,"REQUEST_TIMEOUT");
console.log("PASS: v3 provider errors, legacy gateway messages, safe bilingual diagnostics and publishable-key fallback.");
