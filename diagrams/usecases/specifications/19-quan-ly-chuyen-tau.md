Use Case ID	UC-19
Use Case Name	Quản lý chuyến tàu
Description	Là admin, tôi muốn quản lý chuyến tàu để lập lịch chạy, phân công lái tàu, theo dõi thống kê, cập nhật delay và giám sát vị trí chuyến.
Actor(s)	Admin, Driver
Priority	Must Have
Trigger	Admin cần tạo, cập nhật, xem hoặc giám sát chuyến tàu
Pre-Condition(s)	1. Admin đã đăng nhập
2. Hệ thống có route, tàu và driver hợp lệ khi tạo hoặc cập nhật chuyến
Post-Condition(s)	1. Chuyến tàu được tạo hoặc cập nhật nếu dữ liệu hợp lệ
2. Hệ thống tính thời gian kết thúc dự kiến dựa trên route, tốc độ trung bình của tàu và thời gian quay đầu
3. Thống kê, trạng thái delay và vị trí chuyến được hiển thị khi admin xem chi tiết
Basic Flow	1. Admin mở trang quản lý chuyến tàu
2. Hệ thống hiển thị danh sách chuyến có phân trang, tìm kiếm và bộ lọc
3. Admin chọn tạo chuyến mới
4. Admin chọn route, tàu, driver và thời gian khởi hành
5. Hệ thống kiểm tra route, tàu và driver
6. Hệ thống tính thời gian kết thúc dự kiến
7. Hệ thống kiểm tra tàu có bị trùng lịch với chuyến khác không
8. Hệ thống tạo chuyến ở trạng thái SCHEDULED
9. Hệ thống hiển thị chuyến vừa tạo trong danh sách
Alternative Flow	2a. Admin lọc danh sách theo route, tàu, ngày khởi hành, trạng thái hoặc chuyến sắp tới: Hệ thống hiển thị danh sách phù hợp
4a. Admin cập nhật chuyến: Hệ thống kiểm tra lại route, tàu, driver, thời gian và cập nhật endTime nếu dữ liệu hợp lệ
4b. Admin bỏ phân công driver: Hệ thống cập nhật chuyến không có driver nếu thao tác hợp lệ
4c. Admin xem chi tiết chuyến: Hệ thống hiển thị route, train, driver, danh sách toa và resolved station theo ga đi/ga đến nếu có
4d. Admin xem thống kê chuyến: Hệ thống hiển thị doanh thu, số vé đã bán, số vé đang chờ, tổng ghế và tỷ lệ lấp đầy
4e. Admin xem live location: Hệ thống tính vị trí hiện tại, tốc độ, tiến độ và trạng thái dựa trên lộ trình, thời gian và delay
4f. Admin cập nhật delay trực tiếp: Hệ thống cập nhật departure delay cho chuyến SCHEDULED hoặc arrival delay cho chuyến IN_PROGRESS
4g. Admin xóa chuyến: Hệ thống xóa chuyến nếu không vi phạm ràng buộc dữ liệu
Exception Flow	5a. Route không tồn tại: Hệ thống từ chối tạo hoặc cập nhật chuyến
5b. Tàu không tồn tại: Hệ thống từ chối tạo hoặc cập nhật chuyến
5c. Driver không tồn tại hoặc không có vai trò DRIVER: Hệ thống từ chối tạo hoặc cập nhật chuyến
7a. Tàu đã có chuyến khác trong khoảng thời gian tương ứng: Hệ thống từ chối tạo hoặc cập nhật chuyến
4h. Cập nhật departure delay cho chuyến không ở trạng thái SCHEDULED: Hệ thống từ chối thao tác
4i. Cập nhật arrival delay cho chuyến không ở trạng thái IN_PROGRESS: Hệ thống từ chối thao tác
4j. Chuyến không tồn tại: Hệ thống hiển thị lỗi không tìm thấy
Business Rules	BR-01: Chuyến phải gắn với một route hợp lệ và một tàu hợp lệ
BR-02: Driver được phân công phải có vai trò DRIVER
BR-03: EndTime của chuyến được tính từ departureTime, khoảng cách route, tốc độ trung bình của tàu và turnaroundMinutes
BR-04: Một tàu không được có hai chuyến không bị hủy bị trùng thời gian khai thác
BR-05: Chuyến mới được tạo ở trạng thái SCHEDULED
BR-06: Departure delay chỉ áp dụng cho chuyến SCHEDULED
BR-07: Arrival delay chỉ áp dụng cho chuyến IN_PROGRESS
BR-08: Trạng thái chuyến được hệ thống tự động cập nhật theo thời gian vận hành
Non-Functional Requirement	NFR-01: Danh sách chuyến phải có bộ lọc dễ dùng
NFR-02: Trang chi tiết chuyến phải hiển thị dữ liệu vận hành rõ ràng
NFR-03: Live location và thống kê chuyến phải có trạng thái loading/lỗi rõ ràng
NFR-04: Thao tác cập nhật delay phải có phản hồi thành công hoặc lỗi rõ ràng
