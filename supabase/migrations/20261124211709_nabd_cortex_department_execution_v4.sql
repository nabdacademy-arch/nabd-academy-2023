alter table public.nabd_cortex_tasks add column if not exists assigned_department text;
alter table public.nabd_cortex_tasks add column if not exists dispatch_requested boolean not null default false;
alter table public.nabd_cortex_tasks add column if not exists portal_task_id uuid references public.portal_tasks(id) on delete set null;
alter table public.nabd_cortex_tasks add column if not exists dispatched_at timestamptz;
alter table public.nabd_cortex_tasks add constraint cortex_department_allowed_v4 check (assigned_department is null or assigned_department in ('academic','research','operations','partnerships','scholarships','finance','media','technology','hr','secretary'));
alter table public.nabd_cortex_runs add column if not exists provider_model text;
alter table public.nabd_cortex_runs add column if not exists provider_response_id text;
alter table nabd_cortex_ops.probes add column if not exists actor_id uuid;
create index if not exists cortex_pending_dispatch_v4 on public.nabd_cortex_tasks(created_at) where dispatch_requested and dispatched_at is null;
create index if not exists cortex_admin_probe_rate_v4 on nabd_cortex_ops.probes(actor_id,created_at);
create or replace function public.nabd_cortex_record_v4(p_actor uuid,p_agent text,p_domain text,p_risk text,p_engine text,p_sources integer,p_title text,p_department text,p_dispatch boolean,p_model text,p_response_id text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v jsonb; v_id uuid; v_department text;
begin
 if p_dispatch is null then raise exception 'dispatch choice required';end if;
 v_department:=case p_domain when 'finance' then 'finance' when 'medical' then 'operations' when 'cybersecurity' then 'technology' when 'crisis' then 'operations' when 'education' then case when p_department='research' then 'research' else 'academic' end else coalesce(p_department,'operations') end;
 if v_department not in ('academic','research','operations','partnerships','scholarships','finance','media','technology','hr','secretary') then raise exception 'department invalid';end if;
 if p_domain='administration' and v_department in ('finance','hr','media','scholarships','partnerships','technology') and p_risk='low' then p_risk:='medium';end if;
 if p_engine='llm_assisted' and (nullif(btrim(p_model),'') is null or nullif(btrim(p_response_id),'') is null) then raise exception 'provider evidence required';end if;
 v:=public.nabd_cortex_record_atomic(p_actor,p_agent,p_domain,p_risk,p_engine,p_sources,p_title);
 if v->>'ok' is distinct from 'true' then return v;end if;
 v_id:=(v->>'task_id')::uuid;
 update public.nabd_cortex_tasks set assigned_department=v_department,dispatch_requested=p_dispatch where id=v_id;
 update public.nabd_cortex_runs set provider_model=case when p_engine='llm_assisted' then left(p_model,120) end,provider_response_id=case when p_engine='llm_assisted' then left(p_response_id,160) end where id=(v->>'run_id')::uuid;
 return v||jsonb_build_object('department',v_department,'dispatch_requested',p_dispatch,'risk',p_risk);
end;$$;
revoke all on function public.nabd_cortex_record_v4(uuid,text,text,text,text,integer,text,text,boolean,text,text) from public,anon,authenticated;
grant execute on function public.nabd_cortex_record_v4(uuid,text,text,text,text,integer,text,text,boolean,text,text) to service_role;
create or replace function nabd_cortex_ops.dispatch()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r record; v_task uuid; v_count integer:=0; v_on boolean; v_mgmt boolean;
begin
 if not pg_try_advisory_xact_lock(82174014) then return jsonb_build_object('skipped','busy');end if;
 select enabled into v_on from public.nabd_cortex_settings where id=1 for share;
 select automation_enabled into v_mgmt from public.nabd_agent_control where singleton_id=1 for share;
 if v_on is distinct from true or v_mgmt is distinct from true then return jsonb_build_object('skipped','paused','dispatched',0);end if;
 for r in
 select t.id,t.assigned_department,t.domain,t.status,t.actor_id,t.run_id
 from public.nabd_cortex_tasks t join public.nabd_cortex_runs u on u.id=t.run_id
 where t.dispatch_requested and t.dispatched_at is null and t.assigned_department is not null
 and ((t.status='logged_low_risk' and u.risk='low') or (t.status='approved_for_planning' and t.reviewed_by is not null and t.reviewed_at is not null))
 order by t.created_at limit 20 for update of t skip locked
 loop
 insert into public.portal_tasks(title,details,assigned_role,assigned_user,created_by,status,due_date,generated_by)
 values('متابعة تخطيطية داخلية من CORTEX',
 'مراجعة خطة داخلية مع الإدارة وتوثيق المطلوب قبل التنفيذ. رقم متابعة CORTEX: '||r.id::text||chr(10)||'لا يتضمن هذا التكليف اعتمادًا ماليًا أو سريريًا أو نشرًا أو قبولًا أو رفضًا أو تعديل صلاحيات. تواصل مع الإدارة لمعرفة الخطة المعتمدة.',
 r.assigned_department::public.portal_role,null,null,'todo'::public.portal_task_status,(now() at time zone 'Asia/Gaza')::date+2,'nabd_agent')
 returning id into v_task;
 update public.nabd_cortex_tasks set portal_task_id=v_task,dispatched_at=now() where id=r.id;
 insert into public.nabd_cortex_audit(actor_id,event_type,detail) values(null,'cortex.department_dispatched',jsonb_build_object('task_id',r.id,'portal_task_id',v_task,'department',r.assigned_department,'run_id',r.run_id,'scope','planning_only','external_execution',false));
 v_count:=v_count+1;
 end loop;
 return jsonb_build_object('dispatched',v_count,'max_per_cycle',20);
end;$$;
revoke all on function nabd_cortex_ops.dispatch() from public,anon,authenticated,service_role;
select cron.schedule('nabd-cortex-department-dispatch-v4','2-59/5 * * * *','select nabd_cortex_ops.dispatch()');
create or replace function public.nabd_cortex_admin_probe_start(p_actor uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_on boolean;
begin
 if p_actor is null then raise exception 'actor required';end if;
 perform pg_advisory_xact_lock(82174015);
 select enabled into v_on from public.nabd_cortex_settings where id=1 for share;
 if v_on is distinct from true then return jsonb_build_object('ok',false,'reason','paused');end if;
 if exists(select 1 from nabd_cortex_ops.probes where actor_id is not null and created_at>now()-interval '5 minutes') then return jsonb_build_object('ok',false,'reason','cooldown');end if;
 insert into nabd_cortex_ops.probes(actor_id,token_hash,status,claimed_at) values(p_actor,encode(sha256(convert_to(gen_random_uuid()::text,'UTF8')),'hex'),'running',now()) returning id into v_id;
 return jsonb_build_object('ok',true,'id',v_id);
end;$$;
revoke all on function public.nabd_cortex_admin_probe_start(uuid) from public,anon,authenticated;
grant execute on function public.nabd_cortex_admin_probe_start(uuid) to service_role;
grant insert on nabd_cortex_ops.probes to service_role;
