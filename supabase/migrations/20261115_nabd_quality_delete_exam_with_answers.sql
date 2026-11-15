-- NABD · director-authorized permanent exam deletion with submissions.
-- Applies to drafts, expired, closed, and even published exams, after
-- two independent browser confirmations. This function NEVER runs itself:
-- existing exams and submissions are untouched until the director invokes it.
begin;

create or replace function public.nabd_quality_delete_exam(p_exam uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_title text;
  v_status text;
  v_submissions bigint := 0;
  v_events bigint := 0;
  v_settings bigint := 0;
  v_exam_count bigint := 0;
begin
  if v_uid is null or not exists(
    select 1 from public.nabd_exam_owner o where o.user_id=v_uid
  ) then
    raise exception 'DIRECTOR_ONLY';
  end if;

  if p_exam is null then raise exception 'EXAM_NOT_FOUND'; end if;

  -- Lock the exact exam before deleting children. Ownership is independently
  -- checked server-side and never accepted from the browser.
  select e.title,e.status into v_title,v_status
  from public.nabd_quality_exams e
  where e.id=p_exam and e.created_by=v_uid
  for update;
  if not found then raise exception 'EXAM_NOT_FOUND'; end if;

  -- Parent exam has ON DELETE RESTRICT for submissions; delete the children
  -- first in the SAME transaction, so any failure rolls everything back.
  delete from public.nabd_quality_submissions s
  where s.exam_id=p_exam;
  get diagnostics v_submissions = row_count;

  delete from public.nabd_quality_proctor_events pe
  where pe.exam_id=p_exam;
  get diagnostics v_events = row_count;

  delete from public.nabd_quality_proctor_settings ps
  where ps.exam_id=p_exam;
  get diagnostics v_settings = row_count;

  delete from public.nabd_quality_exams e
  where e.id=p_exam and e.created_by=v_uid;
  get diagnostics v_exam_count = row_count;
  if v_exam_count<>1 then raise exception 'EXAM_DELETE_FAILED'; end if;

  return jsonb_build_object(
    'ok',true,'exam_id',p_exam,'title',v_title,'previous_status',v_status,
    'deleted_exams',v_exam_count,
    'deleted_submissions',v_submissions,
    'deleted_proctor_events',v_events,
    'deleted_proctor_settings',v_settings
  );
end;
$$;

revoke all on function public.nabd_quality_delete_exam(uuid) from public, anon, authenticated;
grant execute on function public.nabd_quality_delete_exam(uuid) to authenticated;
comment on function public.nabd_quality_delete_exam(uuid) is
'Only the recorded NABD exam director may permanently delete exactly one exam and its submissions in a transaction; invoked after UI confirmations.';

commit;
