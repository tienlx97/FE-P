# Requirements

- Contracts use TanStack's row, column ordering, visibility and pinning models.
- Existing toolbar, API pagination/filtering, CSV and dialog actions retain their behavior.
- Mint headers, white rows, density and dividers use existing Astryx components/theme.
- GIÁ TRỊ uses real colspan headers; unrelated headers use rowspan.
- Headers remain visible during vertical scrolling; pinned cells align during horizontal scrolling.
- Totals remain independent of page filtering; an empty result still shows an explanatory message.
- A multi-row fixture exercises desktop/mobile scrolling, presets, filters, CSV and dialogs.
