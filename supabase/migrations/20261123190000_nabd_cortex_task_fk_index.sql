-- Support existing reference from Cortex task to run without indexing the rest of the academy.
create index if not exists nabd_cortex_tasks_run_id_idx on public.nabd_cortex_tasks(run_id);
