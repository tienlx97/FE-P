# Home requirements

- Desktop (≥64rem) shows a reading column (scoped operations, then news) beside a sticky quick-look rail with weather and gold; the rail stays below the 64px app header while scrolling.
- Below 64rem the rail renders first; between 40rem and 64rem weather and gold sit side by side; mobile has no horizontal overflow.
- Gold shows PNJ/SJC buy and sell in millions of VND/lượng as a compact table, with each quote's update time and the PNJ source link.
- The header shows the snapshot's Vietnam date and update time; the refresh action, loading skeletons, partial-failure and error banners remain.
- Users without `logistics:contracts:view` get the same layout without an empty operations row.
