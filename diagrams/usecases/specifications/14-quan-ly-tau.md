Use Case ID
UC-14

Use Case Name
Quản lý tàu

Description
Là Admin, tôi muốn quản lý tàu, toa, ghế, ga, tuyến đường, chuyến tàu và mạng lưới đường sắt.

Actor(s)
Admin

Priority
Must Have

Trigger
Admin muốn quản lý hệ thống tàu hỏa

Pre-Condition(s)
Admin đã đăng nhập vào hệ thống với role ADMIN
Thiết bị của Admin đã được kết nối internet

Post-Condition(s)
Dữ liệu được tạo, cập nhật hoặc xóa thành công
Hệ thống ghi nhận hoạt động vào Activity Log

Basic Flow - Quản lý Tàu
1. Admin chọn menu "Quản lý tàu"
2. Hệ thống hiển thị danh sách tàu với: Mã tàu, Tên, Vận tốc trung bình, Số toa, Trạng thái, Ngày tạo
3. Admin chọn lệnh "Thêm tàu mới"
4. Hệ thống hiển thị form với các trường: Mã tàu, Tên, Vận tốc trung bình (km/h), Trạng thái (ACTIVE/INACTIVE/MAINTENANCE)
5. Admin nhập thông tin và chọn lệnh "Lưu"
6. Hệ thống kiểm tra: Mã tàu duy nhất, Vận tốc > 0
7. Hệ thống tạo Train mới
8. Hệ thống hiển thị thông báo: "Thêm tàu thành công!"
9. Hệ thống ghi nhận hoạt động vào Activity Log

Alternative Flow 1 - Sửa thông tin tàu
3a. Admin click vào 1 tàu để xem chi tiết
3a1. Hệ thống hiển thị trang chi tiết tàu với: Thông tin tàu, Danh sách toa, Thống kê (Tổng ghế, Số chuyến đã chạy)
3a2. Admin chọn lệnh "Sửa thông tin"
3a3. Hệ thống hiển thị form chỉnh sửa
3a4. Admin thay đổi thông tin và chọn lệnh "Lưu"
3a5. Hệ thống cập nhật Train
3a6. Hệ thống hiển thị thông báo: "Cập nhật thành công!"
Use Case tiếp tục bước 9

Alternative Flow 2 - Xóa tàu
3b. Admin chọn lệnh "Xóa" (từ danh sách hoặc chi tiết)
3b1. Hệ thống kiểm tra: Tàu không có chuyến tàu nào đang sử dụng
3b2. Hệ thống hiển thị xác nhận: "Bạn có chắc muốn xóa tàu này?"
3b3. Admin chọn lệnh "Xác nhận"
3b4. Hệ thống xóa Train và các Coach, Seat liên quan
3b5. Hệ thống hiển thị thông báo: "Xóa tàu thành công!"
Use Case tiếp tục bước 9

Alternative Flow 3 - Thêm toa vào tàu
3c. Admin chọn lệnh "Thêm toa" (từ chi tiết tàu)
3c1. Hệ thống hiển thị form với các trường: Mã toa, Tên, Mẫu toa (dropdown), Thứ tự
3c2. Admin chọn mẫu toa và nhập thông tin
3c3. Hệ thống tạo Coach mới
3c4. Hệ thống tự động tạo Seat dựa trên CoachTemplate (rows × cols × tiers)
3c5. Hệ thống hiển thị thông báo: "Thêm toa thành công!"
Use Case tiếp tục bước 9

Alternative Flow 4 - Quản lý ghế trong toa
3d. Admin click vào 1 toa để xem sơ đồ ghế
3d1. Hệ thống hiển thị sơ đồ ghế với màu sắc: Xanh (ACTIVE), Xám (DISABLED), Đỏ (MAINTENANCE)
3d2. Admin click vào 1 ghế
3d3. Hệ thống hiển thị dialog với thông tin ghế: Mã, Tên, Loại, Tầng, Trạng thái
3d4. Admin chọn trạng thái mới và chọn lệnh "Cập nhật"
3d5. Hệ thống cập nhật Seat.status
3d6. Hệ thống hiển thị thông báo: "Cập nhật ghế thành công!"
Use Case tiếp tục bước 9

Alternative Flow 5 - Quản lý Ga
3e. Admin chọn menu "Quản lý ga"
3e1. Hệ thống hiển thị danh sách ga với: Mã ga, Tên, Tọa độ (lat, lng), Số tuyến, Ngày tạo
3e2. Admin chọn lệnh "Thêm ga mới"
3e3. Hệ thống hiển thị form với các trường: Mã ga, Tên, Tọa độ (lat, lng)
3e4. Admin nhập thông tin và chọn lệnh "Lưu"
3e5. Hệ thống kiểm tra: Mã ga duy nhất, Tọa độ hợp lệ
3e6. Hệ thống tạo Station mới
3e7. Hệ thống hiển thị thông báo: "Thêm ga thành công!"
Use Case tiếp tục bước 9

Alternative Flow 6 - Quản lý Tuyến đường
3f. Admin chọn menu "Quản lý tuyến đường"
3f1. Hệ thống hiển thị danh sách tuyến với: Mã tuyến, Tên, Số ga, Tổng km, Giá cơ bản/km, Phí ga, Ngày tạo
3f2. Admin chọn lệnh "Thêm tuyến mới"
3f3. Hệ thống hiển thị form với các trường: Mã tuyến, Tên, Giá cơ bản/km, Phí ga
3f4. Admin nhập thông tin và chọn lệnh "Lưu"
3f5. Hệ thống tạo Route mới
3f6. Hệ thống hiển thị thông báo: "Thêm tuyến thành công!"
3f7. Admin chọn lệnh "Thêm ga vào tuyến"
3f8. Hệ thống hiển thị form với các trường: Ga (dropdown), Thứ tự, Khoảng cách từ ga đầu (km), Thời gian từ ga đầu (phút)
3f9. Admin nhập thông tin và chọn lệnh "Lưu"
3f10. Hệ thống tạo RouteStation mới
3f11. Hệ thống hiển thị thông báo: "Thêm ga vào tuyến thành công!"
Use Case tiếp tục bước 9

Alternative Flow 7 - Quản lý Chuyến tàu
3g. Admin chọn menu "Quản lý chuyến tàu"
3g1. Hệ thống hiển thị danh sách chuyến với: Mã chuyến, Tàu, Tuyến, Giờ khởi hành, Giờ kết thúc, Trạng thái, Delay
3g2. Admin chọn lệnh "Thêm chuyến mới"
3g3. Hệ thống hiển thị form với các trường: Tàu (dropdown), Tuyến (dropdown), Giờ khởi hành, Giờ kết thúc
3g4. Admin nhập thông tin và chọn lệnh "Lưu"
3g5. Hệ thống kiểm tra: Tàu không bị trùng lịch, Giờ kết thúc > Giờ khởi hành
3g6. Hệ thống tạo Trip mới với status SCHEDULED
3g7. Hệ thống hiển thị thông báo: "Thêm chuyến thành công!"
Use Case tiếp tục bước 9

Alternative Flow 8 - Cập nhật Delay chuyến tàu
3h. Admin chọn lệnh "Cập nhật delay" (từ danh sách chuyến)
3h1. Hệ thống hiển thị form với các trường: Delay khởi hành (phút), Delay đến nơi (phút)
3h2. Admin nhập số phút delay và chọn lệnh "Lưu"
3h3. Hệ thống cập nhật Trip.departureDelayMinutes, Trip.arrivalDelayMinutes
3h4. Hệ thống gửi thông báo đến khách hàng có vé
3h5. Hệ thống hiển thị thông báo: "Cập nhật delay thành công!"
Use Case tiếp tục bước 9

Alternative Flow 9 - Giám sát tàu trên bản đồ
3i. Admin chọn menu "Giám sát tàu"
3i1. Hệ thống truy vấn tất cả chuyến có status IN_PROGRESS
3i2. Hệ thống tính toán vị trí tàu cho từng chuyến (GPS giả lập)
3i3. Hệ thống hiển thị bản đồ với marker tàu, tuyến đường, ga dừng
3i4. Hệ thống tự động cập nhật vị trí mỗi 30 giây
3i5. Admin click vào 1 marker tàu
3i6. Hệ thống hiển thị popup với: Mã chuyến, Tàu, Tuyến, Giờ khởi hành, Trạng thái, Delay
Use Case tiếp tục bước 9

Alternative Flow 10 - Quản lý Mạng lưới đường sắt
3j. Admin chọn menu "Quản lý mạng lưới"
3j1. Hệ thống hiển thị danh sách RailwayLine với: Mã, Tên, Tuyến liên kết, Tọa độ GeoJSON
3j2. Admin chọn lệnh "Thêm đường ray mới"
3j3. Hệ thống hiển thị form với các trường: Mã, Tên, Tuyến (dropdown), Tọa độ GeoJSON (LineString)
3j4. Admin nhập thông tin và chọn lệnh "Lưu"
3j5. Hệ thống tạo RailwayLine mới
3j6. Hệ thống hiển thị thông báo: "Thêm đường ray thành công!"
Use Case tiếp tục bước 9

Exception Flow
6a. Mã tàu đã tồn tại
6a1. Hệ thống hiển thị lỗi: "Mã tàu đã tồn tại"
Use Case quay lại bước 4

3b1a. Tàu đang có chuyến tàu sử dụng
3b1a1. Hệ thống hiển thị lỗi: "Không thể xóa tàu. Tàu đang có chuyến tàu sử dụng"
Use Case quay lại bước 3a1

3g5a. Tàu bị trùng lịch
3g5a1. Hệ thống hiển thị lỗi: "Tàu đã có chuyến khác trong khoảng thời gian này"
Use Case quay lại bước 3g3

Business Rules
BR-01: Mã tàu, mã ga, mã tuyến phải duy nhất
BR-02: Vận tốc trung bình > 0
BR-03: Không thể xóa tàu đang có chuyến sử dụng
BR-04: Ghế được tạo tự động khi thêm toa dựa trên CoachTemplate
BR-05: Giá vé được tính động dựa trên: basePricePerKm, stationFee, coachMultiplier, tierMultiplier, discountRate
BR-06: Trạng thái chuyến tàu tự động cập nhật bằng cron job
BR-07: GPS giả lập được tính toán dựa trên thời gian và tọa độ tuyến

Non-Functional Requirement
NFR-01: Thời gian load danh sách dưới 2 giây
NFR-02: Thời gian tạo/cập nhật dưới 1 giây
NFR-03: Bản đồ giám sát load dưới 3 giây
NFR-04: Sơ đồ ghế responsive, hoạt động tốt trên tablet
NFR-05: Hỗ trợ pagination cho tất cả danh sách
NFR-06: Hỗ trợ tìm kiếm và lọc
NFR-07: Bản đồ tự động cập nhật mỗi 30 giây
