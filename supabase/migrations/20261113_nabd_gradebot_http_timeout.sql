
-- Allow enough time for a two-submission AI batch; worker separately enforces
-- director's enabled flag and conditional writes before saving any grade.
select cron.schedule(
 'nabd-quality-grading-worker',
 '* * * * *',
 $job$
 select net.http_post(
   url := 'https://zsmmmljgguycrvyrmakl.supabase.co/functions/v1/nabd-quality-autograde',
   headers := jsonb_build_object(
     'Content-Type','application/json',
     'x-nabd-worker-token',
     (select decrypted_secret from vault.decrypted_secrets where name='nabd_quality_grader_worker' limit 1)
   ),
   body := '{"action":"run","source":"cron"}'::jsonb,
   timeout_milliseconds := 90000
 ) from public.nabd_gradebot_settings where singleton=true and enabled=true;
 $job$
);
