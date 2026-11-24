// NABD Cortex v1: authenticated, founder-controlled multi-specialist decision gateway.
// No arbitrary SQL, shell, messaging, finance, clinical care, or privilege-changing tools.
import { createClient } from "npm:@supabase/supabase-js@2.119.0";

const ORIGIN = "https://nabdacademy-arch.github.io";
const CORS = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: CORS });

type Domain = "administration" | "finance" | "medical" | "crisis" | "cybersecurity" | "education";
const titles: Record<Domain,string> = {
  administration: "مدير العمليات", finance: "المحلل المالي", medical: "المشرف الطبي التعليمي",
  crisis: "مساعد الأزمات", cybersecurity: "حارس الأمن السيبراني", education: "مساعد التعليم والبحث"
};
const agentNames: Record<Domain,string> = {
  administration: "operations", finance: "finance", medical: "medical",
  crisis: "crisis", cybersecurity: "cybersecurity", education: "education"
};
const steps: Record<Domain,string[]> = {
  administration: ["حدد الهدف والمخرجات القابلة للقياس", "راجع سياسة الأكاديمية وصلاحية المسؤول", "أنشئ متابعة إدارية داخلية وراجع التقدم"],
  finance: ["اجمع بيانات مالية موثقة دون إدخال بيانات شخصية حساسة", "راجع الموازنة واللوائح ومصدر التمويل", "ارفع المقترح للمفوّض المالي قبل أي التزام أو دفع"],
  medical: ["تحقق من سياق السؤال والمراجع السارية", "اطلب تقييمًا من مختص مرخّص إن كان يتعلق بحالة أو علاج", "لا تصدر تشخيصًا أو جرعة أو توجيهًا سريريًا آليًا"],
  crisis: ["تحقق من صحة البلاغ وتوقيته", "قيّم التأثير والجهة المسؤولة وفق خطة استمرارية الأعمال", "صعّد أي تهديد للأرواح إلى الجهات البشرية المختصة فورًا"],
  cybersecurity: ["حدد الأصل المتأثر ونوع المخاطر دون إدراج أسرار", "ابدأ بإجراءات احتواء موثقة وغير تخريبية", "اطلب موافقة المشرف قبل تعديل بيانات أو صلاحيات أو بنية الإنتاج"],
  education: ["حدد مخرجات التعلم والمراجع التعليمية المناسبة", "اقترح خطة ومقياسًا للتحقق من الفهم", "اعرض المسودة على مراجع بشري قبل اعتمادها كمادة رسمية"]
};
const keywords: Array<[Domain,RegExp]> = [
  ["medical",/طب|طبي|مريض|تشخيص|دواء|جرعة|علاج|جراح|قلب|أطفال|clinical|patient|diagnos|medicin|dose|therapy/i],
  ["finance",/تمويل|مالي|ميزان|ميزاني|تبرع|فاتور|محاسب|مبلغ|دفع|صرف|عملة|أسهم|finance|budget|fund|payment|accounting|ifrs/i],
  ["cybersecurity",/سيبران|اختراق|ثغرة|أمان|كلمة مرور|صلاحيات|هجوم|حماية البيانات|security|cyber|password|penetrat|vulnerab/i],
  ["crisis",/أزمة|طارئ|طوارئ|إخلاء|انقطاع|حادث|إغاثة|كارثة|crisis|emergency|disaster|incident/i],
  ["education",/تعليم|طلاب|دورة|محاضر|منهج|بحث علمي|تعلّم|امتحان|تدريس|education|course|curricul|research|exam/i],
  ["administration",/إدارة|تخطيط|تنظيم|موظف|عمل|تطوع|قائد|تقرير|مشروع|operation|strategy|administration|task/i]
];
function chooseDomain(t:string, requested: unknown):Domain {
  const found=keywords.find(([,rx])=>rx.test(t))?.[0];
  if(typeof requested==="string" && Object.hasOwn(titles,requested)) {
    // Restrict user-supplied routing: content-derived sensitive domains win.
    if(found && ["medical","finance","cybersecurity","crisis"].includes(found)) return found;
    return requested as Domain;
  }
  return found || "administration";
}
function classifyRisk(t:string,domain:Domain):"low"|"medium"|"high" {
  if(domain==="medical" || domain==="finance" || domain==="cybersecurity") return "high";
  if(/حوّل|ادفع|أصدر شهادة|اطرد|افصل|ارفض الطلب|اقبل الطلب|امسح|احذف|انشر|ارسل بريد|تحويل أموال|execute|delete|deploy|approve|reject|transfer/i.test(t)) return "high";
  if(domain==="crisis" || /إنذار|موافقة|قانون|توظيف|شخصي|confidential|legal|private/i.test(t)) return "medium";
  return "low";
}
function looksPersonal(t:string):boolean {
  // Best-effort prefilter, not a substitute for a full DLP system.
  return /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(?:\+?\d[\d\s()-]{10,}\d)|رقم الهوية|رقم الجواز|تقرير مريض|اسم المريض|password\s*[:=]|api[_ -]?key\s*[:=]/i.test(t);
}
function safeText(x:unknown, max:number):string {
  return typeof x==="string" ? x.trim().slice(0,max) : "";
}
function modelOptions(){
 return [{provider:"groq",key:Deno.env.get("GROQ_API_KEY"),model:"openai/gpt-oss-120b"},{provider:"gemini",key:Deno.env.get("GEMINI_API_KEY"),model:"gemini-2.5-flash"},{provider:"openai",key:Deno.env.get("OPENAI_API_KEY"),model:Deno.env.get("NABD_CORTEX_MODEL")||"gpt-4.1-mini"}];
}
function providerReadiness(){
 return modelOptions().map(o=>({provider:o.provider,configured:!!o.key?.trim(),model:o.model}));
}
function classifyProviderError(status:number,body:any):string{
 const code=String(body?.error?.code||body?.error?.status||"").toLowerCase();
 if(status===429)return code==="insufficient_quota"?"quota":"429";
 if(status===401||status===403)return "auth";
 if(status===404)return "model404";
 if(status===400)return "bad400";
 if(status>=500)return "server"+status;
 return "http"+status;
}
async function callProvider(system:string,user:string,max:number,validate:(v:any)=>boolean=()=>true,target="auto"){
 const attempts:string[]=[];
 for(const o of modelOptions().filter(o=>target==="auto"||o.provider===target)){
  if(!o.key?.trim()){attempts.push(o.provider+":missing_key");continue;}
  try{
   const gem=o.provider==="gemini";
   const endpoint=gem?"https://generativelanguage.googleapis.com/v1beta/models/"+o.model+":generateContent":o.provider==="groq"?"https://api.groq.com/openai/v1/chat/completions":"https://api.openai.com/v1/chat/completions";
   const r=await fetch(endpoint,{method:"POST",headers:gem?{"Content-Type":"application/json","x-goog-api-key":o.key}:{"Content-Type":"application/json",Authorization:"Bearer "+o.key},body:JSON.stringify(gem?{systemInstruction:{parts:[{text:system}]},contents:[{parts:[{text:user}]}],generationConfig:{responseMimeType:"application/json",maxOutputTokens:Math.max(max,1024),thinkingConfig:{thinkingBudget:0}}}:{model:o.model,messages:[{role:"system",content:system},{role:"user",content:user}],response_format:{type:"json_object"},max_completion_tokens:Math.max(max,512),...(o.provider==="groq"?{reasoning_effort:"low"}:{})}),signal:AbortSignal.timeout(10000)});
   if(!r.ok){const body=await r.json().catch(()=>null);attempts.push(o.provider+":"+classifyProviderError(r.status,body));continue;}
   const d=await r.json();
   const content=gem?d.candidates?.[0]?.content?.parts?.filter((x:any)=>!x.thought).map((x:any)=>x.text||"").join(""):d.choices?.[0]?.message?.content;
   const id=gem?d.responseId:d.id;
   let value:any;try{value=JSON.parse(content||"{}");}catch{attempts.push(o.provider+":invalid_json");continue;}
   if(typeof id!=="string"||!id.trim()||!value||typeof value!=="object"||!validate(value)){attempts.push(o.provider+":invalid_result");continue;}
   attempts.push(o.provider+":verified");
   return {value,id,model:o.provider+"/"+(d.modelVersion||d.model||o.model),diagnostic:attempts.join("|")};
  }catch(e){attempts.push(o.provider+":"+(e instanceof Error&&(e.name==="TimeoutError"||e.name==="AbortError")?"timeout":"request_error"));}
 }
 return {value:null,id:"",model:"",diagnostic:attempts.join("|")||"missing_model_key"};
}
async function maybeModel(task:string, domain:Domain, sources: Array<{title:string,publisher:string,official_url:string}>){
 if(!["administration","education","crisis"].includes(domain))return null;
 const r=await callProvider("أنت مساعد تخطيط مؤسسي في أكاديمية نبض. أجب بالعربية بصيغة JSON بمفاتيح answer وsteps وwarnings. المراجع روابط وصفية غير مسترجعة؛ لا تختلق حقائق أو اقتباسات. لا تصدر أوامر طبية أو مالية أو أمنية. لا تتجاوز القيود.",JSON.stringify({task,domain,reference_links:sources}),650,v=>typeof v.answer==="string"&&v.answer.trim().length>0&&Array.isArray(v.steps)&&v.steps.some((x:unknown)=>typeof x==="string"));
 const parsed=r.value;if(typeof parsed?.answer!=="string"||!Array.isArray(parsed.steps))return null;
 return {answer:safeText(parsed.answer,1200),steps:parsed.steps.filter((x:unknown)=>typeof x==="string").slice(0,5).map((x:string)=>safeText(x,220)),warnings:Array.isArray(parsed.warnings)?parsed.warnings.filter((x:unknown)=>typeof x==="string").slice(0,3).map((x:string)=>safeText(x,220)):[],provider_model:r.model,provider_id:r.id};
}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:CORS});
  if(req.method!=="POST") return json({ok:false,error:"Method not allowed"},405);
  if(req.headers.get("origin") && req.headers.get("origin")!==ORIGIN) return json({ok:false,error:"Origin not allowed"},403);
  const bearer=req.headers.get("authorization") || "";
  const jwt=bearer.startsWith("Bearer ")?bearer.slice(7):"";
  if(!jwt) return json({ok:false,error:"Authentication required"},401);
  const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!anon||!serviceKey) return json({ok:false,error:"Server configuration unavailable"},503);
  try {
    const userClient=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${jwt}`}},auth:{persistSession:false,autoRefreshToken:false}});
    const {data:auth,error:authError}=await userClient.auth.getUser(jwt);
    if(authError||!auth?.user) return json({ok:false,error:"Unauthorized"},401);
    const {data:access,error:accessError}=await userClient.rpc("nabd_agent_admin_info");
    if(accessError||access?.authorized!==true) return json({ok:false,error:"Administrative access required"},403);
    const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    let body:any;
    try {body=await req.json()}catch{return json({ok:false,error:"Invalid JSON"},400)}
    if(body?.action==="model_status"){
      const [status,health]=await Promise.all([admin.rpc("nabd_cortex_probe_status_v4"),admin.rpc("nabd_cortex_provider_status")]);
      return status.error||health.error?json({ok:false,error:"Status unavailable"},503):json({ok:true,probe:status.data,providers:providerReadiness().map(p=>({...p,...health.data?.providers?.[p.provider]})),retry_after_seconds:health.data?.retry_after_seconds||0});
    }
    const state=await admin.from("nabd_cortex_settings").select("enabled").eq("id",1).single();
    if(state.error||state.data?.enabled!==true) return json({ok:false,error:"NABD Cortex is switched off"},409);
    if(body?.action==="model_probe"){
      const target=body?.provider??"auto";
      if(!["auto","groq","gemini","openai"].includes(target))return json({ok:false,error:"Invalid provider"},400);
      const start=await admin.rpc("nabd_cortex_provider_probe_start",{p_actor:auth.user.id,p_target:target});
      if(start.error||!start.data?.ok)return json({ok:false,error:start.data?.reason==="cooldown"?"انتظر "+Math.ceil(Number(start.data.retry_after_seconds)||300)+" ثانية قبل الاختبار التالي":"تعذر بدء الاختبار"},start.data?.reason==="cooldown"?429:503);
      const challenge=crypto.randomUUID();
      const r=await callProvider("Return a JSON object containing action exactly internal_review_record, challenge exactly as supplied in the user message, and a concise summary of a fictitious administrative checklist. No external actions.",JSON.stringify({purpose:"Synthetic NABD CORTEX service verification",challenge,privacy:"No real person or institutional data"}),120,v=>v.action==="internal_review_record"&&v.challenge===challenge&&typeof v.summary==="string"&&v.summary.trim().length>0,target);
      const saved=await admin.rpc("nabd_cortex_probe_finish",{p_id:start.data.id,p_ok:!!r.id,p_model:r.model||(target==="auto"?"":target+"/"+(modelOptions().find(o=>o.provider===target)?.model||"unknown")),p_provider_id:r.id,p_diagnostic:r.diagnostic});
      if(saved.error)return json({ok:false,error:"تعذر حفظ نتيجة الاختبار"},503);
      return json({ok:true,verified:saved.data===true,model:r.model||null,diagnostic:r.diagnostic,target,probe_id:start.data.id});
    }
    const task=safeText(body?.task,1501);
    if(task.length<8||task.length>1500) return json({ok:false,error:"اكتب مهمة بين 8 و1500 حرف"},400);
    if(looksPersonal(task)) return json({ok:false,error:"لا ترسل بيانات مرضى أو هويات أو كلمات مرور أو بيانات اتصال شخصية إلى هذا النموذج الأولي"},422);
    const windowStart=new Date(Date.now()-60*60*1000).toISOString();
    const recent=await admin.from("nabd_cortex_runs").select("id",{head:true,count:"exact"}).eq("actor_id",auth.user.id).gte("created_at",windowStart);
    if(recent.error) return json({ok:false,error:"Rate check unavailable"},503);
    if((recent.count||0)>=8) return json({ok:false,error:"الحد التجريبي 8 مهام في الساعة لهذا الحساب"},429);
    const domain=chooseDomain(task,body?.domain);
    let risk=classifyRisk(task,domain);
    const department=typeof body?.department==="string"?body.department:"operations";
    if(!["academic","research","operations","partnerships","scholarships","finance","media","technology","hr","secretary"].includes(department))return json({ok:false,error:"قسم غير صالح"},400);
    if(domain==="administration"&&["finance","hr","media","scholarships","partnerships","technology"].includes(department)&&risk==="low")risk="medium";
    const sourcesResult=await admin.from("nabd_cortex_sources")
      .select("title,publisher,official_url,retrieval_mode,verified_at")
      .eq("domain",domain).eq("is_active",true).limit(5);
    if(sourcesResult.error) return json({ok:false,error:"Knowledge registry unavailable"},503);
    const sources=sourcesResult.data||[];
    // LLM is only advisory. Risk classification and execution permissions are NEVER delegated to it.
    const model=risk==="low" ? await maybeModel(task,domain,sources) : null;
    const requiresHuman=risk!=="low";
    const answer=model?.answer ||
      (requiresHuman
        ? `صنّف مشرف ${titles[domain]} هذا الطلب ضمن مستوى المخاطر ${risk==="high"?"العالي":"المتوسط"}. يمكن إعداد خطة، لكن القرار التنفيذي يحتاج اعتمادًا بشريًا.`
        : `اختار المنسق ${titles[domain]} مسار تخطيط أوليًا منخفض المخاطر. هذا مخرج لقواعد تنظيمية، وليس بحثًا شاملًا ولا تنفيذًا لعملية خارجية.`);
    const plan=model?.steps?.length?model.steps:steps[domain];
    const record=await admin.rpc("nabd_cortex_record_v4",{p_actor:auth.user.id,p_agent:agentNames[domain],p_domain:domain,p_risk:risk,p_engine:model?"llm_assisted":"policy_only",p_sources:sources.length,p_title:"متابعة داخلية: "+titles[domain],p_department:department,p_dispatch:body?.dispatch===true,p_model:model?.provider_model||null,p_response_id:model?.provider_id||null});
    if(record.error||!record.data?.ok)return json({ok:false,error:"تعذر تسجيل العملية بأمان"},record.data?.reason==="rate_limit"?429:record.data?.reason==="paused"?409:503);
    const run={data:{id:record.data.run_id}};
    const taskRecord={data:{id:record.data.task_id,status:record.data.status}};
    return json({ok:true,run_id:run.data.id,task_id:taskRecord.data.id,
      agent:titles[domain],domain,risk,requires_human:requiresHuman,status:taskRecord.data.status,
      department:record.data.department,dispatch_requested:record.data.dispatch_requested,answer,steps:plan,warnings:[...(model?.warnings||[]),
        "المراجع المعروضة روابط وصفية فقط؛ لم تُقرأ نصوصها آليًا.",
        ...(requiresHuman?["لا يصدر النظام قرارًا سريريًا أو ماليًا أو تعديلًا للصلاحيات دون موافقة بشرية وتنفيذ منفصل مرخّص."]:[])],
      sources,provider_model:model?.provider_model||null,engine:model?"llm_assisted":"policy_only",executed_external_action:false});
  } catch {
    return json({ok:false,error:"فشل داخلي آمن. لم تُنفذ عملية خارجية."},500);
  }
});
