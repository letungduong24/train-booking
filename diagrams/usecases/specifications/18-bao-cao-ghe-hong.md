Use Case ID
UC-18

Use Case Name
Báo cáo ghế hỏng

Description
Là Driver, tôi muốn báo cáo ghế hỏng khi phát hiện trong quá trình vận hành để Admin xử lý.

Actor(s)
Driver, Admin, Notification Service

Priority
Should Have

Trigger
Driver phát hiện ghế hỏng trong chuyến tàu

Pre-Condition(s)
Driver đã đăng nhập vào hệ thống với role DRIVER
Driver được phân công cho chuyến tàu này
Chuyến tàu có status SCHEDULED hoặc IN_PROGRESS
Thiết bị của Driver đã được kết nối internet

Post-Condition(s)
Báo cáo ghế hỏng được tạo với status PENDING
Admin nhận thông báo
Ghế được đánh dấu "⚠️" trên sơ đồ
Hệ thống ghi nhận hoạt động vào Activity Log

Basic Flow
1. Driver xem chi tiết chuyến được phân công (UC-16)
2. Driver chọn lệnh "Báo cáo ghế hỏng"
3. Hệ thống hiển thị sơ đồ toa tàu với tất cả các ghế
4. Driver click vào ghế bị hỏng trên sơ đồ
5. Hệ thống highlight ghế đã chọn và hiển thị thông tin: Toa, Ghế, Loại, Tầng
6. Hệ thống hiển thị form với các trường:
   - Loại sự cố (dropdown, required): "Ghế gãy/hỏng", "Ghế bẩn", "Không điều chỉnh được", "Thiết bị hỏng (đèn, ổ cắm)", "Khác"
   - Mô tả chi tiết (textarea, required, tối thiểu 10 ký tự)
   - Upload ảnh (optional, tối đa 3 ảnh, 5MB/ảnh)
7. Driver chọn loại sự cố và nhập mô tả
8. Driver upload ảnh (nếu có)
9. Driver chọn lệnh "Gửi báo cáo"
10. Hệ thống kiểm tra: Loại sự cố đã chọn, Mô tả >= 10 ký tự, Ảnh <= 5MB/ảnh
11. Hệ thống upload ảnh lên server (nếu có)
12. Hệ thống tạo SeatIssueReport với: tripId, seatId, issueType, description, images, reportedBy (driverId), status PENDING
13. Hệ thống gửi notification đến Admin: "Driver {name} báo cáo ghế hỏng: Toa {coach}, Ghế {seat}, Chuyến {trip}"
14. Hệ thống đánh dấu ghế "⚠️" trên sơ đồ (chỉ hiển thị cho Admin và Driver)
15. Hệ thống hiển thị thông báo: "Báo cáo đã được gửi. Admin sẽ xử lý sớm nhất"
16. Hệ thống ghi nhận hoạt động vào Activity Log

Alternative Flow
4a. Driver chọn nhiều ghế cùng lúc
4a1. Hệ thống cho phép chọn nhiều ghế (Ctrl + Click hoặc Shift + Click)
4a2. Hệ thống hiển thị danh sách ghế đã chọn
4a3. Hệ thống tạo 1 báo cáo cho mỗi ghế
Use Case tiếp tục bước 16

7a. Driver chọn loại sự cố "Khác"
7a1. Hệ thống hiển thị thêm trường: "Loại sự cố khác" (required)
7a2. Driver nhập loại sự cố cụ thể
Use Case tiếp tục bước 8

8a. Driver chọn lệnh "Hủy" (từ form)
8a1. Hệ thống đóng form
Use Case quay lại bước 3

Exception Flow
10a. Mô tả quá ngắn (< 10 ký tự)
10a1. Hệ thống hiển thị lỗi: "Mô tả phải có ít nhất 10 ký tự"
Use Case quay lại bước 6

10b. Ảnh quá lớn (> 5MB)
10b1. Hệ thống hiển thị lỗi: "Ảnh không được vượt quá 5MB"
Use Case quay lại bước 6

10c. Upload quá 3 ảnh
10c1. Hệ thống hiển thị lỗi: "Chỉ được upload tối đa 3 ảnh"
Use Case quay lại bước 6

11a. Không thể upload ảnh lên server
11a1. Hệ thống hiển thị lỗi: "Không thể upload ảnh. Vui lòng thử lại"
11a2. Driver chọn lệnh "Thử lại" hoặc "Gửi không có ảnh"
11a3. Nếu "Gửi không có ảnh": Hệ thống tạo báo cáo không có ảnh
Use Case tiếp tục bước 12

13a. Không thể gửi notification đến Admin
13a1. Hệ thống ghi log lỗi
13a2. Hệ thống vẫn tạo báo cáo thành công
Use Case tiếp tục bước 14

Business Rules
BR-01: Chỉ Driver được phân công mới có quyền báo cáo ghế hỏng
BR-02: Mô tả phải có ít nhất 10 ký tự
BR-03: Tối đa 3 ảnh, mỗi ảnh tối đa 5MB
BR-04: Định dạng ảnh: jpg, png, jpeg
BR-05: Báo cáo có status PENDING cho đến khi Admin xử lý
BR-06: Ghế được đánh dấu "⚠️" trên sơ đồ (chỉ hiển thị cho Admin và Driver)
BR-07: Gửi notification đến Admin ngay lập tức
BR-08: Có thể báo cáo nhiều ghế cùng lúc

Non-Functional Requirement
NFR-01: Thời gian load sơ đồ ghế dưới 2 giây
NFR-02: Thời gian upload ảnh dưới 5 giây/ảnh
NFR-03: Thời gian tạo báo cáo dưới 1 giây
NFR-04: Notification đến Admin trong vòng 10 giây
NFR-05: Sơ đồ ghế responsive, hoạt động tốt trên mobile
NFR-06: Hiển thị loading indicator khi đang upload ảnh
NFR-07: Hiển thị preview ảnh trước khi upload
