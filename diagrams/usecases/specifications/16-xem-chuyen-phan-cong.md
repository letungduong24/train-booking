Use Case ID
UC-16

Use Case Name
Xem chuyến được phân công

Description
Là Driver, tôi muốn xem danh sách các chuyến tàu mà tôi được phân công để chuẩn bị và điều khiển.

Actor(s)
Driver

Priority
Must Have

Trigger
Driver muốn xem lịch trình chuyến tàu của mình

Pre-Condition(s)
Driver đã đăng nhập vào hệ thống với role DRIVER
Thiết bị của Driver đã được kết nối internet

Post-Condition(s)
Danh sách chuyến được phân công được hiển thị
Hệ thống ghi nhận hoạt động xem chuyến vào Activity Log

Basic Flow
1. Driver đăng nhập và truy cập trang Driver Dashboard
2. Hệ thống hiển thị menu: "Chuyến hôm nay", "Chuyến tuần này", "Lịch sử chuyến"
3. Driver chọn "Chuyến hôm nay"
4. Hệ thống truy vấn danh sách chuyến với: driverId = Driver.id, departureTime trong ngày hôm nay
5. Hệ thống hiển thị danh sách chuyến với: Mã chuyến, Tàu, Tuyến đường (ga đi - ga đến), Giờ khởi hành, Giờ kết thúc, Trạng thái, Số hành khách, Delay (nếu có)
6. Hệ thống sắp xếp theo giờ khởi hành tăng dần
7. Hệ thống ghi nhận hoạt động xem chuyến vào Activity Log

Alternative Flow
3a. Driver chọn "Chuyến tuần này"
3a1. Hệ thống truy vấn danh sách chuyến với: driverId = Driver.id, departureTime trong tuần này
3a2. Hệ thống hiển thị danh sách chuyến nhóm theo ngày
Use Case tiếp tục bước 7

3b. Driver chọn "Lịch sử chuyến"
3b1. Hệ thống truy vấn danh sách chuyến với: driverId = Driver.id, status COMPLETED hoặc CANCELLED; đồng thời đưa các chuyến đã quá endTime vào nhóm lịch sử dù cron chưa kịp cập nhật status
3b2. Hệ thống hiển thị danh sách chuyến với thêm cột: Kết quả (Hoàn thành/Đã hủy)
3b3. Hệ thống phân trang 20 chuyến/trang
Use Case tiếp tục bước 7

5a. Không có chuyến nào
5a1. Hệ thống hiển thị thông báo: "Bạn không có chuyến nào {hôm nay/tuần này/trong lịch sử}"
Use Case dừng lại

6a. Driver click vào 1 chuyến để xem chi tiết
6a1. Hệ thống hiển thị trang chi tiết chuyến với:
     - Thông tin chuyến: Mã, Tàu, Tuyến, Giờ khởi hành, Giờ kết thúc, Trạng thái, Delay
     - Thông tin tuyến đường: Tổng km, Thời gian chạy dự kiến
     - Danh sách ga dừng: Tên ga, Thứ tự, Khoảng cách từ ga đầu, Thời gian từ ga đầu, Thời gian dừng dự kiến
     - Thông tin tàu: Mã tàu, Số toa, Tổng số ghế
     - Số lượng hành khách: Tổng số vé đã bán, Tỷ lệ lấp đầy
     - Sơ đồ toa tàu: Hiển thị các toa và số ghế đã đặt/trống
6a2. Hệ thống hiển thị các nút: "Báo cáo delay", "Báo cáo ghế hỏng", "Hủy chuyến khẩn cấp" nếu status SCHEDULED hoặc IN_PROGRESS và thời điểm hiện tại chưa vượt quá endTime
6a3. Nếu chuyến đã quá endTime hoặc có status COMPLETED/CANCELLED, hệ thống chỉ cho xem thông tin chuyến và khóa các thao tác báo cáo sự cố
Use Case tiếp tục bước 7

6b. Driver chọn lệnh "Báo cáo delay" (từ chi tiết chuyến)
6b1. Use Case chuyển sang UC-17 (Báo cáo delay)

6c. Driver chọn lệnh "Báo cáo ghế hỏng" (từ chi tiết chuyến)
6c1. Use Case chuyển sang UC-18 (Báo cáo ghế hỏng)

6d. Driver chọn lệnh "Hủy chuyến khẩn cấp" (từ chi tiết chuyến)
6d1. Use Case chuyển sang UC-15 (Yêu cầu hủy chuyến khẩn cấp)

Exception Flow
4a. Hệ thống xảy ra lỗi khi truy vấn
4a1. Hệ thống hiển thị thông báo: "Đã xảy ra lỗi. Vui lòng thử lại sau"
4a2. Hệ thống ghi log lỗi
Use Case dừng lại

Business Rules
BR-01: Chỉ hiển thị chuyến được phân công cho Driver đang đăng nhập
BR-02: Chuyến hôm nay: departureTime trong ngày hôm nay
BR-03: Chuyến tuần này: departureTime trong tuần này (Thứ 2 - Chủ nhật)
BR-04: Lịch sử chuyến: status COMPLETED hoặc CANCELLED hoặc chuyến đã quá endTime
BR-05: Hiển thị thông tin delay nếu có
BR-06: Tỷ lệ lấp đầy = (Số vé đã bán / Tổng số ghế) × 100%
BR-07: Các thao tác báo cáo sự cố chỉ khả dụng khi chuyến chưa kết thúc theo endTime

Non-Functional Requirement
NFR-01: Thời gian load danh sách dưới 1 giây
NFR-02: Thời gian load chi tiết chuyến dưới 2 giây
NFR-03: Danh sách responsive, hoạt động tốt trên mobile
NFR-04: Hiển thị loading indicator khi đang tải dữ liệu
NFR-05: Hỗ trợ pagination cho lịch sử chuyến (20 chuyến/trang)
NFR-06: Highlight chuyến sắp khởi hành (trong vòng 1 giờ) bằng màu vàng
NFR-07: Hiển thị countdown thời gian đến giờ khởi hành
