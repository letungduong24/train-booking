Tài Liệu Phân Tích Use Case - Hệ Thống Đặt Vé Tàu Hỏa (Railway Booking System)

Mục Lục

1. Xác định Tác Nhân (Actors)
2. Xác định Use Case
3. Biểu Đồ Use Case
3.1 Biểu Đồ Use Case Tổng Quát
3.2 Biểu Đồ Use Case Theo Tác Nhân
3.3 Biểu Đồ Use Case Phân Rã
4. Đặc Tả Use Case Chi Tiết

1. Xác Định Tác Nhân (Actors)

1.1 Tác Nhân Chính

1.1.1 Khách Hàng (Customer/User)
Mô tả: Người dùng cuối sử dụng hệ thống để tìm kiếm và đặt vé tàu hỏa
Vai trò: 
Tìm kiếm chuyến tàu
Đặt vé và thanh toán
Quản lý đặt chỗ của mình
Quản lý ví điện tử
Sử dụng chatbot hỗ trợ

1.1.2 Quản Trị Viên (Admin)
Mô tả: Người quản lý hệ thống, có quyền truy cập và quản lý toàn bộ dữ liệu
Vai trò:
Quản lý tàu, toa, ghế
Quản lý tuyến đường và ga
Quản lý chuyến tàu
Quản lý giá vé và nhóm hành khách
Xem báo cáo và thống kê
Quản lý người dùng
Quản lý mạng lưới đường sắt

1.1.3 Lái Tàu (Driver)
Mô tả: Người điều khiển tàu, cập nhật trạng thái chuyến tàu
Vai trò:
Xem thông tin chuyến tàu được phân công
Cập nhật trạng thái chuyến tàu (đang chạy, hoàn thành)
Cập nhật thông tin delay

1.2 Tác Nhân Phụ (Secondary Actors)

1.2.1 Hệ Thống Thanh Toán (Payment Gateway)
Mô tả: Hệ thống bên ngoài xử lý thanh toán (VNPay, Momo, etc.)
Vai trò: Xử lý giao dịch thanh toán

1.2.2 Hệ Thống Email (Email Service)
Mô tả: Dịch vụ gửi email thông báo
Vai trò: Gửi email xác nhận, thông báo

1.2.3 Chatbot AI
Mô tả: Trợ lý ảo hỗ trợ khách hàng
Vai trò: Trả lời câu hỏi, hỗ trợ tìm kiếm

2. Xác Định Use Case

2.1 Use Case Của Khách Hàng (Customer) - 10 UCs

UC-01: Đăng ký tài khoản
UC-02: Đăng nhập hệ thống
UC-03: Quản lý hồ sơ (xem và cập nhật thông tin cá nhân, đổi mật khẩu)
UC-04: Xác nhận đổi ghế (khi ghế bị hỏng)
UC-05: Chat với Chatbot
UC-06: Tìm kiếm chuyến tàu
UC-07: Xem chuyến đang chạy (bao gồm GPS giả lập)
UC-08: Quản lý ví điện tử (xem số dư, nạp tiền, rút tiền, quản lý PIN)
UC-09: Đặt vé tàu (2 luồng: Init -> Passengers -> Payment hoặc All-in-one -> Payment)
UC-10: Xem lịch sử đặt vé

2.2 Use Case Của Quản Trị Viên (Admin) - 4 UCs

UC-11: Xem dashboard và báo cáo (doanh thu, tỷ lệ lấp đầy, chuyến phổ biến)
UC-12: Quản lý người dùng (xem, phân quyền, khóa/mở khóa)
UC-13: Xử lý ghế hỏng (bao gồm đổi ghế cho khách)
UC-14: Quản lý tàu (tàu, toa, ghế, ga, tuyến, chuyến, mạng lưới)

2.3 Use Case Của Lái Tàu (Driver) - 4 UCs

UC-15: Yêu cầu hủy chuyến khẩn cấp
UC-16: Xem chuyến được phân công (hôm nay, tuần này, lịch sử)
UC-17: Báo cáo delay (khởi hành hoặc đến nơi)
UC-18: Báo cáo ghế hỏng

Tổng Kết

Tổng số Use Case: 18 UCs (gộp nhiều UC chi tiết thành UC tổng quát)
Customer: 10 UCs
Admin: 4 UCs
Driver: 4 UCs

3. Biểu Đồ Use Case

3.1 Biểu Đồ Use Case Tổng Quát

Xem file: 01-overall-usecase-diagram.md

3.2 Biểu Đồ Use Case Theo Tác Nhân

3.2.1 Use Case của Khách Hàng
3.2.2 Use Case của Quản Trị Viên
3.2.3 Use Case của Lái Tàu

4. Đặc Tả Use Case Chi Tiết

Các đặc tả chi tiết được lưu trong thư mục specifications:

4.1 Customer Use Cases
UC-01: Đăng ký tài khoản
UC-02: Đăng nhập hệ thống
UC-03: Quản lý hồ sơ
UC-04: Xác nhận đổi ghế
UC-05: Chat với Chatbot
UC-06: Tìm kiếm chuyến tàu
UC-07: Xem chuyến đang chạy
UC-08: Quản lý ví điện tử
UC-09: Đặt vé tàu
UC-10: Xem lịch sử đặt vé

4.2 Admin Use Cases
UC-11: Xem dashboard và báo cáo
UC-12: Quản lý người dùng
UC-13: Xử lý ghế hỏng
UC-14: Quản lý tàu

4.3 Driver Use Cases
UC-15: Yêu cầu hủy chuyến khẩn cấp
UC-16: Xem chuyến được phân công
UC-17: Báo cáo delay
UC-18: Báo cáo ghế hỏng

Ghi Chú

Tài liệu này được tạo dựa trên phân tích codebase hiện tại của hệ thống Railway Booking System
Các biểu đồ sử dụng Mermaid syntax để dễ dàng render và maintain
Tài liệu có thể được cập nhật khi hệ thống có thay đổi
