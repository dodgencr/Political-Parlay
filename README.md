# Political Parlay



A source-linked dashboard for Florida's serving U.S. House members and senators. Click **Sync latest records** to refresh the roster, FEC summaries, House indexes, and member-by-member LD-203 disclosures. Keep the tab open during a full sync; successful updates are saved immediately. Stop ends after the current source. Source failures preserve prior snapshots.



## Coverage

- Current roster: Congress.gov, with FEC identifiers cross-referenced from unitedstates/congress-legislators.

- Campaign finance: 2025â€“26 FEC totals and direct links to donor/committee filings. Individual donor lists are viewed on FEC, not imported into this version.

- Lobbyists: 2026 LD-203 contributions and related payments, with actual payee, honoree, filer, date, amount, and original documents. Name matches are incomplete evidence, not allegations. Searches can be capped; the dashboard flags partial results. Identical disclosed entries are grouped, retaining source links; the Breakdown tab aggregates observed grouped amounts with explicit deduplication and coverage limits.

- Personal finances: 2026 House filing index and original PDFs. Asset values, income and gifts have not been extracted. Senate records require manual review at the official portal.

- Travel: 2026 House member/staff filing index with sponsor and original PDF; Senate travel links to the official disclosure guidance.



Lobbying expenses paid to a lobbying firm are not contributions to a legislator. This version does not import LD-2 lobbying expenditure/client relationships, outside spending, beneficial ownership, or unreported money. No corruption score is assigned.



## Running and maintaining

Node 22.13+ and npm are required. Run `npm install`, `npm run dev`. The Sites build uses the bundled Sites build helper. D1 stores snapshots using the generated migration under `drizzle/`; hosting applies it before publishing. Local D1 can apply the SQL file with Wrangler. Baseline real-source snapshots are in `app/data/seed.json` and remain readable if live sources are down.



The configured window is 2026 in `lib/sources.mjs` and the UI. A new election cycle requires a deliberate rollover. Free public/demo API access is rate limited. The app serializes requests within a sync but simultaneous tabs can still exhaust upstream quotas. There is no background scheduler: sync runs while this page is open.



Checks: `node scripts/sources.test.mjs` and `node node_modules/typescript/bin/tsc --noEmit`. Source tests cover name disambiguation, amendments and payment recipient preservation. Local checks also verified database persistence, responsive layout, filters, tabs and error states. WebMCP is feature-detected; validation was unavailable in the local browser.



## Pages and map

About Us includes the mission and founder bio; Political Parlay contains the live dashboard; References lists sources and methodology. The interactive district map uses simplified Census TIGERweb layer 4 boundaries for the 119th Congress (2025–26), not future election boundaries. Sync does not replace this geometry. Flag photograph: Scrumshus / Wikimedia Commons, public domain.



Live site: https://pollitical-parlay.dodgencr.chatgpt.site (invite-only). Source repository: https://github.com/dodgencr/Political-Parlay (public).



## Voting and money analysis
- Voting history covers the current Florida delegation from calendar year 2020 through the imported September 2026 records, limited to each member’s service. Topics use congressional policy areas; entries consolidate a bill within a year and retain every roll-call link. Passage/final agreement, amendments, procedure, nominations and other recorded actions remain separate.
- `app/data/votes.json` contains House Clerk and Senate XML records supplemented by UCLA Voteview’s congress 116–119 bulk exports. Bill policy-area gaps were filled from GovInfo BILLSTATUS. Official positions take precedence on overlap; source attribution is retained per vote. Some policy areas remain unclassified when the source provides none. Coverage is reported by legislative session; the UI groups by calendar date.
- Voting data loads only when a member’s Votes tab is opened. Full sync refreshes the latest 20 rolls and any newer 2026 rolls, in small batches per chamber, persisted separately in D1. Archived years are snapshots, not automatically refreshed. Rate limits or failed requests preserve previous data.
- The money pivot can group candidate receipts or observed LD-203 records by party/member, and LD-203 by contributor, payee or registrant. FEC receipts and LD-203 amounts overlap and are never added together. Identical date/amount/contributor/payee/type records are grouped across members; shared records are not duplicated in an overall view. Incomplete searches and name matching limit totals. Corporate parents are not inferred. SELF is resolved to the disclosed lobbyist or filer.
- Additional checks: `node scripts/analysis.test.mjs` covers cross-member deduplication, distinct payees, SELF attribution, FEC report selection and vote classification.

Voteview citation: Lewis, Jeffrey B., Keith Poole, Howard Rosenthal, Adam Boche, Aaron Rudkin, and Luke Sonnet (2026). Voteview: Congressional Roll-Call Votes Database. https://voteview.com/
