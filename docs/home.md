# Home · Bản tin hôm nay

Home replaces the sample company portal. Public data comes from authenticated
BE-P `GET /api/v1/home`: HCM current model weather, three daily forecasts,
VnExpress/Tuoi Tre headlines and logistics/import-export/shipping news including
Seatrade Maritime (English titles kept in their original language).
Only titles, publication times, publisher names and original article links are shown.
The weather provider is attributed to Open-Meteo. Tuoi Tre's offsetless publication
dates are interpreted in Vietnam time by BE-P.

The public feed refreshes every 15 minutes and on “Cập nhật”; the backend snapshot
is cached 15 minutes, or two minutes when a source fails. API and partial source
errors are visible. No fake fallback stories or weather. The article selection is
the latest RSS entries, not a popularity score or manual editorial ranking.

`logistics:contracts:view` users also see active shipment counts, the number on
board, danger alerts and up to five shipment links (danger-alert rows first).
Company scoping remains enforced by the existing backend shipment overview query.
Users without the permission do not mount the operation widget or request its data.

For commercial weather API use, set backend `HomeFeed__WeatherApiKey` with an
Open-Meteo commercial subscription; no key belongs in frontend code.
See BE-P `docs/api/Home.md` for source URLs and API details.

UI verification: use the local account in ignored `.ai-login.local.md`, frontend
configured with `API_BASE_URL=http://localhost:8081`. Verify desktop/mobile, loading,
empty operations, source failure feedback, update action and original article links.
No shared operational data needs to be edited for these checks. Historical
`home-portal-browser.mjs` was removed with the portal it tested.

Home now includes PNJ-published regional PNJ/SJC buy/sell quotes, displayed in millions of VND/lượng with each quote update time in Vietnam. Backend returns VND/lượng; the widget retains 1,000 VND precision. PNJ is an independent nullable source.

Layout: compact reading width, weather/gold quick panels side by side on desktop and stacked on mobile, scoped shipment operations before news. Each news column initially shows five articles; expand/collapse preserves original publisher links. The app composes operations through the Home slot; there are no cross-feature imports. Dashboard uses normal UI density and one page inset instead of doubled padding.

Redesign (2026-10-05, `redesign-home-dashboard`): desktop ≥64rem uses a reading column (operations → news, each in a card) and a sticky 22rem rail (weather, gold table). Below 64rem the rail comes first; 40–64rem shows its two cards side by side. Without the operations permission the grid drops the operations area instead of leaving a gap.

Hourly weather and filters (2026-10-05, `home-hourly-weather-and-news-filters`, BE-P `enrich-home-feed`): weather card (blue tint) shows feels-like, humidity, wind, UV band, precipitation, a 12-hour strip and an iconised 3-day forecast. Gold card uses a yellow tint. Headlines (VnExpress, Tuổi Trẻ, Thanh Niên, Dân trí) filter by publisher with a featured lead; logistics filters Việt Nam / Quốc tế by `region`. Publisher colours live in `config/news.js`; relative times use the query's `dataUpdatedAt` (pure render).

Calendar, topics and gold (2026-10-05, `home-calendar-topics-and-gold`, BE-P `home-topic-news-and-logistics-press`): news/logistics cards use TabList topics from `config/news.js`. `calendar-card.jsx` renders a tear-off calendar page from `config/lunar.js` (pure lunar conversion, Can Chi, giờ hoàng đạo, observances, proverbs) and `hooks/use-vietnam-today.js` (useSyncExternalStore; null on the server so no hydration mismatch). Gold uses muted tiles with spread. Rail = weather, calendar, gold, not sticky. Note: Text `type` overrides xstyle colour/size — use `color="inherit"` or a sized wrapper with `type="inherit"`.

Featured carousel and shipper tags (2026-10-05, task 1.2): `featured-news.jsx` shows `leadPerTopic` as fixed 16×10rem ClickableCards in a Carousel above the topic list. Logistics tabs filter by `tags` (customs, freight, then group); headlines' empty `tags` fall back to `topic`.
