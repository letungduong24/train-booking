Use Case ID
UC-07

Use Case Name
Xem chuyến đang chạy

Description
Là khách hàng, tôi muốn xem các chuyến tàu đang chạy mà tôi đã đặt vé để theo dõi vị trí tàu real-time.

Actor(s)
Khách hàng (Customer)

Priority
Should Have

Trigger
Khách hàng muốn theo dõi chuyến tàu đang chạy

Pre-Condition(s)
Khách hàng đã đăng nhập vào hệ thống
Khách hàng có ít nhất 1 vé với status PAID và trip status IN_PROGRESS
Thiết bị của khách hàng đã được kết nối internet

Post-Condition(s)
Danh sách chuyến đang chạy được hiển thị
Vị trí tàu được hiển thị trên bản đồ (GPS giả lập)
Hệ thống ghi nhận hoạt động xem chuyến vào Activity Log

Basic Flow
1. Khách hàng chọn menu "Chuyến đang chạy"
2. Hệ thống truy vấn danh sách booking với: userId, status PAID, trip status IN_PROGRESS
3. Hệ thống hiển thị danh sách chuyến đang chạy với thông tin: Mã chuyến, Tên tàu, Tuyến đường, Giờ khởi hành, Giờ đến dự kiến, Trạng thái hiện tại, Số vé đã đặt
4. Hệ thống sắp xếp theo giờ khởi hành tăng dần
5. Hệ thống ghi nhận hoạt động xem chuyến vào Activity Log

Alternative Flow
3a. Không có chuyến nào đang chạy
3a1. Hệ thống hiển thị thông báo: "Bạn không có chuyến nào đang chạy"
3a2. Hệ thống hiển thị nút "Xem chuyến sắp tới" và "Tìm chuyến mới"
Use Case dừng lại

4a. Khách hàng click vào 1 chuyến để xem chi tiết
4a1. Hệ thống hiển thị trang chi tiết chuyến với: Thông tin chuyến tàu, Danh sách ga dừng, Thông tin vé, Bản đồ GPS giả lập
4a2. Hệ thống tính toán vị trí tàu hiện tại dựa trên: departureTime, endTime, departureDelayMinutes, arrivalDelayMinutes, tọa độ tuyến đường
4a3. Công thức tính vị trí: 
     - Thời gian đã chạy = Thời gian hiện tại - (departureTime + departureDelayMinutes)
     - Tổng thời gian = endTime - departureTime + arrivalDelayMinutes
     - Phần trăm hoàn thành = Thời gian đã chạy / Tổng thời gian
     - Vị trí trên tuyến = Tọa độ đầu + (Tọa độ cuối - Tọa độ đầu) * Phần trăm hoàn thành
4a4. Hệ thống hiển thị marker tàu trên bản đồ với icon tàu hỏa
4a5. Hệ thống hiển thị tuyến đường bằng polyline
4a6. Hệ thống hiển thị các ga dừng bằng marker
4a7. Hệ thống tự động cập nhật vị trí tàu mỗi 30 giây
Use Case tiếp tục bước 5

4b. Khách hàng click vào "Xem vé"
4b1. Hệ thống hiển thị danh sách vé trong booking
4b2. Hệ thống hiển thị thông tin: Tên hành khách, CCCD, Ghế, Toa, Giá vé, QR code
Use Case tiếp tục bước 5

Exception Flow
2a. Hệ thống xảy ra lỗi khi truy vấn
2a1. Hệ thống hiển thị thông báo: "Đã xảy ra lỗi. Vui lòng thử lại sau"
2a2. Hệ thống ghi log lỗi
Use Case dừng lại

4a2a. Không có dữ liệu tọa độ tuyến đường
4a2a1. Hệ thống hiển thị thông báo: "Không thể hiển thị bản đồ. Dữ liệu tuyến đường chưa có"
4a2a2. Hệ thống vẫn hiển thị thông tin chuyến tàu và vé
Use Case tiếp tục bước 5

Business Rules
BR-01: Chỉ hiển thị chuyến có status IN_PROGRESS
BR-02: GPS giả lập được tính toán dựa trên thời gian, không phải GPS thật
BR-03: Vị trí tàu được cập nhật mỗi 30 giây
BR-04: Nếu có delay, vị trí tàu được điều chỉnh theo delay
BR-05: Hiển thị thông tin delay nếu có
BR-06: Marker tàu có hướng di chuyển (rotation) dựa trên tuyến đường

Non-Functional Requirement
NFR-01: Thời gian load danh sách dưới 1 giây
NFR-02: Thời gian load bản đồ dưới 3 giây
NFR-03: Bản đồ responsive, hoạt động tốt trên mobile
NFR-04: Sử dụng Leaflet hoặc Google Maps API để hiển thị bản đồ
NFR-05: Marker tàu có animation khi di chuyển
NFR-06: Hiển thị loading indicator khi đang tính toán vị trí
NFR-07: Bản đồ hỗ trợ zoom in/out và pan
