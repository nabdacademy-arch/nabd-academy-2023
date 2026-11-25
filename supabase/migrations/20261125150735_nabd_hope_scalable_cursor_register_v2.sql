CREATE OR REPLACE FUNCTION public.nabd_hope_submit_v1(p_code uuid, p_name text, p_email text, p_phone text, p_governorate text, p_institution text, p_field text, p_stage text, p_support text[], p_consent boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_open boolean; v_hash bytea; v_id uuid; v_mail text:=lower(btrim(p_email));
begin
 if p_code is null or p_consent is distinct from true or p_support is null or array_position(p_support,null) is not null or (select count(distinct a) from unnest(p_support) a)<>cardinality(p_support) then raise exception 'INVALID_INPUT';end if;
 v_hash:=extensions.digest(p_code::text,'sha256');
 select registration_open into v_open from public.nabd_hope_control where id=1 for share;
 select id into v_id from public.nabd_hope_applications where receipt_hash=v_hash and email=v_mail;
 if found then return jsonb_build_object('ok',true,'existing',true);end if;
 if v_open is distinct from true then return jsonb_build_object('ok',false,'error','CLOSED');end if;
 insert into public.nabd_hope_applications(receipt_hash,full_name,email,phone,governorate,institution,field_of_study,study_stage,support_types)
 values(v_hash,btrim(p_name),v_mail,p_phone,p_governorate,btrim(p_institution),btrim(p_field),p_stage,p_support) returning id into v_id;
 return jsonb_build_object('ok',true,'existing',false);
exception when unique_violation then
 if exists(select 1 from public.nabd_hope_applications where receipt_hash=v_hash and email=v_mail) then return jsonb_build_object('ok',true,'existing',true);end if;
 return jsonb_build_object('ok',false,'error','DUPLICATE_OR_CONFLICT');
when check_violation or not_null_violation then return jsonb_build_object('ok',false,'error','INVALID_INPUT');
end;$function$
;

create index if not exists nabd_hope_decision_cursor on public.nabd_hope_applications(decision,created_at desc,id desc);
create index if not exists nabd_hope_governorate_cursor on public.nabd_hope_applications(governorate,created_at desc,id desc);
create or replace function public.nabd_hope_admin_page_v2(p_query text,p_decision text,p_governorate text,p_before_at timestamptz,p_before_id uuid,p_snapshot timestamptz,p_limit integer)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb; v_limit integer:=least(500,greatest(1,coalesce(p_limit,25))); v_q text:=lower(btrim(coalesce(p_query,''))); v_snapshot timestamptz:=coalesce(p_snapshot,statement_timestamp());
begin
 if not (select public.is_admin()) or not exists(select 1 from public.nabd_exam_owner where user_id=auth.uid()) then raise exception 'DIRECTOR_ONLY';end if;
 if char_length(v_q)>150 or (p_before_at is null)<>(p_before_id is null) or (p_decision is not null and p_decision not in ('pending','review','shortlisted','accepted','waitlisted','rejected')) or (p_governorate is not null and p_governorate not in ('north_gaza','gaza','middle','khan_younis','rafah')) then raise exception 'INVALID_FILTER';end if;
 select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc,r.id desc),'[]'::jsonb) into result from (
 select id,full_name,email,phone,governorate,institution,field_of_study,study_stage,support_types,created_at,decision,result_published,reviewed_at
 from public.nabd_hope_applications
 where created_at<=v_snapshot and (p_before_at is null or (created_at,id)<(p_before_at,p_before_id))
 and (p_decision is null or decision=p_decision) and (p_governorate is null or governorate=p_governorate)
 and (v_q='' or strpos(lower(full_name),v_q)>0 or strpos(email,v_q)>0 or strpos(phone,v_q)>0 or strpos(id::text,v_q)>0)
 order by created_at desc,id desc limit v_limit+1
 ) r;
 return jsonb_build_object('rows',case when jsonb_array_length(result)>v_limit then result-v_limit else result end,'has_more',jsonb_array_length(result)>v_limit,'snapshot',v_snapshot);
end;$$;
create or replace function public.nabd_hope_admin_stats_v2()
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare out jsonb;
begin
 if not (select public.is_admin()) or not exists(select 1 from public.nabd_exam_owner where user_id=auth.uid()) then raise exception 'DIRECTOR_ONLY';end if;
 select jsonb_build_object('total',count(id),'pending',count(id) filter(where decision='pending'),'review',count(id) filter(where decision='review'),'shortlisted',count(id) filter(where decision='shortlisted'),'accepted',count(id) filter(where decision='accepted'),'waitlisted',count(id) filter(where decision='waitlisted'),'rejected',count(id) filter(where decision='rejected'),'published',count(id) filter(where result_published)) into out from public.nabd_hope_applications;
 return out;
end;$$;
revoke all on function public.nabd_hope_admin_page_v2(text,text,text,timestamptz,uuid,timestamptz,integer),public.nabd_hope_admin_stats_v2() from public,anon;
grant execute on function public.nabd_hope_admin_page_v2(text,text,text,timestamptz,uuid,timestamptz,integer),public.nabd_hope_admin_stats_v2() to authenticated;

