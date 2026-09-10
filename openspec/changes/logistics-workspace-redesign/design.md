# Design: Tối ưu workspace Logistics

## 1. Một layout, hai chế độ

Giữ một cây field/component cho mỗi đối tượng. Chuyển Xem/Sửa chỉ thay quyền
tương tác và chrome, không thay vị trí nhãn, thứ tự, số cột, độ cao và padding.
Ưu tiên readonly cho input hỗ trợ; không dùng việc làm mờ toàn bộ nội dung làm
cách biểu thị Xem. Giá trị cần rõ và cho phép chọn/copy. Với Selector/DateInput
không có readonly, dùng adapter giữ hình học và hành vi không sửa được;
không giả định API Astryx chưa được tra cứu. Mọi adapter phải hỗ trợ accessibility.

Giữ slot cho icon, thêm/xóa dòng và validation. Viền trong suốt ở chế độ Xem
phải có cùng độ dày với viền ở Sửa. Giữ cột thao tác của bảng, gutter scrollbar,
chiều cao textarea và các vùng metadata. Dùng token/theme hiện có, StyleX và
workflow `docs/astryx-workflow.md` khi triển khai.

Footer cố định dùng cùng hai slot, cùng kích thước trong tất cả mode/tab:

| Xem | Sửa |
|---|---|
| Đóng | Hủy thay đổi |
| Sửa | Lưu thay đổi |

Lưu thành công cập nhật baseline và về Xem tại chỗ; Hủy khôi phục baseline rồi
về Xem tại chỗ. Đóng là hành động riêng, hỏi xác nhận khi dirty. Không đổi key
của workspace chỉ để reset mode. Giữ active tab, disclosure, scroll và focus
hợp lý qua mọi chuyển đổi. Thông báo trạng thái dùng vùng dự phòng; lỗi trường
dùng vùng dự phòng hoặc popover có hỗ trợ bàn phím, không đẩy layout.

## 2. Quyền sở hữu bản nháp

Mỗi đối tượng có draft, baseline, dirty, pending, error và save/cancel rõ ràng.
Shell nhận trạng thái này từ editor hiện tại thay vì chỉ biết draft Contract.
Draft tồn tại ngoài vòng mount/unmount của nội dung tab. Đổi tab trong cùng
workspace giữ draft; rời workspace/đổi đối tượng/đóng phải đi qua guard.
Không cho thao tác điều hướng bỏ qua pending guard hoặc gây gửi lưu hai lần.
Không để refetch ghi đè draft đang sửa. Lưu đối tượng con không được hiểu thành
lưu toàn bộ Contract, và phải cập nhật đúng danh sách/tóm tắt sau khi hoàn tất.

## 3. Contract là hồ sơ hợp đồng

Giữ dialog fullscreen nhưng chia thành `Hồ sơ · Phụ lục · Thanh toán · Liên quan`.
Header giữ mã hợp đồng, trạng thái và ngữ cảnh đang xem. Phần liên quan hiển thị
tóm tắt, số lượng và hành động mở đối tượng tương ứng, không nhúng toàn bộ editor.

| Nội dung | Nơi quản lý chính | Trong Contract |
|---|---|---|
| Thông tin, các bên, điều khoản, ngân hàng | Contract | Xem/sửa ở Hồ sơ |
| Phụ lục hợp đồng | Contract | Tab Phụ lục |
| Thanh toán hợp đồng | Contract | Tab Thanh toán; lưu từng giao dịch rõ ràng |
| Shipment, VGM, chi phí | Shipment | Danh sách/tóm tắt, mở Shipment |
| Commission, phụ lục và thanh toán hoa hồng | Commission | Tóm tắt, mở Commission |
| Giá vốn, báo giá, lợi nhuận/private | BOQ | Tóm tắt/liên kết theo quyền |

Mở Shipment/Commission từ Contract dùng cùng editor với danh sách độc lập.
Thay nội dung workspace bằng editor đích, có đường quay lại Contract và lưu
ngữ cảnh trước đó; không chồng nhiều dialog fullscreen. Các thao tác ngắn như
thêm một giao dịch/phụ lục vẫn có thể dùng dialog gọn, với guard và focus riêng.
Record mới chưa lưu không được tạo quan hệ con chưa có contractId.

## 4. Điều hướng và danh sách

- Nghiệp vụ: Hợp đồng, Shipment, Commission, BOQ.
- Danh mục: Khách hàng/đối tác, Quốc gia, Cảng/Nơi.
- `/logistics`: trước mắt đưa người dùng tới Hợp đồng nếu có quyền, nếu chỉ có
  logistics:view thì hiển thị entrypoint được phép hoặc thông báo phù hợp;
  không redirect vào route người dùng không được mở.
- Giữ tương thích URL cũ của các hub; không làm mất quyền lọc menu/route.
- Bảng mặc định ưu tiên mã, đối tác/dự án, trạng thái và các thông tin vận hành
  thường dùng. Nhóm tài chính chi tiết thành chế độ xem riêng; cho tùy chọn cột.
- Mã bản ghi mở Xem, menu thao tác thống nhất. Khách hàng dùng cùng quy ước
  Xem/Sửa nếu cần chi tiết; danh mục nhỏ không bắt buộc fullscreen.
- Đóng/Hủy dùng màu trung tính; đỏ dành cho thao tác hủy/xóa nghiệp vụ.

## Affected layers & files

| Layer | Sources | Intended change |
|---|---|---|
| shared/components | form-dialog, common-dialog, form-grid, form-section | Shell, action slots, geometry, dirty/pending guards |
| feature components | contract-form-dialog, contracts-list, contract-expanded-details | Contract scope, retained state, related navigation |
| feature components/hooks | shipment/commission editors, private-info panel, form hooks | Unified save/cancel lifecycle and draft ownership |
| config/app | sidebarLogistics.json, route config, logistics route entrypoints | Navigation and compatible entrypoints |
| feature config | contracts/shipments/commissions/customer table definitions | Default columns and view presets |
| harness | stable-dialog-layout-browser and related browser checks | Exact geometry, reverse transitions, draft safety |

Giữ feature boundaries; khi tách code dùng public index hoặc composition ở app,
không tạo import chéo feature. Không thêm dependency theo mặc định.

## Risks & verification

- Tách nghiệp vụ có thể làm người dùng mất ngữ cảnh → kiểm tra Back/return,
  active record, tab và scroll ở danh sách lẫn Contract.
- Readonly có thể mất contrast/keyboard access → kiểm tra copy, focus,
  label, trạng thái và thao tác bị khóa.
- Dữ liệu private phải giữ `logistics:secret` ở menu, route và query; không
  chỉ ẩn giao diện. Không thay ranh giới quyền backend.
- Mục tiêu geometry: cùng bản ghi, viewport, dữ liệu ổn định; mọi landmark có
  delta x/y/width/height bằng 0 khi Xem↔Sửa. Không dùng CLS thay cho phép đo này.
- Thêm/xóa dòng, mở nhóm hoặc thay đổi dữ liệu có điều kiện được kiểm tra riêng;
  không coi đó là chuyển mode thuần túy và không giấu nội dung để đạt số đo.
- Đo desktop/mobile và trung gian, hai chiều, sau Lưu/Hủy, lỗi validation,
  mạng chậm/thất bại, dữ liệu dài/rỗng và quan hệ con có dữ liệu.
- Screenshot và kết quả vào thư mục dated riêng `harness/runs/`.
- Mỗi task chỉ hoàn tất khi browser scenarios liên quan và `./harness/verify.sh`
  đều pass. Không đánh dấu done dựa trên kết quả khảo sát trước đây.
