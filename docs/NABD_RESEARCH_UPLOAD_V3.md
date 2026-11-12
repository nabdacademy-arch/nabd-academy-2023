# Research PDF upload v3 — file pickers & resumable files

- The publisher can select a PDF from **any document provider exposed to the browser**: local device, Android system file manager, downloaded attachments, WhatsApp's document provider, Google Drive's document picker, etc. The page does not require moving a file to Downloads.
- Browser permissions cannot be bypassed. If an app returns a zero-byte, unreadable virtual file, **no website can force that provider to expose its contents**. The UI explains this and suggests opening the full browser or re-choosing the document via a supported provider. Apps must allow file handoff.
- The chooser is unfiltered by extension/MIME to avoid hiding PDFs from unusual file providers; the uploader **validates the actual PDF header** (not filename alone) before upload. Only PDF research is published.
- The bucket limit is set to **50 MiB**; this remains subject to Supabase's *global* storage limit. If the global setting is lower, an administrator must change it in Storage Settings.
- Small uploads (at most 6 MiB) use Supabase Storage standard upload; larger uploads use tus-js-client 4.3.1 via pinned browser CDN when available with fixed 6 MiB chunks, retries and visible progress. If the client library fails to load, a standard upload fallback is attempted.
- The private Storage bucket, user-ID object path policies, authorized publisher checks, and public access to already-published PDFs are unchanged.
- Tested simulated file-provider cases: valid PDF with non-PDF filename, 12 MiB TUS upload, 51 MiB rejection, non-PDF rejection, and zero-byte metadata with readable contents. Live multi-app browser acceptance test remains required; no real PDF or researcher account was used in the simulation.

## Manual acceptance test
1. Open research-manager.html logged in as the authorized researcher.
2. Select a genuine PDF directly from the Android picker, WhatsApp document picker or Drive provider. Observe actual byte size and status.
3. Publish (never use confidential patient material). The paper should appear in Research News and the PDF should open.
4. Test a 7–25 MiB PDF with network instability; the progress display should increment, and a transient failure should retry.
5. If a provider reports zero bytes, retry selection in the full Chrome/Firefox browser. The site cannot obtain bytes the provider refuses to share.
