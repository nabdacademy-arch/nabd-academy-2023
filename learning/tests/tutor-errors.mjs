import assert from 'node:assert/strict';
import {tutorFailure,tutorFailureText} from '../core.mjs';
import {handleTutor} from '../../supabase/functions/nabd-tutor/index.ts';
const http=(status,body)=>({error:{name:'FunctionsHttpError',context:Response.json(body,{status})}});
for(const [status,body,code] of [
 [401,{code:401,message:'Invalid JWT'},'GATEWAY_INVALID_JWT'],
 [404,{code:'NOT_FOUND',message:'Requested function was not found'},'FUNCTION_NOT_FOUND'],
 [503,{error:'Tutor service has not been activated'},'CONFIG_MISSING'],
 [503,{error:'Tutor quota database is unavailable'},'QUOTA_DATABASE_UNAVAILABLE'],
 [429,{error:'Please wait before asking another question'},'TUTOR_RATE_LIMIT'],
 [502,{error:'Tutor provider unavailable'},'PROVIDER_UNAVAILABLE'],
 [503,{code:'PROVIDER_QUOTA_EXHAUSTED',error:'ignored'},'PROVIDER_QUOTA_EXHAUSTED'],
 [502,{code:'PROVIDER_KEY_INVALID',message:'sk-private-example <img src=x>'},'PROVIDER_KEY_INVALID'],
 [500,{code:'<img src=x>',error:'sk-private-example'},'EDGE_FUNCTION_ERROR'],
 [400,{error:'toString'},'UNKNOWN_ERROR']
]){
 const failure=await tutorFailure(http(status,body));assert.deepEqual(failure,{code,status});
 for(const language of ['ar','en']){const text=tutorFailureText(failure,language);assert(text.includes(code));assert(text.includes('HTTP '+status));assert(!text.includes('sk-private-example'));assert(!text.includes('<img'))}
}
assert.equal((await tutorFailure({error:{name:'FunctionsFetchError'}})).code,'NETWORK_OR_CORS_ERROR');
assert.equal((await tutorFailure({data:{}})).code,'EMPTY_RESPONSE');
assert(!tutorFailureText({code:'sk-private-example',status:'private'},'ar').includes('sk-private'));
const env=name=>({SUPABASE_URL:'https://academy.test',SUPABASE_ANON_KEY:'legacy-public',OPENAI_API_KEY:'provider-test'}[name]);
const request=()=>new Request('https://edge.test/nabd-tutor',{method:'POST',headers:{Authorization:'Bearer student','Content-Type':'application/json',Origin:'https://nabdacademy-arch.github.io'},body:JSON.stringify({question:'Explain circulation'})});
function fetcher(providerStatus=200,providerCode='',keys=[]){return async(url,options)=>{
 if(url.endsWith('/auth/v1/user')){keys.push(options.headers.apikey);return Response.json({id:'student'})}
 if(url.endsWith('take_tutor_slot')){keys.push(options.headers.apikey);return Response.json(true)}
 if(url==='https://api.openai.com/v1/responses')return providerStatus===200?Response.json({output:[{content:[{type:'output_text',text:'Explanation'}]}]}):Response.json({error:{code:providerCode,message:'sk-private-example should never be exposed'}},{status:providerStatus});
 throw Error('Unexpected request');
}}
for(const [status,providerCode,expectedStatus,expectedCode] of [
 [401,'invalid_api_key',502,'PROVIDER_KEY_INVALID'],[403,'permission_denied',502,'PROVIDER_PERMISSION_DENIED'],
 [429,'insufficient_quota',503,'PROVIDER_QUOTA_EXHAUSTED'],[429,'rate_limit_exceeded',429,'PROVIDER_RATE_LIMIT'],
 [404,'model_not_found',502,'PROVIDER_MODEL_UNAVAILABLE'],[400,'bad_request',502,'PROVIDER_REQUEST_REJECTED'],[500,'unknown',502,'PROVIDER_UNAVAILABLE']
]){const response=await handleTutor(request(),env,fetcher(status,providerCode));assert.equal(response.status,expectedStatus);const body=await response.json();assert.equal(body.code,expectedCode);assert(!JSON.stringify(body).includes('sk-private-example'))}
const keys=[];const modern=name=>name==='SUPABASE_PUBLISHABLE_KEYS'?JSON.stringify({default:'sb_publishable_new'}):env(name);
assert.equal((await handleTutor(request(),modern,fetcher(200,'',keys))).status,200);assert.deepEqual(keys,['sb_publishable_new','sb_publishable_new']);
const fallback=[];assert.equal((await handleTutor(request(),name=>name==='SUPABASE_PUBLISHABLE_KEYS'?'invalid JSON':env(name),fetcher(200,'',fallback))).status,200);assert.deepEqual(fallback,['legacy-public','legacy-public']);
const timeout=await handleTutor(request(),env,async()=>{throw new DOMException('private','TimeoutError')});assert.equal(timeout.status,504);assert.equal((await timeout.json()).code,'REQUEST_TIMEOUT');
console.log('PASS: gateway/legacy/structured diagnostics, safe bilingual support messages, prototype-like inputs, provider failure classification, publishable-key preference and legacy fallback, timeout. All requests mocked.');
