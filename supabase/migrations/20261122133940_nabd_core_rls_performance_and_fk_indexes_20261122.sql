-- Applied to NABD production Supabase on 2026-11-22.
-- Supabase migration version: 20261122133940.
-- No data rows are modified; only equivalent RLS predicates and FK indexes.
-- Keep public roles / policy names intact to preserve existing API behavior.

ALTER POLICY "profiles own/admin read" ON public.profiles
  USING ((id = (SELECT auth.uid())) OR (SELECT public.is_admin()));

ALTER POLICY "profiles own/admin update" ON public.profiles
  USING ((id = (SELECT auth.uid())) OR (SELECT public.is_admin()))
  WITH CHECK ((id = (SELECT auth.uid())) OR (SELECT public.is_admin()));

ALTER POLICY "students own enrollments" ON public.enrollments
  USING ((student_id = (SELECT auth.uid())) OR (SELECT public.is_admin()));

ALTER POLICY "students own certificates" ON public.certificates
  USING ((student_id = (SELECT auth.uid())) OR (SELECT public.is_admin()));

ALTER POLICY "Students can create own certificate claims" ON public.certificate_claims
  WITH CHECK ((student_id = (SELECT auth.uid())) AND (status = 'pending'));

ALTER POLICY "Students can view own certificate claims" ON public.certificate_claims
  USING (student_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS nabd_certificates_student_fk_idx ON public.certificates(student_id);
CREATE INDEX IF NOT EXISTS nabd_certificates_course_fk_idx ON public.certificates(course_id);
CREATE INDEX IF NOT EXISTS nabd_enrollments_course_fk_idx ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS nabd_360_study_plans_course_fk_idx ON public.nabd_360_study_plans(course_id);
CREATE INDEX IF NOT EXISTS nabd_quality_submissions_student_fk_idx ON public.nabd_quality_submissions(student_id);
CREATE INDEX IF NOT EXISTS nabd_quality_exams_course_fk_idx ON public.nabd_quality_exams(course_id);
