CREATE OR REPLACE FUNCTION nabd_cortex_ops.reconcile()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_enabled boolean; v_mgmt boolean; v_fixed integer:=0; v_orphans integer; v_failed integer; v_success timestamptz; v_state text;
begin
 if not pg_try_advisory_xact_lock(82174011) then return jsonb_build_object('skipped','already_running');end if;
 select enabled into v_enabled from public.nabd_cortex_settings where id=1 for share;
 select automation_enabled into v_mgmt from public.nabd_agent_control where singleton_id=1;
 if v_enabled is true then
 with candidates as (
 select r.id,r.actor_id,r.agent from public.nabd_cortex_runs r
 where r.created_at<now()-interval '2 minutes' and r.outcome in ('advisory','requires_human')
 and not exists(select 1 from public.nabd_cortex_tasks t where t.run_id=r.id)
 order by r.created_at limit 50 for update of r skip locked
 ), repaired as (
 insert into public.nabd_cortex_tasks(run_id,actor_id,domain,title,status)
 select id,actor_id,case when agent='operations' then 'administration' else agent end,'Recovered internal follow-up (review required)','needs_review'
 from candidates returning id,run_id,actor_id
 )
 insert into public.nabd_cortex_audit(actor_id,event_type,detail)
 select actor_id,'cortex.orphan_recovered',jsonb_build_object('run_id',run_id,'task_id',id,'automatic',true,'external_execution',false) from repaired;
 get diagnostics v_fixed=row_count;
 end if;
 update nabd_cortex_ops.probes set status='failed',finished_at=now(),diagnostic='probe_expired' where status in ('queued','running') and expires_at<=now();
 select count(*) into v_orphans from public.nabd_cortex_runs r where r.created_at<now()-interval '2 minutes' and r.outcome in ('advisory','requires_human') and not exists(select 1 from public.nabd_cortex_tasks t where t.run_id=r.id);
 select count(*) into v_failed from (select distinct on (j.jobid) d.status,d.start_time from cron.job j left join cron.job_run_details d on d.jobid=j.jobid and d.status in ('succeeded','failed') where j.active and j.jobname in ('nabd-executive-agent-supervised-v5','nabd-operator-dispatch-v1','nabd-executive-auto-close-v1','nabd-operator-quality-v1') order by j.jobid,d.start_time desc nulls last) s where status is distinct from 'succeeded' or start_time<now()-interval '25 minutes';
 select max(d.end_time) into v_success from cron.job j join cron.job_run_details d on j.jobid=d.jobid where j.jobname='nabd-executive-agent-supervised-v5' and d.status='succeeded';
 v_state:=case when v_enabled is not true then 'paused' when v_orphans>0 or v_failed>0 or v_mgmt is not true or v_success is null or v_success<now()-interval '20 minutes' then 'degraded' else 'healthy' end;
 insert into nabd_cortex_ops.heartbeat(repaired_count,orphan_remaining,failed_jobs,enabled,management_enabled,management_last_success,state) values(v_fixed,v_orphans,v_failed,coalesce(v_enabled,false),coalesce(v_mgmt,false),v_success,v_state);
 return jsonb_build_object('state',v_state,'repaired',v_fixed,'orphans',v_orphans,'failed_jobs',v_failed,'management_enabled',v_mgmt,'management_last_success',v_success);
end;$function$

;
