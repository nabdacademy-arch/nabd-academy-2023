import { createClient } from "npm:@supabase/supabase-js@2.119.0";
const out=(status:number)=>new Response(JSON.stringify({accepted:status===200}),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
async function callProvider(system:string,user:string,max:number){
 const options=[{provider:"groq",key:Deno.env.get("GROQ_API_KEY"),model:"openai/gpt-oss-120b"},{provider:"gemini",key:Deno.env.get("GEMINI_API_KEY"),model:"gemini-2.5-flash"},{provider:"openai",key:Deno.env.get("OPENAI_API_KEY"),model:Deno.env.get("NABD_CORTEX_MODEL")||"gpt-4.1-mini"}];
 let diagnostic="missing_model_key";
 for(const o of options){if(!o.key)continue;try{
 const gem=o.provider==="gemini";
 const endpoint=gem?"https://generativelanguage.googleapis.com/v1beta/models/"+o.model+":generateContent":o.provider==="groq"?"https://api.groq.com/openai/v1/chat/completions":"https://api.openai.com/v1/chat/completions";
 const r=await fetch(endpoint,{method:"POST",headers:gem?{"Content-Type":"application/json","x-goog-api-key":o.key}:{"Content-Type":"application/json",Authorization:"Bearer "+o.key},body:JSON.stringify(gem?{systemInstruction:{parts:[{text:system}]},contents:[{parts:[{text:user}]}],generationConfig:{responseMimeType:"application/json",maxOutputTokens:Math.max(max,1024),thinkingConfig:{thinkingBudget:0}}}:{model:o.model,messages:[{role:"system",content:system},{role:"user",content:user}],response_format:{type:"json_object"},max_completion_tokens:Math.max(max,512),...(o.provider==="groq"?{reasoning_effort:"low"}:{})}),signal:AbortSignal.timeout(10000)});
 diagnostic=o.provider+"_http_"+r.status;if(!r.ok)continue;
 const d=await r.json();const content=gem?d.candidates?.[0]?.content?.parts?.filter((x:any)=>!x.thought).map((x:any)=>x.text||"").join(""):d.choices?.[0]?.message?.content;
 const id=gem?d.responseId:d.id;const value=JSON.parse(content||"{}");if(!id||!value||typeof value!=="object"){diagnostic=o.provider+"_invalid_response";continue;}
 return {value,id:String(id),model:o.provider+"/"+(d.modelVersion||d.model||o.model),diagnostic:"verified_model_response"};
 }catch{diagnostic=o.provider+"_request_or_parse_failed";}}
 return {value:null,id:"",model:"",diagnostic};
}

Deno.serve(async(req)=>{
 if(req.method!=="POST")return out(405);
 const id=req.headers.get("x-probe-id")||"", token=req.headers.get("x-probe-token")||"";
 if(!/^[0-9a-f-]{36}$/i.test(id)||token.length!==72)return out(401);
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!key)return out(503);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const claimed=await db.rpc("nabd_cortex_probe_claim",{p_id:id,p_token:token});
 if(claimed.error||claimed.data!==true)return out(403);
 const r=await callProvider("Return JSON with action set to internal_review_record and summary describing a synthetic administrative review. No personal data or external actions.","Synthetic NABD service verification: review a fictitious training checklist.",120);
 const ok=!!r.id&&r.value?.action==="internal_review_record"&&typeof r.value?.summary==="string"&&r.value.summary.length>0;
 const model=r.model,provider=r.id,diagnostic=ok?r.diagnostic:r.value?"invalid_model_response":r.diagnostic;
 const saved=await db.rpc("nabd_cortex_probe_finish",{p_id:id,p_ok:ok,p_model:model,p_provider_id:provider,p_diagnostic:diagnostic});
 return out(saved.error?503:200);
});