Use Case ID	UC-04
Use Case Name	Xác nhận đổi ghế
Description	Là hành khách, tôi muốn xác nhận hoặc từ chối phương án đổi ghế khi ghế đã đặt bị báo hỏng.
Actor(s)	Hành khách, Email Service, Hệ thống ví
Priority	Must Have
Trigger	Hành khách nhận email đổi ghế do hệ thống gửi sau khi admin xác nhận sự cố ghế hỏng
Pre-Condition(s)	1. Có yêu cầu đổi ghế hợp lệ đang chờ hành khách xác nhận
2. Liên kết xác nhận đổi ghế còn hạn
Post-Condition(s)	1. Nếu hành khách đồng ý, vé được cập nhật sang ghế thay thế
2. Nếu hành khách từ chối hoặc quá hạn, vé bị hủy và tiền được hoàn theo chính sách
Basic Flow	1. Hành khách mở liên kết xác nhận đổi ghế trong email
2. Hệ thống kiểm tra mã xác nhận
3. Hệ thống hiển thị thông tin vé, ghế cũ, ghế thay thế và chuyến tàu
4. Hành khách chọn đồng ý đổi ghế
5. Hệ thống kiểm tra ghế thay thế còn hợp lệ
6. Hệ thống cập nhật vé sang ghế thay thế
7. Hệ thống đánh dấu yêu cầu đổi ghế đã được xác nhận
8. Hệ thống hiển thị thông báo xác nhận thành công
Alternative Flow	4a. Hành khách chọn không đồng ý: Hệ thống hủy vé bị ảnh hưởng và hoàn tiền
5a. Ghế thay thế không còn khả dụng: Hệ thống hủy vé bị ảnh hưởng và hoàn tiền
Exception Flow	2a. Mã xác nhận không hợp lệ hoặc đã dùng: Hệ thống hiển thị thông báo lỗi
2b. Mã xác nhận hết hạn: Hệ thống hủy vé bị ảnh hưởng và hoàn tiền nếu chưa xử lý
6a. Lỗi cập nhật vé: Hệ thống giữ nguyên trạng thái đang xử lý và thông báo thử lại hoặc liên hệ hỗ trợ
Business Rules	BR-01: Hành khách là người quyết định đồng ý đổi ghế khi còn phương án thay thế
BR-02: Admin không tự hủy vé nếu yêu cầu đổi ghế còn chờ hành khách xác nhận
BR-03: Liên kết xác nhận đổi ghế phải dùng đúng route xác nhận đổi ghế, không dùng route xác thực email
BR-04: Quá 24 giờ không phản hồi thì hệ thống tự hủy vé bị ảnh hưởng và hoàn tiền
Non-Functional Requirement	NFR-01: Trang xác nhận không được nháy lỗi thiếu mã xác thực khi vừa mở link hợp lệ
NFR-02: Nội dung email và giao diện phải dùng tiếng Việt có dấu
NFR-03: Trạng thái xử lý phải hiển thị rõ cho hành khách và admin
