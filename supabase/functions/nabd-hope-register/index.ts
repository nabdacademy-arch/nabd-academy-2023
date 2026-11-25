import {createClient} from "jsr:@supabase/supabase-js@2";
const origin="https://nabdacademy-arch.github.io";
const headers={"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info,x-supabase-api-version","Access-Control-Allow-Methods":"POST,OPTIONS","Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8","Vary":"Origin","X-Content-Type-Options":"nosniff"};
const json=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers});
const env=(n:string)=>Deno.env.get(n)||"";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const str=(v:any,min:number,max:number)=>typeof v==="string"&&v.trim().length>=min&&v.trim().length<=max;
async function captcha(token:string,action:string){
 if(!env("TURNSTILE_SECRET_KEY"))return false;
 const r=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:new URLSearchParams({secret:env("TURNSTILE_SECRET_KEY"),response:token}),signal:AbortSignal.timeout(10000)});
 if(!r.ok)return false;const d=await r.json();return d.success===true&&d.hostname==="nabdacademy-arch.github.io"&&d.action===action;
}
Deno.serve(async req=>{
 if(req.headers.get("Origin")&&req.headers.get("Origin")!==origin)return json({error:"ORIGIN_FORBIDDEN"},403);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return json({error:"METHOD_NOT_ALLOWED"},405);
 let b:any;try{const raw=await req.text();if(raw.length>12000)return json({error:"INVALID_INPUT"},400);b=JSON.parse(raw)}catch{return json({error:"INVALID_INPUT"},400)}
 if(!["submit","lookup"].includes(b?.action)||!uuid.test(b?.code||"")||!str(b?.email,5,254)||!str(b?.captcha,1,2048))return json({error:"INVALID_INPUT"},400);
 const email=b.email.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:"INVALID_INPUT"},400);
 if(b.action==="submit"&&(!str(b.name,3,150)||!str(b.phone,7,16)||!/^\+?[0-9]{7,15}$/.test(b.phone)||!str(b.institution,2,160)||!str(b.field,2,120)||!["north_gaza","gaza","middle","khan_younis","rafah"].includes(b.governorate)||!["prospective","year1","year2","year3","year4","year5plus","other"].includes(b.stage)||!Array.isArray(b.support)||b.support.length<1||b.support.length>5||new Set(b.support).size!==b.support.length||b.support.some((x:any)=>!["tuition","transport","device","internet","supplies"].includes(x))||b.consent!==true))return json({error:"INVALID_INPUT"},400);
 let secret=env("SUPABASE_SERVICE_ROLE_KEY");if(!secret)try{secret=JSON.parse(env("SUPABASE_SECRET_KEYS")||"{}").default||""}catch{}
 if(!secret||!env("SUPABASE_URL")||!env("TURNSTILE_SECRET_KEY"))return json({error:"SERVICE_UNAVAILABLE"},503);
 try{
  if(!await captcha(b.captcha,b.action==="submit"?"hope_submit":"hope_lookup"))return json({error:"CAPTCHA_FAILED"},403);
  const db=createClient(env("SUPABASE_URL"),secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const call=b.action==="lookup"?await db.rpc("nabd_hope_lookup_v1",{p_code:b.code,p_email:email}):await db.rpc("nabd_hope_submit_v1",{p_code:b.code,p_name:b.name.trim(),p_email:email,p_phone:b.phone,p_governorate:b.governorate,p_institution:b.institution.trim(),p_field:b.field.trim(),p_stage:b.stage,p_support:b.support,p_consent:true});
  if(call.error)return json({error:"SERVICE_UNAVAILABLE"},503);
  return json(call.data);
 }catch{return json({error:"SERVICE_UNAVAILABLE"},503);}
});