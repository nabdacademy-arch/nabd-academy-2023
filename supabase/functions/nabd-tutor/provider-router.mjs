// NABD AI Tutor v3: free-tier-capable, server-side provider router.
// Groq hosts an open-weight 120B model; Gemini provides educational image support.
// Keys are read ONLY from Edge Function Secrets, never from browser content.
const GROQ_ENDPOINT="https://api.groq.com/openai/v1/chat/completions";
const GEMINI_ENDPOINT="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const MODELS={groq:"openai/gpt-oss-120b",gemini:"gemini-2.5-flash"};
const BILLING_CODES=new Set([
 "insufficient_quota","billing_hard_limit_reached","billing_not_active",
 "usage_limit_reached","credit_balance_exhausted","project_spend_limit_exceeded",
 "organization_spend_limit_exceeded"
]);

function classify(status,upstreamCode=""){
 if(status===401)return {code:"PROVIDER_KEY_INVALID",status:502,retry:false};
 if(status===403)return {code:"PROVIDER_PERMISSION_DENIED",status:502,retry:false};
 if(status===404||upstreamCode==="model_not_found")return {code:"PROVIDER_MODEL_UNAVAILABLE",status:502,retry:true};
 if(status===429){
  if(BILLING_CODES.has(upstreamCode))return {code:"PROVIDER_QUOTA_EXHAUSTED",status:503,retry:true};
  return {code:"PROVIDER_RATE_LIMIT",status:429,retry:true};
 }
 if(status===400||status===422)return {code:"PROVIDER_REQUEST_REJECTED",status:502,retry:false};
 if(status>=500&&status<=599)return {code:"PROVIDER_UPSTREAM_ERROR",status:502,retry:true};
 return {code:"PROVIDER_HTTP_ERROR",status:502,retry:false};
}
function statusReport(provider,category,upstreamStatus=null){
 // No raw provider body, prompt, Authorization header, API key or personal data.
 console.warn("[nabd-tutor:v3] provider_issue",{provider,category,upstream_status:upstreamStatus});
}
function getConfiguredRoutes(env,hasImage){
 const keys={
  groq:String(env("GROQ_API_KEY")||"").trim(),
  gemini:String(env("GEMINI_API_KEY")||"").trim()
 };
 if(hasImage)return keys.gemini?[{name:"gemini",key:keys.gemini}]:[];
 const preferred=env("NABD_TUTOR_PRIMARY")==="gemini"?"gemini":"groq";
 const order=preferred==="groq"?["groq","gemini"]:["gemini","groq"];
 return order.filter(p=>keys[p]).map(name=>({name,key:keys[name]}));
}
function makeCall(route,{question,image,system,signal}){
 if(route.name==="groq"){
  const body={
   model:MODELS.groq,
   messages:[{role:"system",content:system},{role:"user",content:question}],
   reasoning_effort:"medium",reasoning_format:"hidden",
   max_completion_tokens:2400,temperature:0.4,stream:false
  };
  return {
   url:GROQ_ENDPOINT,
   init:{method:"POST",headers:{"Authorization":"Bearer "+route.key,"Content-Type":"application/json"},
    body:JSON.stringify(body),signal}
  };
 }
 const parts=[{text:question}];
 if(image){
  const comma=image.indexOf(",");
  const mime=image.startsWith("data:image/png;")?"image/png":"image/jpeg";
  parts.push({inline_data:{mime_type:mime,data:image.slice(comma+1)}});
 }
 const body={
  systemInstruction:{parts:[{text:system}]},
  contents:[{role:"user",parts}],
  generationConfig:{maxOutputTokens:2200,temperature:0.35,thinkingConfig:{thinkingBudget:512}}
 };
 return {
  url:GEMINI_ENDPOINT,
  init:{method:"POST",headers:{"x-goog-api-key":route.key,"Content-Type":"application/json"},
   body:JSON.stringify(body),signal}
 };
}
function answerFrom(body,provider){
 if(provider==="groq")return typeof body?.choices?.[0]?.message?.content==="string"?body.choices[0].message.content:"";
 return (body?.candidates?.[0]?.content?.parts||[]).filter(part=>typeof part?.text==="string"&&!part?.thought).map(part=>part.text).join("\n");
}
async function attempt(route,params,fetcher){
 try{
  const request=makeCall(route,params);
  const response=await fetcher(request.url,request.init);
  if(!response.ok){
   let upstreamCode="";
   try{
    const body=await response.json();
    const err=body?.error;
    const str=err?.code||err?.status;
    if(typeof str==="string"&&str.length<110)upstreamCode=str;
   }catch{}
   const c=classify(response.status,upstreamCode);
   statusReport(route.name,c.code,response.status);
   return {ok:false,code:c.code,status:c.status,upstream_status:response.status,retry:c.retry,provider:route.name};
  }
  let body;
  try{body=await response.json();}
  catch{
   statusReport(route.name,"PROVIDER_INVALID_RESPONSE",response.status);
   return {ok:false,code:"PROVIDER_INVALID_RESPONSE",status:502,retry:true,provider:route.name};
  }
  if(route.name==="gemini"&&(body?.promptFeedback?.blockReason||body?.candidates?.[0]?.finishReason==="SAFETY")){
   statusReport(route.name,"PROVIDER_SAFETY_BLOCK");
   return {ok:false,code:"PROVIDER_SAFETY_BLOCK",status:422,retry:false,provider:route.name};
  }
  const answer=answerFrom(body,route.name).trim();
  if(!answer){
   statusReport(route.name,"EMPTY_RESPONSE");
   return {ok:false,code:"EMPTY_RESPONSE",status:502,retry:true,provider:route.name};
  }
  return {ok:true,answer:answer.slice(0,14000),provider:route.name,model:MODELS[route.name]};
 }catch(error){
  const timedOut=error?.name==="TimeoutError"||error?.name==="AbortError";
  const code=timedOut?"REQUEST_TIMEOUT":"PROVIDER_CONNECTION_ERROR";
  statusReport(route.name,code);
  return {ok:false,code,status:timedOut?504:502,retry:!timedOut||params.signal?.aborted!==true,provider:route.name};
 }
}
/** One student quota hit can route to at most two configured backends. */
export async function generateWithFreeProviders({env,fetcher,signal,question,image,system}){
 const routes=getConfiguredRoutes(env,Boolean(image));
 if(!routes.length)return {ok:false,code:image?"IMAGE_PROVIDER_UNAVAILABLE":"CONFIG_MISSING",status:503};
 let last={ok:false,code:"PROVIDER_UNAVAILABLE",status:502};
 for(let i=0;i<routes.length;i++){
  const outcome=await attempt(routes[i],{question,image,system,signal},fetcher);
  if(outcome.ok)return outcome;
  last=outcome;
  if(!outcome.retry||signal?.aborted)break;
  if(i<routes.length-1)console.warn("[nabd-tutor:v3] switching_backend",{from:routes[i].name,to:routes[i+1].name,reason:outcome.code});
 }
 return last;
}
