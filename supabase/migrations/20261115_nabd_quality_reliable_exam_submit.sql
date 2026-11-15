-- Fix exam submission at NABD Academy: authenticated students submit through
-- a single validated RPC, not a direct INSERT on a table with restricted exam
-- question-key access and invoker triggers. No existing records are modified.
begin;

create or replace function public.nabd_quality_submit_exam(
  p_exam uuid,
  p_answers jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_questions jsonb;
  v_id uuid;
  v_submitted_at timestamptz;
  v_bad_keys integer;
begin
  -- Do not trust a student ID supplied by the browser. auth.uid() is the source.
  if v_uid is null or not exists (
    select 1 from public.profiles p where p.id=v_uid and p.role='student'
  ) then
    raise exception 'STUDENT_ONLY' using errcode='42501';
  end if;

  if p_exam is null then raise exception 'EXAM_NOT_FOUND' using errcode='22023'; end if;

  -- Idempotence: a repeated click / lost HTTP success response is not a second
  -- attempt and cannot overwrite already submitted student answers.
  select s.id,s.submitted_at into v_id,v_submitted_at
  from public.nabd_quality_submissions s
  where s.exam_id=p_exam and s.student_id=v_uid;
  if found then
    return jsonb_build_object('ok',true,'already_submitted',true,
      'id',v_id,'submitted_at',v_submitted_at);
  end if;

  if p_answers is null or jsonb_typeof(p_answers)<>'object'
    or octet_length(p_answers::text)>65000 then
    raise exception 'INVALID_ANSWERS' using errcode='22023';
  end if;

  -- Lock the examination record against concurrent edit/delete until this
  -- transaction commits; only a currently open published exam is accepted.
  select x.questions into v_questions
  from public.nabd_quality_exams x
  where x.id=p_exam and x.status='published'
    and x.opens_at<=now() and x.closes_at>now()
  for share;
  if not found then
    raise exception 'EXAM_CLOSED_OR_UNAVAILABLE' using errcode='22023';
  end if;

  -- Reject accidental or malicious answer keys that are not part of this exam.
  select count(*) into v_bad_keys
  from jsonb_object_keys(p_answers) as a(key)
  where not exists (
    select 1 from jsonb_array_elements(v_questions) as q(value)
    where q.value->>'id'=a.key
  );
  if v_bad_keys>0 then
    raise exception 'INVALID_ANSWERS' using errcode='22023';
  end if;

  insert into public.nabd_quality_submissions(exam_id,student_id,answers)
  values(p_exam,v_uid,p_answers)
  on conflict (exam_id,student_id) do nothing
  returning id,submitted_at into v_id,v_submitted_at;

  if v_id is null then
    select s.id,s.submitted_at into v_id,v_submitted_at
    from public.nabd_quality_submissions s
    where s.exam_id=p_exam and s.student_id=v_uid;
    if v_id is null then
      raise exception 'SUBMISSION_NOT_CONFIRMED' using errcode='P0001';
    end if;
    return jsonb_build_object('ok',true,'already_submitted',true,
      'id',v_id,'submitted_at',v_submitted_at);
  end if;

  -- Newly inserted rows retain the existing ai_status='pending' default,
  -- allowing the existing Supabase scheduled grading worker to claim them.
  return jsonb_build_object('ok',true,'already_submitted',false,
    'id',v_id,'submitted_at',v_submitted_at);
end;
$$;
revoke all on function public.nabd_quality_submit_exam(uuid,jsonb)
  from public,anon,authenticated;
grant execute on function public.nabd_quality_submit_exam(uuid,jsonb)
  to authenticated;
comment on function public.nabd_quality_submit_exam(uuid,jsonb) is
'Authenticated NABD student exam submission. One attempt only; server-derived identity, server-time window and idempotent response.';
commit;
