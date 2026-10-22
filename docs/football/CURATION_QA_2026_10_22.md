# Current published-source last-five editorial audit (read-only)
Date: 2026-10-22, source branch football-engine/workers-d1-migration
Source: football-daily/data/today.json and data/odds/2026-10-22.json

## Scope and status
- Original report fixtures: 36. Original odds fixtures: 36.
- Fixture IDs: all 36 match across both files; unique order and odds pair match in sampled structural check.
- **NOT APPROVED FOR NEW ENGINE PRODUCTION PUBLISH** due to excluded non-competitive form results.
- No existing data, odds, source URLs, production endpoints, drafts or engine state changed by audit.
- These items are reported by current recorded competition label ('Friendlies Clubs');
  do not replace with guessed competitive results.

| Fixture row | Team (side) | Date | Competition | Opponent | Recorded source |
|---|---|---|---|---|---|
| 1 — fc-20261022-01 | Ararat-Armenia (home) | 2026-10-03 | Friendlies Clubs | Ararat | https://sokascore.com/team/ararat-armenia/results/ |
| 4 — fc-20261022-04 | Lech Poznan (home) | 2026-10-03 | Friendlies Clubs | Energie Cottbus | https://sokascore.com/team/lech-poznan/results/ |
| 12 — fc-20261022-12 | Jagiellonia (home) | 2026-10-03 | Friendlies Clubs | Polonia Warszawa | https://sokascore.com/team/jagiellonia/results/ |
| 12 — fc-20261022-12 | Jagiellonia (home) | 2026-09-29 | Friendlies Clubs | Suduva Marijampole | https://sokascore.com/team/jagiellonia/results/ |
| 12 — fc-20261022-12 | Anderlecht (away) | 2026-10-02 | Friendlies Clubs | Reims | https://sokascore.com/team/anderlecht/results/ |
| 27 — fc-20261022-27 | Riga (away) | 2026-10-03 | Friendlies Clubs | Aris | https://sokascore.com/team/riga/results/ |

## Required QA before approval
1. For affected team sides, search official club/league/UEFA completed fixtures (not future,
   unofficial friendlies or unverified duplicates), preserve exact five most recent eligible results.
2. Validate scores, opposition, dates, W/D/L, sources and preview commentary implications.
3. Independently compare original legacy-font PDF glyphs and source ledger; current row order count
   alone is not full PDF QA.
4. Run editorial validation and QA; review affected draft before publishing to shared D1.
5. Keep old published site static dataset unchanged until owner's approved controlled migration.

The migration branch now includes a rule that rejects friendly/exhibition/pre-season last-five
records, preventing them from silently passing `validateEditorial`.
