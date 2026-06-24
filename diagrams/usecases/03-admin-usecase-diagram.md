# Hình 2.3: Biểu đồ Use Case phân rã phân hệ Quản trị viên

## Mô Tả
Biểu đồ phân rã chi tiết 8 Use Case khái quát thuộc phân quyền của **Quản Trị Viên (Admin)** để vận hành toàn bộ hệ thống.

### Kế Thừa Quyền Hạn
- **Kế thừa từ Hành khách (Customer):** Quản Trị Viên thừa kế toàn bộ quyền của Hành khách (`Admin --|> Customer`), từ đó tự động thừa kế mọi khả năng của Khách vãng lai (`Customer --|> Guest`). Điều này có nghĩa là Admin hoàn toàn có thể sử dụng các chức năng thông thường như đăng nhập, quản lý ví điện tử cá nhân, đặt vé đi du lịch, xem lịch sử và chat với chatbot mà không cần kết nối lại các mũi tên trên sơ đồ.

---

## Biểu Đồ Use Case Phân Rã Quản Trị Viên

```mermaid
graph TB
    Admin((Quản Trị Viên))
    Customer((Hành khách))
    
    %% Inheritance
    Admin --|> Customer
    
    subgraph "Railway Booking System - Admin Portal"
        UC11[UC-11: Xem dashboard và báo cáo]
        UC12[UC-12: Quản lý người dùng]
        UC13[UC-13: Quản lý trạng thái ghế]
        UC14[UC-14: Quản lý tàu và toa xe]
        UC19[UC-19: Quản lý chuyến tàu]
        UC20[UC-20: Quản lý dữ liệu mạng lưới đường sắt]
        UC21[UC-21: Xử lý sự cố ghế hỏng]
        UC22[UC-22: Xử lý báo cáo delay]
      end
    
    %% Admin connections
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    Admin --> UC19
    Admin --> UC20
    Admin --> UC21
    Admin --> UC22
    
    classDef adminUC fill:#ffffff,stroke:#000000,stroke-width:1.5px
    classDef baseActor fill:#ffffff,stroke:#000000,stroke-width:1.5px
    
    class UC11,UC12,UC13,UC14,UC19,UC20,UC21,UC22 adminUC
    class Customer baseActor
```

---

## Mô Tả Chi Tiết Nghiệp Vụ Admin

### 1. UC-11: Xem dashboard và báo cáo
- **Mô tả:** Admin giám sát các chỉ số sức khỏe của hệ thống và tình hình kinh doanh thời gian thực.
- **Nghiệp vụ chi tiết:** Xem tổng doanh thu bán vé, số lượng vé đã xuất bản, tỷ lệ lấp đầy ghế ngồi theo từng chuyến tàu và biểu đồ thống kê các ga/tuyến tàu có lượng khách đi lại đông nhất.

### 2. UC-12: Quản lý người dùng
- **Mô tả:** Quản lý cơ sở dữ liệu tài khoản trong hệ thống để bảo vệ an ninh vận hành.
- **Nghiệp vụ chi tiết:** Xem danh sách, tìm kiếm người dùng theo email/họ tên, cấp hoặc thu hồi quyền hạn tài khoản (USER, ADMIN, DRIVER), thực hiện khóa (ban) hoặc mở khóa tài khoản khi phát hiện dấu hiệu vi phạm.

### 3. UC-13: Quản lý trạng thái ghế
- **Mô tả:** Quản lý trạng thái hoạt động của các vị trí ghế trong cấu hình tàu/toa.
- **Nghiệp vụ chi tiết:** Admin truy cập cấu hình chi tiết của toa xe, xem trực quan sơ đồ ghế và cập nhật thủ công trạng thái ghế sang các mức còn hoạt động, khóa tạm thời hoặc bảo trì. Use Case này chỉ là quản trị dữ liệu ghế, không thay thế cho luồng xử lý sự cố ghế hỏng.

### 4. UC-14: Quản lý tàu và toa xe (Bám sát `/train` và `/coaches` của Backend)
- **Mô tả:** Quản lý các cấu phần vật lý tàu và toa xe của hệ thống đường sắt Bắc - Nam.
- **Nghiệp vụ chi tiết:**
  - **Quản lý Tàu (Train):** Thêm, sửa thông tin, hoặc xóa tàu (chỉ xóa được khi tàu không có lịch chạy khả dụng).
  - **Quản lý Toa xe (Coach):** Thêm toa vào tàu, cấu hình thứ tự toa xe, chọn mẫu thiết kế toa (Coach Template) giúp hệ thống tự động sinh ra số lượng ghế tương ứng (rows × cols × tiers).

### 5. UC-19: Quản lý chuyến tàu (Bám sát `/trip` của Backend)
- **Mô tả:** Quản lý lịch chạy chuyến tàu hàng ngày, gồm tạo chuyến mới, phân công lái tàu và điều chỉnh route/driver khi chuyến chưa bắt đầu.
- **Nghiệp vụ chi tiết:**
  - **Tạo chuyến tàu:** Chọn route, tàu, driver và thời gian khởi hành. Hệ thống tính `endTime` và kiểm tra trùng lịch của tàu.
  - **Cập nhật chuyến chưa chạy:** Chỉ cho sửa `routeId` và/hoặc `driverId` khi Trip còn `SCHEDULED`. Không sửa thời gian khởi hành trong UC này.
  - **Xóa chuyến:** Chỉ xóa cứng khi không vi phạm ràng buộc dữ liệu lịch sử. Delay được tách sang UC-17/UC-22.

### 6. UC-20: Quản lý dữ liệu mạng lưới đường sắt (Bám sát `/station`, `/route`, `/railway-network` của Backend)
- **Mô tả:** Quản lý dữ liệu mạng lưới tuyến đường sắt phục vụ tìm kiếm chuyến, lập lịch chuyến và hiển thị bản đồ.
- **Nghiệp vụ chi tiết:**
  - **Quản lý Ga (Station):** Thiết lập thông tin danh sách nhà ga dừng đỗ (Mã ga, Tên ga, Kinh độ, vĩ độ GIS GeoJSON).
  - **Quản lý Tuyến đường (Route):** Thiết lập lộ trình tuyến chạy kết nối các ga dừng đỗ, cấu hình hệ số khoảng cách (km) và thời gian dự kiến (phút) giữa các ga để làm căn cứ tính giá vé tự động.
  - **Quản lý Mạng lưới (Railway Line):** Thiết lập dữ liệu đường ray vật lý (tệp GeoJSON định dạng LineString) hiển thị trực quan mạng lưới liên kết ga trên bản đồ số.

### 7. UC-21: Xử lý sự cố ghế hỏng
- **Mô tả:** Admin xử lý các báo cáo ghế hỏng do lái tàu gửi về.
- **Nghiệp vụ chi tiết:** Admin xem chi tiết báo cáo ghế hỏng (`UC-18`), xác nhận hoặc từ chối báo cáo. Khi xác nhận, hệ thống khóa ghế hỏng, xác định vé bị ảnh hưởng, tìm ghế thay thế, gửi email xác nhận đổi ghế cho hành khách và hoàn tiền nếu hành khách từ chối hoặc quá hạn xác nhận.

### 8. UC-22: Xử lý báo cáo delay
- **Mô tả:** Admin xử lý các báo cáo delay do lái tàu gửi về.
- **Nghiệp vụ chi tiết:** Admin xem chi tiết báo cáo delay (`UC-17`), kiểm tra loại delay, số phút và lý do. Nếu duyệt, hệ thống cập nhật delay vào chuyến tàu; nếu từ chối, hệ thống lưu lý do từ chối để lái tàu theo dõi.
