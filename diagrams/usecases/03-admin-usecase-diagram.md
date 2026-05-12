# 3.2.2 Biểu Đồ Use Case Của Quản Trị Viên

## Mô Tả
Biểu đồ chi tiết 4 use case khái quát mà Quản Trị Viên có thể thực hiện để quản lý toàn bộ hệ thống. Quản Trị Viên được kế thừa từ Người Dùng, do đó có thể thực hiện mọi thao tác của một người dùng thông thường (Customer).

## Biểu Đồ

```mermaid
graph TB
    Admin((Quản Trị Viên))
    Customer((Người Dùng))
    
    %% Inheritance
    Admin --|> Customer
    
    subgraph "Railway Booking System - Admin Portal"
        UC11[UC-11: Xem dashboard và báo cáo]
        UC12[UC-12: Quản lý người dùng]
        UC13[UC-13: Xử lý ghế hỏng]
        UC14[UC-14: Quản lý tàu]
    end
    
    EmailService((Email Service))
    
    %% Admin connections
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    
    %% External systems
    UC13 -.-> EmailService
    
    classDef adminUC fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef externalActor fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef baseActor fill:#eceff1,stroke:#607d8b,stroke-width:2px
    
    class UC11,UC12,UC13,UC14 adminUC
    class EmailService externalActor
    class Customer baseActor
```

## Mô Tả Chi Tiết

### 1. Kế Thừa (Inheritance)
- **Quản Trị Viên (Admin) kế thừa Người Dùng (Customer)**: Quản Trị Viên có thể đăng nhập, xem hồ sơ, đổi mật khẩu, tìm kiếm chuyến tàu, đặt vé, quản lý ví... giống như một người dùng bình thường.

### 2. Admin Functions (Chức Năng Quản Trị)
- **UC-11: Xem dashboard và báo cáo**: Xem các chỉ số tổng quan của hệ thống, báo cáo doanh thu, tỷ lệ lấp đầy ghế, và thống kê các chuyến tàu phổ biến nhất.
- **UC-12: Quản lý người dùng**: Quản lý tài khoản khách hàng và lái tàu, phân quyền (USER, ADMIN, DRIVER), và thực hiện khóa/mở khóa tài khoản khi cần thiết.
- **UC-13: Xử lý ghế hỏng**: Tiếp nhận báo cáo ghế hỏng từ Lái tàu. Xác nhận khóa ghế, tìm ghế thay thế (cùng loại/giá) cho các hành khách đã đặt ghế này, và gửi email xác nhận đổi ghế cho khách.
- **UC-14: Quản lý tàu**: Đây là Use Case lớn nhất bao gồm việc vận hành lõi của hệ thống đường sắt:
  - Quản lý tàu, mẫu toa, thêm toa vào tàu.
  - Quản lý nhà ga và tuyến đường (cấu hình giá vé, khoảng cách, thời gian).
  - Quản lý mạng lưới đường ray (GeoJSON cho bản đồ).
  - Quản lý chuyến tàu (Tạo chuyến, cập nhật delay, giám sát GPS tàu chạy trên bản đồ).
  - Quản lý cấu hình giảm giá theo nhóm hành khách.
  - Quản lý (xem/lọc/hủy) toàn bộ đơn đặt vé trong hệ thống.

## Tích Hợp Hệ Thống Bên Ngoài
1. **Email Service**: Tự động gửi email thông báo cho khách hàng khi Admin tiến hành đổi ghế do sự cố ghế hỏng (UC-13), hoặc gửi thông báo khi có các thay đổi quan trọng khác liên quan đến vé của khách.

## Ghi Chú Quan Trọng
Mỗi Use Case trên đây là một chức năng cấp độ cao (High-level Use Case). Các thao tác cụ thể (Ví dụ: Thêm tàu, Xóa tàu, Cập nhật delay, Giám sát bản đồ) đều đã được mô tả như các luồng nhánh (Alternative Flows) bên trong tài liệu đặc tả của `UC-14` tại thư mục `specifications/`.
