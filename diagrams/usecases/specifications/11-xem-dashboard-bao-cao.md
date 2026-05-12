Use Case ID
UC-11

Use Case Name
Xem dashboard và báo cáo

Description
Là Admin, tôi muốn xem dashboard tổng quan và các báo cáo để theo dõi hoạt động hệ thống.

Actor(s)
Admin

Priority
Must Have

Trigger
Admin muốn xem thống kê và báo cáo hệ thống

Pre-Condition(s)
Admin đã đăng nhập vào hệ thống với role ADMIN
Thiết bị của Admin đã được kết nối internet

Post-Condition(s)
Dashboard và báo cáo được hiển thị
Hệ thống ghi nhận hoạt động xem dashboard vào Activity Log

Basic Flow
1. Admin đăng nhập và truy cập trang Admin Dashboard
2. Hệ thống truy vấn dữ liệu thống kê: Tổng doanh thu, Tổng người dùng, Tổng đơn đặt vé, Số tàu đang hoạt động, Số chuyến hôm nay, Phân bố trạng thái đơn hàng
3. Hệ thống tính toán xu hướng (trend) so với 30 ngày trước: Doanh thu, Người dùng, Đơn đặt vé
4. Hệ thống truy vấn dữ liệu biểu đồ: Doanh thu 30 ngày gần nhất, Số đơn đặt vé 30 ngày gần nhất
5. Hệ thống truy vấn 5 đơn đặt vé gần nhất
6. Hệ thống hiển thị dashboard với: 
   - Thẻ thống kê (Cards): Tổng doanh thu (+ trend %), Tổng người dùng (+ trend %), Tổng đơn đặt vé (+ trend %), Số tàu hoạt động, Số chuyến hôm nay
   - Biểu đồ đường (Line Chart): Doanh thu và số đơn theo ngày (30 ngày)
   - Biểu đồ tròn (Pie Chart): Phân bố trạng thái đơn hàng (PAID, PENDING, CANCELLED, PAYMENT_FAILED)
   - Bảng đơn đặt vé gần nhất: Mã đơn, Khách hàng, Chuyến tàu, Tổng tiền, Trạng thái, Ngày đặt
7. Hệ thống ghi nhận hoạt động xem dashboard vào Activity Log

Alternative Flow
6a. Admin chọn xem báo cáo doanh thu chi tiết
6a1. Hệ thống hiển thị trang báo cáo doanh thu với bộ lọc: Khoảng thời gian (ngày/tuần/tháng/năm), Từ ngày, Đến ngày
6a2. Admin chọn khoảng thời gian và chọn lệnh "Xem báo cáo"
6a3. Hệ thống truy vấn dữ liệu doanh thu theo khoảng thời gian
6a4. Hệ thống hiển thị: Tổng doanh thu, Doanh thu trung bình/ngày, Số đơn, Giá trị đơn trung bình, Biểu đồ cột doanh thu theo ngày/tuần/tháng
6a5. Hệ thống hiển thị nút "Xuất Excel"
Use Case tiếp tục bước 7

6b. Admin chọn xem báo cáo tỷ lệ lấp đầy
6b1. Hệ thống hiển thị trang báo cáo tỷ lệ lấp đầy với bộ lọc: Chuyến tàu, Tuyến đường, Khoảng thời gian
6b2. Admin chọn điều kiện lọc và chọn lệnh "Xem báo cáo"
6b3. Hệ thống truy vấn dữ liệu: Tổng ghế, Ghế đã đặt, Tỷ lệ lấp đầy (%)
6b4. Hệ thống hiển thị: Bảng tỷ lệ lấp đầy theo chuyến/tuyến, Biểu đồ cột tỷ lệ lấp đầy
6b5. Hệ thống highlight các chuyến có tỷ lệ lấp đầy < 50% (màu đỏ) và > 90% (màu xanh)
Use Case tiếp tục bước 7

6c. Admin chọn xem báo cáo chuyến tàu phổ biến
6c1. Hệ thống hiển thị trang báo cáo chuyến tàu phổ biến với bộ lọc: Khoảng thời gian, Top N (10/20/50)
6c2. Admin chọn điều kiện lọc và chọn lệnh "Xem báo cáo"
6c3. Hệ thống truy vấn dữ liệu: Số đơn đặt vé, Doanh thu, Tỷ lệ lấp đầy theo chuyến tàu
6c4. Hệ thống sắp xếp theo số đơn giảm dần
6c5. Hệ thống hiển thị: Bảng top chuyến tàu phổ biến, Biểu đồ cột số đơn theo chuyến
Use Case tiếp tục bước 7

6d. Admin chọn lệnh "Xuất Excel" (từ báo cáo doanh thu)
6d1. Hệ thống tạo file Excel với dữ liệu báo cáo
6d2. Hệ thống tải xuống file Excel
Use Case tiếp tục bước 7

6e. Admin chọn lệnh "Làm mới" (Refresh)
6e1. Hệ thống truy vấn lại dữ liệu mới nhất
6e2. Hệ thống cập nhật dashboard
Use Case tiếp tục bước 7

Exception Flow
2a. Hệ thống xảy ra lỗi khi truy vấn dữ liệu
2a1. Hệ thống hiển thị thông báo: "Đã xảy ra lỗi. Vui lòng thử lại sau"
2a2. Hệ thống ghi log lỗi
Use Case dừng lại

6d1a. Không thể tạo file Excel
6d1a1. Hệ thống hiển thị lỗi: "Không thể xuất Excel. Vui lòng thử lại sau"
6d1a2. Hệ thống ghi log lỗi
Use Case quay lại bước 6a4

Business Rules
BR-01: Chỉ Admin có quyền xem dashboard và báo cáo
BR-02: Dữ liệu dashboard được cache 5 phút để tăng hiệu suất
BR-03: Trend được tính so với 30 ngày trước
BR-04: Biểu đồ hiển thị tối đa 30 ngày gần nhất
BR-05: Tỷ lệ lấp đầy = (Ghế đã đặt / Tổng ghế) × 100%
BR-06: Báo cáo có thể xuất Excel

Non-Functional Requirement
NFR-01: Thời gian load dashboard dưới 3 giây
NFR-02: Thời gian load báo cáo dưới 2 giây
NFR-03: Dashboard responsive, hoạt động tốt trên tablet
NFR-04: Biểu đồ sử dụng Chart.js hoặc Recharts
NFR-05: Hiển thị loading indicator khi đang tải dữ liệu
NFR-06: Dashboard tự động refresh mỗi 5 phút
NFR-07: Xuất Excel dưới 5 giây
