Use Case ID
UC-03

Use Case Name
Quản lý hồ sơ

Description
Là người dùng, tôi muốn xem và cập nhật thông tin cá nhân của mình trong hệ thống.

Actor(s)
Người dùng (Customer), File Storage, Email Service

Priority
Must Have

Trigger
Người dùng muốn xem hoặc thay đổi thông tin cá nhân

Pre-Condition(s)
Người dùng đã đăng nhập vào hệ thống
Thiết bị của người dùng đã được kết nối internet

Post-Condition(s)
Thông tin cá nhân được hiển thị hoặc cập nhật thành công
Thay đổi được lưu vào database
Hệ thống ghi nhận hoạt động cập nhật vào Activity Log

Basic Flow - Xem thông tin cá nhân
1. Người dùng chọn menu "Hồ sơ của tôi"
2. Hệ thống truy vấn thông tin người dùng từ database
3. Hệ thống hiển thị thông tin: Họ tên, Email, Số điện thoại, Avatar, Ngày tạo tài khoản, Trạng thái xác thực email
4. Hệ thống ghi nhận hoạt động xem hồ sơ vào Activity Log

Alternative Flow
3a. Người dùng chọn lệnh "Chỉnh sửa hồ sơ"
3a1. Hệ thống hiển thị form chỉnh sửa với các trường: Họ tên (có thể sửa), Email (không thể sửa), Số điện thoại (có thể sửa), Avatar (có thể upload ảnh mới)
4a. Người dùng thay đổi thông tin và chọn lệnh "Lưu thay đổi"
5a. Hệ thống kiểm tra tính hợp lệ của dữ liệu
6a. Hệ thống cập nhật thông tin vào database
7a. Hệ thống hiển thị thông báo: "Cập nhật thông tin thành công"
8a. Hệ thống hiển thị lại thông tin đã cập nhật
9a. Hệ thống ghi nhận hoạt động cập nhật hồ sơ vào Activity Log

3b. Người dùng chọn lệnh "Đổi mật khẩu"
3b1. Hệ thống hiển thị form đổi mật khẩu với các trường: Mật khẩu hiện tại, Mật khẩu mới, Xác nhận mật khẩu mới
4b. Người dùng nhập thông tin và chọn lệnh "Đổi mật khẩu"
5b. Hệ thống kiểm tra: Mật khẩu hiện tại đúng, Mật khẩu mới đủ mạnh, Mật khẩu mới và xác nhận khớp nhau, Mật khẩu mới khác mật khẩu cũ
6b. Hệ thống mã hóa mật khẩu mới bằng bcrypt
7b. Hệ thống cập nhật mật khẩu vào database
8b. Hệ thống gửi email thông báo đổi mật khẩu thành công
9b. Hệ thống hiển thị thông báo: "Đổi mật khẩu thành công"
10b. Hệ thống ghi nhận hoạt động đổi mật khẩu vào Activity Log

5a1. Họ tên để trống
5a1a. Hệ thống hiển thị lỗi: "Họ tên không được để trống"
Use Case quay lại bước 3a1

5a2. Số điện thoại không hợp lệ
5a2a. Hệ thống hiển thị lỗi: "Số điện thoại phải có 10-11 chữ số"
Use Case quay lại bước 3a1

5a3. Avatar quá lớn
5a3a. Hệ thống hiển thị lỗi: "Ảnh không được vượt quá 5MB"
Use Case quay lại bước 3a1

4a1. Người dùng chọn lệnh "Hủy"
4a1a. Hệ thống không lưu thay đổi
Use Case quay lại bước 3

5b1. Mật khẩu hiện tại sai
5b1a. Hệ thống hiển thị lỗi: "Mật khẩu hiện tại không đúng"
Use Case quay lại bước 3b1

5b2. Mật khẩu mới không hợp lệ
5b2a. Hệ thống hiển thị lỗi: "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số"
Use Case quay lại bước 3b1

5b3. Mật khẩu mới trùng mật khẩu cũ
5b3a. Hệ thống hiển thị lỗi: "Mật khẩu mới phải khác mật khẩu hiện tại"
Use Case quay lại bước 3b1

Exception Flow
6a1. Không thể upload ảnh lên server
6a1a. Hệ thống hiển thị lỗi: "Không thể tải ảnh lên. Vui lòng thử lại"
Use Case quay lại bước 3a1

6a2. Hệ thống xảy ra lỗi khi cập nhật thông tin
6a2a. Hệ thống hiển thị thông báo: "Đã xảy ra lỗi. Vui lòng thử lại sau"
Use Case dừng lại

Business Rules
BR-01: Email không thể thay đổi sau khi đăng ký
BR-02: Họ tên không được để trống
BR-03: Số điện thoại phải có 10-11 chữ số
BR-04: Avatar không vượt quá 5MB, định dạng jpg/png
BR-05: Mật khẩu mới phải khác mật khẩu cũ
BR-06: Gửi email thông báo khi đổi mật khẩu

Non-Functional Requirement
NFR-01: Thời gian load thông tin dưới 1 giây
NFR-02: Thời gian cập nhật dưới 2 giây
NFR-03: Upload avatar dưới 5 giây
NFR-04: Mật khẩu mới được mã hóa bằng bcrypt
NFR-05: Form chỉnh sửa responsive, hoạt động tốt trên mobile
NFR-06: Preview avatar trước khi upload
NFR-07: Hiển thị độ mạnh mật khẩu khi đổi mật khẩu
