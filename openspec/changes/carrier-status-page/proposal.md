# "/live" — carrier API status page

## Why

The user wants to see at a glance whether each carrier's vessel schedule
and tracking API works, designed like Anthropic's status page
(status.anthropic.com). BE: `add-carrier-status` (`GET /api/v1/carrier-status`,
`POST /api/v1/carrier-status/check`).

## What changes

- Route `/live` (permission `logistics:contracts:view`), entry "Trạng thái
  API hãng tàu" under Logistics › TIỆN ÍCH.
- Feature `carrier-status`: overall banner; per connected carrier a card
  with "Lịch tàu" / "Tracking": state dot + label, adapter version, uptime
  %, 90 day bars (tooltip: checks / failures), latest probe detail +
  latency + time; carriers with nothing connected in one line; legend;
  "Kiểm tra ngay"; refresh every minute.
