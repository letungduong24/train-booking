Use Case ID
UC-02

Use Case Name
Đăng nhập hệ thống

Description
Là người dùng, tôi muốn đăng nhập vào hệ thống để sử dụng các chức năng đặt vé tàu hỏa.

Actor(s)
Người dùng (Customer), Google OAuth

Priority
Must Have

Trigger
Người dùng muốn truy cập vào hệ thống để sử dụng dịch vụ

Pre-Condition(s)
Người dùng đã có tài khoản trong hệ thống
Tài khoản người dùng đã được phân quyền
Thiết bị của người dùng đã được kết nối internet

Post-Condition(s)
Người dùng đăng nhập hệ thống thành công
Hệ thống tạo JWT token để duy trì phiên đăng nhập
Hệ thống ghi nhận hoạt động đăng nhập thành công vào Activity Log

Basic Flow - Đăng nhập bằng Email/Password
1. Người dùng truy cập trang đăng nhập
2. Người dùng chọn phương thức đăng nhập bằng Email/Password
3. Hệ thống hiển thị form đăng nhập với các trường: Email, Mật khẩu
4. Người dùng nhập email và mật khẩu, chọn lệnh "Đăng nhập"
5. Hệ thống kiểm tra thông tin đăng nhập
6. Hệ thống xác thực thông tin đăng nhập thành công
7. Hệ thống tạo JWT token với thời gian hết hạn 7 ngày
8. Hệ thống lưu token vào cookie
9. Hệ thống chuyển người dùng đến trang dashboard
10. Hệ thống ghi nhận hoạt động đăng nhập thành công vào Activity Log

Alternative Flow
2a. Người dùng chọn phương thức đăng nhập bằng Google OAuth
2a1. Hệ thống chuyển hướng đến trang xác thực Google
3a. Người dùng đăng nhập Google và cho phép quyền truy cập
4a. Google xác thực thông tin đăng nhập thành công và trả về thông tin người dùng (email, tên, avatar)
5a. Hệ thống kiểm tra email đã tồn tại trong hệ thống
5a1. Nếu email đã tồn tại: Đăng nhập vào tài khoản hiện tại
5a2. Nếu email chưa tồn tại: Tạo tài khoản mới với thông tin từ Google
Use Case tiếp tục bước 7

6a. Email không tồn tại trong hệ thống
6a1. Hệ thống hiển thị lỗi: "Email hoặc mật khẩu không đúng"
6a2. Người dùng chọn lệnh thử lại. Use Case quay lại bước 3
6a3. Người dùng chọn lệnh đăng ký. Use Case chuyển sang UC-01
6a4. Người dùng chọn lệnh quên mật khẩu. Use Case chuyển sang UC-04

6b. Mật khẩu không khớp
6b1. Hệ thống hiển thị lỗi: "Email hoặc mật khẩu không đúng"
6b2. Hệ thống tăng số lần đăng nhập thất bại
6b3. Nếu sai 5 lần liên tiếp: Hệ thống khóa tài khoản 15 phút
Use Case quay lại bước 3

6c. Tài khoản bị khóa
6c1. Hệ thống hiển thị lỗi: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ"
Use Case dừng lại

3b. Người dùng hủy xác thực Google
3b1. Hệ thống hiển thị thông báo: "Đăng nhập bị hủy"
Use Case quay lại bước 1

Exception Flow
5b. Hệ thống không thể kết nối đến Google OAuth
5b1. Hệ thống hiển thị lỗi: "Không thể đăng nhập bằng Google. Vui lòng thử lại sau"
Use Case quay lại bước 1

7a. Hệ thống xảy ra lỗi khi tạo token
7a1. Hệ thống hiển thị thông báo: "Đã xảy ra lỗi. Vui lòng thử lại sau"
Use Case dừng lại

Business Rules
BR-01: Mỗi user chỉ có 1 session active tại 1 thời điểm
BR-02: Token hết hạn sau 7 ngày
BR-03: Sau 5 lần đăng nhập sai liên tiếp: Khóa tài khoản 15 phút
BR-04: Tài khoản có trạng thái BLOCKED không thể đăng nhập
BR-05: Google OAuth tự động tạo tài khoản nếu email chưa tồn tại
BR-06: Mật khẩu được so sánh bằng bcrypt

Non-Functional Requirement
NFR-01: Thời gian phản hồi đăng nhập dưới 1 giây
NFR-02: Google OAuth redirect dưới 3 giây
NFR-03: Token được lưu trong httpOnly cookie để tránh XSS
NFR-04: Form đăng nhập responsive, hoạt động tốt trên mobile
NFR-05: Hiển thị/ẩn mật khẩu khi người dùng nhập
