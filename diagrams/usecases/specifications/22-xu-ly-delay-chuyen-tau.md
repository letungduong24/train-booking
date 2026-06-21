Use Case ID	UC-22
Use Case Name	Xử lý báo cáo delay chuyến tàu
Description	Là admin, tôi muốn xem xét báo cáo delay do lái tàu gửi để duyệt hoặc từ chối và cập nhật thời gian delay của chuyến tàu khi hợp lệ.
Actor(s)	Admin, Driver, Hệ thống quản lý chuyến tàu
Priority	Must Have
Trigger	Driver gửi báo cáo delay chuyến tàu
Pre-Condition(s)	1. Có báo cáo delay ở trạng thái chờ duyệt
2. Chuyến tàu liên quan chưa kết thúc hoặc còn đủ điều kiện cập nhật delay
Post-Condition(s)	1. Báo cáo delay được duyệt hoặc từ chối
2. Nếu được duyệt, số phút delay được áp dụng vào chuyến tàu
Basic Flow	1. Admin mở danh sách báo cáo delay
2. Hệ thống hiển thị các báo cáo delay theo trạng thái
3. Admin mở chi tiết một báo cáo
4. Hệ thống hiển thị thông tin chuyến, loại delay, số phút delay, lý do và người báo cáo
5. Admin kiểm tra tính hợp lệ của báo cáo
6. Admin duyệt báo cáo
7. Hệ thống cập nhật số phút delay tương ứng vào chuyến tàu
8. Hệ thống chuyển báo cáo sang trạng thái đã duyệt
9. Hệ thống hiển thị kết quả xử lý cho admin
Alternative Flow	6a. Admin từ chối báo cáo: Admin nhập lý do; hệ thống chuyển báo cáo sang trạng thái bị từ chối
7a. Báo cáo là delay khởi hành: Hệ thống cập nhật delay khởi hành của chuyến
7b. Báo cáo là delay đến ga: Hệ thống cập nhật delay đến ga của chuyến
Exception Flow	5a. Báo cáo không còn ở trạng thái chờ duyệt: Hệ thống từ chối thao tác xử lý
5b. Chuyến không còn đủ điều kiện cập nhật delay: Hệ thống không áp dụng delay và yêu cầu admin kiểm tra lại
7c. Lỗi cập nhật chuyến tàu: Hệ thống giữ nguyên dữ liệu cũ và thông báo lỗi
Business Rules	BR-01: Chỉ admin mới được duyệt hoặc từ chối báo cáo delay
BR-02: Driver chỉ gửi báo cáo delay, không tự áp dụng delay vào chuyến
BR-03: Delay khởi hành chỉ áp dụng cho chuyến sắp khởi hành
BR-04: Delay đến ga chỉ áp dụng cho chuyến đang chạy
BR-05: Mỗi báo cáo delay chỉ được xử lý một lần
BR-06: UC-22 là luồng xử lý/duyệt báo cáo delay, tách biệt với UC-17 báo cáo delay của driver
Non-Functional Requirement	NFR-01: Trang xử lý delay phải hiển thị rõ trạng thái báo cáo
NFR-02: Thao tác duyệt hoặc từ chối phải có phản hồi rõ ràng
NFR-03: Thông báo lỗi phải dùng tiếng Việt có dấu
