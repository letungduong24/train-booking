Use Case ID
UC-17

Use Case Name
Báo cáo delay

Description
Là Driver, tôi muốn báo cáo delay khởi hành hoặc delay đến nơi để hệ thống thông báo cho khách hàng.

Actor(s)
Driver, Customer, Admin, Notification Service

Priority
Must Have

Trigger
Chuyến tàu bị delay khởi hành hoặc delay đến nơi

Pre-Condition(s)
Driver đã đăng nhập vào hệ thống với role DRIVER
Driver được phân công cho chuyến tàu này
Chuyến tàu có status SCHEDULED hoặc IN_PROGRESS
Thiết bị của Driver đã được kết nối internet

Post-Condition(s)
Thông tin delay được cập nhật vào Trip
Khách hàng nhận thông báo delay
Admin nhận thông báo
Hệ thống ghi nhận hoạt động vào Activity Log

Basic Flow - Báo cáo delay khởi hành
1. Driver xem chi tiết chuyến được phân công (UC-16)
2. Driver chọn lệnh "Báo cáo delay"
3. Hệ thống hiển thị dialog với 2 tab: "Delay khởi hành", "Delay đến nơi"
4. Driver chọn tab "Delay khởi hành"
5. Hệ thống hiển thị form với các trường: Số phút delay (required, số nguyên dương), Lý do delay (required, tối thiểu 10 ký tự)
6. Driver nhập số phút delay và lý do
7. Driver chọn lệnh "Xác nhận"
8. Hệ thống kiểm tra: Số phút > 0, Lý do >= 10 ký tự
9. Hệ thống cập nhật Trip.departureDelayMinutes
10. Hệ thống tính toán lại thời gian đến các ga tiếp theo
11. Hệ thống gửi thông báo đến tất cả khách hàng có vé: "Chuyến tàu {code} bị delay khởi hành {minutes} phút. Lý do: {reason}"
12. Hệ thống gửi thông báo đến Admin
13. Hệ thống hiển thị thông báo: "Báo cáo delay thành công. Khách hàng đã được thông báo"
14. Hệ thống ghi nhận hoạt động vào Activity Log

Alternative Flow - Báo cáo delay đến nơi
4a. Driver chọn tab "Delay đến nơi"
4a1. Hệ thống hiển thị form với các trường: Số phút delay (required, số nguyên dương), Lý do delay (required, tối thiểu 10 ký tự)
5a. Driver nhập số phút delay và lý do
6a. Driver chọn lệnh "Xác nhận"
7a. Hệ thống kiểm tra: Số phút > 0, Lý do >= 10 ký tự
8a. Hệ thống cập nhật Trip.arrivalDelayMinutes
9a. Hệ thống gửi thông báo đến tất cả khách hàng có vé: "Chuyến tàu {code} bị delay đến nơi {minutes} phút. Lý do: {reason}"
10a. Hệ thống gửi thông báo đến Admin
11a. Hệ thống hiển thị thông báo: "Báo cáo delay thành công. Khách hàng đã được thông báo"
Use Case tiếp tục bước 14

Alternative Flow - Cập nhật delay đã báo cáo
4b. Chuyến tàu đã có delay trước đó
4b1. Hệ thống hiển thị thông tin delay hiện tại: Số phút, Lý do, Thời gian báo cáo
4b2. Driver có thể cập nhật số phút delay mới
4b3. Hệ thống tính toán chênh lệch: Delay mới - Delay cũ
4b4. Nếu chênh lệch > 0: Hệ thống gửi thông báo "Delay tăng thêm {diff} phút"
4b5. Nếu chênh lệch < 0: Hệ thống gửi thông báo "Delay giảm {diff} phút"
Use Case tiếp tục bước 14

Exception Flow
8a. Số phút delay không hợp lệ (<= 0)
8a1. Hệ thống hiển thị lỗi: "Số phút delay phải lớn hơn 0"
Use Case quay lại bước 5

8b. Lý do delay quá ngắn (< 10 ký tự)
8b1. Hệ thống hiển thị lỗi: "Lý do delay phải có ít nhất 10 ký tự"
Use Case quay lại bước 5

11a. Không thể gửi thông báo cho 1 khách hàng
11a1. Hệ thống ghi log lỗi
11a2. Hệ thống tiếp tục gửi thông báo cho khách hàng khác
Use Case tiếp tục bước 12

Business Rules
BR-01: Chỉ Driver được phân công mới có quyền báo cáo delay
BR-02: Số phút delay phải > 0
BR-03: Lý do delay phải có ít nhất 10 ký tự
BR-04: Hệ thống giữ nguyên departureTime và endTime gốc, chỉ lưu thêm delay
BR-05: Thời gian thực tế = Thời gian gốc + Delay
BR-06: Gửi thông báo đến tất cả khách hàng có vé
BR-07: Gửi thông báo đến Admin
BR-08: Có thể cập nhật delay nhiều lần

Non-Functional Requirement
NFR-01: Thời gian cập nhật delay dưới 1 giây
NFR-02: Thông báo được gửi đến khách hàng trong vòng 30 giây
NFR-03: Thông báo được gửi qua email và SMS (nếu có)
NFR-04: Form responsive, hoạt động tốt trên mobile
NFR-05: Hiển thị loading indicator khi đang xử lý
NFR-06: Hiển thị lịch sử báo cáo delay (nếu có nhiều lần)
NFR-07: Gợi ý lý do delay phổ biến: "Thời tiết xấu", "Sự cố kỹ thuật", "Chờ hành khách", "Tắc đường ray"
