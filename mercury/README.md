# Mercury shared plan

Public UI: https://go.clarra.ru/mercury/
Report: https://go.clarra.ru/mercury/#report-2026-10-15

The existing private Mercury board remains the only editing source. The scheduled GitHub Actions workflow reads its API every five minutes, projects only MP01–MP08 and T01–T12, and writes `mercury/data.json`. New records require an explicit allowlist change. Notes, metrics, history, credentials and arbitrary URL hosts are excluded.

The browser reads the public snapshot from this repository every 30 seconds while visible. No Timeweb redeploy is required for data changes. The copy on go.clarra.ru is a fallback from the last UI release; if the live read fails, the UI labels the error and retains the last available snapshot. The snapshot timestamp advances on data changes or an hourly successful check. GitHub scheduling and caching may delay updates; the UI shows the snapshot time and warns after two hours.

`MERCURY_PLAN_READ_TOKEN` exists only in GitHub Actions Secrets. It is sent only by a GET request to the fixed Mercury board host, with redirects disabled. The workflow never edits the source board. It pushes only `mercury/data.json`. Failed reads preserve the previous snapshot and fail the workflow visibly.

Build the UI from `mercury/source`: install its pinned dependencies, then `npm run build`. Commit only the resulting Mercury files and source changes. Do not replace the existing root, assets, fonts or mercury-report directory.

Timeweb app 248239 uses the public GitHub repository by URL and a manually selected commit. UI releases must select the intended SHA in its deployment settings and trigger deployment. The working baseline before this release was `7dbb74baaaf59b93ab1243cf1cda0cef42de8f21`. All 28 pre-existing files matched the live site before this release. DNS and other application settings were not changed.

Validation: projection allowlist/URL tests, TypeScript, browser tabs/search/status filter, CSV with eight records, responsive view at 390 px, source API through a successful Actions run. The dated report is a historical record for 15 October; status counters and cards use the synchronized data.
