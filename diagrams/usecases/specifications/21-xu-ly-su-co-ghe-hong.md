Use Case ID	UC-21
Use Case Name	Xử lý sự cố ghế hỏng
Description	Là admin, tôi muốn kiểm tra báo cáo ghế hỏng do lái tàu gửi để khóa ghế hỏng, đổi ghế hoặc hoàn tiền cho hành khách bị ảnh hưởng.
Actor(s)	Admin, Driver, Hành khách, Email Service, Hệ thống ví
Priority	Must Have
Trigger	Driver gửi báo cáo ghế hỏng
Pre-Condition(s)	1. Có báo cáo ghế hỏng ở trạng thái chờ xử lý
Post-Condition(s)	1. Báo cáo được từ chối hoặc được xác nhận xử lý
2. Ghế hỏng được khóa nếu báo cáo được xác nhận
3. Vé bị ảnh hưởng được đổi ghế hoặc hoàn tiền theo lựa chọn của hành khách và chính sách hệ thống
Basic Flow	1. Admin mở danh sách báo cáo ghế hỏng
2. Hệ thống hiển thị các báo cáo theo trạng thái
3. Admin mở chi tiết một báo cáo
4. Hệ thống hiển thị thông tin chuyến, toa, ghế, mô tả sự cố và người báo cáo
5. Admin kiểm tra sơ đồ ghế và vé bị ảnh hưởng
6. Admin xác nhận báo cáo là hợp lệ
7. Hệ thống khóa ghế hỏng để không bán tiếp
8. Nếu có hành khách bị ảnh hưởng, hệ thống tìm ghế thay thế phù hợp
9. Hệ thống gửi email cho hành khách để xác nhận đổi ghế
10. Báo cáo chuyển sang trạng thái chờ hành khách xác nhận
11. Khi hành khách xác nhận hoặc từ chối, hệ thống hoàn tất xử lý báo cáo
Alternative Flow	6a. Admin từ chối báo cáo: Admin nhập lý do; hệ thống chuyển báo cáo sang trạng thái bị từ chối
8a. Không có vé bị ảnh hưởng: Hệ thống khóa ghế hỏng và đánh dấu báo cáo đã giải quyết
8b. Không có ghế thay thế phù hợp: Hệ thống hủy vé bị ảnh hưởng và hoàn tiền theo chính sách
11a. Hành khách không đồng ý đổi ghế: Hệ thống hủy vé bị ảnh hưởng và hoàn tiền
11b. Hành khách không phản hồi trong 24 giờ: Hệ thống tự động hủy vé bị ảnh hưởng và hoàn tiền
Exception Flow	6b. Báo cáo không còn ở trạng thái chờ xử lý: Hệ thống từ chối thao tác xác nhận hoặc từ chối
9a. Gửi email đổi ghế thất bại: Hệ thống thông báo lỗi và cho phép admin xử lý lại
Business Rules	BR-01: Chỉ báo cáo đang chờ xử lý mới được admin xác nhận hoặc từ chối
BR-02: Ghế đã xác nhận hỏng phải bị khóa khỏi luồng bán vé
BR-03: Ghế thay thế phải còn trống trên cùng chuyến và chặng bị ảnh hưởng
BR-04: Admin không tự hủy vé thay hành khách khi còn phương án đổi ghế cần hành khách xác nhận
BR-05: Email đổi ghế phải dùng đúng liên kết xác nhận đổi ghế
BR-06: Nếu hành khách không phản hồi trong 24 giờ, hệ thống tự động hủy vé bị ảnh hưởng và hoàn tiền
BR-07: UC-21 là luồng nghiệp vụ xử lý sự cố phát sinh, tách biệt với UC-13 quản lý trạng thái ghế thủ công
Non-Functional Requirement	NFR-01: Trang chi tiết phải hiển thị rõ trạng thái xử lý hiện tại
NFR-02: Sau khi xử lý xong, F5 không được hiển thị lại trạng thái ghế hỏng như chưa giải quyết
NFR-03: Email và thông báo phải dùng tiếng Việt có dấu
