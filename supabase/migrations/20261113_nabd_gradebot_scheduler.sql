
-- Secure recurring NABD grading worker: off until director explicitly enables it.
create extension if not exists pg_net with schema extensions;
do $setup$
declare
  v_worker_secret text := encode(extensions.gen_random_bytes(32),'hex');
begin
  update public.nabd_gradebot_settings
    set worker_token_hash=encode(extensions.digest(v_worker_secret,'sha256'),'hex')
    where singleton=true;
  perform vault.create_secret(v_worker_secret,'nabd_quality_grader_worker','NABD private scheduler token for AI grade bot',null);
end
$setup$;
select cron.schedule(
  'nabd-quality-grading-worker',
  '* * * * *',
  $job$
    select net.http_post(
      url := 'https://zsmmmljgguycrvyrmakl.supabase.co/functions/v1/nabd-quality-autograde',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-nabd-worker-token',
        (select decrypted_secret from vault.decrypted_secrets
         where name='nabd_quality_grader_worker' limit 1)
      ),
      body := '{"action":"run","source":"cron"}'::jsonb,
      timeout_milliseconds := 30000
    )
    from public.nabd_gradebot_settings where singleton=true and enabled=true;
  $job$
);
