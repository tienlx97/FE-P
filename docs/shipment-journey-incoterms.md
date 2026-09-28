# Lộ trình tracking lô hàng theo Incoterm

Tài liệu nghiệp vụ cho khối **"Hành trình vận chuyển"** trên trang chi tiết
lô hàng (`/logistics/contract/[id]/shipment/[shipmentId]`, Figma 115:8469).

- Tài liệu này là nơi **chỉnh sửa / thống nhất nghiệp vụ**.
- Luồng chạy thực tế do BE-kt-xnk xử lý trong
  `src/CompanyManagement.Domain/Shipments/Journey/IncotermJourneys.cs` và
  `ShipmentJourney.cs`. Frontend lấy kết quả từ endpoint `GET .../journey`.
  Khi đổi nghiệp vụ, đồng bộ tài liệu với backend rồi chạy bộ kiểm tra của
  cả hai dự án.

Cập nhật lần cuối: 2026-09-28.

---

## 1. Nguyên tắc

1. **Một Master Journey duy nhất** (các mốc vật lý chuẩn, mục 2). Mỗi
   Incoterm chọn các mốc chính để hiển thị; timeline sự kiện vật lý đầy đủ dùng chung cho mọi Incoterm.
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
4. Khi hết phạm vi Seller (`end`): mọi mốc Seller = **Hoàn thành**; các
   mốc Buyer phía sau **không có "Chặng hiện tại"** (Seller không theo dõi),
   hiển thị viền đứt nét + badge "Phạm vi Buyer".
5. Nếu trạng thái trỏ tới một mốc mà Incoterm không hiển thị → lấy **mốc
   hiển thị gần nhất phía trước** trong Master Journey.
6. **Xác nhận mốc bằng tay chỉ dành cho mốc chưa có ngày thực tế riêng trên lô
   hàng**: `exw-handover`, `on-board` (LOAD), `discharged` (DISC),
   `import-clearance` và `site`. Hộp thoại "Xác nhận mốc" ghi
   **Ngày hoàn thành thực tế** (ngày việc đó thật sự xong) + ghi chú.
   Tiến độ = mốc xa hơn giữa Tình trạng và mốc xác nhận tay cuối cùng.
   Các mốc còn lại **không có nút xác nhận**, ngày lấy từ dữ liệu lô hàng:
   | Mốc | Nguồn ngày |
   |---|---|
   | Empty Pickup | Ngày lấy rỗng của từng container ("Ngày container") |
   | Packing | Ngày đóng hàng của từng container (tab VGM) |
   | POL | Ngày hạ bãi của từng container; chưa có thì ngày khai hải quan |
   | Shipped on Board (LOAD) / Discharged (DISC) | Ngày xác nhận mốc hoặc sự kiện thực tế từ hãng tàu tại POL / POD; tách khỏi ngày tàu chạy và tàu đến |
   | Ocean Freight / POD | ATD / ATA ("Cập nhật lịch tàu"); chưa có thì ETD / ETA hiện tại + số ngày trễ so với ban đầu |
   | Empty Return | Ngày trả rỗng của từng container ("Ngày container") |

   Xác nhận tay đã lưu trước đây cho các mốc này bị bỏ qua.
7. **Dữ liệu đẩy tiến độ** (khi Tình trạng chưa vượt phạm vi Seller): mọi
   container đã lấy rỗng → Packing; mọi container đã hạ bãi → POL; có ATD →
   Ocean Freight; có ATA → POD. Tiến độ = mốc xa nhất giữa Tình trạng, xác
   nhận tay và dữ liệu.
   Dữ liệu **chỉ đẩy trong các mốc Seller**: vượt qua mốc Seller cuối cùng
   thì coi như Seller hoàn tất, không mốc Buyer nào thành "Chặng hiện tại"
   (vd. EXW có ngày hạ bãi, FOB đã có ATD → Seller xong).
8. **Lô LCL** không có container riêng: không hiện Empty Pickup / Empty
   Return, không có free time theo container.
9. **Chưa ghi nhận container nào** thì Empty Return không được theo dõi:
   lô CIF "Đã hoàn thành" = Seller hoàn tất (không kẹt ở "Chặng hiện tại");
   thẻ ghi "Chưa ghi nhận container". Thanh tiến độ đạt 100% khi mọi mốc
   Seller xong (mốc Buyer và Empty Return không theo dõi không tính).
10. Tab **Timeline & lịch tàu** lấy `GET .../journey/events`, nhóm sự kiện
    có ngày theo container rồi chuyến tàu. Mỗi dòng hiển thị mốc vật lý,
    ngày/giờ, địa điểm, trạng thái Thực tế / Dự kiến / Kế hoạch và nguồn
    Container / Xác nhận / Lịch tàu / Hãng tàu. Sự kiện chưa có ngày không
    được tự suy ra từ trạng thái lô. Adapter hãng tàu hiện chưa kết nối nên
    chỉ hiện nguồn Hãng tàu khi đã đồng bộ được dữ liệu thực tế.

---

## 1b. Luồng hoạt động (người dùng)

Một người nhập liệu, theo các thời điểm thực tế của lô hàng. Hệ thống tự
tính tiến độ, hạn và cảnh báo từ dữ liệu này.

| # | Khi nào | Người dùng làm | Ở đâu | Hệ thống tự làm |
|--:|---|---|---|---|
| 1 | Tạo lô hàng | Tạo Shipment từ hợp đồng (Incoterm lấy từ hợp đồng) | Hợp đồng → "Thêm Shipment" | Dựng hành trình theo Incoterm, Tình trạng "Đã book" |
| 2 | Nhận booking từ forwarder | Nhập ETD, ETA, cut-off SI / VGM, cut-off CY, tàu / chuyến, **free time** từng đầu (Chi tiết DEM / DET hoặc Combined) | Lô hàng → "Chỉnh sửa" | Lưu làm ngày **ban đầu**; cảnh báo cut-off SI / CY khi còn ≤ 2 ngày |
| 3 | Lấy cont rỗng | Thêm **container** (số cont + loại, seal nếu có) rồi ghi **ngày lấy rỗng** (nhập nhanh cho mọi cont) | Tab "Container & VGM" → "Thêm container"; "Ngày container" | Mốc Empty Pickup (x/y cont); đồng hồ DET / Combined đầu xuất bắt đầu chạy |
| 4 | Đóng hàng, cân | **Khai VGM** từng cont: ngày đóng hàng, nhà vận chuyển, 5 khối lượng | Tab "Container & VGM" → sửa cont | Mốc Packing (từ – đến); cảnh báo cut-off SI / VGM đếm cont chưa khai |
| 5 | Hạ bãi cảng | Ghi **ngày hạ bãi** (gate-in) | "Ngày container" | Đủ cont → mốc POL; DET đầu xuất dừng, DEM đầu xuất bắt đầu; cảnh báo cut-off CY tắt |
| 6 | Hãng tàu báo trễ / đổi tàu | "**Cập nhật lịch tàu**": ETD / ETA / cut-off mới, lý do, ngày thông báo; gia hạn free time nếu có | Tab "Timeline & lịch tàu" | Lưu 1 dòng **lịch sử**; "trễ n ngày" trên thẻ; cảnh báo ETD / ETA bị dời |
| 7 | Nhận B/L nháp → phát hành | "**Cập nhật B/L**": loại B/L, ngày nháp, ngày phát hành | Tab "Timeline & lịch tàu" | Cảnh báo tàu chạy ≥ 3 ngày chưa phát hành B/L |
| 8 | Xếp container lên tàu | Xác nhận **LOAD** (ngày thực tế) | Mốc Shipped on Board | Điểm chuyển rủi ro FOB / CIF; FOB: Seller hoàn tất |
| 8a | Tàu chạy | Nhập **ATD** ("Cập nhật lịch tàu") | như 6 | Chặng Ocean Freight bắt đầu; DEM / Combined đầu xuất dừng |
| 9 | Có chuyển tải | "**Sửa chuyển tải**": cảng, tàu nối, ETA / ATA, ETD / ATD | Tab "Timeline & lịch tàu" | Thẻ Ocean hiện tuyến qua các cảng; cảnh báo chặng quá ETD chưa ATD |
| 10 | Giao chứng từ / telex | Ghi ngày **giao bộ gốc / telex release** | "Cập nhật B/L" | Tắt cảnh báo; nếu hàng sắp đến / đã đến mà chưa giao → cảnh báo (đỏ khi đã đến) |
| 11 | Tàu đến | Nhập **ATA** | "Cập nhật lịch tàu" | Mốc POD; đồng hồ đầu đích (CIF / DDP) bắt đầu từ ngày dỡ hàng |
| 12 | Tàu đến / dỡ hàng | Nhập ATA ở lịch tàu và xác nhận riêng ngày **DISC** | Lô hàng | Hai sự kiện độc lập trên hành trình |
| 12a | Thông quan / giao hàng (CIF Buyer, DDP Seller) | Cập nhật **Tình trạng**; DDP: xác nhận Import Clearance / Site Delivery (ngày thực tế) | Lô hàng | Mốc tương ứng xong |
| 13 | Cont ra cảng đích / trả rỗng (CIF) | Ghi ngày **lấy hàng ra cảng** (nếu đầu đích Chi tiết) và **trả rỗng** + depot | "Ngày container" | Đồng hồ DEM / DET / Combined đầu đích; trả hết cont → Empty Return xong, lô CIF hoàn tất |
| 14 | Hằng ngày | Xem **"Lô hàng cần chú ý"** | Danh sách Shipment | Gom mọi cảnh báo của các lô, đỏ trước |

Ghi chú:

- Tiến độ = mốc xa nhất giữa **Tình trạng**, **mốc xác nhận tay** (EXW Delivery,
  LOAD, DISC, Import Clearance, Site Delivery) và **dữ liệu** (cont lấy rỗng / hạ bãi,
  ATD, ATA) — dữ liệu chỉ đẩy trong các mốc Seller (nguyên tắc 7).
- Thanh "TIẾN ĐỘ LỘ TRÌNH" tính theo thời gian (mục 4.8), 100% khi mọi mốc
  Seller xong.
- Lô LCL bỏ bước 3, 5, 13 (không có container riêng).
- Phạm vi theo Incoterm: EXW dừng ở EXW Delivery; FOB dừng ở LOAD; CIF
  đến trả rỗng; DDP đến Site Delivery.

---

## 2. Master Journey (mốc chuẩn)

| # | Mã mốc | Nhãn hiển thị | Tiêu đề trên thẻ | Ngày / thông số ở chân thẻ | Nhóm chi phí liên quan |
|--:|---|---|---|---|---|
| 00 | `empty-pickup` | Empty Pickup | Đã lấy {n}/{tổng} cont | Lấy rỗng = "{n}/{tổng} cont · từ – đến" (lô 1 cont: chỉ ngày) | LOG-02 |
| 01 | `cargo-ready` | Packing | Tên lô hàng | Đóng hàng = một ngày, hoặc "từ – đến" khi các cont đóng khác ngày (ngày đóng sớm nhất – muộn nhất trong VGM) | LOG-01 |
| 01a | `exw-handover` | EXW Delivery | Địa điểm EXW | Ngày giao thực tế; không suy từ ngày đóng hàng hay tàu chạy | — |
| 02 | `origin-inland` | Buyer Pickup *(chỉ EXW)* | Đơn vị trucking (tên) | Hạn SI / VGM + thời gian | LOG-02 |
| 03 | `origin-port` | POL | Cảng xếp hàng (POL) | Hạ bãi = "{n}/{tổng} cont · từ – đến"; chưa hạ bãi cont nào thì Khai hải quan = ngày khai tờ khai | LOG-03 |
| 04 | `on-board` | Shipped on Board | {tên tàu} | LOAD = ngày xác nhận xếp lên tàu | LOG-03 → LOG-04 |
| 05 | `ocean` | Ocean Freight | {POL} → {POD} | ATD hoặc ETD hiện tại + số ngày trễ | LOG-04 |
| 06 | `destination-port` | POD | Cảng dỡ hàng (POD) | Đến cảng = ATA, chưa có thì ETA hiện tại · "trễ {n} ngày" | LOG-05 |
| 06a | `discharged` | Discharged | Cảng đích | DISC = ngày xác nhận dỡ khỏi tàu | LOG-05 |
| 07 | `import-clearance` | Import Clearance | (nhãn mốc) | Phụ trách: Seller / Buyer | LOG-07 |
| 08 | `destination-inland` | On-carriage | — (chưa dùng) | — | LOG-06 |
| 09 | `site` | Site Delivery | Nơi đến theo hợp đồng | Giao hàng: Hoàn tất / — | — |
| 10 | `empty-return` | Empty Return | Đã trả {n}/{tổng} cont | Hạn trả rỗng (hết free time) | LOG-05 (DEM/DET) |

Mốc `empty-return` có trong hành trình CIF và lấy tiến độ từ các bản ghi VGM.
Mốc `empty-pickup` có trong FOB / CIF / DDP (Seller lấy cont rỗng); tiến
độ: "Đã book" → Empty Pickup, "Đang đóng hàng" → Packing, hoặc mọi cont đã
lấy rỗng → Packing.

Không Incoterm đang cấu hình nào dùng mốc **Pre-carriage** (chặng xe kéo cont từ xưởng ra
cảng): chặng này kết thúc khi hạ bãi, trùng với POL. `origin-inland` chỉ còn
dùng cho EXW ("Buyer Pickup").

Thẻ chỉ giữ thông số tracking: nhãn mốc, tiêu đề (cắt "…" + tooltip khi
dài), badge trạng thái + marker, và **một** ngày / thông số ở chân thẻ.
Badge mốc đã xong hiển thị **"Hoàn thành"**.

Nhãn mốc hiển thị bằng **thuật ngữ logistics tiếng Anh**, ghi đè ở FE trong
`api/shipment-journey.js`: `MILESTONE_LABELS` theo mã mốc, còn hai mốc có
nhãn khác nhau theo Incoterm (`origin-inland`, `import-clearance`) dịch
theo nhãn backend qua `INCOTERM_LABELS` (vd. EXW "Buyer nhận hàng" →
"Buyer Pickup", DDP "Thông quan & thuế NK" → "Import Clearance & Duties").
Backend vẫn trả `label` tiếng Việt (vd. "Hàng sẵn sàng", "Hải trình
biển") — đổi ở BE thì bỏ phần ghi đè này.

---

## 3. Luồng theo từng Incoterm

Ký hiệu: **S** = Seller, **B** = Buyer, ★ = marker.

### 3.1 EXW — giao tại xưởng

> EXW: Seller giao hàng tại xưởng — Buyer nhận hàng và chịu chi phí, rủi ro từ đây.

| Mốc | Nhãn | Phạm vi | Marker |
|--:|---|---|---|
| 01 | Packing | S | |
| 02 | EXW Delivery | S | ★ Điểm giao |
| 03 | Buyer Pickup *(mốc `origin-inland`)* | B | |
| 03 | POL | B | |
| 04 | Ocean Freight | B | |
| 05 | POD | B | |

| Tình trạng | Mốc hiện tại |
|---|---|
| Đã book, Đang đóng hàng | Packing |
| Các trạng thái còn lại | `end` (Seller hoàn tất) |

### 3.2 FOB — rủi ro chuyển khi hàng lên tàu

> FOB: Rủi ro chuyển sang Buyer khi hàng đã xếp lên tàu tại cảng xuất.

| Mốc | Nhãn | Phạm vi | Marker |
|--:|---|---|---|
| 01 | Empty Pickup | S | |
| 02 | Packing | S | |
| 03 | POL | S | |
| 04 | Shipped on Board | S | ★ Chuyển rủi ro |
| 05 | Ocean Freight | B | |
| 06 | POD | B | |

| Tình trạng | Mốc hiện tại |
|---|---|
| Đã book | Empty Pickup |
| Đang đóng hàng | Packing |
| Hạ bãi chờ xuất | POL |
| Đã giao đến cảng | Shipped on Board *(FOB: giao tại cảng xếp)* |
| Shipping, Khai HQ, Trucking đến site, Đã hoàn thành | `end` *(tàu chạy = đã qua điểm chuyển rủi ro, Ocean Freight là chặng của Buyer)* |

### 3.3 CIF — rủi ro lên tàu, cước & bảo hiểm đến cảng đích

> CIF: Rủi ro chuyển khi hàng lên tàu tại cảng xuất · Seller trả cước và bảo hiểm đến cảng đích.

| Mốc | Nhãn | Phạm vi | Marker |
|--:|---|---|---|
| 01 | Empty Pickup | S | |
| 02 | Packing | S | |
| 03 | POL | S | |
| 04 | Shipped on Board | S | ★ Chuyển rủi ro |
| 05 | Ocean Freight | S | |
| 06 | POD | S | ★ Hết cước & BH |
| 06a | Discharged | S | |
| 07 | Buyer Pickup & Import *(mốc `import-clearance`)* | B | |
| 08 | Empty Return *(mốc `empty-return`)* | S theo dõi | ★ Hoàn tất lô |

| Tình trạng | Mốc hiện tại |
|---|---|
| Đã book | Empty Pickup |
| Đang đóng hàng | Packing |
| Hạ bãi chờ xuất | POL |
| Shipping | Ocean Freight |
| Đã giao đến cảng | POD |
| Khai HQ, Trucking đến site | Buyer Pickup & Import |
| Đã hoàn thành | Empty Return *(nếu chưa trả hết cont)* / `end` *(đã trả hết)* |

**Mốc 08 — Empty Return (CIF)**

- **Vì sao Seller theo dõi:** với CIF, Seller là người ký hợp đồng vận tải
  (booking đứng tên Seller/forwarder của Seller). Cont do Buyer lấy hàng
  xong phải trả rỗng về depot hãng tàu; trả trễ phát sinh phí lưu cont /
  lưu bãi (DEM/DET) mà hãng tàu có thể tính ngược về Seller.
- **Tiến độ lấy từ dữ liệu container** (không lấy từ Tình trạng):
  | Điều kiện | Trạng thái thẻ |
  |---|---|
  | Chưa tới bước Buyer Pickup & Import | Kế hoạch |
  | Mốc 07 xong / lô "Đã hoàn thành", còn cont chưa trả | **Chặng hiện tại** |
  | Tất cả cont đã trả rỗng | **Hoàn thành** |
  | Quá hạn trả rỗng mà chưa trả hết | Chặng hiện tại + cảnh báo đỏ "Quá hạn {n} ngày" |
- **Thẻ hiển thị:**
  - Tiêu đề: `Đã trả {n}/{tổng} cont` (tổng = số bản ghi VGM của lô).
  - Chân thẻ: `Hạn trả rỗng` = ngày cuối free time sớm nhất (DET hoặc
    combined đầu đích, mục 4.2) của cont chưa trả — lô chưa có free time đầu
    đích thì dùng hạn nhập tay cũ; khi đã trả hết đổi thành `Trả xong` = ngày
    trả cont cuối cùng.
- **Lô chỉ được coi là hoàn tất phía Seller khi đã trả hết cont** — thanh
  "TIẾN ĐỘ LỘ TRÌNH" chưa đạt 100% khi còn cont chưa trả.

> Lưu ý UI: không ghi "Seller → Cảng đích" chung chung, vì dễ hiểu nhầm
> Seller chịu rủi ro tới cảng đích. Hai marker tách riêng rủi ro và cước.

### 3.4 DDP — Seller lo toàn bộ

> DDP: Seller lo toàn bộ hành trình, thông quan và thuế nhập khẩu đến điểm giao.

DDP **không có mốc Empty Return** (quyết định 2026-09-27): hành trình kết
thúc ở Site Delivery. Free time đầu đích vẫn được theo dõi theo từng cont
(mục 4.2) để cảnh báo DEM / DET.

| Mốc | Nhãn | Phạm vi | Marker |
|--:|---|---|---|
| 01 | Empty Pickup | S | |
| 02 | Packing | S | |
| 03 | POL | S | |
| 04 | Shipped on Board | S | |
| 05 | Ocean Freight | S | |
| 06 | POD | S | |
| 07 | Discharged | S | |
| 08 | Import Clearance & Duties *(mốc `import-clearance`)* | S | |
| 09 | Site Delivery | S | ★ Điểm giao |

| Tình trạng | Mốc hiện tại |
|---|---|
| Đã book | Empty Pickup |
| Đang đóng hàng | Packing |
| Hạ bãi chờ xuất | POL |
| Shipping | Ocean Freight |
| Đã giao đến cảng | POD |
| Khai HQ | Import Clearance & Duties |
| Trucking đến site | Site Delivery |
| Đã hoàn thành | `end` (tất cả hoàn thành) |

### 3.5 Incoterm khác (chưa cấu hình)

Hệ thống hiện chỉ có EXW / FOB / CIF / DDP (enum `Incoterm`). Incoterm
chưa cấu hình dùng luồng mặc định **không marker**: Packing → POL →
Ocean Freight → POD (ánh xạ trạng thái như CIF).

### 3.6 Dữ liệu cho "Empty Return"

| Dữ liệu | Đặt ở đâu | Ghi chú |
|---|---|---|
| Ngày trả cont rỗng | Mỗi container (`ShipmentVgm.emptyReturnedAt`, date, null = chưa trả) | Nhập ở tab VGM & Container |
| Depot trả rỗng | Mỗi container (`ShipmentVgm.emptyReturnDepot`, text, tuỳ chọn) | |
| Hạn trả rỗng (hết free time) | Lô hàng (`Shipment.operationalDetails.emptyReturnDeadline`, date) | Có thể tính = ETA + số ngày free time nếu lưu free time |
| Số cont đã trả / tổng | Tính khi đọc từ VGM | Không lưu |

Backend lưu các trường trên và tính mốc CIF từ VGM. Trang chi tiết lô hàng
cho phép nhập ngày trả rỗng và depot theo từng container.

---

## 4. Lịch tàu, free time DEM / DET và cảnh báo

Thống nhất với người dùng ngày 2026-09-26; triển khai cùng ngày (BE-kt-xnk
`add-shipment-schedule-free-time`). Trên trang lô hàng: tab **"Lịch tàu &
Free time"**, hộp thoại **"Cập nhật lịch tàu"** và **"Ngày container"** (menu
"…" của thẻ lô hàng, nút trên thẻ mốc), dải cảnh báo dưới thẻ lô hàng; trang
danh sách Shipment có khối **"Lô hàng cần chú ý"**. Bối cảnh vận hành:

- Một lô có từ 1 đến 20 cont, tùy dự án.
- Một người nhập liệu, vào các thời điểm: nhận booking từ forwarder, sau
  khi lấy cont, khi hãng tàu báo delay, khi tàu chạy / đến.
- Free time DEM / DET khác nhau theo từng lô, có hai loại: **chi tiết** (số
  ngày DEM và số ngày DET rõ ràng, vd. 7 DEM / 10 DET) và **combined** (DEM +
  DET = một số ngày, vd. 21 ngày).
- Chưa gặp rớt cont → không xử lý rớt tàu / tách lô.

Mục tiêu: **quản lý theo ngoại lệ**. Người dùng nhập ít nhất có thể; hệ
thống tự tính hạn và cảnh báo lô / cont sắp có vấn đề.

### 4.1 Lịch tàu có lịch sử

Hãng tàu báo delay thì ETD, ETA, cut-off SI / VGM, cut-off CY (và có khi
tàu / chuyến) đều đổi, có thể nhiều lần. Mỗi ngày trong lịch tàu có ba giá
trị:

| Giá trị | Ý nghĩa |
|---|---|
| Ban đầu | Giá trị lần nhập đầu tiên (lúc nhận booking) |
| Dự kiến hiện tại | Giá trị theo thông báo mới nhất |
| Thực tế | ATD / ATA — tàu thật sự chạy / đến |

- Thao tác **"Cập nhật lịch tàu"** (hộp thoại): ETD, ETA, cut-off SI / VGM,
  cut-off CY, tàu / chuyến, free time (xem 4.2), lý do (tàu trễ, đổi tàu,
  ùn tắc cảng, khác), ghi chú. Mỗi lần lưu thành **một dòng lịch sử**
  (ngày nhận thông báo, cũ → mới, lý do), không ghi đè.
- Cut-off **không tự dời theo ETD** (do hãng tàu / cảng quyết định). Hộp
  thoại đặt cut-off cạnh ETD để kiểm tra; có nút "Dời cut-off cùng số ngày
  với ETD".
- Số ngày trễ = (thực tế, nếu có, hoặc dự kiến hiện tại) − ban đầu. Thẻ mốc
  hiển thị ví dụ: "Rời cảng 13/10 · trễ 3 ngày (dời 2 lần)".
- Trang chi tiết lô hàng có mục **"Lịch sử lịch tàu"**.
- Mọi hạn và cảnh báo tính theo giá trị **mới nhất**.

### 4.2 Free time DEM / DET

Thuật ngữ (đồng hồ chạy từ sự kiện bắt đầu đến sự kiện kết thúc):

| Đầu | Loại | Container đang ở đâu | Bắt đầu | Kết thúc |
|---|---|---|---|---|
| Xuất | DET (lưu cont) | Ngoài cảng (ở xưởng / trên xe) | Lấy rỗng | Hạ bãi (gate-in) |
| Xuất | DEM (lưu bãi) | Trong cảng | Hạ bãi | Xếp tàu (≈ ATD) |
| Xuất | **Combined** | | Lấy rỗng | Xếp tàu (≈ ATD) |
| Đích | DEM (lưu bãi) | Trong cảng | Dỡ hàng (≈ ATA) | Lấy hàng ra khỏi cảng (gate-out) |
| Đích | DET (lưu cont) | Ngoài cảng | Gate-out | Trả rỗng |
| Đích | **Combined** | | Dỡ hàng (≈ ATA) | Trả rỗng |

Nhập theo **từng lô, từng đầu**, chọn cách tính:

- **Chi tiết**: số ngày DEM và số ngày DET — hai đồng hồ riêng (vd. 7 DEM /
  10 DET, 14 DEM / 7 DET).
- **Combined**: DEM + DET = một số ngày — một đồng hồ (vd. 21 ngày: dùng 10
  ngày trong cảng thì còn 11 ngày ngoài cảng).

Đầu nào áp dụng theo Incoterm:

| Incoterm | Đầu xuất | Đầu đích |
|---|---|---|
| EXW | — (Buyer lấy cont) | — |
| FOB | ✔ | — |
| CIF | ✔ | ✔ (Seller đứng tên booking, xem mốc Empty Return) |
| DDP | ✔ | ✔ |

- Free time sửa được trong "Cập nhật lịch tàu" (khi forwarder xin được gia
  hạn do lỗi hãng tàu).
- Xếp tàu / dỡ hàng dùng ngày của cả lô (ATD / ATA, chưa có thì ETD / ETA
  dự kiến hiện tại). Các sự kiện còn lại theo **từng cont**.
- Hạn tự tính cho từng cont, ví dụ chi tiết đầu xuất:
  hạn hạ bãi = lấy rỗng + DET (không muộn hơn cut-off CY);
  hạn xếp tàu = hạ bãi + DEM. Combined: hạn xếp tàu = lấy rỗng + combined.
- **Delay làm DEM đầu xuất chạy**: cont đã hạ bãi mà ETD dời → cảnh báo
  "ETD dời 3 ngày, 5/5 cont đã hạ bãi, còn 1 ngày free time".
- Thay thế ô nhập tay "Hạn trả cont rỗng" hiện nay bằng hạn tự tính.
- Chưa tính **tiền** DEM / DET (biểu phí theo bậc ngày) — để sau; khi phát
  sinh thì ghi vào chi phí LOG-05.

### 4.3 Ngày theo từng container

**Container trước, VGM sau** (2026-09-27): tab **"Container & VGM"**, mỗi
cont một dòng. Container tạo được ngay khi lấy rỗng, chỉ cần **số cont +
loại cont** (seal nhập sau cũng được). Phần **khai VGM** (ngày đóng hàng,
nhà vận chuyển, 5 khối lượng: max gross, tare, payload, net weight, bao bì)
điền sau khi đóng hàng — đủ cả 5 hoặc để trống cả 5. Cont chưa khai hiện
"Chưa khai VGM"; cảnh báo cut-off SI / VGM đếm các cont chưa khai.

Thêm vào mỗi container (bản ghi VGM), nhập **hàng loạt** (một ngày cho các
cont cùng ngày, sửa riêng cont khác ngày):

| Ngày | Khi nào cần |
|---|---|
| Lấy rỗng | Đầu xuất (mọi Incoterm trừ EXW) |
| Đóng hàng | Đã có |
| Hạ bãi (gate-in) | Đầu xuất |
| Gate-out cảng đích | Chỉ khi đầu đích tính **chi tiết** DEM / DET |
| Trả rỗng | Đã có |

Hiển thị: lô 1 cont chỉ hiện ngày; lô nhiều cont hiện "Hạ bãi 3/5 cont",
ngày từ cont đầu tiên đến cont cuối cùng. Mỗi cont hiện "Còn x ngày" /
"Hết free time hôm nay" / "Quá y ngày".

Hành trình thêm mốc **"Empty Pickup"** (lấy rỗng) trước Packing.

### 4.4 Cảnh báo

Tính tự động, hiện trên danh sách lô hàng và trang chi tiết:

- Cont sắp hết / đã quá free time (mỗi loại DEM / DET / combined, mỗi đầu).
- Sắp đến cut-off SI / VGM mà chưa có VGM; sắp đến cut-off CY mà còn cont
  chưa hạ bãi.
- ETD / ETA bị dời (số ngày trễ so với ban đầu).

### 4.5 Giai đoạn

1. ✅ Lịch tàu có lịch sử (4.1) + free time tách / gộp và hạn tự tính (4.2).
2. ✅ Ngày theo từng container, nhập hàng loạt (4.3) — drawer "Ngày
   container", bảng từng container.
3. ✅ Cảnh báo (4.4).
4. ✅ Chứng từ B/L (4.6), chuyển tải (4.7), thanh tiến độ theo thời gian
   (4.8) — 2026-09-27.
5. Để sau: tiền DEM / DET theo biểu phí, dữ liệu tự động từ hãng tàu / cảng.

Đã chốt (2026-09-26): free time tính **từ chính ngày sự kiện** (ngày lấy
rỗng = ngày 1) và theo **ngày lịch**. Hạn / cảnh báo "sắp hết" = còn ≤ 2
ngày.

### 4.6 Chứng từ B/L

Với nhà xuất khẩu, giao B/L gắn với thu tiền. Mỗi lô: **loại B/L** (B/L gốc
— gửi / xuất trình bộ gốc; Surrendered — telex release; Seaway bill — không
cần release) và 3 bước: **Nhận B/L nháp → B/L phát hành → Giao bộ chứng từ
gốc / Telex release** (Seaway bill chỉ 2 bước đầu) + số chuyển phát / telex.
Nhập ở "Cập nhật B/L" (tab "Lịch tàu & Free time").

Cảnh báo (không áp dụng lô "Đã hoàn thành"):

- Tàu đã chạy (ATD) ≥ 3 ngày mà **chưa phát hành B/L**.
- Còn ≤ 2 ngày đến cảng đích (ATA, không thì ETA) mà **chưa giao chứng từ /
  telex release** (đỏ nếu hàng đã đến).

### 4.7 Chuyển tải

Danh sách **cảng chuyển tải** theo thứ tự tuyến: cảng, tàu / chuyến nối,
ETA / ATA, ETD / ATD tại cảng đó (drawer "Chuyển tải", bảng từng chặng).
Không có chặng = đi thẳng (tự cập nhật "Phương thức vận chuyển"). Thẻ
Ocean Freight hiện tuyến qua các cảng: "VNSGN → Singapore → THBKK".
Cảnh báo: chặng đã quá ETD mà chưa có ATD (tàu nối chuyến chưa chạy).

### 4.8 Thanh "TIẾN ĐỘ LỘ TRÌNH"

Tính theo **thời gian**: hôm nay nằm đâu giữa sự kiện container đầu tiên
(lấy rỗng, không thì đóng hàng) và ngày đến (ATA, không thì ETA), kèm "còn
n ngày đến ETA" / "quá ETA n ngày" / "đã đến …". 100% chỉ khi mọi mốc hoàn
thành (vd. CIF đã trả hết cont); chưa xong thì tối đa 99%. Thiếu một trong
hai ngày thì tính theo số mốc như cũ.

---

## 5. Incoterm khác (chưa triển khai)

Điền bảng theo mẫu mục 3 khi cần thêm:

| Incoterm | Mốc hiển thị (gợi ý) | Marker |
|---|---|---|
| FCA | Packing → Pre-carriage ★ → (B) POL → Ocean Freight → POD | Điểm giao + Chuyển rủi ro tại nơi giao cho người chuyên chở |
| CFR | Như CIF | Chuyển rủi ro (lên tàu), Hết cước (cảng đích, không có BH) |
| CPT / CIP | Như CFR / CIF, rủi ro chuyển khi giao cho người chuyên chở đầu tiên | |
| DAP | Packing → POL → Ocean Freight → POD → (B) Import Clearance → Site Delivery ★ | Điểm giao = "Đã tới nơi, sẵn sàng dỡ hàng" (không gồm dỡ hàng) |
| DDU (dữ liệu cũ) | Như DAP | Nên chuyển sang DAP cho lô mới |

Ý tưởng mở rộng: bấm vào một mốc để xem mốc con, ví dụ Cảng đích →
*Tàu đến → Dỡ hàng → D/O → Hải quan → Thuế → Giải phóng hàng* (cần thêm dữ
liệu mốc con ở backend).

---

## 6. Nhật ký thay đổi

| Ngày | Nội dung | Người sửa |
|---|---|---|
| 2026-09-24 | Tạo tài liệu từ cấu hình đang chạy (EXW / FOB / CIF / DDP) | Claude |
| 2026-09-24 | CIF: thêm mốc 07 "Trả cont rỗng" (đã trả hết cont chưa), mốc chuẩn `empty-return`, dữ liệu cần bổ sung — chưa triển khai | Claude |
| 2026-09-28 | Tách EXW Delivery khỏi Packing, LOAD khỏi ATD, DISC khỏi ATA; timeline sự kiện vật lý dùng chung bốn Incoterm | Codex |
| 2026-09-24 | BE-kt-xnk triển khai hành trình, xác nhận mốc và trả cont rỗng; frontend dùng endpoint hành trình | Codex |
| 2026-09-26 | Xác nhận tay chỉ còn ở Import Clearance / Site Delivery (nguyên tắc 6); Packing hiện khoảng ngày đóng; bỏ "(ETD)", "(ETA)", "Dự kiến" ở chân thẻ vì ETD / ETA nhập ngày thực tế; FOB bỏ Pre-carriage | Claude |
| 2026-09-26 | Thêm mục 4 (đề xuất): lịch tàu có lịch sử khi hãng tàu báo delay, free time DEM / DET tách riêng hoặc gộp, ngày theo từng container, cảnh báo | Claude |
| 2026-09-26 | Triển khai mục 4 (giai đoạn 1–3); thêm mốc Empty Pickup (FOB / CIF / DDP), nguyên tắc 7 (dữ liệu đẩy tiến độ), chân thẻ dùng ATD / ATA + số ngày trễ, hạn trả rỗng tính từ free time | Claude |
| 2026-09-27 | Thêm 4.6 chứng từ B/L, 4.7 chuyển tải, 4.8 thanh tiến độ theo thời gian; "Ngày container" thành drawer | Claude |
| 2026-09-27 | Container trước, VGM sau: tab "Container & VGM", khai VGM tuỳ chọn (đủ 5 khối lượng hoặc không), cảnh báo SI / VGM đếm cont chưa khai | Claude |
| 2026-09-27 | Kiểm tra luồng: dữ liệu chỉ đẩy trong mốc Seller (EXW / FOB sau ATD), LCL không có mốc container, CIF hoàn thành không có container không kẹt ở Empty Return (nguyên tắc 7–9) | Claude |
| 2026-09-27 | FOB "Shipping" = `end` (Seller hoàn tất khi tàu chạy); DDP không có mốc Empty Return; thêm mục 1b Luồng hoạt động | Claude |
