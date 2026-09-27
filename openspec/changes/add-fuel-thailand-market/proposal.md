# Xăng dầu: tab Thái Lan

## Why
User request: "Làm mục xăng dầu cho tab Thái Lan". The fuel utility had a
single "Việt Nam" tab; FE assumed đ/lít, whole-number prices, 15:00 and
the VN product list everywhere.

## What
- `FUEL_MARKETS` entries carry `currency`, `unit`, `fractionDigits`,
  `effectiveTime` and their own `products` (with xăng / dầu `category`);
  `FUEL_PRODUCTS` is gone. Every card, the chart, history, tooltip pills
  and the drawer take the `market`.
- "Thái Lan" (`TH`): Bangkok retail prices, ฿/lít with 2 decimals,
  effective 05:00. Task 1 used Bangchak (current prices only); task 2
  (user asked for a source with history) uses PTT OR's web service
  (BE-kt-xnk `fuel-price-thailand`): 9 products (Gasohol 95 / 91 / E20,
  Gasoline 95, Super Power GSH95 / X99, Diesel, Diesel B20, Premium
  Diesel), history from 01/01/2022 (335 periods).
- News stays shared under the tabs (Vietnamese Google News).
