
alter table nabd_cortex_ops.probes add column if not exists target_provider text check (target_provider in ('auto','groq','gemini','openai'));
create or replace function public.nabd_cortex_provider_probe_start(p_actor uuid,p_target text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_on boolean; v_next timestamptz;
begin
 if p_actor is null or p_target is null or p_target not in ('auto','groq','gemini','openai') then raise exception 'invalid probe request'; end if;
 perform pg_advisory_xact_lock(82174015);
 select enabled into v_on from public.nabd_cortex_settings where id=1 for share;
 if v_on is distinct from true then return jsonb_build_object('ok',false,'reason','paused');end if;
 select max(created_at)+interval '5 minutes' into v_next from nabd_cortex_ops.probes where actor_id is not null;
 if v_next>now() then return jsonb_build_object('ok',false,'reason','cooldown','retry_after_seconds',ceil(extract(epoch from v_next-now())));end if;
 insert into nabd_cortex_ops.probes(actor_id,token_hash,status,claimed_at,target_provider)
 values(p_actor,encode(sha256(convert_to(gen_random_uuid()::text,'UTF8')),'hex'),'running',now(),p_target) returning id into v_id;
 return jsonb_build_object('ok',true,'id',v_id);
end;$$;
revoke all on function public.nabd_cortex_provider_probe_start(uuid,text) from public,anon,authenticated;
grant execute on function public.nabd_cortex_provider_probe_start(uuid,text) to service_role;
create or replace function public.nabd_cortex_provider_status()
returns jsonb language sql stable security invoker set search_path='' as $$
with providers(provider) as (values ('groq'),('gemini'),('openai')),
classified as (
 select p.*,case when target_provider in ('groq','gemini','openai') then target_provider
 when model like 'groq/%' then 'groq' when model like 'gemini/%' then 'gemini'
 when model like 'openai/%' or model like 'gpt-%' or diagnostic like 'provider_http_%' then 'openai' end as provider
 from nabd_cortex_ops.probes p
)
select jsonb_build_object('providers',(
 select jsonb_object_agg(x.provider,jsonb_build_object('latest',(
 select jsonb_build_object('status',c.status,'model',c.model,'diagnostic',c.diagnostic,'finished_at',c.finished_at,'verified',c.status='succeeded' and nullif(c.provider_id,'') is not null)
 from classified c where c.provider=x.provider order by c.created_at desc limit 1
 ),'last_verified_at',(select max(c.finished_at) from classified c where c.provider=x.provider and c.status='succeeded' and nullif(c.provider_id,'') is not null)))
 from providers x
 ),'retry_after_seconds',coalesce((select greatest(0,ceil(extract(epoch from max(created_at)+interval '5 minutes'-now()))) from nabd_cortex_ops.probes where actor_id is not null),0));
$$;
revoke all on function public.nabd_cortex_provider_status() from public,anon,authenticated;
grant execute on function public.nabd_cortex_provider_status() to service_role;

