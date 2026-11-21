/* Public QR verification for institutional documents. Never returns a person's name
 * or protected document contents. QR is a random, opaque token.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
const URL=Deno.env.get("SUPABASE_URL")||"";
const KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const ORIGIN="https://nabdacademy-arch.github.io";
const cors={"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"apikey,authorization,content-type,x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8","Vary":"Origin","X-Content-Type-Options":"nosniff"};
const reply=(body:Record<string,unknown>,code=200)=>new Response(JSON.stringify(body),{status:code,headers:cors});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const db=URL&&KEY?createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}}):null;
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="POST")return reply({status:"invalid"},405);
 if(req.headers.get("origin")&&req.headers.get("origin")!==ORIGIN)return reply({status:"forbidden"},403);
 if(Number(req.headers.get("content-length")||0)>1000)return reply({status:"invalid"},413);
 let token="";
 try{const b=await req.json();token=typeof b?.token==="string"?b.token:"";}catch{return reply({status:"invalid"},400);}
 if(!uuid.test(token))return reply({status:"invalid"});
 if(!db)return reply({status:"unavailable"},503);
 try{
  const {data,error}=await db.from("nabd_official_documents")
    .select("id,doc_type,status,issued_at").eq("verify_token",token).maybeSingle();
  if(error)return reply({status:"unavailable"},503);
  if(!data)return reply({status:"invalid"});
  const result={status:data.status==="issued"?"valid":"void",number:"NABD-DOC-"+String(data.id).padStart(7,"0"),type:data.doc_type,issued_at:data.issued_at};
  return reply(result);
 }catch{return reply({status:"unavailable"},503);}
});
