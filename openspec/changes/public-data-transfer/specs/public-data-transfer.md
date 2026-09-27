# Dữ liệu public

## Xuất

- Khi Admin chọn “Xuất dữ liệu public”, một hộp thoại mở để chọn Xăng dầu Việt Nam, Xăng dầu Thái Lan hoặc Cảng nước.
- Mỗi lựa chọn xăng dầu chỉ tải kỳ giá của thị trường tương ứng; Cảng nước tải quốc gia và cảng đến. File JSON có tên theo nhóm đã chọn.
- Khi API từ chối hoặc không kết nối được, hộp thoại hiển thị lỗi và cho phép thử lại.
- File xuất không chứa bản sao lưu SQL hay dữ liệu người dùng/hợp đồng.

## Nhập

- Khi Admin chọn “Nhập dữ liệu public”, hộp thoại nhận file `.json` và giới hạn 20 MB.
- File sai JSON hoặc thiếu ba danh sách dữ liệu được báo lỗi ngay trong hộp thoại.
- Sau khi API nhập thành công, hộp thoại hiển thị số quốc gia, cảng và kỳ giá đã thêm; dữ liệu đang hiển thị được làm mới.
- Lỗi từ API xuất hiện trong hộp thoại; người dùng có thể chọn file khác và thử lại.
