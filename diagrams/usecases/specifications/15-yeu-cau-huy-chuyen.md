Use Case ID	UC-15
Use Case Name	Yêu cầu hủy chuyến khẩn cấp
Description	Là lái tàu, tôi muốn gửi yêu cầu hủy chuyến trong trường hợp khẩn cấp để admin xem xét và xử lý quyền lợi hành khách.
Actor(s)	Driver, Admin, Hành khách, Hệ thống ví
Priority	Should Have
Trigger	Driver phát hiện tình huống khẩn cấp có thể cần hủy chuyến
Pre-Condition(s)	1. Driver đã đăng nhập
2. Driver được phân công cho chuyến cần báo cáo
3. Chuyến chưa hoàn thành
Post-Condition(s)	1. Yêu cầu hủy chuyến được ghi nhận ở trạng thái chờ duyệt nếu chức năng được triển khai
2. Chuyến chỉ bị hủy sau khi admin duyệt
Basic Flow	1. Driver mở chi tiết chuyến được phân công
2. Driver chọn báo cáo tình huống khẩn cấp cần hủy chuyến
3. Driver nhập lý do và mô tả tình huống
4. Hệ thống ghi nhận yêu cầu ở trạng thái chờ duyệt
5. Admin mở danh sách yêu cầu hủy chuyến
6. Admin kiểm tra lý do và tình trạng chuyến
7. Admin duyệt yêu cầu
8. Hệ thống chuyển chuyến sang trạng thái hủy
9. Hệ thống xử lý các booking hoặc vé bị ảnh hưởng theo chính sách hoàn tiền
Alternative Flow	7a. Admin từ chối yêu cầu: Hệ thống lưu lý do từ chối và chuyến tiếp tục theo trạng thái hiện tại
3a. Yêu cầu thiếu lý do: Hệ thống yêu cầu nhập bổ sung
Exception Flow	1a. Driver truy cập chuyến không được phân công: Hệ thống từ chối truy cập
2a. Chuyến đã hoàn thành: Hệ thống không cho tạo yêu cầu hủy chuyến
9a. Hoàn tiền thất bại: Hệ thống ghi nhận lỗi để admin xử lý thủ công
Business Rules	BR-01: Driver không tự hủy chuyến; admin là người duyệt quyết định cuối cùng
BR-02: Hủy chuyến phải xử lý quyền lợi hành khách đã mua vé
BR-03: Chuyến đã hoàn thành không được hủy bằng luồng khẩn cấp
BR-04: Project hiện chưa có module hoặc trang riêng cho driver gửi yêu cầu hủy chuyến khẩn cấp và admin duyệt; Use Case này là phạm vi mở rộng
Non-Functional Requirement	NFR-01: Nếu triển khai, thao tác hủy chuyến cần có xác nhận rõ ràng
NFR-02: Lý do hủy và người thao tác cần được lưu để phục vụ kiểm tra
NFR-03: Thông báo cho admin và driver phải rõ trạng thái xử lý
