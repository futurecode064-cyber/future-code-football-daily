# Football brand export layout verification — 2026-10-28

Production fix: AI-Recap-GitHub:football-daily-render commit 54073c1c13e229d8d8cfc4155b7fa79ec834ee43. Source equivalent: aa4117f4d95ec9036e68a33a4b3be8010ede7a42. Rollback base: 72375a8665729ce9462dea991f104a5b9b851074. Concurrent frame-editor changes were preserved.

The BCF league-label repaint multiplied html2canvas's existing 2x transform, causing oversized duplicate labels over table headers and fixture rows. Export clones now hide labels only inside html2canvas, then paint complete native-shaped Myanmar labels once using an absolute transform and clipped measured label boxes. The original gradient and crest remain untouched. All brands share this path.

All 54 current-day team URLs and all four competition crests resolve to verified bundled PNGs. Previously missing lower-division Spanish cup teams are included. Existing data URLs, prose, prices and fixture ordering were preserved. Added bundled Myanmar font registration for home-page canvas exports and fixed the compact odds table columns to total the actual 1152px inner width. Compact kickoff cells show HH:mm. Export module URLs were refreshed.

Local browser QA: Main plus six clones, desktop 1280x900 and mobile 390x844. Six clones: actual split odds PNG button, all-in-one odds button, full-article preview download, verified-results download. Main: shared odds API, preview, results. PNG files opened successfully. Every day's 58 distinct team/competition images loaded from same origin. Native heading transform asserted equal to 2, not 4. BCF both 14-row and 13-row split pages downloaded and visually inspected; Spanish cup crests complete. Representative preview and compact odds PNGs also visually inspected.

Live cloud-browser QA after publication: Bet City, YKZ, BW Sport, Ko Thet, Goal Zone and KMM actual odds PNG download controls succeeded. BCF second page PNG opened at 2160x2241 with proper single headings, all Spanish cup team crests and original top/bottom banners. Shared assets could not be fetched from the shell's network path (403); live verification used the cloud browser. Local test suite: 46 focused existing tests passed; expanded asset suite 18 passed; new native-label regression 1 passed. These suites overlap and are not additive totals. Broader historical suite not certified.

No daily content publication, runtime-reader switch, login change, database change or new site was performed.
