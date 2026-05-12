Use Case ID
UC-12

Use Case Name
Quản lý người dùng

Description
Là Admin, tôi muốn quản lý người dùng trong hệ thống bao gồm xem danh sách, phân quyền và khóa/mở khóa tài khoản.

Actor(s)
Admin, Email Service

Priority
Must Have

Trigger
Admin muốn quản lý người dùng

Pre-Condition(s)
Admin đã đăng nhập vào hệ thống với role ADMIN
Thiết bị của Admin đã được kết nối internet

Post-Condition(s)
Danh sách người dùng được hiển thị hoặc cập nhật thành công
Thay đổi được lưu vào database
Email thông báo được gửi đến người dùng (nếu có thay đổi)
Hệ thống ghi nhận hoạt động vào Activity Log

Basic Flow
1. Admin chọn menu "Quản lý người dùng"
2. Hệ thống truy vấn danh sách người dùng với: Tên, Email, Role, Trạng thái, Số dư ví, Ngày tạo
3. Hệ thống hiển thị danh sách người dùng dạng bảng
4. Hệ thống phân trang 20 người dùng/trang
5. Hệ thống ghi nhận hoạt động xem danh sách vào Activity Log

Alternative Flow
3a. Admin tìm kiếm người dùng
3a1. Hệ thống hiển thị ô tìm kiếm
3a2. Admin nhập từ khóa (tên, email)
3a3. Hệ thống tìm kiếm và hiển thị kết quả
Use Case tiếp tục bước 5

3b. Admin lọc người dùng
3b1. Hệ thống hiển thị bộ lọc: Role (USER/ADMIN/DRIVER), Trạng thái (ACTIVE/BLOCKED), Trạng thái email (VERIFIED/UNVERIFIED)
3b2. Admin chọn điều kiện lọc
3b3. Hệ thống lọc và hiển thị kết quả
Use Case tiếp tục bước 5

3c. Admin click vào 1 người dùng để xem chi tiết
3c1. Hệ thống hiển thị trang chi tiết người dùng với: Thông tin cá nhân, Thống kê (Số đơn đặt vé, Tổng chi tiêu, Số dư ví), Lịch sử đặt vé (5 đơn gần nhất), Lịch sử giao dịch ví (5 giao dịch gần nhất)
3c2. Hệ thống hiển thị các nút: "Phân quyền", "Khóa tài khoản" (nếu ACTIVE), "Mở khóa tài khoản" (nếu BLOCKED), "Xem tất cả đơn hàng"
Use Case tiếp tục bước 5

3d. Admin chọn lệnh "Phân quyền" (từ chi tiết người dùng)
3d1. Hệ thống hiển thị dialog phân quyền với dropdown: USER, ADMIN, DRIVER
3d2. Admin chọn role mới và chọn lệnh "Xác nhận"
3d3. Hệ thống kiểm tra: Admin không thể tự phân quyền mình thành USER
3d4. Hệ thống cập nhật User.role
3d5. Hệ thống gửi email thông báo thay đổi quyền
3d6. Hệ thống hiển thị thông báo: "Phân quyền thành công!"
Use Case quay lại bước 3c1

3e. Admin chọn lệnh "Khóa tài khoản" (từ chi tiết người dùng ACTIVE)
3e1. Hệ thống hiển thị dialog xác nhận với trường: Lý do khóa (required)
3e2. Admin nhập lý do và chọn lệnh "Xác nhận"
3e3. Hệ thống kiểm tra: Admin không thể tự khóa mình
3e4. Hệ thống cập nhật User.status = BLOCKED
3e5. Hệ thống gửi email thông báo khóa tài khoản kèm lý do
3e6. Hệ thống hiển thị thông báo: "Khóa tài khoản thành công!"
Use Case quay lại bước 3c1

3f. Admin chọn lệnh "Mở khóa tài khoản" (từ chi tiết người dùng BLOCKED)
3f1. Hệ thống hiển thị dialog xác nhận: "Bạn có chắc muốn mở khóa tài khoản này?"
3f2. Admin chọn lệnh "Xác nhận"
3f3. Hệ thống cập nhật User.status = ACTIVE
3f4. Hệ thống gửi email thông báo mở khóa tài khoản
3f5. Hệ thống hiển thị thông báo: "Mở khóa tài khoản thành công!"
Use Case quay lại bước 3c1

3g. Admin chọn lệnh "Xem tất cả đơn hàng" (từ chi tiết người dùng)
3g1. Hệ thống chuyển sang trang danh sách đơn hàng với filter userId
Use Case tiếp tục bước 5

Exception Flow
2a. Hệ thống xảy ra lỗi khi truy vấn
2a1. Hệ thống hiển thị thông báo: "Đã xảy ra lỗi. Vui lòng thử lại sau"
2a2. Hệ thống ghi log lỗi
Use Case dừng lại

3d3a. Admin cố tự phân quyền mình thành USER
3d3a1. Hệ thống hiển thị lỗi: "Bạn không thể tự phân quyền mình thành USER"
Use Case quay lại bước 3d1

3e3a. Admin cố tự khóa mình
3e3a1. Hệ thống hiển thị lỗi: "Bạn không thể tự khóa tài khoản của mình"
Use Case quay lại bước 3e1

3d5a. Không thể gửi email thông báo
3d5a1. Hệ thống vẫn cập nhật thành công
3d5a2. Hệ thống ghi log lỗi gửi email
Use Case tiếp tục bước 3d6

Business Rules
BR-01: Chỉ Admin có quyền quản lý người dùng
BR-02: Admin không thể tự phân quyền mình thành USER
BR-03: Admin không thể tự khóa tài khoản của mình
BR-04: Tài khoản BLOCKED không thể đăng nhập
BR-05: Gửi email thông báo khi thay đổi quyền hoặc khóa/mở khóa tài khoản
BR-06: Lý do khóa tài khoản là bắt buộc

Non-Functional Requirement
NFR-01: Thời gian load danh sách dưới 2 giây
NFR-02: Thời gian load chi tiết người dùng dưới 1 giây
NFR-03: Thời gian cập nhật dưới 1 giây
NFR-04: Danh sách responsive, hoạt động tốt trên tablet
NFR-05: Hỗ trợ pagination (20 người dùng/trang)
NFR-06: Hỗ trợ tìm kiếm và lọc
NFR-07: Email được gửi trong vòng 30 giây
