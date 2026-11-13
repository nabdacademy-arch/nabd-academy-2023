-- Least-privilege reads for the server-side grading worker. No client access to worker tokens.
grant select on public.nabd_gradebot_settings to service_role;
grant select on public.nabd_quality_submissions to service_role;
grant select on public.nabd_quality_exams to service_role;
grant select on public.nabd_exam_owner to service_role;