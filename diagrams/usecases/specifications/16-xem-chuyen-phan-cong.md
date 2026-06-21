Use Case ID	UC-16
Use Case Name	Xem chuyến được phân công
Description	Là lái tàu, tôi muốn xem danh sách chuyến được phân công và mở chi tiết chuyến để theo dõi vận hành hoặc gửi báo cáo.
Actor(s)	Driver
Priority	Must Have
Trigger	Driver mở trang chuyến được phân công
Pre-Condition(s)	1. Driver đã đăng nhập
Post-Condition(s)	1. Danh sách chuyến và chi tiết chuyến được hiển thị đúng phạm vi phân công
Basic Flow	1. Driver mở trang chuyến được phân công
2. Hệ thống tải các chuyến có driver đang đăng nhập được phân công
3. Hệ thống hiển thị thông tin tàu, tuyến, thời gian và trạng thái chuyến
4. Driver chọn một chuyến
5. Hệ thống kiểm tra chuyến có thuộc driver hay không
6. Hệ thống hiển thị chi tiết chuyến, sơ đồ toa/ghế và các chức năng báo cáo còn được phép
Alternative Flow	2a. Không có chuyến được phân công: Hệ thống hiển thị trạng thái rỗng
6a. Chuyến đã kết thúc: Hệ thống vẫn cho xem thông tin nhưng khóa các chức năng báo cáo vận hành
Exception Flow	5a. Driver truy cập chuyến không thuộc phân công: Hệ thống từ chối truy cập
2b. Lỗi tải danh sách chuyến: Hệ thống hiển thị lỗi và cho phép thử lại
Business Rules	BR-01: Driver chỉ xem được chuyến được phân công cho mình
BR-02: Chức năng báo cáo ghế hỏng và delay chỉ mở khi chuyến chưa kết thúc và còn hoạt động
BR-03: Trạng thái chuyến quyết định hành động vận hành được hiển thị
Non-Functional Requirement	NFR-01: Danh sách chuyến phải dễ đọc và dễ lọc theo trạng thái
NFR-02: Hành động bị khóa phải có lý do bằng tiếng Việt
NFR-03: Trang chi tiết chuyến responsive
