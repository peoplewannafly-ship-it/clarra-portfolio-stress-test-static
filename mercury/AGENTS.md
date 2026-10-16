# Mercury operations

The source of truth is the existing Mercury content board. Preserve its records and history. Do not modify synced project sources, other site routes, DNS or unrelated assets.

After every meaningful Mercury action (publication, scheduling, edit, completed check, automation change, failure or blocker), immediately update the relevant existing board record via `mercury-update.yml`. Include a factual public `lastAction`, `nextAction` (empty only when nothing remains), and the affected status, dates and links. If an action is partially successful, record exactly what succeeded and what remains. Never report completion before the source read-back and public snapshot are confirmed. Local ledgers alone do not complete an action.

Each workflow update publishes the public snapshot immediately, including its sanitized action history. Inspect the workflow result and the online tracker. Do not wait for the scheduled sync. If a board write or sync fails, report it and retain the verified action evidence for reconciliation; never repeat a Pinterest publication to repair a tracking failure.

Mark pins published only after checking their live Pinterest URL and destination. Preserve `publishedUrl` as empty while queued. Keep credentials exclusively in GitHub Actions Secrets. Public action summaries must contain no credentials, private notes or personal data.

Read `README.md` and `sync/update.mjs` before using the updater. New publication IDs require an explicit allowlist extension; never reuse an old ID or erase publication history. Update only the approved Mercury route and verify existing site files before and after UI deployment.
