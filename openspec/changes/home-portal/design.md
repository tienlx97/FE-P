# Design

Keep ProtectedAppShell and the 1280px content budget. Desktop: a 1.7:1 grid,
with featured news and three secondary rows on the left, notices and a single
company calendar on the right. Mobile: stack the editorial region, notices,
calendar, videos, then ecosystem. Use divided rows for secondary news.

Keep teal #247768, accent wash #e5f8f3, white #ffffff and theme neutrals, all
through tokens. Optimistic Display Vietnamese headings, Optimistic Text
Vietnamese body. Signature: one editorial image anchors the page, with compact
operational information in the adjacent column; avoid repeated card galleries.
Use neutral category text and an explicit pinned marker.

Server supplies the Vietnam date; client month controls update grid and
agenda together. Holidays have explicit config metadata and render in the
calendar only. Secondary stories expand locally, avoiding a misleading archive
link to /docs. Videos retain the on-demand player and lose repeated descriptions;
the ecosystem is one compact logo strip. The carousel no longer auto-advances.
