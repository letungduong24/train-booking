Use Case ID	UC-13
Use Case Name	Quản lý trạng thái ghế
Description	Là admin, tôi muốn cập nhật trạng thái hoặc loại ghế trong cấu hình tàu/toa để kiểm soát ghế nào được phép bán hoặc bị khóa khỏi luồng đặt vé.
Actor(s)	Admin
Priority	Should Have
Trigger	Admin cần cập nhật trạng thái hoặc loại ghế trong cấu hình tàu/toa
Pre-Condition(s)	1. Admin đã đăng nhập
2. Ghế cần cập nhật đã tồn tại trong hệ thống
Post-Condition(s)	1. Trạng thái hoặc loại ghế được cập nhật nếu dữ liệu hợp lệ
2. Sơ đồ ghế hiển thị lại dữ liệu mới
Basic Flow	1. Admin mở trang quản lý tàu
2. Admin chọn tàu và toa cần quản lý
3. Hệ thống hiển thị sơ đồ ghế của toa
4. Admin chọn ghế cần cập nhật
5. Admin chọn trạng thái hoặc loại ghế mới
6. Hệ thống kiểm tra dữ liệu cập nhật
7. Hệ thống lưu thay đổi của ghế
8. Hệ thống cập nhật lại sơ đồ ghế
Alternative Flow	5a. Admin hủy thao tác cập nhật: Hệ thống giữ nguyên dữ liệu ghế cũ
Exception Flow	1a. Người dùng không có quyền admin: Hệ thống từ chối truy cập
6a. Trạng thái hoặc loại ghế không hợp lệ: Hệ thống từ chối cập nhật
7a. Ghế không tồn tại: Hệ thống thông báo không tìm thấy ghế
7b. Lỗi lưu dữ liệu ghế: Hệ thống giữ nguyên dữ liệu cũ và thông báo lỗi
Business Rules	BR-01: Chỉ admin mới được cập nhật trạng thái hoặc loại ghế
BR-02: Trạng thái ghế phải thuộc danh mục SeatStatus của hệ thống
BR-03: Loại ghế phải thuộc danh mục SeatType của hệ thống
BR-04: Ghế ở trạng thái DISABLED không được bán trong luồng đặt vé
BR-05: Quản lý trạng thái ghế là thao tác quản trị dữ liệu ghế, không thay thế cho luồng xử lý sự cố ghế hỏng
BR-06: Luồng xử lý sự cố ghế hỏng được tách riêng thành UC-21
Non-Functional Requirement	NFR-01: Sơ đồ ghế phải hiển thị rõ trạng thái hiện tại của từng ghế
NFR-02: Thao tác cập nhật trạng thái ghế cần phản hồi thành công hoặc lỗi rõ ràng
NFR-03: Giao diện quản lý trạng thái ghế phải đồng bộ với trang quản lý tàu/toa
