# Home requirements

- News tabs: Mới nhất, Thời sự, Thế giới, Kinh doanh, Công nghệ, Thể thao, Giải trí, Sức khỏe, each with a count; logistics tabs: Tất cả, Việt Nam, Hàng hải & cảng, Hàng không, Chuỗi cung ứng.
- The calendar shows today's Vietnam date (rolls over at Vietnam midnight, never rendered from the server clock), weekday, solar or lunar observance, lunar day/month (leap marked), Can Chi of day/month/year, six auspicious hours and a proverb stable for the day; Sundays and observances are red.
- Lunar conversion matches published calendars for Tết 2024–2026, Trung thu 2026 and the 2025 leap sixth month.
- Gold shows PNJ and SJC tiles with update time, buy, sell and spread in millions of VND/lượng.
- Rail order: weather, calendar, gold; calendar renders even when the feed fails; mobile has no horizontal overflow.
- "Tin nổi bật" shows the newest story of each news topic in a Carousel of fixed-size cards (16rem × 10rem; topic tag, three-line title, source and time).
- Logistics tabs add Hải quan and Cước & forwarder, filtered by article `tags`; an article may appear in several tabs.
