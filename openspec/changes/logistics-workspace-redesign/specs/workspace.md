# Requirements: Logistics workspace

## Shared view/edit geometry

- Given cùng một record và viewport, khi chuyển Xem→Sửa hoặc Sửa→Xem,
  header, nhãn, field rectangles, table columns và footer giữ đúng vị trí/kích
  thước (0 CSS px delta); scroll và disclosure được giữ.
- Given record có text dài, optional fields, danh sách con rỗng hoặc nhiều dòng,
  khi chuyển mode không có clipping, overlap hoặc nút footer ngoài viewport.
- Given chế độ Xem, giá trị đọc/copy được, field không sửa được, thao tác parent
  không gửi mutation; thao tác con độc lập có nhãn/phạm vi rõ ràng.

## Draft and persistence

- Given draft Commission/private trong Contract, khi đổi tab rồi quay lại,
  draft còn nguyên và không bị query refetch thay thế.
- Given draft dirty, khi đóng/rời editor/đổi record, có xác nhận; chọn tiếp tục
  giữ draft, chọn bỏ thay đổi mới được rời.
- Given record đang sửa, khi Hủy thay đổi, về Xem với baseline cũ tại chỗ.
- Given lưu thành công, về Xem với dữ liệu mới tại chỗ và cập nhật summary/list.
- Given validation hoặc network error, giữ draft, chỉ rõ lỗi và cho thử lại.
- Given đang pending, không gửi trùng và không đóng/rời làm mất ngữ cảnh.

## Contract boundaries and navigation

- Contract có Hồ sơ, Phụ lục, Thanh toán, Liên quan; nút hành động chỉ tác động
  đúng đối tượng/phạm vi được ghi trên UI.
- Shipment, Commission, BOQ mở cùng editor từ list và Contract; trở về đúng
  record/tab/scroll nguồn, không chồng hai dialog fullscreen.
- VGM/chi phí do Shipment quản lý; Commission quản lý phụ lục/thanh toán của nó.
- Record mới chưa lưu không tạo quan hệ cần contractId; có giải thích rõ.
- Không có logistics:secret thì không lộ BOQ/private qua menu, route hoặc query.
- Sidebar nghiệp vụ/danh mục, URL cũ và entrypoint /logistics tôn trọng quyền.
- Chuyển list↔detail giữ tìm kiếm, bộ lọc, phân trang và cấu hình cột.

## Acceptance evidence

Browser checks dùng fixture phản ánh đúng API hiện tại; bao phủ 1440/768/390/320px,
keyboard, dữ liệu dài/rỗng/có quan hệ con, lưu thành công/thất bại, Hủy và đóng.
Không đánh đồng ca VGM rỗng với ca field geometry. Mỗi scenario phải có test;
ảnh và phép đo đi cùng kết quả full harness, không chỉ kiểm tra bằng mã nguồn.
