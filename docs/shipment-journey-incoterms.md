# Lộ trình tracking lô hàng theo Incoterm

Tài liệu nghiệp vụ cho khối **"Hành trình vận chuyển"** trên trang chi tiết
lô hàng (`/logistics/contract/[id]/shipment/[shipmentId]`, Figma 115:8469).

- Tài liệu này là nơi **chỉnh sửa / thống nhất nghiệp vụ**.
- Luồng chạy thực tế do BE-kt-xnk xử lý trong
  `src/CompanyManagement.Domain/Shipments/Journey/IncotermJourneys.cs` và
  `ShipmentJourney.cs`. Frontend lấy kết quả từ endpoint `GET .../journey`.
  Khi đổi nghiệp vụ, đồng bộ tài liệu với backend rồi chạy bộ kiểm tra của
  cả hai dự án.

Cập nhật lần cuối: 2026-09-26.

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
4. Khi hết phạm vi Seller (`end`): mọi mốc Seller = **Hoàn thành**; các
   mốc Buyer phía sau **không có "Chặng hiện tại"** (Seller không theo dõi),
   hiển thị viền đứt nét + badge "Phạm vi Buyer".
5. Nếu trạng thái trỏ tới một mốc mà Incoterm không hiển thị → lấy **mốc
   hiển thị gần nhất phía trước** trong Master Journey.
6. **Xác nhận mốc bằng tay chỉ dành cho mốc chưa có dữ liệu trên lô
   hàng**: `import-clearance` và `site`. Hộp thoại "Xác nhận mốc" ghi
   **Ngày hoàn thành thực tế** (ngày việc đó thật sự xong) + ghi chú.
   Tiến độ = mốc xa hơn giữa Tình trạng và mốc xác nhận tay cuối cùng.
   Các mốc còn lại **không có nút xác nhận**, ngày lấy từ dữ liệu lô hàng:
   | Mốc | Nguồn ngày |
   |---|---|
   | Packing | Ngày đóng hàng của từng container (tab VGM) |
   | POL | Ngày khai hải quan của lô hàng |
   | Shipped on Board / Ocean Freight / POD | ETD / ETA sửa trong lô hàng (nhập ngày thực tế) |
   | Empty Return | Ngày trả rỗng của từng container (tab VGM) |

   Xác nhận tay đã lưu trước đây cho các mốc này bị bỏ qua.

---

## 2. Master Journey (mốc chuẩn)

| # | Mã mốc | Nhãn hiển thị | Tiêu đề trên thẻ | Ngày / thông số ở chân thẻ | Nhóm chi phí liên quan |
|--:|---|---|---|---|---|
| 01 | `cargo-ready` | Packing | Tên lô hàng | Đóng hàng = một ngày, hoặc "từ – đến" khi các cont đóng khác ngày (ngày đóng sớm nhất – muộn nhất trong VGM) | LOG-01 |
| 02 | `origin-inland` | Buyer Pickup *(chỉ EXW)* | Đơn vị trucking (tên) | Hạn SI / VGM + thời gian | LOG-02 |
| 03 | `origin-port` | POL | Cảng xếp hàng (POL) | Khai hải quan = ngày khai tờ khai | LOG-03 |
| 04 | `on-board` | Shipped on Board | {tên tàu} | Rời cảng = ETD | LOG-03 → LOG-04 |
| 05 | `ocean` | Ocean Freight | {POL} → {POD} | Transit = ETA − ETD (ngày) | LOG-04 |
| 06 | `destination-port` | POD | Cảng dỡ hàng (POD) | Đến cảng = ETA | LOG-05 |
| 07 | `import-clearance` | Import Clearance | (nhãn mốc) | Phụ trách: Seller / Buyer | LOG-07 |
| 08 | `destination-inland` | On-carriage | — (chưa dùng) | — | LOG-06 |
| 09 | `site` | Site Delivery | Nơi đến theo hợp đồng | Giao hàng: Hoàn tất / — | — |
| 10 | `empty-return` | Empty Return | Đã trả {n}/{tổng} cont | Hạn trả rỗng (hết free time) | LOG-05 (DEM/DET) |

Mốc `empty-return` có trong hành trình CIF và lấy tiến độ từ các bản ghi VGM.

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
| 01 | Packing | S | ★ Điểm giao |
| 02 | Buyer Pickup *(mốc `origin-inland`)* | B | |
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
| 01 | Packing | S | |
| 02 | POL | S | |
| 03 | Shipped on Board | S | ★ Chuyển rủi ro |
| 04 | Ocean Freight | B | |
| 05 | POD | B | |

| Tình trạng | Mốc hiện tại |
|---|---|
| Đã book, Đang đóng hàng | Packing |
| Hạ bãi chờ xuất | POL |
| Đã giao đến cảng | Shipped on Board *(FOB: giao tại cảng xếp)* |
| Shipping | Ocean Freight |
| Khai HQ, Trucking đến site, Đã hoàn thành | `end` |

### 3.3 CIF — rủi ro lên tàu, cước & bảo hiểm đến cảng đích

> CIF: Rủi ro chuyển khi hàng lên tàu tại cảng xuất · Seller trả cước và bảo hiểm đến cảng đích.

| Mốc | Nhãn | Phạm vi | Marker |
|--:|---|---|---|
| 01 | Packing | S | |
| 02 | POL | S | |
| 03 | Shipped on Board | S | ★ Chuyển rủi ro |
| 04 | Ocean Freight | S | |
| 05 | POD | S | ★ Hết cước & BH |
| 06 | Buyer Pickup & Import *(mốc `import-clearance`)* | B | |
| 07 | Empty Return *(mốc `empty-return`)* | S theo dõi | ★ Hoàn tất lô |

| Tình trạng | Mốc hiện tại |
|---|---|
| Đã book, Đang đóng hàng | Packing |
| Hạ bãi chờ xuất | POL |
| Shipping | Ocean Freight |
| Đã giao đến cảng | POD |
| Khai HQ, Trucking đến site | Buyer Pickup & Import |
| Đã hoàn thành | Empty Return *(nếu chưa trả hết cont)* / `end` *(đã trả hết)* |

**Mốc 07 — Empty Return (CIF)**

- **Vì sao Seller theo dõi:** với CIF, Seller là người ký hợp đồng vận tải
  (booking đứng tên Seller/forwarder của Seller). Cont do Buyer lấy hàng
  xong phải trả rỗng về depot hãng tàu; trả trễ phát sinh phí lưu cont /
  lưu bãi (DEM/DET) mà hãng tàu có thể tính ngược về Seller.
- **Tiến độ lấy từ dữ liệu container** (không lấy từ Tình trạng):
  | Điều kiện | Trạng thái thẻ |
  |---|---|
  | Chưa tới mốc 06 | Kế hoạch |
  | Mốc 06 xong / lô "Đã hoàn thành", còn cont chưa trả | **Chặng hiện tại** |
  | Tất cả cont đã trả rỗng | **Hoàn thành** |
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
| 01 | Packing | S | |
| 02 | POL | S | |
| 03 | Ocean Freight | S | |
| 04 | POD | S | |
| 05 | Import Clearance & Duties *(mốc `import-clearance`)* | S | |
| 06 | Site Delivery | S | ★ Điểm giao |

| Tình trạng | Mốc hiện tại |
|---|---|
| Đã book, Đang đóng hàng | Packing |
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

## 4. Lịch tàu, free time DEM / DET và cảnh báo (đề xuất, chưa triển khai)

Thống nhất với người dùng ngày 2026-09-26. Bối cảnh vận hành:

- Một lô có từ 1 đến 20 cont, tùy dự án.
- Một người nhập liệu, vào các thời điểm: nhận booking từ forwarder, sau
  khi lấy cont, khi hãng tàu báo delay, khi tàu chạy / đến.
- Free time DEM / DET khác nhau theo từng lô; có lô tính **tách riêng**, có
  lô tính **gộp (combined)**.
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

- **Tách riêng**: số ngày DEM + số ngày DET.
- **Gộp**: một số ngày combined.

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
- Hạn tự tính cho từng cont, ví dụ tách riêng đầu xuất:
  hạn hạ bãi = lấy rỗng + DET (không muộn hơn cut-off CY);
  hạn xếp tàu = hạ bãi + DEM. Gộp: hạn xếp tàu = lấy rỗng + combined.
- **Delay làm DEM đầu xuất chạy**: cont đã hạ bãi mà ETD dời → cảnh báo
  "ETD dời 3 ngày, 5/5 cont đã hạ bãi, còn 1 ngày free time".
- Thay thế ô nhập tay "Hạn trả cont rỗng" hiện nay bằng hạn tự tính.
- Chưa tính **tiền** DEM / DET (biểu phí theo bậc ngày) — để sau; khi phát
  sinh thì ghi vào chi phí LOG-05.

### 4.3 Ngày theo từng container

Thêm vào mỗi container (bản ghi VGM), nhập **hàng loạt** (một ngày cho các
cont cùng ngày, sửa riêng cont khác ngày):

| Ngày | Khi nào cần |
|---|---|
| Lấy rỗng | Đầu xuất (mọi Incoterm trừ EXW) |
| Đóng hàng | Đã có |
| Hạ bãi (gate-in) | Đầu xuất |
| Gate-out cảng đích | Chỉ khi đầu đích tính **tách riêng** DEM / DET |
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

1. Lịch tàu có lịch sử (4.1) + free time tách / gộp và hạn tự tính (4.2).
2. Ngày theo từng container, nhập hàng loạt (4.3).
3. Cảnh báo (4.4).
4. Để sau: mốc B/L / telex release, chuyển tải, tiền DEM / DET, dữ liệu tự
   động từ hãng tàu / cảng.

Thanh "TIẾN ĐỘ LỘ TRÌNH": nên tính theo thời gian (hôm nay nằm đâu giữa ngày
bắt đầu và ETA) hoặc bỏ — quyết định khi làm giai đoạn 1.

Câu hỏi mở:

- Hãng tàu / forwarder tính free time **từ chính ngày sự kiện** (ngày 1 =
  ngày lấy rỗng) hay **từ ngày hôm sau**? Có khác nhau theo hãng không?
- Free time tính **ngày lịch** hay trừ Chủ nhật / ngày lễ?

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
| 2026-09-24 | BE-kt-xnk triển khai hành trình, xác nhận mốc và trả cont rỗng; frontend dùng endpoint hành trình | Codex |
| 2026-09-26 | Xác nhận tay chỉ còn ở Import Clearance / Site Delivery (nguyên tắc 6); Packing hiện khoảng ngày đóng; bỏ "(ETD)", "(ETA)", "Dự kiến" ở chân thẻ vì ETD / ETA nhập ngày thực tế; FOB bỏ Pre-carriage | Claude |
| 2026-09-26 | Thêm mục 4 (đề xuất): lịch tàu có lịch sử khi hãng tàu báo delay, free time DEM / DET tách riêng hoặc gộp, ngày theo từng container, cảnh báo | Claude |
