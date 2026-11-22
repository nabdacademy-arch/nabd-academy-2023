-- Applied to production 2026-11-22 as migration 20261122134111.
-- Remove redundant public/admin policies with equivalent surviving predicates.
-- Authenticated administrators retain all existing CRUD privileges.
DROP POLICY IF EXISTS "admins manage achievements" ON public.achievements;
DROP POLICY IF EXISTS "admins manage certificates" ON public.certificates;
DROP POLICY IF EXISTS "admins manage courses" ON public.courses;
DROP POLICY IF EXISTS "admins manage enrollments" ON public.enrollments;

-- Admin SELECT and UPDATE are already included in owner/admin rules.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
