Use Case ID	UC-03
Use Case Name	Quản lý hồ sơ
Description	Là người dùng, tôi muốn xem và cập nhật thông tin hồ sơ của mình.
Actor(s)	Người dùng
Priority	Must Have
Trigger	Người dùng muốn xem hoặc thay đổi hồ sơ cá nhân
Pre-Condition(s)	1. Người dùng đã đăng nhập
Post-Condition(s)	1. Thông tin hồ sơ được cập nhật nếu dữ liệu hợp lệ
2. Dữ liệu cũ được giữ nguyên nếu cập nhật thất bại
Basic Flow	1. Người dùng mở trang hồ sơ
2. Hệ thống hiển thị email, tên và thông tin tài khoản hiện có
3. Người dùng chỉnh sửa tên hoặc mật khẩu
4. Người dùng chọn lưu thay đổi
5. Hệ thống kiểm tra dữ liệu
6. Hệ thống cập nhật hồ sơ
7. Hệ thống hiển thị thông báo thành công
Alternative Flow	3a. Người dùng không thay đổi dữ liệu: Hệ thống không thực hiện cập nhật
5a. Dữ liệu không hợp lệ: Hệ thống hiển thị lỗi và giữ nguyên dữ liệu cũ
Exception Flow	1a. Phiên đăng nhập hết hạn: Hệ thống yêu cầu đăng nhập lại
Business Rules	BR-01: Người dùng chỉ được cập nhật hồ sơ của chính mình
BR-02: Email không được chỉnh sửa trực tiếp trong hồ sơ hiện tại
BR-03: Mật khẩu mới phải đáp ứng yêu cầu bảo mật tối thiểu
Non-Functional Requirement	NFR-01: Form hồ sơ responsive
NFR-02: Thông báo cập nhật rõ ràng
NFR-03: Không làm mất dữ liệu cũ nếu cập nhật thất bại
