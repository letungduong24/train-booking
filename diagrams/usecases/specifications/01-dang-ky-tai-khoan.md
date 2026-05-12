Use Case ID
UC-01

Use Case Name
Đăng ký tài khoản

Description
Là người dùng, tôi muốn đăng ký tài khoản mới để sử dụng hệ thống đặt vé tàu hỏa.

Actor(s)
Người dùng (Customer), Email Service

Priority
Must Have

Trigger
Người dùng muốn tạo tài khoản mới trong hệ thống

Pre-Condition(s)
Người dùng chưa có tài khoản trong hệ thống
Người dùng có email hợp lệ
Thiết bị của người dùng đã được kết nối internet

Post-Condition(s)
Tài khoản mới được tạo với trạng thái chưa xác thực email
Email xác thực được gửi đến địa chỉ email đã đăng ký
Hệ thống ghi nhận hoạt động đăng ký thành công vào Activity Log

Basic Flow
1. Người dùng truy cập trang đăng ký
2. Hệ thống hiển thị form đăng ký với các trường: Họ tên, Email, Mật khẩu, Xác nhận mật khẩu, Số điện thoại (tùy chọn)
3. Người dùng nhập thông tin và chọn lệnh "Đăng ký"
4. Hệ thống kiểm tra tính hợp lệ của dữ liệu
5. Hệ thống tạo tài khoản mới với trạng thái UNVERIFIED, số dư ví 0 VND, vai trò USER
6. Hệ thống gửi email xác thực đến địa chỉ email đã đăng ký
7. Hệ thống hiển thị thông báo: "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản"
8. Hệ thống ghi nhận hoạt động đăng ký thành công vào Activity Log

Alternative Flow
4a. Email đã tồn tại trong hệ thống
4a1. Hệ thống hiển thị lỗi: "Email này đã được sử dụng"
4a2. Người dùng chọn lệnh thử lại. Use Case quay lại bước 2
4a3. Người dùng chọn lệnh đăng nhập. Use Case chuyển sang UC-02

4b. Mật khẩu không đủ mạnh
4b1. Hệ thống hiển thị lỗi: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số"
Use Case quay lại bước 2

4c. Mật khẩu xác nhận không khớp
4c1. Hệ thống hiển thị lỗi: "Mật khẩu xác nhận không khớp"
Use Case quay lại bước 2

6a. Không thể gửi email xác thực
6a1. Hệ thống vẫn tạo tài khoản
6a2. Hệ thống hiển thị thông báo: "Đăng ký thành công nhưng không thể gửi email xác thực. Vui lòng liên hệ hỗ trợ"
Use Case tiếp tục bước 8

Exception Flow
4d. Hệ thống xảy ra lỗi khi kiểm tra dữ liệu
4d1. Hệ thống hiển thị thông báo: "Đã xảy ra lỗi. Vui lòng thử lại sau"
4d2. Người dùng chọn lệnh hủy đăng ký. Use Case dừng lại
4d3. Người dùng chọn lệnh thử lại. Use Case quay lại bước 2

5a. Hệ thống xảy ra lỗi khi tạo tài khoản
5a1. Hệ thống hiển thị thông báo: "Đã xảy ra lỗi. Vui lòng thử lại sau"
Use Case dừng lại

Business Rules
BR-01: Email phải là duy nhất trong hệ thống
BR-02: Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số
BR-03: Tài khoản mới có số dư ví = 0 VND
BR-04: Tài khoản mới có vai trò mặc định là USER
BR-05: Email xác thực hết hạn sau 24 giờ
BR-06: Giới hạn số lần đăng ký từ cùng 1 IP: 5 lần/giờ

Non-Functional Requirement
NFR-01: Thời gian phản hồi đăng ký dưới 2 giây
NFR-02: Email xác thực được gửi trong vòng 30 giây
NFR-03: Mật khẩu của người dùng phải được hash bằng bcrypt
NFR-04: Form đăng ký responsive, hoạt động tốt trên mobile
NFR-05: Hiển thị độ mạnh mật khẩu real-time khi người dùng nhập
