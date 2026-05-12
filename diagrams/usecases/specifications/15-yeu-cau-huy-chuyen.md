Use Case ID
UC-15

Use Case Name
Yêu cầu hủy chuyến khẩn cấp

Description
Là Driver, tôi muốn hủy chuyến tàu trong trường hợp khẩn cấp (sự cố kỹ thuật nghiêm trọng, thiên tai).

Actor(s)
Driver, Admin, Customer, Email Service

Priority
Must Have

Trigger
Driver phát hiện sự cố khẩn cấp không thể tiếp tục chuyến tàu

Pre-Condition(s)
Driver đã đăng nhập vào hệ thống với role DRIVER
Chuyến tàu có status SCHEDULED hoặc IN_PROGRESS
Driver được phân công cho chuyến tàu này
Thiết bị của Driver đã được kết nối internet

Post-Condition(s)
Chuyến tàu được hủy (status CANCELLED)
Tất cả khách hàng được hoàn tiền 100%
Email thông báo được gửi đến khách hàng
Admin nhận thông báo khẩn cấp
Hệ thống ghi nhận hoạt động vào Activity Log

Basic Flow
1. Driver chọn menu "Chuyến của tôi"
2. Hệ thống hiển thị danh sách chuyến được phân công với status SCHEDULED hoặc IN_PROGRESS
3. Driver click vào 1 chuyến để xem chi tiết
4. Hệ thống hiển thị trang chi tiết chuyến với: Thông tin chuyến, Tuyến đường, Danh sách ga, Số hành khách
5. Driver chọn lệnh "Hủy chuyến khẩn cấp"
6. Hệ thống hiển thị dialog cảnh báo: "Đây là hành động nghiêm trọng. Chỉ sử dụng trong trường hợp khẩn cấp"
7. Hệ thống hiển thị form với các trường: Lý do hủy (required, tối thiểu 20 ký tự), Checkbox "Tôi xác nhận đây là tình huống khẩn cấp"
8. Driver nhập lý do và check vào checkbox
9. Driver chọn lệnh "Xác nhận hủy"
10. Hệ thống kiểm tra: Lý do >= 20 ký tự, Checkbox đã check
11. Hệ thống cập nhật Trip.status = CANCELLED
12. Hệ thống tìm tất cả Booking có tripId và status PAID
13. Hệ thống hoàn tiền 100% về ví cho từng khách hàng
14. Hệ thống cập nhật Booking.status = CANCELLED
15. Hệ thống gửi email thông báo hủy chuyến và hoàn tiền đến tất cả khách hàng
16. Hệ thống gửi thông báo khẩn cấp đến Admin với: Mã chuyến, Driver, Lý do, Số khách bị ảnh hưởng
17. Hệ thống hiển thị thông báo: "Đã hủy chuyến thành công. Admin đã được thông báo"
18. Hệ thống ghi nhận hoạt động vào Activity Log

Alternative Flow
8a. Driver chọn lệnh "Hủy" (từ dialog)
8a1. Hệ thống đóng dialog
Use Case quay lại bước 4

Exception Flow
10a. Lý do hủy quá ngắn (< 20 ký tự)
10a1. Hệ thống hiển thị lỗi: "Lý do hủy phải có ít nhất 20 ký tự"
Use Case quay lại bước 7

10b. Checkbox chưa check
10b1. Hệ thống hiển thị lỗi: "Vui lòng xác nhận đây là tình huống khẩn cấp"
Use Case quay lại bước 7

13a. Không thể hoàn tiền cho 1 khách hàng
13a1. Hệ thống ghi log lỗi
13a2. Hệ thống tiếp tục hoàn tiền cho khách hàng khác
13a3. Hệ thống gửi thông báo lỗi đến Admin để xử lý thủ công
Use Case tiếp tục bước 14

15a. Không thể gửi email cho 1 khách hàng
15a1. Hệ thống ghi log lỗi
15a2. Hệ thống tiếp tục gửi email cho khách hàng khác
Use Case tiếp tục bước 16

Business Rules
BR-01: Chỉ Driver được phân công mới có quyền hủy chuyến
BR-02: Chỉ cho phép hủy chuyến có status SCHEDULED hoặc IN_PROGRESS
BR-03: Lý do hủy phải có ít nhất 20 ký tự
BR-04: Phải check vào checkbox xác nhận
BR-05: Hoàn tiền 100% cho tất cả khách hàng
BR-06: Gửi email thông báo đến tất cả khách hàng
BR-07: Gửi thông báo khẩn cấp đến Admin
BR-08: Hành động này được ghi log để kiểm tra sau

Non-Functional Requirement
NFR-01: Thời gian xử lý hủy chuyến dưới 5 giây
NFR-02: Thời gian hoàn tiền cho 1 khách hàng dưới 1 giây
NFR-03: Email được gửi trong vòng 1 phút
NFR-04: Thông báo khẩn cấp đến Admin trong vòng 10 giây
NFR-05: Form responsive, hoạt động tốt trên mobile
NFR-06: Hiển thị loading indicator khi đang xử lý
NFR-07: Hiển thị progress bar khi hoàn tiền cho nhiều khách hàng
