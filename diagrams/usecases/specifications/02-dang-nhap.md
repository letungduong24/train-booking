Use Case ID	UC-02
Use Case Name	Đăng nhập hệ thống
Description	Là người dùng, tôi muốn đăng nhập vào hệ thống để sử dụng các chức năng theo vai trò.
Actor(s)	Người dùng, Google OAuth, Email Service
Priority	Must Have
Trigger	Người dùng muốn truy cập hệ thống hoặc thực hiện chức năng cần đăng nhập
Pre-Condition(s)	1. Người dùng đã có tài khoản trong hệ thống
Post-Condition(s)	1. Người dùng được đăng nhập thành công
2. Hệ thống điều hướng người dùng đến khu vực phù hợp với vai trò
3. Nếu tài khoản chưa xác thực email, hệ thống hiển thị trạng thái và gợi ý xác thực
Basic Flow	1. Người dùng truy cập trang đăng nhập
2. Hệ thống hiển thị form email và mật khẩu
3. Người dùng nhập thông tin đăng nhập
4. Hệ thống kiểm tra thông tin tài khoản
5. Hệ thống thiết lập phiên đăng nhập
6. Hệ thống tải hồ sơ và vai trò người dùng
7. Hệ thống điều hướng người dùng đến trang phù hợp
Alternative Flow	2a. Người dùng chọn đăng nhập bằng Google: Hệ thống xác thực với Google, tìm hoặc tạo tài khoản tương ứng và đăng nhập
2b. Người dùng chọn quên mật khẩu: Hệ thống gửi liên kết đặt lại mật khẩu qua email
4a. Sai email hoặc mật khẩu: Hệ thống thông báo đăng nhập không thành công
4b. Tài khoản chưa xác thực email: Hệ thống cho phép tiếp tục phiên nhưng hiển thị yêu cầu xác thực email nếu chức năng cần xác thực
Exception Flow	2b1. Liên kết đặt lại mật khẩu hết hạn: Hệ thống yêu cầu gửi lại liên kết mới
5a. Phiên đăng nhập không thiết lập được: Hệ thống thông báo lỗi và yêu cầu thử lại
Business Rules	BR-01: Thông báo lỗi đăng nhập không tiết lộ tài khoản có tồn tại hay không
BR-02: Vai trò người dùng quyết định khu vực được truy cập
BR-03: Người dùng có thể đăng xuất để kết thúc phiên đăng nhập
BR-04: Liên kết đặt lại mật khẩu chỉ dùng một lần và có thời hạn
Non-Functional Requirement	NFR-01: Đăng nhập phản hồi nhanh và hiển thị trạng thái loading
NFR-02: Form đăng nhập responsive
NFR-03: Thông báo lỗi dùng tiếng Việt có dấu
NFR-04: Không hiển thị thông tin kỹ thuật nội bộ
