Use Case ID	UC-18
Use Case Name	Báo cáo ghế hỏng
Description	Là lái tàu, tôi muốn báo cáo ghế hỏng trong chuyến được phân công để admin xử lý và bảo vệ quyền lợi hành khách.
Actor(s)	Driver, Admin
Priority	Must Have
Trigger	Driver phát hiện ghế bị hỏng trong chuyến được phân công
Pre-Condition(s)	1. Driver đã đăng nhập
2. Driver được phân công cho chuyến
3. Chuyến chưa kết thúc
4. Ghế thuộc tàu của chuyến
Post-Condition(s)	1. Báo cáo ghế hỏng được tạo ở trạng thái chờ xử lý
2. Admin có thể xác nhận hoặc từ chối báo cáo
Basic Flow	1. Driver mở chi tiết chuyến được phân công
2. Hệ thống hiển thị sơ đồ toa và ghế của tàu
3. Driver chọn ghế bị hỏng
4. Hệ thống mở form báo cáo sự cố
5. Driver chọn loại sự cố và nhập mô tả
6. Driver gửi báo cáo
7. Hệ thống kiểm tra quyền báo cáo, trạng thái chuyến và ghế được chọn
8. Hệ thống kiểm tra ghế chưa có báo cáo đang mở
9. Hệ thống tạo báo cáo ghế hỏng ở trạng thái chờ xử lý
10. Hệ thống thông báo gửi báo cáo thành công
Alternative Flow	3a. Driver chọn ghế khác trước khi gửi báo cáo: Hệ thống cập nhật form theo ghế mới được chọn
Exception Flow	5a. Mô tả quá ngắn: Hệ thống yêu cầu nhập mô tả rõ hơn
7a. Chuyến đã kết thúc hoặc không hoạt động: Hệ thống khóa chức năng báo cáo ghế hỏng
7b. Ghế không thuộc tàu của chuyến: Hệ thống từ chối báo cáo
8a. Ghế đã có báo cáo đang mở: Hệ thống không cho gửi trùng để tránh spam
9a. Lỗi lưu báo cáo: Hệ thống hiển thị lỗi và cho phép thử lại
Business Rules	BR-01: Chỉ driver được phân công mới được báo cáo ghế hỏng của chuyến đó
BR-02: Chỉ cho báo cáo khi chuyến ở trạng thái sắp khởi hành hoặc đang chạy và chưa quá thời gian kết thúc
BR-03: Mỗi ghế trên một chuyến chỉ có một báo cáo đang chờ xử lý hoặc chờ hành khách xác nhận
BR-04: Báo cáo ghế hỏng phải có loại sự cố và mô tả tối thiểu
BR-05: Admin là người xác nhận hoặc từ chối báo cáo
Non-Functional Requirement	NFR-01: Không cho driver spam nhiều báo cáo trùng cùng ghế/chuyến
NFR-02: Khi chuyến đã kết thúc, thông báo khóa báo cáo phải hiển thị bằng tiếng Việt
NFR-03: Sơ đồ ghế phải phản ánh đúng trạng thái đang xử lý
