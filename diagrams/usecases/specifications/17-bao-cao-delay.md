Use Case ID	UC-17
Use Case Name	Báo cáo delay chuyến tàu
Description	Là lái tàu, tôi muốn báo cáo trễ khởi hành hoặc trễ đến ga trong chuyến được phân công để admin kiểm tra và phê duyệt.
Actor(s)	Driver, Admin, Hệ thống quản lý chuyến tàu
Priority	Must Have
Trigger	Driver phát hiện chuyến tàu bị delay
Pre-Condition(s)	1. Driver đã đăng nhập với quyền lái tàu
2. Driver được phân công cho chuyến tàu cần báo cáo
3. Chuyến tàu chưa kết thúc và đang ở trạng thái sắp khởi hành hoặc đang chạy
Post-Condition(s)	1. Báo cáo delay được lưu ở trạng thái chờ duyệt
2. Sau khi admin duyệt, số phút delay tương ứng được áp dụng vào chuyến tàu
Basic Flow	1. Driver mở chi tiết chuyến tàu được phân công
2. Hệ thống hiển thị thông tin chuyến, trạng thái hiện tại và khu vực báo cáo delay
3. Driver chọn gửi báo cáo delay
4. Hệ thống xác định loại delay phù hợp với trạng thái chuyến
5. Driver nhập số phút delay và lý do
6. Driver gửi báo cáo
7. Hệ thống kiểm tra quyền báo cáo, trạng thái chuyến và tính hợp lệ của dữ liệu
8. Hệ thống lưu báo cáo ở trạng thái chờ duyệt
9. Hệ thống thông báo cho driver rằng báo cáo đã được gửi và chờ admin xử lý
10. Admin mở danh sách báo cáo delay
11. Admin kiểm tra thông tin chuyến, loại delay, số phút và lý do
12. Admin duyệt báo cáo
13. Hệ thống áp dụng delay vào chuyến tàu
14. Hệ thống chuyển báo cáo sang trạng thái đã duyệt
Alternative Flow	4a. Chuyến sắp khởi hành: Hệ thống xác định loại delay là trễ khởi hành
4b. Chuyến đang chạy: Hệ thống xác định loại delay là trễ đến ga
12a. Admin từ chối báo cáo: Admin nhập lý do; hệ thống lưu lý do và chuyển báo cáo sang trạng thái bị từ chối
7a. Chuyến đã có báo cáo delay cùng loại đang chờ duyệt: Hệ thống từ chối báo cáo mới để tránh spam
Exception Flow	7b. Chuyến đã kết thúc, bị hủy hoặc không còn hoạt động: Hệ thống không cho tạo báo cáo delay mới
7c. Số phút delay hoặc lý do không hợp lệ: Hệ thống hiển thị lỗi và yêu cầu nhập lại
13a. Trạng thái chuyến thay đổi khiến báo cáo không còn duyệt được: Hệ thống không áp dụng delay và yêu cầu admin xử lý lại theo thực tế vận hành
Business Rules	BR-01: Chỉ driver được phân công cho chuyến mới được báo cáo delay của chuyến đó
BR-02: Chuyến đã kết thúc hoặc không còn hoạt động thì khóa chức năng báo cáo delay
BR-03: Chuyến sắp khởi hành chỉ được báo cáo trễ khởi hành
BR-04: Chuyến đang chạy chỉ được báo cáo trễ đến ga
BR-05: Số phút delay phải là số nguyên từ 1 đến 720
BR-06: Lý do delay phải có tối thiểu 10 ký tự
BR-07: Mỗi chuyến chỉ có một báo cáo đang chờ duyệt cho cùng một loại delay
BR-08: Driver không tự áp dụng delay vào chuyến; delay chỉ có hiệu lực sau khi admin duyệt
Non-Functional Requirement	NFR-01: Driver và admin phải thấy rõ trạng thái báo cáo
NFR-02: Hệ thống không cho spam nhiều báo cáo pending cùng loại
NFR-03: Thông báo lỗi phải dùng tiếng Việt có dấu
