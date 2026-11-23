# NABD Guardian — synthetic availability checks

A non-intrusive uptime monitor for the existing NABD Academy GitHub Pages website and Supabase backend. The homepage and internal portal designs are unchanged.

## What it actually checks

- **Website:** an HTTPS GET for the current public GitHub Pages URL.
- **Database:** a single anonymous, read-only PostgREST query to `public.courses` with `?select=id&limit=1`. An empty JSON array is healthy; no student profile, exam result, certificate, or other private row is read.
- **Frequency:** six checks per day at minute 17 every four hours (UTC), with at most one retry after two seconds.
- **Identity:** the `NABD-Guardian/1.0` User-Agent clearly marks synthetic traffic. These requests must **not** be represented as real users, student sessions, visits, or engagement.

The monitor uses only the publishable/anon key already shipped in `assets/js/config.js`. Never place a `service_role`, secret API key, database password, or student JWT in this workflow or in the public repository.

## Running and checking

1. Open GitHub > Actions > **NABD Guardian - website and database monitoring**.
2. Choose **Run workflow** to request an immediate synthetic check (after this workflow is merged to the default branch).
3. Review both `[OK]` checks. A failed check returns a non-zero exit status and marks the workflow failed.
4. Configure GitHub Actions failure notifications for the repository owner; optionally add an independent uptime provider with an account you control.

To run locally: `python3 scripts/nabd_guardian.py`. Optional overrides: `NABD_GUARDIAN_SITE_URL`, `NABD_GUARDIAN_SUPABASE_URL`, and `NABD_GUARDIAN_PUBLISHABLE_KEY` (publishable/anon key **only**).

## Operational limits

- GitHub Actions scheduled workflows in public repos can be **automatically disabled after 60 days without repository activity**. This is why the GitHub workflow is **not** a standalone uptime guarantee; use independent uptime monitoring (for example, UptimeRobot for the site and a scheduler that supports a custom `apikey` header for the Supabase read request).
- Supabase Free projects may be paused due to insufficient activity over seven days. Real API reads *may* help a lightly-used app remain active, but automated checks **cannot guarantee** that Supabase won't pause it. Supabase Pro or another paid plan is the documented protection against inactivity pausing.
- A public website HTTP 200 does not confirm the database works. Monitoring the public `courses` route provides a separate, lightweight real database query.
- Avoid automated logins, fake accounts, artificial student clicks, or writing records for heartbeat purposes. Exclude Guardian's User-Agent from visitor/engagement analytics.
- This workflow is **monitoring**, not an off-site backup. Protecting educational records still requires a separate, encrypted, access-controlled backup and periodic restore drills.

## If the check fails

1. Check the GitHub Actions run. Site and database checks run independently, so an outage in one does not skip the other.
2. Confirm the site URL and existing public `courses` RLS policy are still correct.
3. If the Supabase project is paused, the owner must resume it in the Supabase Dashboard. This workflow cannot unpause or recover it automatically.
4. If the workflow is disabled after repository inactivity, re-enable it and ensure external monitoring is active.

Official references: [Supabase free project pausing](https://supabase.com/docs/guides/platform/free-project-pausing) · [GitHub scheduled workflow disabling](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows).
