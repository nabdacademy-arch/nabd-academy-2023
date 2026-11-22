-- Applied to production 2026-11-22 as migration 20261122134039.
-- Rewrite only constant auth.uid() lookup evaluation. Authorization conditions remain identical.
ALTER POLICY "Admins can read executive applications" ON public.executive_applications
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
  ));

ALTER POLICY "Admins can update executive applications" ON public.executive_applications
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
  ));

ALTER POLICY "nfx_congress_read" ON public.nfx_congress_submissions
  USING (((status = 'accepted') AND public_consent)
    OR ((SELECT auth.uid()) = user_id) OR (SELECT public.is_admin()));

ALTER POLICY "nfx_manuscript_read" ON public.nfx_manuscripts
  USING (((status = 'published') AND public_consent)
    OR ((SELECT auth.uid()) = user_id) OR (SELECT public.is_admin()));
