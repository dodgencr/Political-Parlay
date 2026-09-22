# Florida Influence Ledger

A private, source-linked dashboard for Florida's serving U.S. House members and senators. Click **Sync latest records** to refresh the roster, FEC summaries, House indexes, and member-by-member LD-203 disclosures. Keep the tab open during a full sync; successful updates are saved immediately. Stop ends after the current source. Source failures preserve prior snapshots.

## Coverage
- Current roster: Congress.gov, with FEC identifiers cross-referenced from unitedstates/congress-legislators.
- Campaign finance: 2025–26 FEC totals and direct links to donor/committee filings. Individual donor lists are viewed on FEC, not imported into this version.
- Lobbyists: 2026 LD-203 contributions and related payments, with actual payee, honoree, filer, date, amount, and original documents. Name matches are incomplete evidence, not allegations. Searches can be capped; the dashboard flags partial results. Identical disclosed entries are grouped, retaining source links; amounts are not aggregated.
- Personal finances: 2026 House filing index and original PDFs. Asset values, income and gifts have not been extracted. Senate records require manual review at the official portal.
- Travel: 2026 House member/staff filing index with sponsor and original PDF; Senate travel links to the official disclosure guidance.

Lobbying expenses paid to a lobbying firm are not contributions to a legislator. This version does not import LD-2 lobbying expenditure/client relationships, outside spending, beneficial ownership, or unreported money. No corruption score is assigned.

## Running and maintaining
Node 22.13+ and npm are required. Run `npm install`, `npm run dev`. The Sites build uses the bundled Sites build helper. D1 stores snapshots using the generated migration under `drizzle/`; hosting applies it before publishing. Local D1 can apply the SQL file with Wrangler. Baseline real-source snapshots are in `app/data/seed.json` and remain readable if live sources are down.

The configured window is 2026 in `lib/sources.mjs` and the UI. A new election cycle requires a deliberate rollover. Free public/demo API access is rate limited. The app serializes requests within a sync but simultaneous tabs can still exhaust upstream quotas. There is no background scheduler: sync runs while this page is open.

Checks: `node scripts/sources.test.mjs` and `node node_modules/typescript/bin/tsc --noEmit`. Source tests cover name disambiguation, amendments and payment recipient preservation. Local checks also verified database persistence, responsive layout, filters, tabs and error states. WebMCP is feature-detected; validation was unavailable in the local browser.
