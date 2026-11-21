/** Public, read-only QR verification for NABD council memberships.
 * A 128-bit random token is required. Public results contain no email, account ID or secrets.
 * Membership validity is checked live, so suspension instantly invalidates a card.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
const URL=Deno.env.get("SUPABASE_URL")||"";
const KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const ORIGIN="https://nabdacademy-arch.github.io";
const responseHeaders={
 "Access-Control-Allow-Origin":ORIGIN,
 "Access-Control-Allow-Headers":"content-type, apikey, authorization, x-client-info",
 "Access-Control-Allow-Methods":"POST, OPTIONS",
 "Content-Type":"application/json; charset=utf-8",
 "Cache-Control":"no-store",
 "Vary":"Origin",
 "X-Content-Type-Options":"nosniff"
};
const send=(body:Record<string,unknown>,status=200)=>
  new Response(JSON.stringify(body),{status,headers:responseHeaders});
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const db=URL&&KEY?createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}}):null;
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:responseHeaders});
 if(req.method!=="POST")return send({status:"invalid_request"},405);
 if(req.headers.get("origin") && req.headers.get("origin")!==ORIGIN) return send({status:"forbidden"},403);
 if(Number(req.headers.get("content-length")||"0")>1024)return send({status:"invalid_request"},413);
 let body:Record<string,unknown>;
 try{const raw=await req.json();body=raw && typeof raw==="object" && !Array.isArray(raw)?raw:{};}
 catch{return send({status:"invalid_request"},400);}
 const token=String(body.token||"");
 if(!UUID.test(token))return send({status:"invalid"});
 if(!db)return send({status:"unavailable"},503);
 try{
  const {data:membership,error}=await db.from("nabd_council_memberships")
   .select("user_id,council_code,member_code,position,active,appointed_at")
   .eq("verify_token",token).maybeSingle();
  if(error){console.error("nabd council verifier database query failed");return send({status:"unavailable"},503);}
  if(!membership)return send({status:"invalid"});
  if(!membership.active)return send({status:"inactive",member_code:membership.member_code});
  const {data:profile,error:profileError}=await db.from("profiles")
   .select("full_name").eq("id",membership.user_id).maybeSingle();
  if(profileError||!profile){return send({status:"unavailable"},503);}
  return send({status:"valid",
   member_code:membership.member_code,
   full_name:profile.full_name||"—",
   council_code:membership.council_code,
   position:membership.position,
   appointed_at:membership.appointed_at
  });
 }catch{return send({status:"unavailable"},503);}
});
