Use Case ID
UC-04

Use Case Name
Xác nhận đổi ghế

Description
Là khách hàng, tôi muốn xác nhận đổi ghế khi ghế cũ bị hỏng để tiếp tục sử dụng dịch vụ.

Actor(s)
Khách hàng (Customer), Admin, Email Service

Priority
Should Have

Trigger
Admin gửi email thông báo ghế bị hỏng và đề xuất ghế thay thế

Pre-Condition(s)
Khách hàng đã đặt vé thành công (status PAID)
Ghế của khách hàng bị báo cáo hỏng bởi Driver
Admin đã xử lý báo cáo và tìm ghế thay thế
Email thông báo đã được gửi đến khách hàng

Post-Condition(s)
Khách hàng xác nhận chọn ghế mới
Ticket được cập nhật với ghế mới
Ghế cũ được đánh dấu DISABLED
Email xác nhận đổi ghế được gửi đến khách hàng

Basic Flow
1. Khách hàng nhận email thông báo ghế bị hỏng từ Admin
2. Email chứa: Thông tin ghế cũ, Lý do hỏng, Danh sách ghế thay thế (cùng loại, cùng giá), Link xác nhận
3. Khách hàng click vào link xác nhận trong email
4. Hệ thống hiển thị trang xác nhận đổi ghế với: Thông tin vé hiện tại, Ghế cũ (đã hỏng), Danh sách ghế đề xuất (tối đa 5 ghế)
5. Khách hàng chọn 1 ghế mới từ danh sách đề xuất
6. Khách hàng chọn lệnh "Xác nhận đổi ghế"
7. Hệ thống kiểm tra ghế mới vẫn còn trống
8. Hệ thống cập nhật Ticket với seatId mới
9. Hệ thống cập nhật Seat cũ: status = DISABLED
10. Hệ thống gửi email xác nhận đổi ghế thành công
11. Hệ thống hiển thị thông báo: "Đổi ghế thành công! Vé của bạn đã được cập nhật"

Alternative Flow
5a. Khách hàng không hài lòng với các ghế đề xuất
5a1. Khách hàng chọn lệnh "Liên hệ hỗ trợ"
5a2. Hệ thống hiển thị form liên hệ với thông tin vé
5a3. Khách hàng nhập yêu cầu và gửi
5a4. Hệ thống gửi thông báo đến Admin
5a5. Admin xử lý thủ công và liên hệ lại khách hàng
Use Case dừng lại

7a. Ghế mới đã bị người khác chọn (race condition)
7a1. Hệ thống hiển thị lỗi: "Ghế này đã được chọn bởi người khác. Vui lòng chọn ghế khác"
7a2. Hệ thống làm mới danh sách ghế đề xuất (loại bỏ ghế đã chọn)
Use Case quay lại bước 4

7b. Ghế mới không còn khả dụng (bị disable)
7b1. Hệ thống hiển thị lỗi: "Ghế này không còn khả dụng. Vui lòng chọn ghế khác"
7b2. Hệ thống làm mới danh sách ghế đề xuất
Use Case quay lại bước 4

Exception Flow
3a. Link xác nhận đã hết hạn (quá 48 giờ)
3a1. Hệ thống hiển thị thông báo: "Link xác nhận đã hết hạn. Vui lòng liên hệ hỗ trợ"
Use Case dừng lại

8a. Hệ thống xảy ra lỗi khi cập nhật Ticket
8a1. Hệ thống rollback các thay đổi
8a2. Hệ thống hiển thị thông báo: "Đã xảy ra lỗi. Vui lòng thử lại sau"
8a3. Hệ thống gửi thông báo lỗi đến Admin
Use Case dừng lại

10a. Không thể gửi email xác nhận
10a1. Hệ thống vẫn cập nhật thành công
10a2. Hệ thống ghi log lỗi gửi email
10a3. Admin nhận thông báo để xử lý thủ công
Use Case tiếp tục bước 11

Business Rules
BR-01: Ghế thay thế phải cùng loại (SEAT/BED) với ghế cũ
BR-02: Ghế thay thế phải cùng giá với ghế cũ
BR-03: Ghế thay thế phải trong cùng chuyến tàu
BR-04: Link xác nhận hết hạn sau 48 giờ
BR-05: Khách hàng chỉ có thể chọn 1 trong các ghế đề xuất
BR-06: Không hoàn tiền khi đổi ghế (vì cùng giá)
BR-07: Ghế cũ được đánh dấu DISABLED sau khi đổi thành công

Non-Functional Requirement
NFR-01: Thời gian load trang xác nhận dưới 2 giây
NFR-02: Thời gian cập nhật Ticket dưới 1 giây
NFR-03: Email xác nhận được gửi trong vòng 30 giây
NFR-04: Trang xác nhận responsive, hoạt động tốt trên mobile
NFR-05: Hiển thị sơ đồ ghế để khách hàng dễ hình dung vị trí
NFR-06: Link xác nhận phải được mã hóa để tránh giả mạo
