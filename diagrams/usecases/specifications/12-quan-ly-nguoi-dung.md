Use Case ID	UC-12
Use Case Name	Quản lý người dùng
Description	Là quản trị viên, tôi muốn quản lý tài khoản, vai trò và trạng thái người dùng để kiểm soát quyền sử dụng hệ thống.
Actor(s)	Admin, Người dùng, Email Service
Priority	Should Have
Trigger	Admin cần tra cứu hoặc cập nhật tài khoản người dùng
Pre-Condition(s)	1. Admin đã đăng nhập
2. Admin có quyền quản lý người dùng
Post-Condition(s)	1. Nếu chức năng được triển khai, thông tin tài khoản hoặc trạng thái tài khoản được cập nhật
2. Nếu dữ liệu không hợp lệ, tài khoản giữ nguyên trạng thái cũ
Basic Flow	1. Admin mở trang quản lý người dùng
2. Hệ thống hiển thị danh sách tài khoản và vai trò
3. Admin tìm kiếm hoặc lọc người dùng
4. Admin xem chi tiết tài khoản
5. Admin cập nhật vai trò hoặc trạng thái tài khoản
6. Hệ thống lưu thay đổi và hiển thị trạng thái mới
Alternative Flow	2a. Không có dữ liệu người dùng: Hệ thống hiển thị trạng thái rỗng
3a. Không tìm thấy người dùng theo bộ lọc: Hệ thống hiển thị thông báo không có kết quả
5a. Thay đổi vai trò không hợp lệ: Hệ thống từ chối thao tác
5b. Admin tự khóa tài khoản quản trị của chính mình: Hệ thống ngăn thao tác để tránh mất quyền quản trị
Exception Flow	1a. Người dùng không có quyền ADMIN: Hệ thống từ chối truy cập
6a. Lỗi lưu thay đổi: Hệ thống thông báo lỗi và giữ nguyên dữ liệu cũ
Business Rules	BR-01: Chỉ admin mới được quản lý tài khoản người dùng
BR-02: Thay đổi vai trò phải đảm bảo hệ thống luôn còn tài khoản admin hợp lệ
BR-03: Khóa tài khoản không được làm mất dữ liệu booking, vé hoặc giao dịch đã phát sinh
BR-04: Project hiện chưa có module hoặc trang quản lý người dùng hoàn chỉnh; Use Case này là phạm vi mở rộng
Non-Functional Requirement	NFR-01: Danh sách người dùng cần có tìm kiếm, lọc và phân trang khi dữ liệu lớn
NFR-02: Thao tác khóa tài khoản hoặc đổi vai trò cần có xác nhận rõ ràng
NFR-03: Thông báo lỗi phải dùng tiếng Việt có dấu
