# Hình 2.3: Biểu đồ Use Case phân rã phân hệ Quản trị viên

## Mô Tả
Biểu đồ phân rã chi tiết 6 Use Case khái quát thuộc phân quyền của **Quản Trị Viên (Admin)** để vận hành toàn bộ hệ thống. 

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
        UC20[UC-20: Quản lý cơ sở hạ tầng]
      end
    
    %% Admin connections
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    Admin --> UC19
    Admin --> UC20
    
    classDef adminUC fill:#ffffff,stroke:#000000,stroke-width:1.5px
    classDef baseActor fill:#ffffff,stroke:#000000,stroke-width:1.5px
    
    class UC11,UC12,UC13,UC14,UC19,UC20 adminUC
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

### 3. UC-13: Quản lý trạng thái ghế (Bám sát code dự án)
- **Mô tả:** Quản lý toàn diện các vị trí ghế ngồi trên tất cả các toa xe, kết hợp xử lý sự cố.
- **Nghiệp vụ chi tiết (Bám sát code thực tế):**
  - **Quản lý & Khóa ghế:** Admin truy cập cấu hình chi tiết của Toa xe (thông qua phân cấp Tàu -> Toa -> Ghế), xem trực quan sơ đồ và cập nhật thủ công trạng thái của từng ghế ngồi sang các mức `ACTIVE` (Hoạt động), `DISABLED` (Khóa tạm thời) hoặc `MAINTENANCE` (Bảo trì) thông qua API `SeatsController` (`PATCH /seats/:id`).
  - **Xử lý ghế hỏng:** Tiếp nhận các thông báo ghế hỏng được Lái tàu gửi về (`UC-18`). Xác nhận khóa ghế bị sự cố. Khi có hành khách đã mua vé trúng vào ghế hỏng này, hệ thống sẽ thực hiện thuật toán tự động tìm kiếm vị trí ghế trống tương đương trên cùng toa/chuyến để đổi vé cho họ và tự động gửi email thông báo kèm mã vé mới cho khách hàng.

### 4. UC-14: Quản lý tàu và toa xe (Bám sát `/train` và `/coaches` của Backend)
- **Mô tả:** Quản lý các cấu phần vật lý tàu và toa xe của hệ thống đường sắt Bắc - Nam.
- **Nghiệp vụ chi tiết:**
  - **Quản lý Tàu (Train):** Thêm, sửa thông tin, hoặc xóa tàu (chỉ xóa được khi tàu không có lịch chạy khả dụng).
  - **Quản lý Toa xe (Coach):** Thêm toa vào tàu, cấu hình thứ tự toa xe, chọn mẫu thiết kế toa (Coach Template) giúp hệ thống tự động sinh ra số lượng ghế tương ứng (rows × cols × tiers).

### 5. UC-19: Quản lý chuyến tàu (Bám sát `/trip` của Backend)
- **Mô tả:** Quản lý lịch trình vận tải và điều phối hành trình chạy tàu hàng ngày.
- **Nghiệp vụ chi tiết (Bám sát `TripController` & `trips-table.tsx`):**
  - **Lập lịch chuyến tàu (Create/Update Trip):** Tạo mới các chuyến đi (`Trip`) bằng cách ghép nối Tàu chạy, Tuyến đường, thời gian xuất phát và kết thúc dự kiến. Hệ thống tự động kiểm tra xung đột trùng lịch của tàu.
  - **Quản lý Delay hành trình:** Cập nhật số phút trễ của tàu tại ga đi hoặc ga đến (`departureDelayMinutes`, `arrivalDelayMinutes`). Hệ thống tự động đồng bộ thời gian trễ này để nội suy tọa độ GPS thực tế của tàu và tự động gửi cảnh báo trễ giờ cho tất cả hành khách mua vé chuyến đó.
  - **Giám sát GPS tàu chạy:** Xem trực quan bản đồ số giám sát vị trí giả lập của tất cả các tàu đang chạy trên tuyến Bắc - Nam thời gian thực.

### 6. UC-20: Quản lý cơ sở hạ tầng (Bám sát `/station`, `/route`, `/railway-network` của Backend)
- **Mô tả:** Quản lý các đối tượng cơ sở hạ tầng mạng lưới tuyến đường sắt.
- **Nghiệp vụ chi tiết:**
  - **Quản lý Ga (Station):** Thiết lập thông tin danh sách nhà ga dừng đỗ (Mã ga, Tên ga, Kinh độ, vĩ độ GIS GeoJSON).
  - **Quản lý Tuyến đường (Route):** Thiết lập lộ trình tuyến chạy kết nối các ga dừng đỗ, cấu hình hệ số khoảng cách (km) và thời gian dự kiến (phút) giữa các ga để làm căn cứ tính giá vé tự động.
  - **Quản lý Mạng lưới (Railway Line):** Thiết lập dữ liệu đường ray vật lý (tệp GeoJSON định dạng LineString) hiển thị trực quan mạng lưới liên kết ga trên bản đồ số.
