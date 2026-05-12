Use Case ID
UC-06

Use Case Name
Tìm kiếm chuyến tàu

Description
Là khách hàng, tôi muốn tìm kiếm chuyến tàu theo ga đi, ga đến và ngày khởi hành để chọn chuyến phù hợp.

Actor(s)
Khách hàng (Customer)

Priority
Must Have

Trigger
Khách hàng muốn tìm chuyến tàu để đặt vé

Pre-Condition(s)
Khách hàng đã truy cập vào hệ thống (có thể chưa đăng nhập)
Hệ thống có dữ liệu chuyến tàu
Thiết bị của khách hàng đã được kết nối internet

Post-Condition(s)
Danh sách chuyến tàu phù hợp được hiển thị
Hệ thống ghi nhận hoạt động tìm kiếm vào Activity Log

Basic Flow
1. Khách hàng truy cập trang tìm kiếm chuyến tàu
2. Hệ thống hiển thị form tìm kiếm với các trường: Ga đi (dropdown), Ga đến (dropdown), Ngày khởi hành (date picker)
3. Khách hàng chọn ga đi từ dropdown
4. Khách hàng chọn ga đến từ dropdown
5. Khách hàng chọn ngày khởi hành
6. Khách hàng chọn lệnh "Tìm kiếm"
7. Hệ thống kiểm tra tính hợp lệ của dữ liệu
8. Hệ thống tìm kiếm chuyến tàu theo điều kiện: fromStationId, toStationId, date
9. Hệ thống hiển thị danh sách chuyến tàu với thông tin: Mã chuyến, Tên tàu, Giờ khởi hành, Giờ đến dự kiến, Thời gian di chuyển, Giá vé thấp nhất, Số ghế trống, Trạng thái delay (nếu có)
10. Hệ thống sắp xếp kết quả theo giờ khởi hành tăng dần
11. Hệ thống ghi nhận hoạt động tìm kiếm vào Activity Log

Alternative Flow
7a. Ga đi và ga đến trùng nhau
7a1. Hệ thống hiển thị lỗi: "Ga đi và ga đến không được trùng nhau"
Use Case quay lại bước 2

7b. Ngày khởi hành trong quá khứ
7b1. Hệ thống hiển thị lỗi: "Ngày khởi hành phải từ hôm nay trở đi"
Use Case quay lại bước 2

8a. Không tìm thấy chuyến tàu nào
8a1. Hệ thống hiển thị thông báo: "Không tìm thấy chuyến tàu phù hợp. Vui lòng thử lại với điều kiện khác"
8a2. Hệ thống gợi ý: "Thử tìm kiếm với ngày khác" hoặc "Xem các tuyến phổ biến"
Use Case dừng lại

9a. Khách hàng chọn lọc kết quả
9a1. Hệ thống hiển thị bộ lọc: Giờ khởi hành (sáng, chiều, tối), Loại tàu, Khoảng giá
9a2. Khách hàng chọn điều kiện lọc
9a3. Hệ thống lọc và hiển thị lại kết quả
Use Case tiếp tục bước 11

9b. Khách hàng chọn sắp xếp kết quả
9b1. Hệ thống hiển thị tùy chọn sắp xếp: Giờ khởi hành (tăng/giảm), Giá vé (tăng/giảm), Thời gian di chuyển (tăng/giảm)
9b2. Khách hàng chọn cách sắp xếp
9b3. Hệ thống sắp xếp và hiển thị lại kết quả
Use Case tiếp tục bước 11

9c. Khách hàng click vào 1 chuyến tàu
9c1. Hệ thống chuyển sang UC-07 (Xem chi tiết chuyến tàu)

Exception Flow
8a. Hệ thống xảy ra lỗi khi tìm kiếm
8a1. Hệ thống hiển thị thông báo: "Đã xảy ra lỗi. Vui lòng thử lại sau"
8a2. Hệ thống ghi log lỗi
Use Case dừng lại

Business Rules
BR-01: Ga đi và ga đến không được trùng nhau
BR-02: Ngày khởi hành phải từ hôm nay trở đi
BR-03: Chỉ hiển thị chuyến tàu có status SCHEDULED
BR-04: Giá vé thấp nhất được tính từ ghế rẻ nhất còn trống
BR-05: Số ghế trống = Tổng ghế - Ghế đã đặt - Ghế DISABLED
BR-06: Hiển thị thông tin delay nếu departureDelayMinutes > 0
BR-07: Kết quả tìm kiếm được cache 5 phút để tăng hiệu suất

Non-Functional Requirement
NFR-01: Thời gian tìm kiếm dưới 2 giây
NFR-02: Form tìm kiếm responsive, hoạt động tốt trên mobile
NFR-03: Dropdown ga hỗ trợ tìm kiếm theo tên ga
NFR-04: Date picker chỉ cho phép chọn từ hôm nay đến 90 ngày sau
NFR-05: Hiển thị loading indicator khi đang tìm kiếm
NFR-06: Kết quả tìm kiếm hỗ trợ pagination (10 chuyến/trang)
NFR-07: Lưu lịch sử tìm kiếm gần nhất (3 lần) để gợi ý
