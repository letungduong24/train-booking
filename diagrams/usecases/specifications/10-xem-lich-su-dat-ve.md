Use Case ID
UC-10

Use Case Name
Xem lịch sử đặt vé

Description
Là khách hàng, tôi muốn xem lịch sử tất cả các đơn đặt vé của mình để theo dõi và quản lý.

Actor(s)
Khách hàng (Customer)

Priority
Must Have

Trigger
Khách hàng muốn xem lịch sử đặt vé

Pre-Condition(s)
Khách hàng đã đăng nhập vào hệ thống
Thiết bị của khách hàng đã được kết nối internet

Post-Condition(s)
Danh sách đơn đặt vé được hiển thị
Hệ thống ghi nhận hoạt động xem lịch sử vào Activity Log

Basic Flow
1. Khách hàng chọn menu "Vé của tôi"
2. Hệ thống truy vấn danh sách booking với: userId, sắp xếp theo createdAt giảm dần
3. Hệ thống hiển thị danh sách đơn đặt vé với thông tin: Mã đặt chỗ, Chuyến tàu, Tuyến đường, Ngày khởi hành, Số vé, Tổng tiền, Trạng thái (PAID/PENDING/CANCELLED/PAYMENT_FAILED), Ngày đặt
4. Hệ thống phân trang 10 đơn/trang
5. Hệ thống ghi nhận hoạt động xem lịch sử vào Activity Log

Alternative Flow
3a. Không có đơn đặt vé nào
3a1. Hệ thống hiển thị thông báo: "Bạn chưa có đơn đặt vé nào"
3a2. Hệ thống hiển thị nút "Tìm chuyến tàu"
Use Case dừng lại

4a. Khách hàng chọn lọc theo trạng thái
4a1. Hệ thống hiển thị dropdown lọc: Tất cả, Đã thanh toán, Chờ thanh toán, Đã hủy, Thanh toán thất bại
4a2. Khách hàng chọn trạng thái
4a3. Hệ thống lọc và hiển thị lại kết quả
Use Case tiếp tục bước 5

4b. Khách hàng tìm kiếm theo mã đặt chỗ hoặc tên chuyến
4b1. Hệ thống hiển thị ô tìm kiếm
4b2. Khách hàng nhập từ khóa
4b3. Hệ thống tìm kiếm và hiển thị kết quả
Use Case tiếp tục bước 5

4c. Khách hàng click vào 1 đơn để xem chi tiết
4c1. Hệ thống hiển thị trang chi tiết đơn đặt vé với: Thông tin chuyến tàu, Danh sách vé (Tên hành khách, CCCD, Ghế, Toa, Giá), Tổng tiền, Trạng thái, Ngày đặt, Thời gian hết hạn (nếu PENDING)
4c2. Nếu status PAID: Hiển thị nút "Tải vé PDF" và "Hủy vé"
4c3. Nếu status PENDING: Hiển thị nút "Thanh toán" và "Hủy đơn", Countdown thời gian hết hạn
4c4. Nếu status CANCELLED hoặc PAYMENT_FAILED: Hiển thị lý do
Use Case tiếp tục bước 5

4d. Khách hàng chọn lệnh "Hủy vé" (từ chi tiết đơn PAID)
4d1. Hệ thống hiển thị xác nhận: "Bạn có chắc muốn hủy vé? Tiền sẽ được hoàn về ví của bạn"
4d2. Khách hàng chọn lệnh "Xác nhận"
4d3. Hệ thống kiểm tra: Chuyến tàu chưa khởi hành
4d4. Hệ thống cập nhật Booking: status = CANCELLED
4d5. Hệ thống xóa Ticket
4d6. Hệ thống hoàn tiền về ví
4d7. Hệ thống gửi email thông báo hủy vé
4d8. Hệ thống hiển thị thông báo: "Hủy vé thành công! Tiền đã được hoàn về ví"
Use Case quay lại bước 2

4e. Khách hàng chọn lệnh "Hủy đơn" (từ chi tiết đơn PENDING)
4e1. Hệ thống hiển thị xác nhận: "Bạn có chắc muốn hủy đơn?"
4e2. Khách hàng chọn lệnh "Xác nhận"
4e3. Hệ thống cập nhật Booking: status = CANCELLED
4e4. Hệ thống xóa Redis lock
4e5. Hệ thống emit socket event "seats.released"
4e6. Hệ thống hiển thị thông báo: "Hủy đơn thành công!"
Use Case quay lại bước 2

4f. Khách hàng chọn lệnh "Thanh toán" (từ chi tiết đơn PENDING)
4f1. Hệ thống kiểm tra: Đơn chưa hết hạn, Chuyến tàu vẫn SCHEDULED
4f2. Hệ thống tạo URL thanh toán VNPay
4f3. Hệ thống chuyển hướng khách hàng đến trang thanh toán
Use Case tiếp tục UC-09 bước 23

4g. Khách hàng chọn lệnh "Tải vé PDF" (từ chi tiết đơn PAID)
4g1. Hệ thống tạo PDF vé với QR code
4g2. Hệ thống tải xuống file PDF
Use Case tiếp tục bước 5

Exception Flow
2a. Hệ thống xảy ra lỗi khi truy vấn
2a1. Hệ thống hiển thị thông báo: "Đã xảy ra lỗi. Vui lòng thử lại sau"
2a2. Hệ thống ghi log lỗi
Use Case dừng lại

4d3a. Chuyến tàu đã khởi hành
4d3a1. Hệ thống hiển thị lỗi: "Không thể hủy vé. Chuyến tàu đã khởi hành"
Use Case quay lại bước 4c1

4f1a. Đơn đã hết hạn
4f1a1. Hệ thống hiển thị lỗi: "Đơn đã hết hạn. Vui lòng đặt vé mới"
Use Case quay lại bước 2

4g1a. Không thể tạo PDF
4g1a1. Hệ thống hiển thị lỗi: "Không thể tạo vé PDF. Vui lòng thử lại sau"
4g1a2. Hệ thống ghi log lỗi
Use Case quay lại bước 4c1

Business Rules
BR-01: Hiển thị tất cả trạng thái: PAID, PENDING, CANCELLED, PAYMENT_FAILED
BR-02: Chỉ cho phép hủy vé PAID nếu chuyến tàu chưa khởi hành
BR-03: Hoàn tiền 100% khi hủy vé PAID
BR-04: Đơn PENDING hết hạn sau 10 phút
BR-05: Chỉ cho phép thanh toán đơn PENDING nếu chưa hết hạn và chuyến tàu vẫn SCHEDULED
BR-06: Vé PDF chứa QR code để quét khi lên tàu

Non-Functional Requirement
NFR-01: Thời gian load danh sách dưới 1 giây
NFR-02: Thời gian load chi tiết đơn dưới 1 giây
NFR-03: Thời gian tạo PDF dưới 3 giây
NFR-04: Danh sách responsive, hoạt động tốt trên mobile
NFR-05: Hiển thị countdown real-time cho đơn PENDING
NFR-06: Hỗ trợ pagination (10 đơn/trang)
NFR-07: Hỗ trợ lọc và tìm kiếm
