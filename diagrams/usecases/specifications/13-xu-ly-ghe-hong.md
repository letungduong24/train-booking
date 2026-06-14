Use Case ID
UC-13

Use Case Name
Quản lý trạng thái ghế

Description
Là Admin, tôi muốn xem sơ đồ ghế, thay đổi trạng thái hoạt động của ghế ngồi (Khóa ghế, Mở khóa, Bảo trì) và xử lý sự cố báo cáo ghế hỏng từ Lái tàu (đổi ghế tương đương cho khách hàng bị ảnh hưởng).

Actor(s)
Admin, Lái tàu (Driver), Khách hàng (Customer), Email Service

Priority
Must Have

Trigger
- Admin chủ động muốn khóa/mở khóa ghế để dọn dẹp hoặc sửa chữa.
- Lái tàu gửi báo cáo sự cố ghế hỏng (UC-18) trên chuyến tàu đang chạy.

Pre-Condition(s)
Admin đã đăng nhập thành công vào hệ thống với vai trò ADMIN
Thiết bị của Admin đã được kết nối internet

Post-Condition(s)
Trạng thái của ghế ngồi được cập nhật chính xác trong cơ sở dữ liệu (ACTIVE, DISABLED, hoặc MAINTENANCE)
Nếu có hành khách bị ảnh hưởng bởi ghế hỏng, hệ thống tự động điều phối đổi ghế mới hoặc hoàn tiền 100% khi hết ghế trống
Hệ thống gửi email thông báo trạng thái hoặc kết quả xử lý cho khách hàng
Hệ thống lưu Activity Log lịch sử thay đổi trạng thái của Admin

Basic Flow
1. Admin truy cập menu "Quản lý tàu và cơ sở hạ tầng", chọn một Tàu, chọn tiếp một Toa xe bất kỳ
2. Admin chọn tab "Sơ đồ ghế" (Seat Layout)
3. Hệ thống truy vấn danh sách ghế ngồi thuộc toa xe đó và hiển thị sơ đồ trực quan với màu sắc biểu đạt trạng thái: Màu xanh (ACTIVE), Màu xám (DISABLED), Màu đỏ (MAINTENANCE)
4. Admin click chọn vào một vị trí ghế cụ thể
5. Hệ thống hiển thị dialog thông tin chi tiết của ghế bao gồm: Mã ghế, Tên ghế, Loại ghế, Tầng, và Trạng thái hiện tại
6. Admin lựa chọn Trạng thái mới cho ghế (chuyển từ ACTIVE sang DISABLED hoặc MAINTENANCE)
7. Admin chọn lệnh "Cập nhật"
8. Hệ thống gọi API PATCH /seats/:id để lưu trạng thái ghế vào cơ sở dữ liệu
9. Hệ thống cập nhật lại màu sắc ghế trên sơ đồ và hiển thị thông báo: "Cập nhật trạng thái ghế thành công!"
10. Hệ thống ghi nhận hoạt động vào Activity Log

Alternative Flow
13a. Tiếp nhận và xử lý báo cáo sự cố ghế hỏng từ Lái tàu
13a1. Admin chọn menu "Danh sách báo cáo sự cố ghế hỏng"
13a2. Hệ thống hiển thị danh sách báo cáo có trạng thái PENDING xếp theo thời gian giảm dần
13a3. Admin click vào một báo cáo sự cố để xem chi tiết
13a4. Hệ thống hiển thị: Mã sự cố, Chuyến tàu, Toa xe, Số ghế, Loại sự cố, Mô tả chi tiết của Lái tàu, Ảnh chụp hiện trạng (nếu có), và Người báo cáo
13a5. Admin chọn "Xác nhận sự cố"
13a6. Hệ thống tự động cập nhật trạng thái của ghế đó thành DISABLED và truy vấn cơ sở dữ liệu để quét tất cả vé tàu (Ticket) của các khách hàng đã đặt đúng vào chiếc ghế này trên chuyến tàu đó (có trạng thái PAID)
13a7. Nếu không có vé nào bị ảnh hưởng, hệ thống cập nhật trạng thái sự cố thành RESOLVED. Use Case tiếp tục bước 9 của Luồng cơ bản
13a8. Nếu có vé bị ảnh hưởng, hệ thống kích hoạt luồng tự động đổi ghế tương đương (Alternative Flow 13b)

13b. Tự động đổi ghế và liên kết thông báo hành khách
13b1. Hệ thống tìm kiếm vị trí ghế thay thế phù hợp theo quy tắc: Cùng chuyến tàu, cùng loại ghế (Ghế ngồi / Giường nằm), cùng tầng, cùng giá vé. Trạng thái ghế thay thế phải là ACTIVE và chưa có ai đặt chặng đè lên
13b2. Hệ thống sắp xếp mức độ ưu tiên ghế thay thế: Cùng toa xe > Gần vị trí ghế cũ nhất
13b3. Nếu tìm được ghế thay thế:
- Hệ thống khóa tạm thời vị trí ghế mới tìm được cho khách.
- Hệ thống tạo mã Token xác thực đổi ghế tự động (hết hạn sau 24 giờ).
- Hệ thống thông qua Email Service tự động gửi thư cảnh báo sự cố ghế hỏng tới khách hàng bằng template đổi ghế riêng, kèm liên kết /confirm-seat-replacement?token=... và danh sách đề xuất vị trí mới. Email này không sử dụng template xác thực tài khoản /verify-email.
- Trạng thái sự cố chuyển sang WAITING_CUSTOMER_CONFIRMATION.
13b4. Hành khách nhận được email, bấm vào link để chọn vị trí ghế mới (UC-04):
- Hệ thống giải phóng ghế cũ bị hỏng, cập nhật Ticket sang vị trí ghế mới đã chọn.
- Hệ thống chuyển trạng thái sự cố sang RESOLVED.
- Hệ thống gửi email xác nhận đổi ghế thành công cho khách.
13b5. Nếu không tìm được ghế thay thế tương đương:
- Hệ thống hiển thị thông báo lỗi: "Không tìm thấy ghế thay thế phù hợp trên hệ thống".
- Admin chọn lệnh "Tự động hủy vé & Hoàn tiền".
- Hệ thống cập nhật trạng thái Booking thành CANCELLED, hủy Ticket bị ảnh hưởng.
- Hệ thống tự động hoàn tiền 100% giá trị vé vào Ví điện tử nội bộ của hành khách.
- Hệ thống gửi email xin lỗi, thông báo hủy chuyến/ghế và chi tiết giao dịch hoàn tiền cho khách.
- Hệ thống chuyển trạng thái sự cố sang RESOLVED.

13c. Admin từ chối báo cáo sự cố của Lái tàu
13c1. Admin xem chi tiết báo cáo và chọn lệnh "Từ chối"
13c2. Hệ thống hiển thị dialog yêu cầu Admin nhập "Lý do từ chối"
13c3. Admin nhập lý do và bấm "Xác nhận"
13c4. Hệ thống cập nhật báo cáo sự cố thành REJECTED, lưu lý do từ chối
13c5. Hệ thống gửi thông báo phản hồi lại cho Lái tàu đã gửi báo cáo

13d. Khách hàng không xác nhận đổi ghế trong 24 giờ
13d1. Hết thời hạn 24 giờ kể từ khi gửi email, hệ thống tự động quét thấy Token hết hạn
13d2. Cron job tự động hủy vé bị ảnh hưởng và hoàn tiền 100% về Ví nội bộ của hành khách
13d3. Hệ thống gửi email thông báo hủy vé và chi tiết hoàn tiền cho khách hàng
13d4. Hệ thống xóa token đổi ghế để link không còn sử dụng được
13d5. Trạng thái sự cố chuyển sang RESOLVED

13e. Khách hàng không ưng ý với các ghế đề xuất
13e1. Khách hàng bấm lựa chọn "Tôi không ưng ý với các ghế đề xuất này"
13e2. Frontend gọi API POST /tickets/reject-replacement với token đổi ghế
13e3. Hệ thống hủy vé bị ảnh hưởng và hoàn tiền 100% về Ví nội bộ của hành khách
13e4. Hệ thống gửi email thông báo hoàn tiền cho khách hàng
13e5. Trạng thái sự cố chuyển sang RESOLVED

Exception Flow
3a. Hệ thống xảy ra lỗi khi truy vấn sơ đồ ghế
3a1. Hệ thống hiển thị thông báo: "Đã xảy ra lỗi khi tải sơ đồ ghế. Vui lòng thử lại sau"
Use Case dừng lại

8a. Hệ thống xảy ra lỗi khi cập nhật trạng thái ghế vào cơ sở dữ liệu
8a1. Hệ thống hiển thị thông báo: "Cập nhật thất bại. Vui lòng kiểm tra lại kết nối"
Use Case quay lại bước 5

Business Rules
BR-01: Chỉ có tài khoản có quyền ADMIN mới được phép thao tác thay đổi trạng thái ghế hoặc xử lý sự cố ghế hỏng
BR-02: Ghế bị hỏng hoặc đang trong diện bảo trì bắt buộc phải mang trạng thái DISABLED hoặc MAINTENANCE để hệ thống tự động chặn không cho phép khách hàng khác tìm kiếm và đặt vé vào ghế này trên tất cả các chuyến đi sau đó
BR-03: Ghế thay thế bắt buộc phải cùng loại (SEAT / BED), cùng tầng và cùng phân cấp giá vé với ghế cũ của hành khách
BR-04: Nếu hành trình không còn bất kỳ ghế trống nào khả dụng, hệ thống bắt buộc phải hoàn 100% giá trị vé về Ví điện tử nội bộ của khách hàng (Không thu phí hủy vé)
BR-05: Email đổi ghế hỏng phải dùng link /confirm-seat-replacement?token=...; không được gửi token đổi ghế qua luồng /verify-email
BR-06: Admin không được chủ động hủy vé/hoàn tiền trong khi đang chờ hành khách xác nhận đổi ghế
BR-07: Nếu hành khách không phản hồi trong 24 giờ, cron job tự động hủy vé bị ảnh hưởng và hoàn tiền

Non-Functional Requirement
NFR-01: Thời gian truy xuất sơ đồ ghế của toa xe và hiển thị màu sắc trực quan phải dưới 1 giây
NFR-02: Thuật toán quét và tìm kiếm ghế trống thay thế tương đương trên chuyến tàu phải hoàn tất dưới 2 giây
NFR-03: Đảm bảo tính an toàn giao dịch tuyệt đối khi sửa đổi vị trí ghế trong Database, áp dụng cơ chế Database Transaction để rollback nếu xảy ra sự cố nghẽn mạng giữa chừng
NFR-04: Sơ đồ bố cục layout ghế và giường phải responsive, hoạt động tốt trên cả tablet và máy tính
