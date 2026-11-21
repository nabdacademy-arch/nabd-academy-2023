/* NABD Official Documents — authenticated issuance & administrator-authorized delegation.
 * Fixed institutional templates only. Clinical prescriptions/diagnoses are not supported.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
const URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const ORIGIN="https://nabdacademy-arch.github.io";
const types=new Set(["statement","permit","report","treatment_request","consultation_request","complaint"]);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const cors={"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin"};
const reply=(body:Record<string,unknown>,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
const fail=(code:string,status=400)=>reply({error:code},status);
const db=URL&&SERVICE?createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}}):null;
const safeText=(value:unknown)=>String(value||"").trim();
const fields="id,verify_token,doc_type,subject_user_id,subject_name,subject_kind,issuer_user_id,issuer_name,issued_at,status,voided_at";
const publicFields=["id","doc_type","status","issued_at"];
const num=(id:number)=>"NABD-DOC-"+String(id).padStart(7,"0");
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="POST")return fail("method_not_allowed",405);
 if(req.headers.get("origin")&&req.headers.get("origin")!==ORIGIN)return fail("origin_not_allowed",403);
 if(Number(req.headers.get("content-length")||0)>8000)return fail("request_too_large",413);
 if(!db)return fail("service_unavailable",503);
 const token=(req.headers.get("authorization")||"").match(/^Bearer\s+(.+)$/i)?.[1];
 if(!token)return fail("authentication_required",401);
 try{
  const {data:auth,error:authError}=await db.auth.getUser(token);
  if(authError||!auth.user)return fail("invalid_session",401);
  const actor=auth.user.id;
  const {data:profile,error:profileError}=await db.from("profiles").select("role,full_name").eq("id",actor).maybeSingle();
  if(profileError||!profile)return fail("account_profile_missing",403);
  const isAdmin=profile.role==="admin";
  const {data:permit,error:permitError}=await db.from("nabd_document_issuer_permissions")
    .select("active,allowed_types").eq("user_id",actor).maybeSingle();
  if(permitError)return fail("authorization_unavailable",503);
  const allowed= isAdmin?Array.from(types):(permit?.active?permit.allowed_types||[]:[]);
  const canIssue=allowed.length>0;
  const body=await req.json();
  if(!body||typeof body!=="object"||Array.isArray(body))return fail("invalid_body");
  const action=safeText(body.action);

  if(action==="whoami")return reply({is_admin:isAdmin,can_issue:canIssue,allowed_types:allowed});

  if(action==="search_subjects"){
   if(!canIssue)return fail("issuer_not_authorized",403);
   const q=safeText(body.query).replace(/[%_\\,()]/g,"").slice(0,70);
   if(q.length<2)return fail("search_requires_two_characters");
   const {data,error}=await db.from("profiles").select("id,full_name,role")
     .ilike("full_name","%"+q+"%").order("full_name",{ascending:true}).limit(20);
   if(error)return fail("search_failed",503);
   return reply({subjects:(data||[]).map(s=>({id:s.id,name:s.full_name||"",role:s.role||""}))});
  }

  if(action==="issue"){
   if(!canIssue)return fail("issuer_not_authorized",403);
   const doc_type=safeText(body.doc_type);
   const subject_user_id=safeText(body.subject_user_id);
   if(!types.has(doc_type)||!allowed.includes(doc_type))return fail("template_not_authorized",403);
   if(!uuid.test(subject_user_id))return fail("invalid_subject");
   const {data:person,error:personError}=await db.from("profiles")
     .select("full_name,role").eq("id",subject_user_id).maybeSingle();
   if(personError||!person||safeText(person.full_name).length<2)return fail("subject_profile_missing",404);
   const {data:membership,error:memberError}=await db.from("nabd_council_memberships")
     .select("user_id").eq("user_id",subject_user_id).eq("active",true).limit(1);
   if(memberError)return fail("membership_lookup_failed",503);
   const subject_kind=(membership?.length||0)>0?"member":person.role==="student"?"student":"other";
   const issuer_name=safeText(profile.full_name)||"إدارة أكاديمية نبض";
   const {data:row,error:issueError}=await db.from("nabd_official_documents").insert({
    doc_type,subject_user_id,subject_name:safeText(person.full_name).slice(0,160),subject_kind,issuer_user_id:actor,issuer_name
   }).select(fields).single();
   if(issueError||!row)return fail("issue_failed",503);
   return reply({document:{...row,number:num(row.id)}},201);
  }

  if(action==="list"){
   if(!canIssue)return fail("issuer_not_authorized",403);
   let query=db.from("nabd_official_documents").select(fields).order("issued_at",{ascending:false}).limit(50);
   if(!isAdmin)query=query.eq("issuer_user_id",actor);
   const {data,error}=await query;
   if(error)return fail("list_failed",503);
   return reply({documents:(data||[]).map(d=>({...d,number:num(d.id)}))});
  }

  if(action==="get"){
   if(!canIssue)return fail("issuer_not_authorized",403);
   const id=Number(body.id);
   if(!Number.isSafeInteger(id)||id<1)return fail("invalid_id");
   const {data:doc,error}=await db.from("nabd_official_documents").select(fields).eq("id",id).maybeSingle();
   if(error||!doc)return fail("document_not_found",404);
   if(!isAdmin&&doc.issuer_user_id!==actor)return fail("document_forbidden",403);
   return reply({document:{...doc,number:num(doc.id)}});
  }

  if(action==="void"){
   if(!isAdmin)return fail("admin_only",403);
   const id=Number(body.id);
   if(!Number.isSafeInteger(id)||id<1)return fail("invalid_id");
   const {data,error}=await db.from("nabd_official_documents")
     .update({status:"void",voided_at:new Date().toISOString(),voided_by:actor})
     .eq("id",id).eq("status","issued").select("id").maybeSingle();
   if(error||!data)return fail("cannot_void",409);
   return reply({ok:true,number:num(id)});
  }

  if(action==="list_issuers"){
   if(!isAdmin)return fail("admin_only",403);
   const {data,error}=await db.from("nabd_document_issuer_permissions")
     .select("user_id,active,allowed_types,granted_at").order("granted_at",{ascending:false}).limit(200);
   if(error)return fail("cannot_list_permissions",503);
   const ids=(data||[]).map(p=>p.user_id);
   const names:Record<string,string>={};
   for(let i=0;i<ids.length;i+=80){
     const {data:people,error:pe}=await db.from("profiles").select("id,full_name").in("id",ids.slice(i,i+80));
     if(pe)return fail("cannot_resolve_names",503);
     (people||[]).forEach(p=>{names[p.id]=p.full_name||"";});
   }
   return reply({issuers:(data||[]).map(p=>({...p,name:names[p.user_id]||""}))});
  }

  if(action==="grant_issuer"){
   if(!isAdmin)return fail("admin_only",403);
   const id=safeText(body.user_id);
   const raw=body.allowed_types;
   if(!uuid.test(id)||!Array.isArray(raw)||raw.length>types.size||raw.some(t=>typeof t!=="string"||!types.has(t)))return fail("invalid_grant");
   if(typeof body.active!=="boolean")return fail("invalid_grant");
   const {data:userCheck,error:userError}=await db.auth.admin.getUserById(id);
   if(userError||!userCheck.user)return fail("user_not_found",404);
   const {error}=await db.from("nabd_document_issuer_permissions")
     .upsert({user_id:id,allowed_types:[...new Set(raw)],active:body.active,granted_by:actor,granted_at:new Date().toISOString()},{onConflict:"user_id"});
   if(error)return fail("cannot_save_permission",503);
   return reply({ok:true});
  }
  return fail("unknown_action");
 }catch(e){
   console.error("nabd-official-documents request error",e instanceof Error?e.name:"unknown");
   return fail("request_failed",500);
 }
});
