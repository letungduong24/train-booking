Use Case ID
UC-14

Use Case Name
Quản lý tàu

Description
Là Admin, tôi muốn quản trị thông tin danh mục Tàu hỏa (Train), Toa xe (Coach) thuộc tàu và các Mẫu thiết kế toa xe (CoachTemplate) để xây dựng nên cấu trúc cấu hình vật lý cho hệ thống.

Actor(s)
Admin

Priority
Must Have

Trigger
Admin muốn thiết lập mới hoặc cập nhật thông số danh mục tàu hỏa và toa xe

Pre-Condition(s)
Admin đã đăng nhập thành công vào hệ thống với vai trò ADMIN
Thiết bị của Admin đã được kết nối internet

Post-Condition(s)
Bản ghi Tàu hỏa (Train), Toa xe (Coach) hoặc Mẫu toa (CoachTemplate) được tạo mới, chỉnh sửa, hoặc xóa thành công trong CSDL PostgreSQL
Sơ đồ ghế tĩnh (Seat) được tự động sinh ra trong database khi thêm mới Toa xe dựa trên mẫu cấu hình
Hệ thống ghi nhật ký Activity Log cho các hành động thay đổi dữ liệu của Admin

Basic Flow
1. Admin chọn menu "Quản lý tàu"
2. Hệ thống hiển thị danh sách các tàu hiện có trong hệ thống bao gồm: Mã tàu, Tên tàu, Vận tốc trung bình (km/h), Số toa, Trạng thái hoạt động, và Ngày tạo
3. Admin chọn lệnh "Thêm tàu mới"
4. Hệ thống hiển thị form điền thông tin: Mã tàu, Tên tàu, Vận tốc trung bình, và Trạng thái (ACTIVE, INACTIVE, hoặc MAINTENANCE)
5. Admin nhập dữ liệu và chọn nút "Lưu"
6. Hệ thống thực hiện kiểm tra: Mã tàu không được trùng lặp, Vận tốc trung bình phải lớn hơn 0
7. Hệ thống tạo thực thể Tàu (Train) mới trong cơ sở dữ liệu
8. Hệ thống hiển thị thông báo: "Thêm tàu thành công!"
9. Hệ thống ghi nhận hoạt động vào nhật ký (Activity Log)

Alternative Flow
14a. Sửa đổi thông tin Tàu hỏa
14a1. Admin click chọn vào 1 tàu từ danh sách để xem chi tiết
14a2. Hệ thống hiển thị trang thông tin chi tiết của tàu bao gồm: thông số kỹ thuật, danh sách các toa xe hiện có thuộc tàu này và bảng thống kê số chuyến đã thực hiện
14a3. Admin chọn lệnh "Sửa thông tin"
14a4. Hệ thống hiển thị form chỉnh sửa thông tin tàu
14a5. Admin thay đổi thông số và chọn lệnh "Lưu"
14a6. Hệ thống cập nhật bản ghi Train trong database và thông báo: "Cập nhật thông tin tàu thành công!"

14b. Xóa Tàu khỏi hệ thống
14b1. Admin click chọn nút "Xóa tàu" từ danh sách hoặc trang chi tiết
14b2. Hệ thống thực hiện kiểm tra tính toàn vẹn: Tàu muốn xóa không được có bất kỳ chuyến tàu (Trip) nào đang được lên lịch chạy (SCHEDULED hoặc IN_PROGRESS)
14b3. Hệ thống hiển thị cảnh báo xác nhận: "Bạn có chắc chắn muốn xóa tàu này? Toàn bộ toa xe và ghế liên quan cũng sẽ bị xóa bỏ."
14b4. Admin bấm "Xác nhận"
14b5. Hệ thống xóa bản ghi Train cùng các toa xe (Coach) và ghế (Seat) thuộc tàu đó khỏi CSDL
14b6. Hệ thống thông báo: "Xóa tàu thành công!"

14c. Quản lý cấu trúc Toa xe (Coach) thuộc Tàu
14c1. Tại trang chi tiết của một tàu cụ thể, Admin chọn lệnh "Thêm toa xe"
14c2. Hệ thống hiển thị form thông tin: Mã toa, Tên toa, Thứ tự toa, và Mẫu toa (Coach Template - dropdown list các mẫu toa có sẵn)
14c3. Admin chọn một mẫu toa (ví dụ: Toa ngồi mềm điều hòa 64 ghế, Toa giường nằm 28 chỗ) và nhập thông tin toa
14c4. Admin chọn lệnh "Lưu"
14c5. Hệ thống tạo bản ghi Coach mới, đồng thời tự động tính toán số hàng, số cột, số tầng từ CoachTemplate được chọn để sinh tự động tất cả các bản ghi ghế ngồi (Seat) tương ứng của toa đó trong database
14c6. Hệ thống thông báo: "Thêm toa xe và khởi tạo ghế thành công!"

14d. Quản lý Mẫu toa xe (CoachTemplate)
14d1. Admin chọn menu "Quản lý mẫu toa xe"
14d2. Hệ thống hiển thị danh sách các mẫu toa xe bao gồm: Tên mẫu, Loại toa (Ghế ngồi - SEAT / Giường nằm - BED), Số tầng, Số hàng, Số cột, Tổng số chỗ, và Hệ số nhân giá vé
14d3. Admin chọn lệnh "Tạo mẫu toa mới"
14d4. Hệ thống hiển thị form nhập thông số kỹ thuật. Admin nhập dữ liệu và bấm "Lưu"
14d5. Hệ thống tạo thực thể CoachTemplate mới làm cơ sở để tái sử dụng khi tạo toa xe

Exception Flow
6a. Mã tàu trùng lặp
6a1. Hệ thống hiển thị thông báo lỗi: "Mã tàu này đã tồn tại trong hệ thống. Vui lòng nhập mã khác"
Use Case quay lại bước 4

6b. Vận tốc trung bình nhỏ hơn hoặc bằng 0
6b1. Hệ thống hiển thị thông báo lỗi: "Vận tốc trung bình của tàu phải lớn hơn 0"
Use Case quay lại bước 4

14b2a. Tàu đang có chuyến đi được lập lịch hoạt động
14b2a1. Hệ thống hiển thị thông báo lỗi: "Không thể xóa tàu này vì đang có chuyến tàu được lên lịch hoạt động trong tương lai"
Use Case dừng lại

Business Rules
BR-01: Các mã định danh (Mã tàu, Mã toa) bắt buộc phải là duy nhất
BR-02: Ghế ngồi tĩnh được tự động sinh ra trong database khi tạo Toa xe dựa trên thông số hàng, cột, tầng của CoachTemplate được chọn. Admin không cần phải tạo thủ công từng chiếc ghế
BR-03: Không cho phép xóa một đoàn tàu đang có chuyến tàu (Trip) đã được lập lịch chạy hoạt động

Non-Functional Requirement
NFR-01: Quá trình tự động sinh hàng loạt ghế ngồi trong CSDL khi tạo Toa xe mới phải hoàn tất dưới 1.5 giây
NFR-02: Sơ đồ bố cục layout ghế và giường phải responsive, hoạt động tốt trên cả tablet và máy tính để quản trị viên dễ cấu hình
