create schema if not exists nabd_cortex_ops;
revoke all on schema nabd_cortex_ops from public, anon, authenticated;
grant usage on schema nabd_cortex_ops to service_role;
create table if not exists nabd_cortex_ops.probes(
 id uuid primary key default gen_random_uuid(), token_hash text not null,
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '5 minutes',
 status text not null default 'queued' check(status in ('queued','running','succeeded','failed')),
 request_id bigint, claimed_at timestamptz, finished_at timestamptz,
 model text, provider_id text, diagnostic text,
 executed_action text check(executed_action is null or executed_action='internal_review_record')
);
alter table nabd_cortex_ops.probes enable row level security;
revoke all on nabd_cortex_ops.probes from public,anon,authenticated;
grant select,update on nabd_cortex_ops.probes to service_role;
create table if not exists nabd_cortex_ops.heartbeat(
 id bigint generated always as identity primary key, checked_at timestamptz not null default now(),
 repaired_count integer not null, orphan_remaining integer not null, failed_jobs integer not null,
 enabled boolean not null, management_enabled boolean not null, management_last_success timestamptz,
 state text not null check(state in ('healthy','degraded','paused'))
);
alter table nabd_cortex_ops.heartbeat enable row level security;
revoke all on nabd_cortex_ops.heartbeat from public,anon,authenticated;
create or replace function public.nabd_cortex_probe_claim(p_id uuid,p_token text)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if p_token is null or length(p_token)<>72 then return false; end if;
 update nabd_cortex_ops.probes set status='running',claimed_at=now()
 where id=p_id and status='queued' and expires_at>now() and token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex')
 and exists(select 1 from public.nabd_cortex_settings where id=1 and enabled);
 return found;
end;$$;
revoke all on function public.nabd_cortex_probe_claim(uuid,text) from public,anon,authenticated;
grant execute on function public.nabd_cortex_probe_claim(uuid,text) to service_role;
create or replace function public.nabd_cortex_probe_finish(p_id uuid,p_ok boolean,p_model text,p_provider_id text,p_diagnostic text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare v_ok boolean;
begin
 v_ok := coalesce(p_ok,false) and nullif(p_model,'') is not null and nullif(p_provider_id,'') is not null
 and exists(select 1 from public.nabd_cortex_settings where id=1 and enabled);
 update nabd_cortex_ops.probes set status=case when v_ok then 'succeeded' else 'failed' end,
 finished_at=now(),model=left(p_model,100),provider_id=left(p_provider_id,150),diagnostic=left(p_diagnostic,120),
 executed_action=case when v_ok then 'internal_review_record' end
 where id=p_id and status='running' and expires_at>now();
 if not found then return false; end if;
 insert into public.nabd_cortex_audit(actor_id,event_type,detail)
 values(null,'cortex.model_probe',jsonb_build_object('probe_id',p_id,'success',v_ok,'model',left(p_model,100),'diagnostic',left(p_diagnostic,120),'action',case when v_ok then 'internal_review_record' else 'none' end,'synthetic',true));
 return v_ok;
end;$$;
revoke all on function public.nabd_cortex_probe_finish(uuid,boolean,text,text,text) from public,anon,authenticated;
grant execute on function public.nabd_cortex_probe_finish(uuid,boolean,text,text,text) to service_role;
create or replace function nabd_cortex_ops.reconcile()
returns jsonb language plpgsql security invoker set search_path='' as $$
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
 select count(*) into v_failed from (select distinct on (j.jobid) d.status,d.start_time from cron.job j left join cron.job_run_details d on d.jobid=j.jobid where j.active and j.jobname in ('nabd-executive-agent-supervised-v5','nabd-operator-dispatch-v1','nabd-executive-auto-close-v1','nabd-operator-quality-v1') order by j.jobid,d.start_time desc nulls last) s where status is distinct from 'succeeded' or start_time<now()-interval '25 minutes';
 select max(d.end_time) into v_success from cron.job j join cron.job_run_details d on j.jobid=d.jobid where j.jobname='nabd-executive-agent-supervised-v5' and d.status='succeeded';
 v_state:=case when v_enabled is not true then 'paused' when v_orphans>0 or v_failed>0 or v_mgmt is not true or v_success is null or v_success<now()-interval '20 minutes' then 'degraded' else 'healthy' end;
 insert into nabd_cortex_ops.heartbeat(repaired_count,orphan_remaining,failed_jobs,enabled,management_enabled,management_last_success,state) values(v_fixed,v_orphans,v_failed,coalesce(v_enabled,false),coalesce(v_mgmt,false),v_success,v_state);
 return jsonb_build_object('state',v_state,'repaired',v_fixed,'orphans',v_orphans,'failed_jobs',v_failed,'management_enabled',v_mgmt,'management_last_success',v_success);
end;$$;
revoke all on function nabd_cortex_ops.reconcile() from public,anon,authenticated,service_role;
select cron.schedule('nabd-cortex-reconcile-v3','*/10 * * * *','select nabd_cortex_ops.reconcile()');
