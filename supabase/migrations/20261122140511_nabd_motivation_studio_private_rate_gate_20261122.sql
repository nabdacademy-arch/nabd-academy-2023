-- Production migration 20261122140511: NABD Motivation Studio private abuse prevention.
-- Exact backend first applied on 2026-11-22. No applicant text is stored.
CREATE TABLE IF NOT EXISTS nabd_portal_private.nabd_motivation_rate_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key_digest text NOT NULL CHECK (length(key_digest)=64),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE nabd_portal_private.nabd_motivation_rate_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nabd_portal_private.nabd_motivation_rate_events FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS nabd_motivation_rate_digest_time_idx
  ON nabd_portal_private.nabd_motivation_rate_events(key_digest, created_at DESC);
CREATE INDEX IF NOT EXISTS nabd_motivation_rate_retention_idx
  ON nabd_portal_private.nabd_motivation_rate_events(created_at);

CREATE OR REPLACE FUNCTION public.nabd_motivation_try_rate(p_digest text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE v_hour integer; v_day integer;
BEGIN
 IF p_digest IS NULL OR p_digest !~ '^[0-9a-f]{64}$' THEN
   RAISE EXCEPTION 'INVALID_RATE_KEY' USING errcode='22023';
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_digest));
 DELETE FROM nabd_portal_private.nabd_motivation_rate_events
   WHERE created_at < now() - interval '48 hours';
 SELECT count(*) FILTER (WHERE created_at>=now()-interval '1 hour'),
        count(*) FILTER (WHERE created_at>=now()-interval '24 hours')
 INTO v_hour,v_day
 FROM nabd_portal_private.nabd_motivation_rate_events
 WHERE key_digest=p_digest;
 IF v_hour>=6 OR v_day>=24 THEN
   RETURN jsonb_build_object('allowed',false,'reason','RATE_LIMIT');
 END IF;
 INSERT INTO nabd_portal_private.nabd_motivation_rate_events(key_digest) VALUES (p_digest);
 RETURN jsonb_build_object('allowed',true);
END $$;
REVOKE ALL ON FUNCTION public.nabd_motivation_try_rate(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nabd_motivation_try_rate(text) TO service_role;
