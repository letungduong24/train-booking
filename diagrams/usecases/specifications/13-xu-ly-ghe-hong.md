Use Case ID
UC-13

Use Case Name
Xử lý ghế hỏng

Description
Là Admin, tôi muốn xử lý báo cáo ghế hỏng từ Driver và đổi ghế cho khách hàng bị ảnh hưởng.

Actor(s)
Admin, Driver, Customer, Email Service

Priority
Should Have

Trigger
Driver báo cáo ghế hỏng hoặc Admin phát hiện ghế hỏng

Pre-Condition(s)
Admin đã đăng nhập vào hệ thống với role ADMIN
Có báo cáo ghế hỏng từ Driver hoặc phát hiện trực tiếp
Thiết bị của Admin đã được kết nối internet

Post-Condition(s)
Báo cáo ghế hỏng được xử lý
Ghế hỏng được đánh dấu DISABLED
Khách hàng bị ảnh hưởng được thông báo và đổi ghế
Email xác nhận được gửi đến khách hàng
Hệ thống ghi nhận hoạt động vào Activity Log

Basic Flow
1. Admin chọn menu "Quản lý ghế hỏng"
2. Hệ thống truy vấn danh sách báo cáo ghế hỏng với status PENDING
3. Hệ thống hiển thị danh sách báo cáo với: Mã báo cáo, Chuyến tàu, Toa, Ghế, Loại sự cố, Người báo cáo (Driver), Ngày báo cáo, Trạng thái
4. Hệ thống sắp xếp theo ngày báo cáo giảm dần
5. Admin click vào 1 báo cáo để xem chi tiết
6. Hệ thống hiển thị chi tiết báo cáo với: Thông tin chuyến tàu, Thông tin ghế, Loại sự cố, Mô tả chi tiết, Ảnh (nếu có), Người báo cáo, Ngày báo cáo
7. Hệ thống hiển thị các nút: "Xác nhận hỏng", "Từ chối"
8. Admin chọn lệnh "Xác nhận hỏng"
9. Hệ thống cập nhật Seat.status = DISABLED
10. Hệ thống tìm các Ticket đang sử dụng ghế này (tripId, seatId, booking status PAID)
11. Nếu có Ticket bị ảnh hưởng: Hệ thống chuyển sang luồng đổi ghế (Alternative Flow 11a)
12. Nếu không có Ticket bị ảnh hưởng: Hệ thống cập nhật báo cáo: status = RESOLVED
13. Hệ thống hiển thị thông báo: "Xử lý báo cáo thành công!"
14. Hệ thống ghi nhận hoạt động vào Activity Log

Alternative Flow 11a - Đổi ghế cho khách hàng
11a1. Hệ thống tìm ghế thay thế: Cùng chuyến tàu, Cùng loại (SEAT/BED), Cùng giá, Status ACTIVE, Chưa bị đặt
11a2. Hệ thống sắp xếp ghế thay thế theo: Cùng toa > Gần ghế cũ > Số ghế tăng dần
11a3. Hệ thống hiển thị danh sách khách hàng bị ảnh hưởng với: Tên, Email, Ghế cũ, Danh sách ghế đề xuất (tối đa 5 ghế)
11a4. Admin xem danh sách và chọn lệnh "Gửi email thông báo"
11a5. Hệ thống tạo token xác nhận đổi ghế (hết hạn sau 48 giờ)
11a6. Hệ thống gửi email đến khách hàng với: Thông tin ghế cũ, Lý do hỏng, Danh sách ghế đề xuất, Link xác nhận
11a7. Hệ thống cập nhật báo cáo: status = WAITING_CUSTOMER_CONFIRMATION
11a8. Hệ thống hiển thị thông báo: "Email đã được gửi đến khách hàng. Chờ xác nhận"
11a9. Khách hàng click vào link và chọn ghế mới (UC-04)
11a10. Hệ thống cập nhật Ticket với seatId mới
11a11. Hệ thống cập nhật báo cáo: status = RESOLVED
11a12. Hệ thống gửi email xác nhận đổi ghế thành công
Use Case tiếp tục bước 13

Alternative Flow 8a - Admin từ chối báo cáo
8a1. Admin chọn lệnh "Từ chối"
8a2. Hệ thống hiển thị dialog với trường: Lý do từ chối (required)
8a3. Admin nhập lý do và chọn lệnh "Xác nhận"
8a4. Hệ thống cập nhật báo cáo: status = REJECTED, rejectionReason
8a5. Hệ thống gửi thông báo đến Driver
8a6. Hệ thống hiển thị thông báo: "Đã từ chối báo cáo"
Use Case quay lại bước 2

Alternative Flow 11a1a - Không tìm thấy ghế thay thế
11a1a1. Hệ thống hiển thị thông báo: "Không tìm thấy ghế thay thế phù hợp. Vui lòng xử lý thủ công"
11a1a2. Admin chọn lệnh "Hoàn tiền cho khách"
11a1a3. Hệ thống cập nhật Booking: status = CANCELLED
11a1a4. Hệ thống xóa Ticket
11a1a5. Hệ thống hoàn tiền 100% về ví khách hàng
11a1a6. Hệ thống gửi email thông báo hủy vé và hoàn tiền
11a1a7. Hệ thống cập nhật báo cáo: status = RESOLVED
Use Case tiếp tục bước 13

Alternative Flow 11a9a - Khách hàng không xác nhận trong 48 giờ
11a9a1. Token hết hạn
11a9a2. Hệ thống tự động chọn ghế đề xuất đầu tiên
11a9a3. Hệ thống cập nhật Ticket với seatId mới
11a9a4. Hệ thống gửi email thông báo đã tự động đổi ghế
11a9a5. Hệ thống cập nhật báo cáo: status = RESOLVED
Use Case tiếp tục bước 13

Exception Flow
10a. Hệ thống xảy ra lỗi khi tìm Ticket
10a1. Hệ thống hiển thị thông báo: "Đã xảy ra lỗi. Vui lòng thử lại sau"
10a2. Hệ thống ghi log lỗi
Use Case dừng lại

11a6a. Không thể gửi email
11a6a1. Hệ thống hiển thị lỗi: "Không thể gửi email. Vui lòng thử lại"
11a6a2. Hệ thống ghi log lỗi
Use Case quay lại bước 11a4

Business Rules
BR-01: Chỉ Admin có quyền xử lý báo cáo ghế hỏng
BR-02: Ghế hỏng được đánh dấu DISABLED
BR-03: Ghế thay thế phải cùng loại và cùng giá với ghế cũ
BR-04: Ưu tiên ghế thay thế cùng toa và gần ghế cũ
BR-05: Token xác nhận đổi ghế hết hạn sau 48 giờ
BR-06: Nếu khách không xác nhận trong 48 giờ: Tự động đổi ghế đề xuất đầu tiên
BR-07: Nếu không có ghế thay thế: Hoàn tiền 100%
BR-08: Gửi email thông báo cho khách hàng bị ảnh hưởng

Non-Functional Requirement
NFR-01: Thời gian load danh sách báo cáo dưới 1 giây
NFR-02: Thời gian tìm ghế thay thế dưới 2 giây
NFR-03: Thời gian cập nhật dưới 1 giây
NFR-04: Email được gửi trong vòng 30 giây
NFR-05: Hiển thị sơ đồ ghế để Admin dễ chọn ghế thay thế
NFR-06: Hỗ trợ upload ảnh ghế hỏng (tối đa 3 ảnh)
NFR-07: Danh sách responsive, hoạt động tốt trên tablet
