/**
 * NABD Councils — director-only account provisioning.
 * Every call checks a fresh Supabase Auth user and their server-side admin role.
 * No service-role credentials or passwords are returned to the browser.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ALLOWED_ORIGIN = "https://nabdacademy-arch.github.io";
const codes = new Set(["trustees","academic","research","students","international","quality","digital","humanitarian"]);
const positions = new Set(["member","chair","vice_chair","secretary"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cors = {
  "Access-Control-Allow-Origin":ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Vary":"Origin",
  "Cache-Control":"no-store",
  "Content-Type":"application/json; charset=utf-8"
};
function reply(body: Record<string,unknown>, status=200) {
  return new Response(JSON.stringify(body),{status,headers:cors});
}
function fail(message:string,status=400){return reply({error:message},status);}
function councilPosition(body:Record<string,unknown>) {
  const council_code=String(body.council_code||"");
  const position=String(body.position||"member");
  if(!codes.has(council_code)||!positions.has(position))return null;
  return {council_code,position};
}
function validPassword(password:unknown) {
  return typeof password==="string" && password.length>=12 && password.length<=128 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
}
const admin = createClient(SUPABASE_URL,SERVICE_ROLE_KEY,{
  auth:{autoRefreshToken:false,persistSession:false}
});
Deno.serve(async (req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
  if(req.headers.get("origin") && req.headers.get("origin")!==ALLOWED_ORIGIN)return fail("Origin not permitted",403);
  if(req.method!=="POST")return fail("Method not allowed",405);
  const bearer=req.headers.get("authorization")||"";
  const token=bearer.match(/^Bearer\s+(.+)$/i)?.[1];
  if(!token)return fail("Sign in to the director dashboard first",401);
  if(!SUPABASE_URL||!SERVICE_ROLE_KEY)return fail("Provisioning service is not configured",503);
  try {
    const {data:identified,error:authenticationError}=await admin.auth.getUser(token);
    if(authenticationError||!identified.user)return fail("Session expired; sign in again",401);
    const actor=identified.user.id;
    const {data:profile,error:roleError}=await admin.from("profiles").select("role").eq("id",actor).maybeSingle();
    if(roleError||profile?.role!=="admin")return fail("Director access is required",403);
    const size=Number(req.headers.get("content-length")||0);
    if(size>16000)return fail("Request is too large",413);
    const raw=await req.json();
    if(!raw||typeof raw!=="object"||Array.isArray(raw))return fail("Invalid request");
    const body=raw as Record<string,unknown>;
    const action=String(body.action||"");

    if(action==="search"){
      const input=String(body.query||"").trim();
      if(input.length<2||input.length>70)return fail("Search requires 2–70 characters");
      // Strip LIKE wildcards; do not interpolate untrusted query into .or() filters.
      const query=input.replace(/[%_\\]/g,"").trim();
      if(query.length<2)return fail("Search too short");
      const field=query.includes("@")?"email":"full_name";
      const {data,error}=await admin.from("profiles")
        .select("id,email,full_name,role").ilike(field,"%"+query+"%")
        .order("created_at",{ascending:false}).limit(15);
      if(error)return fail("Could not search Academy accounts",500);
      // Profile email is editable: show and match only the canonical verified Auth email.
      const verified=await Promise.all((data||[]).map(async p=>{
        const {data:identity,error:identityError}=await admin.auth.admin.getUserById(p.id);
        if(identityError||!identity.user)return null;
        const realEmail=String(identity.user.email||"").toLowerCase();
        if(field==="email" && !realEmail.includes(query.toLowerCase()))return null;
        return {id:p.id,email:realEmail,full_name:p.full_name,role:p.role};
      }));
      return reply({accounts:verified.filter(Boolean)});
    }

    if(action==="list"){
      const {data,error}=await admin.from("nabd_council_memberships")
        .select("user_id,council_code,position,active,appointed_at,member_code")
        .order("appointed_at",{ascending:false}).limit(500);
      if(error)return fail("Could not load council memberships",500);
      const memberships=data||[];
      const ids=[...new Set(memberships.map(m=>m.user_id))];
      const accounts:Record<string,{full_name:string,email:string,role:string}>={};
      // Queries are bounded, and only director users receive the result.
      for(let i=0;i<ids.length;i+=100){
        const {data:profiles,error:profileError}=await admin.from("profiles")
          .select("id,full_name,email,role").in("id",ids.slice(i,i+100));
        if(profileError)return fail("Could not resolve council members",500);
        (profiles||[]).forEach(p=>{accounts[p.id]={full_name:p.full_name||"",email:p.email||"",role:p.role||""};});
      }
      return reply({memberships:memberships.map(m=>({...m,account:accounts[m.user_id]||null}))});
    }

    if(action==="create"){
      const selection=councilPosition(body);
      if(!selection)return fail("Invalid council or position");
      const full_name=String(body.full_name||"").trim();
      const email=String(body.email||"").trim().toLowerCase();
      const password=body.password;
      if(full_name.length<3||full_name.length>120)return fail("Enter the member's full name (3–120 characters)");
      if(email.length>254||!emailRe.test(email))return fail("A real valid member email is required");
      if(!validPassword(password))return fail("Use 12+ characters with upper/lower case letters and a number");
      if(body.verified_email!==true)return fail("Confirm that the member owns this email before activating their account");
      const {data:created,error:createError}=await admin.auth.admin.createUser({
        email, password:password as string, email_confirm:true,
        user_metadata:{full_name}
      });
      if(createError||!created?.user)return fail(createError?.message||"Unable to create account",400);
      const userId=created.user.id;
      const {error:membershipError}=await admin.from("nabd_council_memberships").insert({
        user_id:userId,...selection,active:true
      });
      if(membershipError){
        // Compensate if the account could not be given the intended membership.
        await admin.auth.admin.deleteUser(userId);
        return fail("Could not assign council access; account creation was rolled back",500);
      }
      await admin.from("nabd_council_account_audit").insert({
        action:"create_account",actor_user_id:actor,target_user_id:userId,...selection,active:true
      });
      return reply({ok:true,account:{id:userId,full_name,email},...selection,created:true},201);
    }

    if(action==="assign"){
      const selection=councilPosition(body);
      const user_id=String(body.user_id||"");
      if(!selection||!uuid.test(user_id))return fail("Select a valid existing account and council");
      const {data:existing,error:accountError}=await admin.auth.admin.getUserById(user_id);
      if(accountError||!existing.user)return fail("That Academy account does not exist",404);
      const {error:membershipError}=await admin.from("nabd_council_memberships")
        .upsert({user_id,...selection,active:true},{onConflict:"user_id,council_code"});
      if(membershipError)return fail("Could not assign council access",500);
      await admin.from("nabd_council_account_audit").insert({
        action:"assign_existing",actor_user_id:actor,target_user_id:user_id,...selection,active:true
      });
      return reply({ok:true,user_id,...selection,created:false});
    }

    if(action==="set_active"){
      const user_id=String(body.user_id||"");
      const council_code=String(body.council_code||"");
      if(!uuid.test(user_id)||!codes.has(council_code)||typeof body.active!=="boolean")return fail("Invalid membership update");
      const {data:changed,error}=await admin.from("nabd_council_memberships")
        .update({active:body.active})
        .eq("user_id",user_id).eq("council_code",council_code)
        .select("user_id,council_code,position,active").maybeSingle();
      if(error||!changed)return fail("Could not update this council membership",404);
      await admin.from("nabd_council_account_audit").insert({
        action:"change_membership",actor_user_id:actor,target_user_id:user_id,
        council_code,position:changed.position,active:changed.active
      });
      return reply({ok:true,membership:changed});
    }
    return fail("Unsupported action",400);
  } catch(error) {
    // Do not log payloads or passwords; return a generic error.
    console.error("nabd-council-provision: unexpected failure",error instanceof Error?error.name:"unknown");
    return fail("The account service could not complete this request",500);
  }
});
