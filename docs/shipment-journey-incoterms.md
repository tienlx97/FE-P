# Lộ trình tracking lô hàng theo Incoterm

Tài liệu nghiệp vụ cho khối **"Hành trình vận chuyển"** trên trang chi tiết
lô hàng (`/logistics/contract/[id]/shipment/[shipmentId]`, Figma 115:8469).

- Tài liệu này là nơi **chỉnh sửa / thống nhất nghiệp vụ**.
- Luồng chạy thực tế do BE-kt-xnk xử lý trong
  `src/CompanyManagement.Domain/Shipments/Journey/IncotermJourneys.cs` và
  `ShipmentJourney.cs`. Frontend lấy kết quả từ endpoint `GET .../journey`.
  Khi đổi nghiệp vụ, đồng bộ tài liệu với backend rồi chạy bộ kiểm tra của
  cả hai dự án.

Cập nhật lần cuối: 2026-09-24.

---

## 1. Nguyên tắc

1. **Một Master Journey duy nhất** (các mốc vật lý chuẩn, mục 2). Mỗi
   Incoterm chỉ **chọn 4–6 mốc chính** để hiển thị, không làm luồng riêng.
2. **Hành trình vật lý ≠ trách nhiệm Incoterm.** Mỗi mốc có:
   - **Phạm vi**: `Seller` hoặc `Buyer`.
   - **Marker** (★) tại điểm quan trọng:
     | Marker | Nhãn hiển thị | Ý nghĩa |
     |---|---|---|
     | `risk` | Chuyển rủi ro | Rủi ro chuyển từ Seller sang Buyer |
     | `freight` | Hết cước & BH | Hết phạm vi cước / bảo hiểm Seller đã trả |
     | `delivery` | Điểm giao | Seller hoàn tất nghĩa vụ giao hàng |
3. **Tiến độ lấy từ `Tình trạng` (status) của lô hàng**, ánh xạ theo từng
   Incoterm — cùng một trạng thái có thể là mốc khác nhau (ví dụ "Đã giao
   đến cảng": FOB = đã giao lên tàu ở cảng xuất; CIF = đã tới cảng đích).
4. Khi hết phạm vi Seller (`end`): mọi mốc Seller = **Đã hoàn thành**; các
   mốc Buyer phía sau **không có "Chặng hiện tại"** (Seller không theo dõi),
   hiển thị viền đứt nét + badge "Phạm vi Buyer".
5. Nếu trạng thái trỏ tới một mốc mà Incoterm không hiển thị → lấy **mốc
   hiển thị gần nhất phía trước** trong Master Journey.

---

## 2. Master Journey (mốc chuẩn)

| # | Mã mốc | Nhãn hiển thị | Tiêu đề trên thẻ | Ngày / thông số ở chân thẻ | Nhóm chi phí liên quan |
|--:|---|---|---|---|---|
| 01 | `cargo-ready` | Hàng sẵn sàng | Tên lô hàng | Đóng hàng = ngày đóng hàng VGM mới nhất | LOG-01 |
| 02 | `origin-inland` | Vận chuyển ra cảng | Đơn vị trucking (tên) | Hạn SI / VGM | LOG-02 |
| 03 | `origin-port` | Cảng xuất | Cảng xếp hàng (POL) | Khai hải quan = ngày khai tờ khai | LOG-03 |
| 04 | `on-board` | Xếp hàng lên tàu | Tàu {tên tàu} | Rời cảng (ETD) | LOG-03 → LOG-04 |
| 05 | `ocean` | Hải trình biển | {POL} → {POD} | Dự kiến transit = ETA − ETD (ngày) | LOG-04 |
| 06 | `destination-port` | Cảng đích | Cảng dỡ hàng (POD) | Đến cảng (ETA) | LOG-05 |
| 07 | `import-clearance` | Thông quan nhập khẩu | (nhãn mốc) | Phụ trách: Seller / Buyer | LOG-07 |
| 08 | `destination-inland` | Vận chuyển nội địa | — (chưa dùng) | — | LOG-06 |
| 09 | `site` | Giao tới công trình | Nơi đến theo hợp đồng | Giao hàng: Hoàn tất / — | — |
| 10 | `empty-return` | Trả cont rỗng | Đã trả {n}/{tổng} cont | Hạn trả rỗng (hết free time) | LOG-05 (DEM/DET) |

Mốc `empty-return` có trong hành trình CIF và lấy tiến độ từ các bản ghi VGM.

Thẻ chỉ giữ thông số tracking: nhãn mốc, tiêu đề (cắt "…" + tooltip khi
dài), badge trạng thái + marker, và **một** ngày / thông số ở chân thẻ.

---

## 3. Luồng theo từng Incoterm

Ký hiệu: **S** = Seller, **B** = Buyer, ★ = marker.

### 3.1 EXW — giao tại xưởng

> EXW: Seller giao hàng tại xưởng — Buyer nhận hàng và chịu chi phí, rủi ro từ đây.

| Mốc | Nhãn | Phạm vi | Marker |
|--:|---|---|---|
| 01 | Hàng sẵn sàng | S | ★ Điểm giao |
| 02 | Buyer nhận hàng *(mốc `origin-inland`)* | B | |
| 03 | Cảng xuất | B | |
| 04 | Hải trình biển | B | |
| 05 | Cảng đích | B | |

| Tình trạng | Mốc hiện tại |
|---|---|
| Đã book, Đang đóng hàng | Hàng sẵn sàng |
| Các trạng thái còn lại | `end` (Seller hoàn tất) |

### 3.2 FOB — rủi ro chuyển khi hàng lên tàu

> FOB: Rủi ro chuyển sang Buyer khi hàng đã xếp lên tàu tại cảng xuất.

| Mốc | Nhãn | Phạm vi | Marker |
|--:|---|---|---|
| 01 | Hàng sẵn sàng | S | |
| 02 | Vận chuyển ra cảng | S | |
| 03 | Cảng xuất | S | |
| 04 | Xếp hàng lên tàu | S | ★ Chuyển rủi ro |
| 05 | Hải trình biển | B | |
| 06 | Cảng đích | B | |

| Tình trạng | Mốc hiện tại |
|---|---|
| Đã book, Đang đóng hàng | Hàng sẵn sàng |
| Hạ bãi chờ xuất | Cảng xuất |
| Đã giao đến cảng | Xếp hàng lên tàu *(FOB: giao tại cảng xếp)* |
| Shipping | Hải trình biển |
| Khai HQ, Trucking đến site, Đã hoàn thành | `end` |

### 3.3 CIF — rủi ro lên tàu, cước & bảo hiểm đến cảng đích

> CIF: Rủi ro chuyển khi hàng lên tàu tại cảng xuất · Seller trả cước và bảo hiểm đến cảng đích.

| Mốc | Nhãn | Phạm vi | Marker |
|--:|---|---|---|
| 01 | Hàng sẵn sàng | S | |
| 02 | Cảng xuất | S | |
| 03 | Xếp hàng lên tàu | S | ★ Chuyển rủi ro |
| 04 | Hải trình biển | S | |
| 05 | Cảng đích | S | ★ Hết cước & BH |
| 06 | Buyer nhận hàng & nhập khẩu *(mốc `import-clearance`)* | B | |
| 07 | Trả cont rỗng *(mốc `empty-return`)* | S theo dõi | ★ Hoàn tất lô |

| Tình trạng | Mốc hiện tại |
|---|---|
| Đã book, Đang đóng hàng | Hàng sẵn sàng |
| Hạ bãi chờ xuất | Cảng xuất |
| Shipping | Hải trình biển |
| Đã giao đến cảng | Cảng đích |
| Khai HQ, Trucking đến site | Buyer nhận hàng & nhập khẩu |
| Đã hoàn thành | Trả cont rỗng *(nếu chưa trả hết cont)* / `end` *(đã trả hết)* |

**Mốc 07 — Trả cont rỗng (CIF)**

- **Vì sao Seller theo dõi:** với CIF, Seller là người ký hợp đồng vận tải
  (booking đứng tên Seller/forwarder của Seller). Cont do Buyer lấy hàng
  xong phải trả rỗng về depot hãng tàu; trả trễ phát sinh phí lưu cont /
  lưu bãi (DEM/DET) mà hãng tàu có thể tính ngược về Seller.
- **Tiến độ lấy từ dữ liệu container** (không lấy từ Tình trạng):
  | Điều kiện | Trạng thái thẻ |
  |---|---|
  | Chưa tới mốc 06 | Kế hoạch |
  | Mốc 06 xong / lô "Đã hoàn thành", còn cont chưa trả | **Chặng hiện tại** |
  | Tất cả cont đã trả rỗng | **Đã hoàn thành** |
  | Quá hạn trả rỗng mà chưa trả hết | Chặng hiện tại + cảnh báo đỏ "Quá hạn {n} ngày" |
- **Thẻ hiển thị:**
  - Tiêu đề: `Đã trả {n}/{tổng} cont` (tổng = số bản ghi VGM của lô).
  - Chân thẻ: `Hạn trả rỗng` = ngày hết free time; khi đã trả hết đổi thành
    `Trả xong` = ngày trả cont cuối cùng.
- **Lô chỉ được coi là hoàn tất phía Seller khi đã trả hết cont** — thanh
  "TIẾN ĐỘ LỘ TRÌNH" chưa đạt 100% khi còn cont chưa trả.

> Lưu ý UI: không ghi "Seller → Cảng đích" chung chung, vì dễ hiểu nhầm
> Seller chịu rủi ro tới cảng đích. Hai marker tách riêng rủi ro và cước.

### 3.4 DDP — Seller lo toàn bộ

> DDP: Seller lo toàn bộ hành trình, thông quan và thuế nhập khẩu đến điểm giao.

| Mốc | Nhãn | Phạm vi | Marker |
|--:|---|---|---|
| 01 | Hàng sẵn sàng | S | |
| 02 | Cảng xuất | S | |
| 03 | Hải trình biển | S | |
| 04 | Cảng đích | S | |
| 05 | Thông quan & thuế NK *(mốc `import-clearance`)* | S | |
| 06 | Giao tới công trình | S | ★ Điểm giao |

| Tình trạng | Mốc hiện tại |
|---|---|
| Đã book, Đang đóng hàng | Hàng sẵn sàng |
| Hạ bãi chờ xuất | Cảng xuất |
| Shipping | Hải trình biển |
| Đã giao đến cảng | Cảng đích |
| Khai HQ | Thông quan & thuế NK |
| Trucking đến site | Giao tới công trình |
| Đã hoàn thành | `end` (tất cả hoàn thành) |

### 3.5 Incoterm khác (chưa cấu hình)

Hệ thống hiện chỉ có EXW / FOB / CIF / DDP (enum `Incoterm`). Incoterm
chưa cấu hình dùng luồng mặc định **không marker**: Hàng sẵn sàng → Cảng
xuất → Hải trình biển → Cảng đích (ánh xạ trạng thái như CIF).

### 3.6 Dữ liệu cho "Trả cont rỗng"

| Dữ liệu | Đặt ở đâu | Ghi chú |
|---|---|---|
| Ngày trả cont rỗng | Mỗi container (`ShipmentVgm.emptyReturnedAt`, date, null = chưa trả) | Nhập ở tab VGM & Container |
| Depot trả rỗng | Mỗi container (`ShipmentVgm.emptyReturnDepot`, text, tuỳ chọn) | |
| Hạn trả rỗng (hết free time) | Lô hàng (`Shipment.operationalDetails.emptyReturnDeadline`, date) | Có thể tính = ETA + số ngày free time nếu lưu free time |
| Số cont đã trả / tổng | Tính khi đọc từ VGM | Không lưu |

Backend lưu các trường trên và tính mốc CIF từ VGM. Trang chi tiết lô hàng
cho phép nhập ngày trả rỗng và depot theo từng container.

---

## 4. Đề xuất bổ sung (chưa triển khai)

Điền bảng theo mẫu mục 3 khi cần thêm:

| Incoterm | Mốc hiển thị (gợi ý) | Marker |
|---|---|---|
| FCA | Hàng sẵn sàng → Vận chuyển ra cảng ★ → (B) Cảng xuất → Hải trình → Cảng đích | Điểm giao + Chuyển rủi ro tại nơi giao cho người chuyên chở |
| CFR | Như CIF | Chuyển rủi ro (lên tàu), Hết cước (cảng đích, không có BH) |
| CPT / CIP | Như CFR / CIF, rủi ro chuyển khi giao cho người chuyên chở đầu tiên | |
| DAP | Hàng sẵn sàng → Cảng xuất → Hải trình → Cảng đích → (B) Thông quan NK → Giao tới công trình ★ | Điểm giao = "Đã tới nơi, sẵn sàng dỡ hàng" (không gồm dỡ hàng) |
| DDU (dữ liệu cũ) | Như DAP | Nên chuyển sang DAP cho lô mới |

Ý tưởng mở rộng: bấm vào một mốc để xem mốc con, ví dụ Cảng đích →
*Tàu đến → Dỡ hàng → D/O → Hải quan → Thuế → Giải phóng hàng* (cần thêm dữ
liệu mốc con ở backend).

---

## 5. Nhật ký thay đổi

| Ngày | Nội dung | Người sửa |
|---|---|---|
| 2026-09-24 | Tạo tài liệu từ cấu hình đang chạy (EXW / FOB / CIF / DDP) | Claude |
| 2026-09-24 | CIF: thêm mốc 07 "Trả cont rỗng" (đã trả hết cont chưa), mốc chuẩn `empty-return`, dữ liệu cần bổ sung — chưa triển khai | Claude |
| 2026-09-24 | BE-kt-xnk triển khai hành trình, xác nhận mốc và trả cont rỗng; frontend dùng endpoint hành trình | Codex |
