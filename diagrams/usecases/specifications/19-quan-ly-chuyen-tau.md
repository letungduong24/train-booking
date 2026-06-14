Use Case ID
UC-19

Use Case Name
Quản lý chuyến tàu

Description
Là Admin, tôi muốn lập lịch khởi hành chuyến tàu (Trip), cập nhật thông số delay thời gian thực của các chuyến tàu tại các trạm ga, và giám sát vị trí GPS giả lập của các đoàn tàu đang di chuyển trên bản đồ số GIS.

Actor(s)
Admin, Khách hàng (Customer), Email Service

Priority
Must Have

Trigger
Admin muốn thiết lập lịch chạy, cập nhật delay khi nhận báo cáo từ Lái tàu (UC-17), hoặc muốn giám sát hành trình chạy tàu thực tế.

Pre-Condition(s)
Admin đã đăng nhập thành công vào hệ thống với vai trò ADMIN
Thiết bị của Admin đã được kết nối Internet để kết nối tới Backend API

Post-Condition(s)
Bản ghi chuyến tàu (Trip) được tạo mới, cập nhật hoặc xóa thành công trong CSDL PostgreSQL
Số phút delay được ghi nhận và tự động làm cơ sở thay độ tọa độ GPS thực tế của tàu
Hệ thống gửi thư cảnh báo trễ giờ tự động tới tất cả khách hàng đã mua vé thuộc chuyến đi bị trễ
Nhật ký hoạt động được ghi lại vào hệ thống Activity Log

Basic Flow
1. Admin chọn menu "Quản lý chuyến tàu"
2. Hệ thống hiển thị danh sách các chuyến tàu hiện có bao gồm: Mã chuyến, Tên Tàu chạy, Tên Tuyến lộ trình, Giờ khởi hành dự kiến, Giờ kết thúc dự kiến, Trạng thái (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED), số phút Delay ga đi/ga đến, và Ngày tạo
3. Admin chọn lệnh "Thêm chuyến tàu mới"
4. Hệ thống hiển thị form nhập: Chọn tàu (dropdown hiển thị danh sách tàu hoạt động), Chọn Tuyến đường (dropdown hiển thị danh sách tuyến), Nhập thời gian khởi hành dự kiến (DateTime Picker), Nhập thời gian kết thúc dự kiến (DateTime Picker)
5. Admin điền thông tin và chọn nút "Lưu"
6. Backend nhận dữ liệu và thực hiện kiểm tra nghiệp vụ:
- Kiểm tra xung đột lịch trình: Tàu được chọn không được có lịch chạy ở bất kỳ chuyến tàu nào khác trong khoảng thời gian khởi hành đến kết thúc vừa chọn.
- Thời gian kết thúc phải lớn hơn thời gian khởi hành.
7. Hệ thống tạo thực thể Chuyến tàu (Trip) mới với trạng thái ban đầu là SCHEDULED
8. Hệ thống hiển thị thông báo: "Thêm chuyến tàu thành công!"
9. Hệ thống ghi nhận hoạt động vào nhật ký (Activity Log)

Alternative Flow
19a. Cập nhật Delay hành trình chuyến tàu
19a1. Tại danh sách chuyến tàu, Admin click chọn nút "Cập nhật delay" bên cạnh chuyến đi đang quan tâm
19a2. Hệ thống hiển thị form nhập số phút trễ bao gồm: Số phút delay khởi hành (departureDelayMinutes) và số phút delay cập bến ga cuối (arrivalDelayMinutes)
19a3. Admin nhập số phút trễ thực tế (nhận thông số báo cáo từ Lái tàu qua UC-17) và bấm "Lưu"
19a4. Backend nhận dữ liệu, gọi API PATCH /trip/:id/departure-delay hoặc PATCH /trip/:id/arrival-delay để ghi nhận số phút delay vào thực thể Trip tương ứng
19a5. Hệ thống quét tất cả vé tàu (Ticket có trạng thái PAID) thuộc chuyến đi này để lấy danh sách email khách hàng
19a6. Hệ thống phối hợp với Email Service tự động gửi thư cảnh báo trễ giờ khởi hành hoặc giờ cập bến mới tới toàn bộ hành khách bị ảnh hưởng
19a7. Hệ thống thông báo: "Cập nhật delay và gửi email cảnh báo hành khách thành công!"

19b. Giám sát vị trí GPS tàu chạy thời gian thực trên bản đồ GIS
19b1. Admin chọn menu "Giám sát bản đồ chạy tàu"
19b2. Hệ thống gọi API truy vấn toàn bộ các chuyến tàu đang hoạt động có trạng thái là IN_PROGRESS
19b3. Với mỗi chuyến tàu IN_PROGRESS, hệ thống gọi API GET /trip/:id/live-location để Backend tự động tính toán tọa độ GPS thực tế
19b4. Hệ thống quét danh sách các ga, tọa độ và khoảng cách thời gian giữa các ga thuộc Tuyến lộ trình của chuyến đi
19b5. Hệ thống dựa vào thời gian thực tế đã trôi qua kể từ lúc khởi hành, kết hợp với số phút delay (departureDelayMinutes) để tính toán tỷ lệ quãng đường tàu đã đi qua, từ đó thực hiện thuật toán nội suy địa lý để tính ra tọa độ (Vĩ độ, Kinh độ) hiện thời của tàu
19b6. Hệ thống render bản đồ MapLibre, vẽ các đường ray (LineString GeoJSON), đánh dấu các nhà ga (Station Marker) và hiển thị các Icon Tàu đang chạy di chuyển thời gian thực tại các tọa độ vừa tính toán
19b7. Hệ thống tự động làm mới tọa độ và cập nhật vị trí tàu trên bản đồ mỗi 30 giây
19b8. Admin có thể click vào Icon Tàu để xem popup thông tin nhanh: Mã chuyến, Tên Tàu chạy, Tuyến lộ trình, Trạng thái, và số phút Delay

19c. Sửa đổi hoặc Hủy/Xóa chuyến tàu
19c1. Admin có thể chọn sửa đổi lịch trình của một chuyến tàu (Trip.status = SCHEDULED) khi chưa xuất phát
19c2. Khi chuyến tàu chưa chạy và có nhu cầu hủy chuyến (ví dụ: bão lũ, sự cố ray):
- Admin chọn lệnh "Hủy chuyến".
- Hệ thống cập nhật trạng thái chuyến thành CANCELLED.
- Hệ thống tự động kích hoạt luồng hoàn tiền 100% về ví điện tử cho toàn bộ khách hàng đã mua vé và gửi email thông báo hủy chuyến tự động (tương tự luồng khẩn cấp của Lái tàu UC-15).
19c3. Admin chỉ được xóa hoàn toàn bản ghi Trip khỏi CSDL nếu chuyến đi chưa bán bất kỳ chiếc vé nào

Exception Flow
6a. Trùng lịch trình tàu
6a1. Hệ thống hiển thị thông báo lỗi: "Tàu được chọn đang bận chạy trong khoảng thời gian này. Vui lòng chọn thời gian khác hoặc tàu khác"
Use Case quay lại bước 4

6b. Thời gian kết thúc không hợp lệ
6b1. Hệ thống hiển thị thông báo lỗi: "Thời gian kết thúc phải muộn hơn thời gian khởi hành"
Use Case quay lại bước 4

Business Rules
BR-01: Hệ thống chặn hoàn toàn không cho phép lập lịch chuyến tàu bị trùng thời gian hoạt động của cùng một đầu tàu vật lý (Tránh xung đột tài nguyên vật lý)
BR-02: Trạng thái của Chuyến tàu (Trip.status) được luân chuyển hoàn toàn tự động thông qua Cron Job:
- SCHEDULED -> IN_PROGRESS: Khi thời gian thực tế chạm vào giờ khởi hành dự kiến.
- IN_PROGRESS -> COMPLETED: Khi thời gian thực tế chạm giờ kết thúc dự kiến (sau khi đã cộng bù số phút delay nếu có).
BR-03: Thuật toán nội suy GPS giả lập vị trí tàu di chuyển thời gian thực dựa trên tỷ lệ phần trăm thời gian trôi qua so với tổng thời gian chặng, cộng trừ thời gian delay và chiếu tuyến tính lên đường ray địa lý GeoJSON

Non-Functional Requirement
NFR-01: Thời gian Backend tính toán và trả về tọa độ GPS thời gian thực của tàu thông qua API phải dưới 1 giây
NFR-02: Bản đồ số phải tự động đồng bộ hóa trạng thái di chuyển của toàn bộ các tàu đang chạy mỗi 30 giây mà không cần Admin phải tải lại trang
NFR-03: Đảm bảo hệ thống Cron Job hoạt động chính xác với sai số dưới 15 giây để luân chuyển trạng thái chuyến tàu đúng giờ khởi hành
