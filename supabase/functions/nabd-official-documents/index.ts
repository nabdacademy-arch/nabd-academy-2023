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
const fields="id,verify_token,doc_type,subject_user_id,subject_name,subject_name_en,english_name_added_by,english_name_added_at,subject_kind,issuer_user_id,issuer_name,issued_at,status,voided_at,subject_details,signatory_name,signatory_kind";
const publicFields=["id","doc_type","status","issued_at"];
const num=(id:number)=>"NABD-DOC-"+String(id).padStart(7,"0");
// There is no verified English-name column on Academy profiles. Require a human-confirmed
// spelling rather than inventing a transliteration or suggesting it is passport-verified.
function validatedEnglishName(raw:unknown,confirmed:unknown){
  if(confirmed!==true||typeof raw!=="string")return null;
  const name=raw.trim().replace(/\\s+/g," ");
  if(name.length<3||name.length>160||!/^[A-Za-z][A-Za-z .'-]{2,159}$/.test(name))return null;
  if(!/[A-Za-z]{2}/.test(name))return null;
  return name;
}
// All claims come from authoritative Academy tables, not client-submitted form fields.
// Limit the snapshot so that the A4 statement stays readable.
async function verifiedSubjectDetails(id:string,role:string,withEducation:boolean){
  const {data:appointments,error:appointmentError}=await db!.from("nabd_council_memberships")
    .select("council_code,position,member_code").eq("user_id",id).eq("active",true)
    .order("appointed_at",{ascending:true}).limit(8);
  if(appointmentError)throw new Error("verified_memberships_unavailable");
  const memberships=(appointments||[]).map(m=>({
    council_code:String(m.council_code||"").slice(0,32),
    position:String(m.position||"").slice(0,32),
    member_code:String(m.member_code||"").slice(0,50)
  }));
  const details:{role:string;memberships:unknown[];certified_courses:unknown[];ongoing_courses:unknown[];evidence_at:string}={
    role, memberships,certified_courses:[],ongoing_courses:[],evidence_at:new Date().toISOString()
  };
  if(!withEducation)return details;
  const [completed,enrolled]=await Promise.all([
    db!.from("certificates").select("course_id,course_title,hours,issue_date")
      .eq("student_id",id).eq("status","valid")
      .order("issue_date",{ascending:false}).limit(8),
    db!.from("enrollments").select("course_id,status")
      .eq("student_id",id).eq("status","active")
      .order("enrolled_at",{ascending:false}).limit(8)
  ]);
  if(completed.error||enrolled.error)throw new Error("verified_courses_unavailable");
  const valid=completed.data||[];
  const active=enrolled.data||[];
  const ids=[...new Set([...valid.map(c=>c.course_id),...active.map(c=>c.course_id)].filter(Boolean))];
  const courses:Record<string,{title_ar:string;title_en:string}>={};
  if(ids.length){
    const {data:titles,error}=await db!.from("courses")
      .select("id,title_ar,title_en").in("id",ids);
    if(error)throw new Error("verified_course_titles_unavailable");
    (titles||[]).forEach(c=>{courses[c.id]={
      title_ar:String(c.title_ar||"").slice(0,150),
      title_en:String(c.title_en||"").slice(0,150)
    };});
  }
  const completedIds=new Set<string>();
  details.certified_courses=valid.reduce((list:Array<Record<string,unknown>>,c)=>{
    const key=String(c.course_id||c.course_title||"");
    if(!key||completedIds.has(key)||list.length>=5)return list;
    completedIds.add(key);
    const translated=c.course_id?courses[c.course_id]:null;
    list.push({
      title_ar:String(translated?.title_ar||c.course_title||"").slice(0,150),
      title_en:String(translated?.title_en||c.course_title||"").slice(0,150),
      hours:Number.isFinite(c.hours)?c.hours:null
    });
    return list;
  },[]);
  details.ongoing_courses=active.reduce((list:Array<Record<string,unknown>>,c)=>{
    const id=String(c.course_id||"");
    if(!id||completedIds.has(id)||!courses[id]||list.some(v=>v.course_id===id)||list.length>=3)return list;
    list.push({course_id:id,title_ar:courses[id].title_ar,title_en:courses[id].title_en});
    return list;
  },[]);
  return details;
}

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
  // A profile query error (e.g. a missing SQL GRANT) is NOT a missing user profile.
  // Separating these cases prevents misleading 403 messages during service failures.
  if(profileError){
    console.error("nabd-official-documents profile lookup failed",profileError.code||"unknown");
    return fail("profile_lookup_failed",503);
  }
  if(!profile)return fail("account_profile_missing",403);
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
   const english_name=validatedEnglishName(body.subject_name_en,body.english_name_confirmed);
   if(!english_name)return fail("english_name_required",400);
   if(!uuid.test(subject_user_id))return fail("invalid_subject");
   const {data:person,error:personError}=await db.from("profiles")
     .select("full_name,role").eq("id",subject_user_id).maybeSingle();
   if(personError||!person||safeText(person.full_name).length<2)return fail("subject_profile_missing",404);
   let details;
   try{
     details=await verifiedSubjectDetails(
       subject_user_id,String(person.role||"student").slice(0,50),
       ["statement","permit","report"].includes(doc_type)
     );
   }catch(error){
     console.error("nabd-official-documents evidence snapshot failed",error instanceof Error?error.message:"unknown");
     return fail("verified_evidence_unavailable",503);
   }
   const subject_kind=details.memberships.length?"member":person.role==="student"?"student":"other";
   const issuer_name=safeText(profile.full_name)||"إدارة أكاديمية نبض";
   // Current sole director requested their typed institutional sign-off. Do NOT
   // fabricate a handwritten signature. Delegates sign with their own profile.
   const signatory_name=isAdmin?(safeText(profile.full_name)||"محمد خالد العرجا"):issuer_name;
   const signatory_kind=isAdmin?"director":"issuer";
   const {data:row,error:issueError}=await db.from("nabd_official_documents").insert({
    doc_type,subject_user_id,subject_name:safeText(person.full_name).slice(0,160),
    subject_kind,issuer_user_id:actor,issuer_name,
    subject_name_en:english_name,english_name_added_by:actor,
    english_name_added_at:new Date().toISOString(),
    subject_details:details,signatory_name,signatory_kind
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

  // Legacy print records may be annotated ONCE with an attested English spelling,
  // without issuing a new number or changing any substantive Academy record.
  if(action==="add_english_name"){
   if(!canIssue)return fail("issuer_not_authorized",403);
   const id=Number(body.id);
   if(!Number.isSafeInteger(id)||id<1)return fail("invalid_id");
   const englishName=validatedEnglishName(body.subject_name_en,body.english_name_confirmed);
   if(!englishName)return fail("english_name_required",400);
   const {data:existing,error:lookupError}=await db.from("nabd_official_documents")
     .select("id,issuer_user_id,subject_name_en,status").eq("id",id).maybeSingle();
   if(lookupError||!existing)return fail("document_not_found",404);
   if(!isAdmin&&existing.issuer_user_id!==actor)return fail("document_forbidden",403);
   if(existing.status!=="issued")return fail("document_void",409);
   if(existing.subject_name_en)return fail("english_name_already_recorded",409);
   const {data:updated,error:updateError}=await db.from("nabd_official_documents")
     .update({subject_name_en:englishName,english_name_added_by:actor,
       english_name_added_at:new Date().toISOString()})
     .eq("id",id).eq("status","issued").is("subject_name_en",null)
     .select(fields).maybeSingle();
   if(updateError)return fail("english_name_save_failed",503);
   if(!updated)return fail("english_name_already_recorded",409);
   return reply({document:{...updated,number:num(updated.id)}});
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
