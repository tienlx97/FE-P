# Proposal: Tối ưu workspace Logistics

**Status:** draft
**Created:** 2026-09-10

## Why

Người dùng yêu cầu rà soát `/logistics/*`, dùng chung layout Xem ↔ Sửa với
dịch chuyển bằng 0, và đánh giá phạm vi chức năng của dialog Contract.
Khảo sát cho thấy form chính đã dùng chung cấu trúc, nhưng Lưu/Hủy không
thống nhất và đổi tab Commission trong Contract làm mất bản nháp không cảnh báo.
Contract còn điều khiển nhiều đối tượng có vòng đời lưu độc lập, gây khó hiểu
về phạm vi nút Lưu và điều hướng.

## What changes

- Bảo vệ bản nháp khi đổi tab, đóng, quay lại hoặc mở đối tượng liên quan.
- Thống nhất Xem → Sửa → Lưu/Hủy → Xem tại chỗ; giữ tab, scroll và disclosure.
- Giữ hình học trường, header và footer khi đổi chế độ; chế độ Xem dễ đọc/copy.
- Thu hẹp Contract thành hồ sơ hợp đồng; Shipment, Commission và BOQ quản lý
  nghiệp vụ riêng, truy cập được từ phần liên quan của Contract.
- Sắp xếp sidebar theo nghiệp vụ/danh mục và giảm số cột mặc định của bảng.

## Out of scope

- Thay đổi quy tắc kế toán, hợp đồng API, dữ liệu hoặc quyền backend.
- Xây dashboard với chỉ số giả hoặc số liệu chưa có nguồn.
- Thay framework, design system, hoặc thêm thư viện khi chưa cần thiết.
- Sửa các thay đổi đang dang dở ngoài phạm vi Logistics này.

## Evidence and limits

- Khảo sát mã nguồn và bản build local, dùng dữ liệu giả lập; không ghi dữ liệu thật.
- Các trường được đo trong Contract, Shipment, Commission và chi phí đạt 0px
  khi Xem → Sửa ở 1440px/390px. Chưa đủ bằng chứng cho toàn bộ vòng hai chiều,
  mọi tab và mọi dữ liệu. Ca VGM rỗng không chứng minh hình học VGM có dữ liệu.
- Bộ kiểm tra cũ chấp nhận ≤2px; plan mới yêu cầu 0px cho chuyển chế độ thuần túy.
- Commission trong Contract mất bản nháp khi chuyển tab; đã tái hiện.
- Shipment/Commission độc lập đóng sau lưu; Hủy đi qua luồng đóng.
  Contract thay key theo revision và đưa về tab info sau onSuccess.
- Evidence local (gitignored): `harness/runs/20260910-stable-dialog-layout/geometry.json`,
  `harness/runs/20260910-logistics-review/dirty-tab.json` và ảnh cùng thư mục.
  Runner cũ cần cập nhật fixture search Contract sang envelope
  `{ page, valueTotals, settlements }` trước khi tái sử dụng.

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-09-10 | Lưu đề xuất thành plan; chưa triển khai | Người dùng yêu cầu lưu plan sau khảo sát. |
