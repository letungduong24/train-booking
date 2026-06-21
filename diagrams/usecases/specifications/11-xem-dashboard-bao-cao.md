Use Case ID	UC-11
Use Case Name	Xem dashboard và báo cáo
Description	Là quản trị viên hoặc lái tàu, tôi muốn xem dashboard để theo dõi tổng quan hoạt động hệ thống hoặc công việc được phân công.
Actor(s)	Admin, Driver
Priority	Must Have
Trigger	Người dùng mở dashboard theo vai trò
Pre-Condition(s)	1. Người dùng đã đăng nhập
2. Người dùng có vai trò phù hợp với dashboard cần truy cập
Post-Condition(s)	1. Dashboard hiển thị dữ liệu tổng quan theo đúng vai trò
Basic Flow	1. Admin mở trang dashboard quản trị
2. Hệ thống tổng hợp số liệu người dùng, chuyến tàu, booking, doanh thu và giao dịch
3. Hệ thống hiển thị các chỉ số chính, biểu đồ hoặc thống kê tổng quan
4. Admin chọn khu vực nghiệp vụ cần theo dõi chi tiết
5. Hệ thống điều hướng đến trang quản lý tương ứng
Alternative Flow	1a. Driver mở dashboard lái tàu: Hệ thống hiển thị chuyến được phân công và thông tin vận hành liên quan
2a. Không có dữ liệu thống kê: Hệ thống hiển thị trạng thái rỗng phù hợp
Exception Flow	1b. Người dùng không có quyền: Hệ thống từ chối truy cập
2b. Lỗi tải dữ liệu dashboard: Hệ thống hiển thị lỗi và cho phép thử lại
Business Rules	BR-01: Dashboard quản trị chỉ dành cho người dùng có quyền ADMIN
BR-02: Dashboard lái tàu chỉ hiển thị dữ liệu thuộc phạm vi lái tàu được phân công
BR-03: Số liệu phải thống nhất với dữ liệu booking, chuyến tàu và giao dịch hiện tại
BR-04: Không hiển thị dữ liệu ngoài phạm vi quyền của người dùng
Non-Functional Requirement	NFR-01: Dashboard tải nhanh và có trạng thái loading rõ ràng
NFR-02: Biểu đồ và chỉ số phải dễ đọc
NFR-03: Giao diện responsive trên desktop và mobile
