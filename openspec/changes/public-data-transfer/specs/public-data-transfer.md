# Dữ liệu public

## Xuất

- Khi Admin chọn “Xuất dữ liệu public”, một hộp thoại mở để chọn Xăng dầu hoặc Cảng nước.
- Chọn Xăng dầu chỉ tải các kỳ giá; chọn Cảng nước tải quốc gia và cảng đến. File JSON có tên theo nhóm đã chọn.
- File xuất không chứa bản sao lưu SQL hay dữ liệu người dùng/hợp đồng.

## Nhập

- Khi Admin chọn “Nhập dữ liệu public”, hộp thoại nhận file `.json` và giới hạn 20 MB.
- File sai JSON hoặc thiếu ba danh sách dữ liệu được báo lỗi ngay trong hộp thoại.
- Sau khi API nhập thành công, hộp thoại hiển thị số quốc gia, cảng và kỳ giá đã thêm; dữ liệu đang hiển thị được làm mới.
- Lỗi từ API xuất hiện trong hộp thoại; người dùng có thể chọn file khác và thử lại.
