# Home requirements

- Signed-in users see PNJ-published regional PNJ/SJC buy/sell quotes in VND/lượng, original source link and each quote update time.
- Invalid/missing gold payload gives null gold and PNJ in unavailableSources; news/weather remain usable.
- Source requests are fixed, bounded and cached with the existing Home snapshot.
- Home displays weather and gold as responsive quick-look panels, scoped operations before news, and shorter initial news lists with an accessible expand/collapse button.
- Loading, partial failure, retry and empty states remain visible; mobile has no horizontal overflow.
