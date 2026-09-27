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
- "Thái Lan" (`TH`): Bangkok retail prices from Bangchak (BE-kt-xnk
  `fuel-price-thailand`), ฿/lít with 2 decimals, effective 05:00, 8
  products (Gasohol 95 / 91 / E20 / E85, Hi Premium 98, Hi Diesel S,
  Diesel B20, Hi Premium Diesel). The source has no history: TH periods
  build up from each "Cập nhật giá" / manual input.
- News stays shared under the tabs (Vietnamese Google News).
