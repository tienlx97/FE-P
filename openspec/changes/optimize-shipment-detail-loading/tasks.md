# Tasks

- [x] 1. Single-shipment query, tab-gated cost groups and reference-data
  `staleTime`; browser QA (Overview: 7 requests incl. single-shipment GET and
  no cost groups; Costs tab fetches them); full harness. ESLint now ignores the
  orphan generated `kt-xnk.{js,d.ts}` that failed the lint gate.
- [ ] 2. Replace the full supplier list on the detail page by an id-batch lookup
  (needs BE endpoint).
  - 2026-10-07 measurement (26KCT39/LOT-01, Timeline tab): production build
    TTFB 46 ms, DOMContentLoaded 126 ms, load 506 ms, 3.4 MB JS decoded; dev
    API calls on load = shipment, schedule, journey, alerts, 10–40 ms each —
    no supplier list request. The 8–12 s seen during work was `next dev`
    (TTFB 3.3 s, ~23 MB unminified chunks). Recommendation: drop this task
    unless a slow production measurement shows otherwise.
