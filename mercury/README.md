> Route update (2026-10-24): the Pinterest media plan is now at `/mercury-plan/`. Its assets and data remain under `/mercury/`. The `/mercury/` entry point is the client account prototype; see `client-portal-readme.md`.

# Mercury shared plan

Public UI: https://go.clarra.ru/mercury/
Report: https://go.clarra.ru/mercury/#report-2026-10-15

The existing private Mercury board remains the only editing source. The scheduled GitHub Actions workflow requests a read every five minutes, projects only MP01–MP27 and T01–T12, and writes `mercury/data.json`. New records require an explicit allowlist change. Private notes, metrics, credentials and arbitrary URL hosts are excluded. The user-approved public action journal is projected only for these same records; raw private history is never copied wholesale.

The browser reads the public snapshot from this repository every 30 seconds while visible. No Timeweb redeploy is required for data changes. The copy on go.clarra.ru is a fallback from the last UI release; if the live read fails, the UI labels the error and retains the last available snapshot. The snapshot timestamp advances on data changes or an hourly successful check. GitHub scheduling and caching may delay updates (observed scheduled runs on 16 October were several hours apart); the UI shows the snapshot time and warns after two hours.

`MERCURY_PLAN_READ_TOKEN` exists only in GitHub Actions Secrets. The scheduled `mercury-sync.yml` workflow uses GET only and never edits the board. The manual `mercury-update.yml` workflow also uses POST to update explicitly supplied, allowlisted existing records with revision checks and GET read-back. Both send the credential only to the fixed Mercury board host with redirects disabled, and push only `mercury/data.json`. Failed reads preserve the previous snapshot and fail the workflow visibly.

Build the UI from `mercury/source`: install its pinned dependencies, then `npm run build`. Commit only the resulting Mercury files and source changes. Do not replace the existing root, assets, fonts or mercury-report directory.

Timeweb app 248239 uses the public GitHub repository by URL and a manually selected commit. UI releases must select the intended SHA in its deployment settings and trigger deployment. The working baseline before this release was `7dbb74baaaf59b93ab1243cf1cda0cef42de8f21`. All 28 pre-existing files matched the live site before this release. DNS and other application settings were not changed.

Validation: projection allowlist/URL tests, TypeScript, browser tabs/search/status filter, CSV with eight records, responsive view at 390 px, source API through a successful Actions run. The dated report is a historical record for 15 October; status counters and cards use the synchronized data.

## Publication operations

Pinterest posts are published or scheduled in the native Pinterest interface for `bykovdess`. The GitHub workflows do not publish Pins. Never mark a Pin as published based on its planned date: first verify the live Pin URL, image, title and destination. Keep `publishedUrl` empty while queued and record the native queue URL in private `scheduleEvidence`.

For an approved source-board correction, dispatch `mercury-update.yml` with the `changes` input containing a JSON array of `{id, body}` patches. Existing MP01–MP27 and T01–T12 are supported. New approved MP09–MP27 may be created with `operation: "create"`, a title and `status: "План"`; creation uses revision 0 and refuses an occupied ID. Every patch must include public `lastAction` (what was actually done) and `nextAction` (what remains; empty only when finished). Read current records first, preserve unrelated fields, and never place credentials or sensitive content in workflow inputs. The updater fetches current revisions, merges the requested fields, checks every response and reads the records back. A conflict fails rather than overwriting. Do not automatically retry an ambiguous publication or write.

After the workflow succeeds, verify the generated public snapshot and the live Mercury page. Public projection excludes private notes and scheduling evidence. It includes `nextAction` and a filtered `activity` journal from the source history. Explicit action summaries are bound to their source revision, so later manual edits cannot incorrectly inherit an earlier action. Previously captured summaries remain in the latest 100 public journal entries even when the upstream API window advances. New weeks require explicit source-record creation and an allowlist extension; do not reuse previous publication IDs or erase history.

As of 20 October 2026: MP01–MP07, MP09 and MP10 have verified live URLs. The native scheduled release was observed for MP04 and later Pins, including MP10 at the evening slot on 20 October. The user explicitly authorized adapting the researched formats, preparing and publishing the next batch without another general approval. The initial test is three distinct Pins per day (12:00, 17:00, 20:00 Moscow); this is a Mercury experiment, not a measured competitor cadence. Two Codex thread automations are active: checks at 12:30, 17:30 and 20:30; queue replenishment daily at 10:00, targeting nine upcoming Pins. Both were resumed after the user's pause on 20 October. Large generated batches require art-director review, and generated concepts must be labeled separately from portfolio visualizations. The current batch uses original portfolio renders. Native Pinterest scheduling works independently of the Mac; local Codex checks and replenishment require the Mac and app to be running. A previous daily check ran on 17 October, but the new three-slot cadence and daily replenishment still need their first scheduled-run verification.

The overview period and CSV filename derive from the current records, so adding later dates does not leave a fixed first-week label. The report dated 15 October remains a historical record.

## Required completion sequence

After each meaningful action, update the source board immediately with its result and next step, await `mercury-update.yml`, and verify the online tracker. The updater publishes the snapshot in the same run; it does not wait for cron. On a partially failed multi-record update, a fresh snapshot is still attempted so successful source writes become visible, while the workflow retains its failure result. Report synchronization failures explicitly; never repeat a publication to repair the tracker.

The online overview derives published Pins (with verified links), upcoming Pins and unfinished tasks from the same records. Its action journal uses approved history IDs, timestamps, titles/statuses and explicit public action summaries; no local seed is the source of truth. The page refreshes in the background every 30 seconds and on visibility changes. External manual edits rely on scheduled sync until an immediate sync is dispatched; GitHub cron is best-effort, not a real-time webhook.

Example dispatch input: `{"changes":"[{\"id\":\"T09\",\"body\":{\"lastAction\":\"Проверена очередь Pinterest.\",\"nextAction\":\"Проверить фактический выход следующего пина.\"}}]"}`. A completed check should include its actual date/time in `lastAction`; retries of the same action should reuse the same patch to avoid duplicate history.

Validation: `node --test mercury/sync/tests/projection.test.mjs`, then `npm run build --prefix mercury/source` for UI edits. Keep the historical report for 15 October unchanged.
