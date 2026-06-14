# Hình 2.1: Biểu đồ Use Case tổng quát hệ thống

## Mô Tả
Biểu đồ này thể hiện tổng quan toàn bộ hệ thống với tất cả các tác nhân chính và 20 use case khái quát nhất. 

### Phân cấp Tác nhân (Actor Generalization)
Để chuẩn hóa mô hình phân tích thiết kế hệ thống theo quy chuẩn học thuật:
- **Tác nhân Khách vãng lai (Guest):** Đại diện cho người dùng chưa đăng nhập hệ thống. Họ chỉ có quyền thực hiện các thao tác cơ bản như tìm kiếm chuyến tàu, xem vị trí tàu chạy, chat với chatbot hỗ trợ, và thực hiện đăng ký/đăng nhập.
- **Tác nhân Hành khách (Customer / Member):** Kế thừa tất cả các chức năng từ Khách vãng lai (`Customer --|> Guest`), đồng thời có thêm quyền thực hiện các thao tác bảo mật và giao dịch tài chính như đặt vé, xem lịch sử đặt vé, quản lý hồ sơ cá nhân và quản lý ví điện tử của riêng mình.
- **Tác nhân Quản Trị Viên (Admin) và Lái Tàu (Driver):** Cùng kế thừa từ Hành khách (`Admin --|> Customer` và `Driver --|> Customer`) để có quyền thực hiện mọi thao tác của một hành khách đăng nhập (ví dụ: đổi mật khẩu, đặt vé, quản lý ví cá nhân), kết hợp thêm các chức năng đặc thù phục vụ công tác quản lý và vận hành thực tế.

*Lưu ý học thuật:* Để đảm bảo biểu đồ tổng quát được tinh gọn, tập trung và đúng chuẩn Phân tích Thiết kế của môn học, các hệ thống bên ngoài (Tác nhân phụ / Secondary Actors như cổng thanh toán, dịch vụ email, AI server) không được đưa vào sơ đồ tổng quát này mà sẽ được mô tả chi tiết trong tài liệu đặc tả và các sơ đồ phân rã phân hệ.

---

## Biểu Đồ Use Case Tổng Quát

```mermaid
graph TB
    subgraph "Hệ Thống Đặt Vé Tàu Hỏa (Railway Booking System)"
        subgraph "Phân Hệ Khách Hàng (Customer Portal)"
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
        
        subgraph "Phân Hệ Quản Trị (Admin Portal)"
            UC11[UC-11: Xem dashboard và báo cáo]
            UC12[UC-12: Quản lý người dùng]
            UC13[UC-13: Quản lý trạng thái ghế]
            UC14[UC-14: Quản lý tàu và toa xe]
            UC19[UC-19: Quản lý chuyến tàu]
            UC20[UC-20: Quản lý cơ sở hạ tầng]
        end
        
        subgraph "Phân Hệ Lái Tàu (Driver Portal)"
            UC15[UC-15: Yêu cầu hủy chuyến khẩn cấp]
            UC16[UC-16: Xem chuyến được phân công]
            UC17[UC-17: Báo cáo delay]
            UC18[UC-18: Báo cáo ghế hỏng]
        end
    end
    
    Guest((Khách vãng lai))
    Customer((Hành khách))
    Admin((Quản Trị Viên))
    Driver((Lái Tàu))
    
    %% Inheritance among Actors
    Customer --|> Guest
    Admin --|> Customer
    Driver --|> Customer
    
    %% Guest connections
    Guest --> UC01
    Guest --> UC02
    Guest --> UC05
    Guest --> UC06
    Guest --> UC07
    
    %% Customer connections
    Customer --> UC03
    Customer --> UC04
    Customer --> UC08
    Customer --> UC09
    Customer --> UC10
    
    %% Admin connections
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    Admin --> UC19
    Admin --> UC20
    
    %% Driver connections
    Driver --> UC15
    Driver --> UC16
    Driver --> UC17
    Driver --> UC18
    
    classDef customerUC fill:#ffffff,stroke:#000000,stroke-width:1.5px
    classDef adminUC fill:#ffffff,stroke:#000000,stroke-width:1.5px
    classDef driverUC fill:#ffffff,stroke:#000000,stroke-width:1.5px
    
    class UC01,UC02,UC03,UC04,UC05,UC06,UC07,UC08,UC09,UC10 customerUC
    class UC11,UC12,UC13,UC14,UC19,UC20 adminUC
    class UC15,UC16,UC17,UC18 driverUC
```

---

## Chú Thích

### Ký Hiệu Sơ Đồ
- **Tác nhân (Actor - Hình người vẽ tròn)**: Người dùng thực tế tương tác trực tiếp với hệ thống.
- **Use Case (Hình ellipse/oval)**: Một chức năng/nghiệp vụ hoàn chỉnh mà tác nhân có thể thực hiện để đạt được mục tiêu cụ thể.
- **Quan hệ kế thừa (Generalization - Nét liền có mũi tên rỗng chỉ về cha)**: Tác nhân con kế thừa toàn bộ quyền thực thi Use Case của tác nhân cha.
- **Quan hệ liên kết (Association - Nét liền không có đầu mũi tên)**: Kết nối trực tiếp giữa tác nhân thực hiện và Use Case tương ứng mà họ có quyền truy cập.

### Danh Sách Tác Nhân Hệ Thống
1. **Khách vãng lai (Guest)**: Người dùng chưa xác thực thông tin. Họ có quyền truy cập các tính năng cơ bản, không bảo mật.
2. **Hành khách (Customer)**: Người dùng đã đăng ký tài khoản và đăng nhập thành công. Kế thừa toàn bộ khả năng của Khách vãng lai, đồng thời có quyền thực hiện các nghiệp vụ nâng cao (ví dụ: ví tiền, đặt vé tàu, quản lý hồ sơ).
3. **Quản Trị Viên (Admin)**: Người quản lý hệ thống, điều phối và thiết lập cơ sở hạ tầng, kế thừa từ Hành khách.
4. **Lái Tàu (Driver)**: Nhân sự điều khiển tàu chạy thực tế, báo cáo thông số chuyến đi, kế thừa từ Hành khách.

### Ghi Chú Về Việc Tách Biệt Nghiệp Vụ (Khớp 100% Code dự án)
Để bám sát tuyệt đối vào kiến trúc mã nguồn NestJS hiện có của hệ thống:
- **UC-14: Quản lý tàu và toa xe** (Train & Coach Management): Chỉ tập trung vào quản lý thực thể Tàu (`Train`), Toa xe (`Coach`), và mẫu toa (`CoachTemplate`). Tương ứng với các module `/train`, `/coaches` và `/coach-template` của backend và giao diện `trains-table.tsx`.
- **UC-20: Quản lý cơ sở hạ tầng** (Infrastructure/Network Management): Quản lý các đối tượng mạng lưới gồm Ga dừng (`Station`), Tuyến đường (`Route`), và mạng lưới ray GeoJSON (`RailwayLine`). Tương ứng với các module `/station`, `/route` và `/railway-network` của backend.
- **UC-13: Quản lý trạng thái ghế** (Seat Status Management): Quản lý các vị trí ghế tĩnh và xử lý sự cố.
- **UC-19: Quản lý chuyến tàu** (Trip Management): Vận hành lịch trình các chuyến tàu chạy hàng ngày, báo delay, GPS live.
