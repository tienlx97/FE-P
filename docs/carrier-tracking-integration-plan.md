# Kế hoạch tích hợp tracking hãng tàu

> Trạng thái: **giai đoạn 1 xong** (2026-09-27) — khung tracking theo hãng + version; chưa hãng nào lấy dữ liệu thật (mục 6).
> Liên quan: [shipment-journey-incoterms.md](shipment-journey-incoterms.md) — mục 1b (luồng hoạt động), mục 4 (lịch tàu, free time, cảnh báo).

## 1. Mục tiêu

Hiện người dùng nhập tay các mốc thực tế: ngày lấy rỗng, hạ bãi, ATD, ATA,
chuyển tải, lấy hàng ra cảng đích, trả rỗng, và các lần hãng tàu dời
ETD / ETA. Đây chính là dữ liệu mà API tracking của hãng tàu trả về.

Mục tiêu: tự động lấy các mốc này, **giảm nhập tay và phát hiện delay sớm**,
nhưng vẫn để người dùng kiểm soát dữ liệu cuối cùng.

## 2. Hãng tàu đang dùng và mức hỗ trợ API

| Tuyến | Hãng | API chính thức | Ghi chú |
|---|---|---|---|
| Thái Lan | **KMTC** | ✅ Cổng API | Đăng ký → KMTC duyệt → cấp API key; một số dịch vụ có thể thu phí |
| | Heung-A | ❌ Chưa thấy | Qua aggregator (ShipsGo…) |
| | Namsung | ❌ Chưa thấy | Qua aggregator (ShipsGo…) |
| Philippines | SITC | ⚠️ Chưa rõ | Có nền tảng api.sitcline.com (lịch tàu, tracking, B/L release) nhưng chưa thấy tài liệu developer công khai → hỏi SITC hoặc dùng aggregator |
| | **Evergreen** | ✅ DCSA T&T v2.2 | Track & Trace hiện miễn phí; quy trình: qua sales → nộp đơn → duyệt → cấp JWT + whitelist IP máy chủ |
| | RCL | ❌ Chưa thấy | Chỉ có tra cứu web; qua aggregator (Portcast…) |
| Úc | OOCL | ⚠️ Chỉ EDI | Không có REST API công khai; EDI qua CargoSmart (nặng với một người dùng) → aggregator |
| | **Yang Ming** | ✅ Cổng API | T&T 2.2, B/L 3.0 beta, lịch tàu (OVS) |
| | **ONE** | ✅ Cổng developer, chuẩn DCSA | |

**Kết luận:** 4 hãng có API chính thức (ONE, Evergreen, Yang Ming, KMTC);
5 hãng còn lại (OOCL, SITC, RCL, Heung-A, Namsung) nên đi qua aggregator.
Aggregator (ShipsGo, Vizion, Portcast, SeaRates, Tradlinx…) có thể phủ cả 9 hãng.

## 3. Map sự kiện hãng tàu → dữ liệu hệ thống

Theo chuẩn DCSA Track & Trace (aggregator cũng trả sự kiện tương đương):

| Sự kiện | Loại DCSA | Trường trong hệ thống |
|---|---|---|
| Cont rỗng ra depot | Equipment `GTOT` (empty) | Ngày lấy rỗng (từng cont) |
| Cont hàng vào cảng xếp | Equipment `GTIN` (full, POL) | Ngày hạ bãi (từng cont) |
| Xếp lên tàu | Equipment `LOAD` (POL) | (tham khảo, xác nhận Shipped on Board) |
| Tàu rời cảng | Transport `DEPA` | ATD; ATD chặng chuyển tải |
| Tàu đến cảng | Transport `ARRI` | ATA; ATA chặng chuyển tải |
| Dỡ hàng | Equipment `DISC` (POD) | (tham khảo, bắt đầu đồng hồ đầu đích) |
| Cont hàng ra cảng đích | Equipment `GTOT` (full, POD) | Ngày lấy hàng ra cảng đích |
| Cont rỗng về depot | Equipment `GTIN` (empty) | Ngày trả rỗng + depot |
| ETD / ETA dự kiến thay đổi | Transport `PLN` / `EST` | Dòng lịch sử lịch tàu (revision) |

## 4. Nguyên tắc

1. **Dữ liệu nhập tay là nguồn chuẩn.** API chỉ tự điền vào ô còn trống.
2. Khi API khác giá trị đã nhập → hiện **"Hãng tàu báo khác"** để người dùng
   chấp nhận / bỏ qua; không ghi đè âm thầm.
3. Mỗi lần dời ETD / ETA từ API → thêm dòng lịch sử lịch tàu với lý do
   **"Hãng tàu cập nhật"**.
4. Lưu **sự kiện gốc** (raw) để tra soát; hiển thị nguồn (Nhập tay / API).
5. Lỗi hoặc hãng không hỗ trợ → hệ thống vẫn chạy như hiện nay (nhập tay).

## 5. Thiết kế kỹ thuật (tóm tắt)

- **Dữ liệu lô hàng:** hãng tàu (SCAC) + số booking / B/L để tra cứu
  (kiểm tra model Shipment hiện có trước, bổ sung nếu thiếu).
- **BE:** interface `ICarrierTrackingProvider` ở Application; các adapter ở
  Infrastructure (`AggregatorTrackingProvider`, `DcsaTrackingProvider`).
  Bảng `ShipmentTrackingSubscription` (lô, nguồn, trạng thái, lần đồng bộ cuối)
  và `ShipmentTrackingEvent` (sự kiện gốc đã chuẩn hoá).
- **Đồng bộ:** job nền định kỳ (hosted service) cho các lô chưa hoàn tất,
  hoặc webhook nếu nhà cung cấp hỗ trợ; khoá API lưu trong cấu hình bí mật,
  không commit.
- **Áp dụng:** một bước "apply" map sự kiện → trường (mục 3) theo nguyên tắc
  mục 4; tận dụng các command đã có (UpdateShipmentSchedule,
  RecordShipmentContainerDates, ReplaceShipmentTransshipmentLegs).
- **FE:** trạng thái đồng bộ trên tab "Lịch tàu & Free time"; danh sách
  "Hãng tàu báo khác" để chấp nhận; nút "Đồng bộ ngay".
- Quy trình repo: tạo change trong `openspec/` + ADR cho lựa chọn nhà cung cấp.

## 6. Lộ trình

**Quyết định 2026-09-27 (người dùng):** mỗi hãng tàu một tích hợp riêng
(crawl hoặc public API, viết sau; tạm coi như hãng không có public API),
**quản lý version API của từng hãng trong code BE** vì dữ liệu crawl có thể
đổi dạng. Thay cho hướng "một aggregator" ban đầu. BE: ADR-0008,
`docs/carrier-tracking.md`, openspec `add-carrier-tracking`.

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| 1. Khung tracking | Danh mục 9 hãng (nhận ra từ ô "Hãng tàu"), adapter theo hãng × version (`Fetch` raw + `Parse` → sự kiện chuẩn DCSA), registry chọn version (ghim trong cấu hình, không ghim = cao nhất), map sự kiện (mục 3) theo nguyên tắc (mục 4), "Hãng tàu báo khác", lịch sử lịch tàu lý do "Hãng tàu cập nhật", lưu sự kiện gốc + raw, job đồng bộ 6 giờ, nút "Đồng bộ ngay" | ✅ Xong — mỗi hãng có `v1` **placeholder** (báo "Chưa kết nối", vẫn nhập tay) |
| 2. Lấy dữ liệu từng hãng | Viết `Fetch` + `Parse` thật cho từng hãng (crawl / API), mỗi hãng kèm test parse trên response đã lưu; web đổi bố cục → thêm `v2`, giữ `v1` | ⏳ Người dùng code sau |
| 3. Lịch tàu (tuỳ chọn) | Lấy lịch tàu / cut-off từ hãng để gợi ý khi nhập booking | Chưa làm |

Aggregator vẫn có thể thêm sau như một adapter cho bất kỳ hãng nào.

## 7. Việc cần làm song song (người dùng)

- [ ] Đăng ký cổng API: Evergreen (liên hệ sales, cần IP máy chủ), KMTC, ONE, Yang Ming.
- [ ] Hỏi forwarder / hãng: SITC, Heung-A, Namsung, RCL có API hoặc EDI cho khách hàng không.
- [ ] So sánh giá, độ phủ 9 hãng, điều khoản của ShipsGo / Vizion / Portcast (chưa xác minh — cần hỏi trực tiếp).

## 8. Các hướng phát triển khác (đang chờ quyết định)

- Tính **chi phí DEM / DET** (số ngày quá hạn × biểu phí).
- Thêm Incoterm **CFR / FCA**.
- Gửi **cảnh báo qua email / Zalo**.
- Deploy 4 migration lên production (portal-ops) — backup DB trước.
- Đổi git remote sang BE-P / FE-P.

## Nguồn

- [KMTC API Portal](https://apiportal.ekmtc.com/index?lang=en)
- [Evergreen ShipmentLink API Developer Portal](https://www.shipmentlink.com/_ec/APIPORTAL_Home)
- [Evergreen Tracking & Visibility – Expedion](https://expedion.ai/carriers/evergreen/tracking/)
- [Yang Ming e-service API updates](https://www.yangming.com/en/news/e_service_updates/14692)
- [ONE Developer Portal](https://developers.one-line.com/)
- [DCSA Track & Trace adopted by member carriers](https://dcsa.org/resource/dcsa-track-trace-standards-adopted-member-carriers/)
- [DCSA Track & Trace API](https://developer.dcsa.org/explore-apis/track-and-trace)
- [How OOCL container tracking works – Tradlinx](https://blogs.tradlinx.com/how-oocl-container-tracking-actually-works-what-the-portal-shows-what-it-doesnt-and-what-the-events-mean/)
- [OOCL Cargo Tracking](https://www.oocl.com/eng/ourservices/eservices/cargotracking/Pages/cargotracking.aspx)
- [Vizion – OOCL tracking](https://www.vizionapi.com/carrier-tracking/oocl)
- [SITC API platform](https://api.sitcline.com/app/)
- [SeaRates – SITC tracking](https://www.searates.com/sealine/sitc/container-tracking)
- [ShipsGo – SITC](https://shipsgo.com/ocean/carriers/sitc/container-tracking)
- [ShipsGo – Heung-A](https://shipsgo.com/ocean/carriers/heunga/container-tracking)
- [ShipsGo – Namsung](https://shipsgo.com/ocean/carriers/namsung/container-tracking)
- [Portcast – RCL tracking](https://www.portcast.io/carrier-coverage/rcl-regional-container-lines-tracking)
- [RCL eService Cargo Tracking](https://eservice.rclgroup.com/CargoTracking/)
