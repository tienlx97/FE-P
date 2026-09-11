# Tasks: Tối ưu workspace Logistics

Status: in progress. Thực hiện tuần tự, một task mỗi lần.
Mỗi task yêu cầu full `./harness/verify.sh` pass trước khi đánh dấu hoàn tất,
cập nhật evidence/PROGRESS và commit theo quy trình repository.

## 1. Bảo vệ dữ liệu và thống nhất vòng đời

- [x] 1.1 Sửa mất draft của Commission/private khi đổi tab hoặc đóng Contract; giữ draft theo editor, đưa dirty/pending vào guard chung. Verify: đổi tab rồi quay lại giữ giá trị; đóng/rời có xác nhận; đang lưu không thoát hoặc gửi trùng.
- [x] 1.2 Chuẩn hóa Lưu/Hủy của Contract, Shipment, Commission và BOQ: về Xem tại chỗ, giữ tab/scroll/disclosure; bỏ remount chỉ để đổi mode. Verify: Lưu thành công, Hủy, lỗi lưu và refetch không làm mất ngữ cảnh/draft.

## 2. Hình học và chế độ Xem

- [x] 2.1 Chuẩn hóa shared shell, footer, field slots, readonly và vùng validation; giữ chữ dễ đọc/copy và màu hành động nhất quán. Verify: exact 0px landmarks hai chiều tại 1440/768/390/320px, không tràn/che nút.
- [ ] 2.2 Mở rộng regression harness: fixture API search mới, ID landmark ổn định, Lưu/Hủy, lỗi validation/mạng và VGM có dữ liệu; không chấp nhận ca 0 controls như chứng minh field geometry. Verify: test bắt được dịch chuyển có chủ ý và mất draft; lưu ảnh trước/sau.

## 3. Thu hẹp Contract và tái sử dụng editor

- [x] 3.1 Gom Contract thành Hồ sơ/Phụ lục/Thanh toán/Liên quan; giữ dữ liệu và quyền hiện tại, làm rõ phạm vi hành động từng tab. Verify: đủ nội dung cũ, tạo mới khóa quan hệ chưa lưu, private không lộ qua query/UI.
- [x] 3.2 Dùng một editor Shipment từ Contract và danh sách; VGM/chi phí thuộc Shipment, điều hướng quay lại giữ ngữ cảnh và không chồng fullscreen. Verify: mở từ hai entrypoint, thao tác con, trở lại Contract và refresh tóm tắt.
- [x] 3.3 Dùng chung editor Commission/BOQ từ Contract và danh sách, chuyển phần Contract thành summary/link theo quyền. Verify: quan hệ 1:1 Commission, phụ lục/thanh toán, dirty guard, quay lại và quyền logistics:secret.

## 4. Điều hướng và bảng

- [x] 4.1 Sắp sidebar Nghiệp vụ/Danh mục, xử lý trang /logistics và tương thích hub URL cũ theo quyền. Verify: route direct, Back, menu desktop/mobile và user chỉ có logistics:view.
- [ ] 4.2 Tối ưu cột mặc định/chế độ xem tài chính, hành động bản ghi và chi tiết khách hàng; giữ filter/pagination/column preferences. Verify: dữ liệu dài, không có dữ liệu, cuộn bảng, mở/đóng chi tiết không reset danh sách.

## 5. Nghiệm thu toàn luồng

- [ ] 5.1 Chạy ma trận geometry và hành vi toàn bộ workspace, rà keyboard/focus/readonly/permissions; cập nhật docs và ADR cho cấu trúc cuối. Verify: tất cả scenarios trong specs pass, screenshots đầy đủ và full gate pass.
