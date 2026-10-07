# Proposal: Compact mode setting, cost group title across three columns

**Status:** done
**Created:** 2026-10-07

## Why

User (2026-10-07): "Thêm mode compact trong setting" and, in shipment
detail > Chi phí Logistics, the group title row ("LOG-01 …", "LOG-02 …",
with the quick-add "+") should span three cells — its single "Nhóm chi
phí" cell is too narrow for the name. Choices: compact = tables only (1a);
the title spans STT + Nhóm chi phí + Tên khoản chi phí (2b).

## What changes

- Cost table group row: one cell spanning STT, Nhóm chi phí and Tên khoản
  chi phí holds the label and "+"; pinned left from 900px like the columns
  it replaces. Subtotal stays in Thành tiền.
- "Cài đặt giao diện": "Chế độ thu gọn" switch, persisted with the other
  layout preferences (localStorage). On → every table renders at compact
  row density (shared table components and direct Astryx tables, including
  ones with their own cell padding); off → each table's own density
  (including the per-table "Mật độ dòng" choice).

## Out of scope

- Compacting cards, forms, page padding or font sizes.
