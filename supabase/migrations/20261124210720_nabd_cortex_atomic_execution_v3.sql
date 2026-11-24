create or replace function public.nabd_cortex_record_atomic(p_actor uuid,p_agent text,p_domain text,p_risk text,p_engine text,p_sources integer,p_title text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_run uuid; v_task uuid; v_status text; v_count integer; v_enabled boolean;
begin
 if p_actor is null or p_risk is null or p_engine is null or p_domain is null or p_risk not in ('low','medium','high') or p_engine not in ('llm_assisted','policy_only') or p_domain not in ('administration','finance','medical','crisis','cybersecurity','education') or p_agent is distinct from (case when p_domain='administration' then 'operations' else p_domain end) then raise exception 'invalid parameters'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text,82174012));
 select enabled into v_enabled from public.nabd_cortex_settings where id=1 for share;
 if v_enabled is distinct from true then return jsonb_build_object('ok',false,'reason','paused'); end if;
 select count(*) into v_count from public.nabd_cortex_runs where actor_id=p_actor and created_at>=now()-interval '1 hour';
 if v_count>=8 then return jsonb_build_object('ok',false,'reason','rate_limit');end if;
 v_status:=case when p_risk='low' then 'logged_low_risk' else 'needs_review' end;
 insert into public.nabd_cortex_runs(actor_id,agent,risk,outcome,engine,sources_count) values(p_actor,p_agent,p_risk,case when p_risk='low' then 'advisory' else 'requires_human' end,p_engine,p_sources) returning id into v_run;
 insert into public.nabd_cortex_tasks(run_id,actor_id,domain,title,status) values(v_run,p_actor,p_domain,left(p_title,180),v_status) returning id into v_task;
 insert into public.nabd_cortex_audit(actor_id,event_type,detail) values(p_actor,'cortex.task_routed',jsonb_build_object('run_id',v_run,'task_id',v_task,'domain',p_domain,'risk',p_risk,'engine',p_engine,'external_execution',false,'atomic',true));
 return jsonb_build_object('ok',true,'run_id',v_run,'task_id',v_task,'status',v_status);
end;$$;
revoke all on function public.nabd_cortex_record_atomic(uuid,text,text,text,text,integer,text) from public,anon,authenticated;
grant execute on function public.nabd_cortex_record_atomic(uuid,text,text,text,text,integer,text) to service_role;
