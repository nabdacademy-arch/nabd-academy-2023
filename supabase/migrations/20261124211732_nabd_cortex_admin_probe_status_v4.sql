create or replace function public.nabd_cortex_probe_status_v4()
returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('status',status,'model',model,'diagnostic',diagnostic,'finished_at',finished_at,'verified',status='succeeded' and nullif(provider_id,'') is not null)
 from nabd_cortex_ops.probes order by created_at desc limit 1
$$;
revoke all on function public.nabd_cortex_probe_status_v4() from public,anon,authenticated;
grant execute on function public.nabd_cortex_probe_status_v4() to service_role;
