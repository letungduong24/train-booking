# 3.1 Biểu Đồ Use Case Tổng Quát

## Mô Tả
Biểu đồ này thể hiện tổng quan toàn bộ hệ thống với tất cả các tác nhân chính và 18 use case khái quát nhất. Các tác nhân Quản Trị Viên và Lái Tàu kế thừa từ Người Dùng (Khách Hàng) để sử dụng các chức năng cơ bản.

## Biểu Đồ

```mermaid
graph TB
    subgraph "Railway Booking System"
        subgraph "Customer Functions"
            UC01[UC-01: Đăng ký tài khoản]
            UC02[UC-02: Đăng nhập hệ thống]
            UC03[UC-03: Quản lý hồ sơ]
            UC04[UC-04: Xác nhận đổi ghế]
            UC05[UC-05: Chat với Chatbot]
            UC06[UC-06: Tìm kiếm chuyến tàu]
            UC07[UC-07: Xem chuyến đang chạy]
            UC08[UC-08: Quản lý ví điện tử]
            UC09[UC-09: Đặt vé tàu]
            UC10[UC-10: Xem lịch sử đặt vé]
        end
        
        subgraph "Admin Functions"
            UC11[UC-11: Xem dashboard và báo cáo]
            UC12[UC-12: Quản lý người dùng]
            UC13[UC-13: Xử lý ghế hỏng]
            UC14[UC-14: Quản lý tàu]
        end
        
        subgraph "Driver Functions"
            UC15[UC-15: Yêu cầu hủy chuyến khẩn cấp]
            UC16[UC-16: Xem chuyến được phân công]
            UC17[UC-17: Báo cáo delay]
            UC18[UC-18: Báo cáo ghế hỏng]
        end
    end
    
    Customer((Người Dùng))
    Admin((Quản Trị Viên))
    Driver((Lái Tàu))
    PaymentGateway((Payment Gateway))
    EmailService((Email Service))
    ChatbotAI((Chatbot AI))
    
    %% Inheritance
    Admin --|> Customer
    Driver --|> Customer
    
    %% Customer connections
    Customer --> UC01
    Customer --> UC02
    Customer --> UC03
    Customer --> UC04
    Customer --> UC05
    Customer --> UC06
    Customer --> UC07
    Customer --> UC08
    Customer --> UC09
    Customer --> UC10
    
    %% Admin connections
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    
    %% Driver connections
    Driver --> UC15
    Driver --> UC16
    Driver --> UC17
    Driver --> UC18
    
    %% External systems
    UC09 -.-> PaymentGateway
    UC08 -.-> PaymentGateway
    UC01 -.-> EmailService
    UC09 -.-> EmailService
    UC05 -.-> ChatbotAI
    UC13 -.-> EmailService
    UC15 -.-> EmailService
    
    classDef customerUC fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef adminUC fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef driverUC fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef externalActor fill:#ffebee,stroke:#b71c1c,stroke-width:2px
    
    class UC01,UC02,UC03,UC04,UC05,UC06,UC07,UC08,UC09,UC10 customerUC
    class UC11,UC12,UC13,UC14 adminUC
    class UC15,UC16,UC17,UC18 driverUC
    class PaymentGateway,EmailService,ChatbotAI externalActor
```

## Chú Thích

### Ký Hiệu
- **Hình tròn**: Tác nhân (Actor)
- **Hình chữ nhật**: Use Case
- **Đường liền với mũi tên hở** (`--|>`): Quan hệ kế thừa (Generalization). Quản Trị Viên và Lái Tàu kế thừa tất cả Use Case của Người Dùng.
- **Đường liền**: Quan hệ trực tiếp giữa Actor và Use Case
- **Đường đứt**: Quan hệ với hệ thống bên ngoài

### Màu Sắc
- **Xanh dương nhạt**: Use Case của Người Dùng (Khách Hàng)
- **Cam nhạt**: Use Case của Quản Trị Viên
- **Tím nhạt**: Use Case của Lái Tàu
- **Đỏ nhạt**: Hệ thống bên ngoài

### Tác Nhân
1. **Người Dùng (Customer)**: Người dùng cơ bản, sử dụng các tính năng tìm kiếm và đặt vé.
2. **Quản Trị Viên (Admin)**: Kế thừa từ Người Dùng, có thêm quyền quản lý toàn bộ hệ thống.
3. **Lái Tàu (Driver)**: Kế thừa từ Người Dùng, có thêm quyền báo cáo trạng thái chuyến tàu.
4. **Payment Gateway**: Xử lý thanh toán (VNPay, Momo...).
5. **Email Service**: Gửi thông báo email xác thực, đặt vé.
6. **Chatbot AI**: Hỗ trợ khách hàng tự động.

### Ghi Chú Quan Trọng
- **Sự kế thừa**: Admin và Driver có thể thực hiện mọi chức năng của Người Dùng (đăng nhập, xem hồ sơ, đặt vé, v.v.). Do đó, không cần nối lại các mũi tên từ Admin/Driver tới các Use Case của Người Dùng.
- **Các luồng chi tiết**: Mỗi Use Case tổng quát ở trên chứa nhiều luồng xử lý con (Alternative Flows) đã được mô tả chi tiết trong thư mục `specifications/`. Ví dụ, `UC-14: Quản lý tàu` bao gồm cả quản lý ga, tuyến đường, tàu, toa, v.v.
