# Mercury client account prototype

Published at `/mercury/`. The Pinterest media plan has a separate entry point at `/mercury-plan/`; its original assets, data.json and sync workflow remain at their original paths. A copy of the plan JS under `/mercury-plan/app.js` changes only the home/logo link to the new plan route.

The account contains four real Foriver report groups from the September 30, 2026 forwarded collection: preparation (capture date unknown), mobilization/plaster completion (capture date unknown), September 21 and September 23. There are 31 photos and 7 videos. Videos were converted to H.264/AAC MP4 for browser playback; image metadata was removed during WebP export. No customer names, chat identifiers, spreadsheet URLs or credentials are included.

The initial `/mercury-report/` demo is unchanged and remains available inside the account as a clearly labelled separate demo record. Authentication, reviews, acceptance and signing are prototype interactions. No backend, access-control enforcement, real signatures, financial transactions or message delivery are implemented. Guest routes provide a read-only presentation, not a security boundary.

Release scope: `mercury/index.html`, `mercury/client-assets/*`, `mercury-plan/*`, and this documentation. Preserve all neighboring pages and Pinterest data/workflows. For a UI release, select the intended Git commit in Timeweb app 248239, deploy, and verify both public routes and original `/mercury-report/` and root pages.

Animation update: the original Mercury logo film now runs on initial account load and when opening a different report (including opening from the catalogue). The parent owns automatic playback so embedded reports do not play a second intro. Skip/Escape, portrait playback, reduced-motion manual playback and the original animated-image fallback are supported. Ordinary section navigation and actions within the same report do not restart the intro.
