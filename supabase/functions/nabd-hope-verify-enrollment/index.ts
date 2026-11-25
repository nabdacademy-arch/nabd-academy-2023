import {createClient} from "jsr:@supabase/supabase-js@2";
const origin="https://nabdacademy-arch.github.io",bucket="nabd-hope-enrollment-private",max=1048576;
const headers={"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8","Vary":"Origin","X-Content-Type-Options":"nosniff"};
const json=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers});
const env=(n:string)=>Deno.env.get(n)||"";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function readBounded(req:Request){
 const reader=req.body?.getReader();if(!reader)throw Error("EMPTY");let size=0;const chunks:Uint8Array[]=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max+16384){await reader.cancel();throw Error("SIZE");}chunks.push(value);}}
 finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 return new Response(bytes,{headers:{"content-type":req.headers.get("content-type")||""}}).formData();
}
function kindOf(b:Uint8Array){
 if(b.length>=8&&b[0]===37&&b[1]===80&&b[2]===68&&b[3]===70&&b[4]===45)return ["application/pdf","pdf"];
 if(b.length>=8&&b[0]===255&&b[1]===216&&b[2]===255)return ["image/jpeg","jpg"];
 if(b.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v))return ["image/png","png"];
 return null;
}
Deno.serve(async req=>{
 if(req.headers.get("Origin")&&req.headers.get("Origin")!==origin)return json({error:"ORIGIN_FORBIDDEN"},403);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return json({error:"METHOD_NOT_ALLOWED"},405);
 if(!req.headers.get("content-type")?.startsWith("multipart/form-data;"))return json({error:"INVALID_INPUT"},400);
 let f:FormData;try{f=await readBounded(req);}catch{return json({error:"FILE_LIMIT_OR_INVALID"},400);}
 const get=(k:string)=>typeof f.get(k)==="string"?String(f.get(k)).trim():"";
 const code=get("code"),email=get("email").toLowerCase(),captcha=get("captcha"),kind=get("kind"),issuer=get("issuer").toUpperCase(),number=get("number").toUpperCase(),file=f.get("document");
 if(!uuid.test(code)||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||captcha.length<1||captcha.length>2048||!["national_id","passport"].includes(kind)||!/^[A-Z]{2}$/.test(issuer)||!/^[A-Z0-9]{5,20}$/.test(number)||(kind==="national_id"&&issuer==="PS"&&!/^[0-9]{9}$/.test(number))||get("consent")!=="yes"||!(file instanceof File)||file.size<1||file.size>max)return json({error:"INVALID_INPUT"},400);
 const bytes=new Uint8Array(await file.arrayBuffer()),type=kindOf(bytes);if(!type||type[0]!==file.type)return json({error:"FILE_TYPE"},400);
 let secret=env("SUPABASE_SERVICE_ROLE_KEY");if(!secret)try{secret=JSON.parse(env("SUPABASE_SECRET_KEYS")||"{}").default||""}catch{}
 if(!secret||!env("SUPABASE_URL")||!env("TURNSTILE_SECRET_KEY"))return json({error:"SERVICE_UNAVAILABLE"},503);
 try{
  const r=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:new URLSearchParams({secret:env("TURNSTILE_SECRET_KEY"),response:captcha}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)return json({error:"CAPTCHA_FAILED"},403);const d=await r.json();
  if(d.success!==true||d.hostname!=="nabdacademy-arch.github.io"||d.action!=="hope_verify")return json({error:"CAPTCHA_FAILED"},403);
  const db=createClient(env("SUPABASE_URL"),secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const prep=await db.rpc("nabd_hope_verification_prepare",{p_code:code,p_email:email});
  if(prep.error)return json({error:"SERVICE_UNAVAILABLE"},503);
  if(prep.data?.found!==true)return json({error:"NOT_FOUND"},404);
  if(prep.data?.can_upload!==true)return json({error:"ALREADY_SUBMITTED"},409);
  const id=prep.data.application_id;if(typeof id!=="string"||!/^[0-9a-f-]{36}$/.test(id))return json({error:"SERVICE_UNAVAILABLE"},503);
  const path=id+"/"+crypto.randomUUID()+"."+type[1],storage=db.storage.from(bucket);
  const upload=await storage.upload(path,bytes,{contentType:type[0],cacheControl:"0",upsert:false});
  if(upload.error)return json({error:"STORAGE_UNAVAILABLE"},503);
  const save=await db.rpc("nabd_hope_verification_save",{p_code:code,p_email:email,p_kind:kind,p_issuer:issuer,p_number:number,p_path:path,p_mime:type[0],p_bytes:bytes.length});
  // If the RPC response is ambiguous, do not remove a file that might already be linked.
  if(save.error)return json({error:"SAVE_UNCONFIRMED"},503);
  if(save.data?.ok!==true){await storage.remove([path]);return json({error:save.data?.error||"SERVICE_UNAVAILABLE"},409);}
  if(typeof save.data.old_path==="string"&&save.data.old_path!==path)await storage.remove([save.data.old_path]);
  return json({ok:true,state:"submitted"});
 }catch{return json({error:"SERVICE_UNAVAILABLE"},503);}
});