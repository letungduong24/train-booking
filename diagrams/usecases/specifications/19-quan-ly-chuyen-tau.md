Use Case ID	UC-19
Use Case Name	Quản lý chuyến tàu
Description	Là admin, tôi muốn quản lý chuyến tàu để tạo lịch chạy, phân công lái tàu và điều chỉnh route/driver khi chuyến chưa bắt đầu.
Actor(s)	Admin
Priority	Must Have
Trigger	Admin cần tạo, cập nhật hoặc xóa chuyến tàu
Pre-Condition(s)	1. Admin đã đăng nhập
2. Hệ thống có route, tàu và driver hợp lệ khi tạo chuyến
3. Khi cập nhật chuyến, Trip phải tồn tại và còn trạng thái SCHEDULED
Post-Condition(s)	1. Chuyến tàu được tạo ở trạng thái SCHEDULED nếu dữ liệu hợp lệ
2. Route hoặc driver của chuyến được cập nhật nếu chuyến còn SCHEDULED
3. Chuyến được xóa nếu không vi phạm ràng buộc toàn vẹn dữ liệu
Basic Flow	1. Admin mở trang quản lý chuyến tàu
2. Hệ thống hiển thị danh sách chuyến có phân trang, tìm kiếm và bộ lọc
3. Admin chọn tạo chuyến mới
4. Admin chọn route, tàu, driver và thời gian khởi hành
5. Hệ thống kiểm tra route, tàu và driver hợp lệ
6. Hệ thống tính endTime theo route.totalDistanceKm, train.averageSpeedKmH và turnaroundMinutes
7. Hệ thống kiểm tra tàu có bị trùng lịch với Trip chưa CANCELLED không
8. Hệ thống tạo chuyến ở trạng thái SCHEDULED
9. Hệ thống hiển thị chuyến vừa tạo trong danh sách
Alternative Flow	2a. Admin lọc danh sách theo route, tàu, ngày khởi hành, trạng thái hoặc chuyến sắp tới: Hệ thống hiển thị danh sách phù hợp
4a. Admin cập nhật chuyến: Hệ thống chỉ cho cập nhật routeId và/hoặc driverId khi Trip còn SCHEDULED
4b. Admin bỏ phân công driver: Hệ thống cập nhật driverId về null nếu Trip còn SCHEDULED
4c. Admin đổi route: Hệ thống kiểm tra route hợp lệ, tính lại endTime và kiểm tra trùng lịch theo khung giờ mới
4d. Admin xóa chuyến: Hệ thống xóa chuyến nếu không vi phạm ràng buộc dữ liệu lịch sử
Exception Flow	5a. Route không tồn tại: Hệ thống từ chối tạo hoặc cập nhật chuyến
5b. Tàu không tồn tại khi tạo chuyến: Hệ thống từ chối tạo chuyến
5c. Driver không tồn tại hoặc không có vai trò DRIVER: Hệ thống từ chối tạo hoặc cập nhật chuyến
7a. Tàu đã có chuyến khác trong khoảng thời gian tương ứng: Hệ thống từ chối tạo hoặc cập nhật route của chuyến
4e. Trip không tồn tại: Hệ thống hiển thị lỗi không tìm thấy chuyến
4f. Trip không còn SCHEDULED: Hệ thống từ chối cập nhật route/driver
4g. Admin gửi trainId, departureTime hoặc status vào API cập nhật chuyến: Hệ thống từ chối vì các trường này không thuộc UC-19
4h. Chuyến đã có Booking/Ticket/Báo cáo liên quan: Hệ thống từ chối xóa cứng để bảo toàn dữ liệu
Business Rules	BR-01: Chuyến mới phải gắn với một route hợp lệ và một tàu hợp lệ
BR-02: Driver được phân công phải có vai trò DRIVER
BR-03: EndTime của chuyến được tính từ departureTime, khoảng cách route, tốc độ trung bình của tàu và turnaroundMinutes
BR-04: Một tàu không được có hai chuyến chưa CANCELLED bị trùng khung thời gian khai thác
BR-05: Chuyến mới được tạo ở trạng thái SCHEDULED
BR-06: Chỉ chuyến SCHEDULED mới được cập nhật routeId hoặc driverId
BR-07: UC-19 không sửa departureTime, trainId hoặc status của chuyến; delay được xử lý ở UC-17/UC-22 và endpoint delay riêng
BR-08: Trạng thái chuyến được hệ thống tự động cập nhật theo thời gian vận hành
Non-Functional Requirement	NFR-01: Danh sách chuyến phải có bộ lọc dễ dùng
NFR-02: Trang chi tiết chuyến phải hiển thị dữ liệu vận hành rõ ràng
NFR-03: Thao tác tạo, cập nhật route/driver và xóa chuyến phải phản hồi thành công hoặc lỗi rõ ràng
