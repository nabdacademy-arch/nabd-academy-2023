-- Fix the Cortex login/control mismatch.
-- The academy currently has one authenticated admin and no active portal founder.
-- Use the same trusted admin/founder rule as nabd_agent_admin_info().
-- Keep control and review RPCs accessible only to authenticated administrators/founders.
alter table public.nabd_cortex_settings
  add column if not exists active_since timestamptz,
  add column if not exists last_stopped_at timestamptz,
  add column if not exists elapsed_seconds bigint not null default 0 check (elapsed_seconds >= 0);
update public.nabd_cortex_settings
  set active_since = pg_catalog.clock_timestamp()
  where id=1 and enabled=true and active_since is null;

create or replace function public.nabd_cortex_set_enabled(p_enabled boolean)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_enabled boolean;
  v_since timestamptz;
  v_elapsed bigint;
  v_last_stop timestamptz;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if auth.uid() is null or not (
    public.is_admin()
    or exists (select 1 from public.portal_profiles where user_id=auth.uid()
      and role='founder' and is_active)
  ) then
    raise exception 'Admin or active founder authorization required' using errcode='42501';
  end if;

  select enabled,active_since,elapsed_seconds,last_stopped_at
  into v_enabled,v_since,v_elapsed,v_last_stop
  from public.nabd_cortex_settings where id=1 for update;
  if not found then raise exception 'Cortex configuration is missing'; end if;
  if p_enabled is null then raise exception 'Enabled flag required'; end if;

  if p_enabled is distinct from v_enabled then
    if p_enabled then
      v_since := v_now;
    else
      if v_since is not null then
        v_elapsed := v_elapsed + greatest(0, floor(extract(epoch from (v_now-v_since)))::bigint);
      end if;
      v_since := null;
      v_last_stop := v_now;
    end if;
    update public.nabd_cortex_settings set
      enabled=p_enabled, active_since=v_since, elapsed_seconds=v_elapsed,
      last_stopped_at=v_last_stop, updated_by=auth.uid(), updated_at=v_now
    where id=1;
    insert into public.nabd_cortex_audit(actor_id,event_type,detail)
      values(auth.uid(),'cortex.toggle',pg_catalog.jsonb_build_object('enabled',p_enabled,
        'elapsed_seconds',v_elapsed,'authorization','admin_or_active_founder'));
  end if;

  return pg_catalog.jsonb_build_object('enabled',p_enabled,'active_since',v_since,
     'last_stopped_at',v_last_stop,'elapsed_seconds',v_elapsed,'scope','nabd_cortex_only');
end;
$$;

create or replace function public.nabd_cortex_review_task(p_task_id uuid,p_approved boolean)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_new text; v_rows integer;
begin
  if auth.uid() is null or not (
    public.is_admin()
    or exists (select 1 from public.portal_profiles where user_id=auth.uid()
      and role='founder' and is_active)
  ) then
    raise exception 'Admin or active founder authorization required' using errcode='42501';
  end if;
  if p_task_id is null or p_approved is null then
    raise exception 'Task and approval response are required';
  end if;
  v_new:=case when p_approved then 'approved_for_planning' else 'rejected' end;
  update public.nabd_cortex_tasks
    set status=v_new,reviewed_by=auth.uid(),reviewed_at=now()
    where id=p_task_id and status='needs_review';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'Task not pending review'; end if;
  insert into public.nabd_cortex_audit(actor_id,event_type,detail)
    values(auth.uid(),'cortex.task_review',pg_catalog.jsonb_build_object(
      'task_id',p_task_id,'approved',p_approved,'execution','none'));
  return pg_catalog.jsonb_build_object('task_id',p_task_id,'status',v_new,'executed',false);
end;
$$;

revoke all on function public.nabd_cortex_set_enabled(boolean) from public,anon;
revoke all on function public.nabd_cortex_review_task(uuid,boolean) from public,anon;
grant execute on function public.nabd_cortex_set_enabled(boolean) to authenticated;
grant execute on function public.nabd_cortex_review_task(uuid,boolean) to authenticated;
