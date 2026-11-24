
create or replace function public.nabd_quality_smart_save(
 p_request uuid,p_course uuid,p_level text,p_language text,p_count integer,p_minutes integer,p_questions jsonb,p_publish boolean
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_uid uuid:=auth.uid(); v_course record; v_exam public.nabd_quality_exams%rowtype; v_q jsonb; v_title text; v_marker text; v_i integer:=0; v_key integer;
begin
 if v_uid is null or not exists(select 1 from public.nabd_exam_owner where user_id=v_uid) then raise exception 'DIRECTOR_ONLY';end if;
 if p_request is null or p_course is null or p_publish is null or p_level is null or p_level not in ('basic','easy','medium','hard','professional','precision') or p_language is null or p_language not in ('ar','en') or p_count is null or p_count not between 1 and 30 or p_minutes is null or p_minutes not between 5 and 180 then raise exception 'INVALID_SETTINGS';end if;
 if jsonb_typeof(p_questions) is distinct from 'array' or jsonb_array_length(p_questions)<>p_count then raise exception 'INVALID_QUESTION_COUNT';end if;
 for v_q in select value from jsonb_array_elements(p_questions) loop
  v_i:=v_i+1;
  if jsonb_typeof(v_q) is distinct from 'object' or v_q->>'type' is distinct from 'mcq' or length(btrim(coalesce(v_q->>'prompt',''))) not between 10 and 1800 or jsonb_typeof(v_q->'options') is distinct from 'array' or jsonb_typeof(v_q->'answer_key') is distinct from 'number' or coalesce(v_q->>'answer_key','') !~ '^[0-3]$' or coalesce(v_q->>'id','') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'INVALID_QUESTION %',v_i;end if;
  if jsonb_array_length(v_q->'options')<>4 or exists(select 1 from jsonb_array_elements(v_q->'options') o where jsonb_typeof(o)<>'string' or length(btrim(o#>>'{}')) not between 1 and 400) or (select count(distinct lower(btrim(o#>>'{}'))) from jsonb_array_elements(v_q->'options') o)<>4 then raise exception 'INVALID_OPTIONS %',v_i;end if;
  if (v_q - array['id','type','prompt','options','answer_key'])<>'{}'::jsonb then raise exception 'UNEXPECTED_QUESTION_FIELDS';end if;
 end loop;
 if (select count(distinct lower(btrim(q->>'prompt'))) from jsonb_array_elements(p_questions) q)<>p_count or (select count(distinct q->>'id') from jsonb_array_elements(p_questions) q)<>p_count then raise exception 'DUPLICATE_QUESTIONS';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 v_marker:='NABD AI | course outline | '||p_level||' | '||p_language;
 select * into v_exam from public.nabd_quality_exams where id=p_request;
 if found then
  if v_exam.created_by<>v_uid or v_exam.course_id is distinct from p_course or v_exam.duration_minutes<>p_minutes or v_exam.source_filename<>v_marker or v_exam.questions<>p_questions then raise exception 'REQUEST_CONFLICT';end if;
  return jsonb_build_object('id',v_exam.id,'status',v_exam.status,'opens_at',v_exam.opens_at,'closes_at',v_exam.closes_at,'existing',true);
 end if;
 select c.title_ar,c.title_en into v_course from public.courses c where c.id=p_course and c.status='active';
 if not found then raise exception 'COURSE_NOT_ACTIVE';end if;
 v_title:=left(case when p_language='en' then 'AI Exam — '||coalesce(nullif(v_course.title_en,''),v_course.title_ar)||' — '||p_level else 'اختبار ذكي — '||coalesce(nullif(v_course.title_ar,''),v_course.title_en)||' — '||case p_level when 'basic' then 'تأسيسي' when 'easy' then 'سهل' when 'medium' then 'متوسط' when 'hard' then 'صعب' when 'professional' then 'احترافي' else 'دقيق ومتقدم' end end,220);
 insert into public.nabd_quality_exams(id,title,course_id,source_filename,source_path,questions,duration_minutes,status,created_by)
 values(p_request,v_title,p_course,v_marker,null,p_questions,p_minutes,'draft',v_uid);
 if p_publish then perform public.nabd_quality_publish_exam(p_request);end if;
 select * into v_exam from public.nabd_quality_exams where id=p_request;
 return jsonb_build_object('id',v_exam.id,'status',v_exam.status,'opens_at',v_exam.opens_at,'closes_at',v_exam.closes_at,'existing',false);
end;$$;
revoke all on function public.nabd_quality_smart_save(uuid,uuid,text,text,integer,integer,jsonb,boolean) from public,anon;
grant execute on function public.nabd_quality_smart_save(uuid,uuid,text,text,integer,integer,jsonb,boolean) to authenticated;

