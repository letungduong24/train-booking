# Hình 2.2: Biểu đồ Use Case phân rã phân hệ Khách hàng

## Mô Tả
Biểu đồ phân rã chi tiết các Use Case thuộc phân hệ Khách hàng. Để đảm bảo tính chuẩn xác trong phân tích hệ thống và giải quyết vấn đề đăng nhập, phân hệ được phân tách thành hai tác nhân:
1. **Khách vãng lai (Guest):** Người dùng chưa đăng nhập. Họ có thể thực hiện tìm kiếm, xem live GPS của tàu, trò chuyện với chatbot, đăng ký tài khoản mới và đăng nhập.
2. **Hành khách (Customer):** Người dùng đã đăng nhập thành công. Họ kế thừa (Generalization) toàn bộ khả năng của Khách vãng lai, đồng thời có quyền thao tác trên các tính năng yêu cầu bảo mật tài khoản cao (Đặt vé, ví tiền, đổi ghế, xem lịch sử).

---

## Biểu Đồ Use Case Phân Rã Khách Hàng

```mermaid
graph TB
    Guest((Khách vãng lai))
    Customer((Hành khách))
    
    %% Inheritance
    Customer --|> Guest
    
    subgraph "Railway Booking System - Customer Portal"
        subgraph "Authentication & Profile (Xác thực & Hồ sơ)"
            UC01[UC-01: Đăng ký tài khoản]
            UC02[UC-02: Đăng nhập hệ thống]
            UC03[UC-03: Quản lý hồ sơ]
        end
        
        subgraph "Trip Search & Booking (Tìm kiếm & Đặt vé)"
            UC06[UC-06: Tìm kiếm chuyến tàu]
            UC09[UC-09: Đặt vé tàu]
            UC10[UC-10: Xem lịch sử đặt vé]
            UC07[UC-07: Xem chuyến đang chạy]
        end
        
        subgraph "Wallet Management (Quản lý Ví)"
            UC08[UC-08: Quản lý ví điện tử]
        end
        
        subgraph "Support (Hỗ trợ)"
            UC05[UC-05: Chat với Chatbot]
            UC04[UC-04: Xác nhận đổi ghế]
        end
    end
    
    PaymentGateway((Payment Gateway))
    EmailService((Email Service))
    ChatbotAI((Chatbot AI))
    
    %% Guest to Use Cases
    Guest --> UC01
    Guest --> UC02
    Guest --> UC05
    Guest --> UC06
    Guest --> UC07
    
    %% Customer to Use Cases
    Customer --> UC03
    Customer --> UC04
    Customer --> UC08
    Customer --> UC09
    Customer --> UC10
    
    %% External systems
    UC01 -.-> EmailService
    UC09 -.-> EmailService
    UC09 -.-> PaymentGateway
    UC08 -.-> PaymentGateway
    UC05 -.-> ChatbotAI
    UC04 -.-> EmailService
    
    classDef primaryUC fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef externalActor fill:#ffebee,stroke:#b71c1c,stroke-width:2px
    
    class UC01,UC02,UC03,UC04,UC05,UC06,UC07,UC08,UC09,UC10 primaryUC
    class PaymentGateway,EmailService,ChatbotAI externalActor
```

---

## Mô Tả Chi Tiết Nghiệp Vụ

### 1. Phân nhóm Xác thực & Hồ sơ (Authentication & Profile)
- **UC-01: Đăng ký tài khoản (Khách vãng lai):** Hành động thiết lập tài khoản mới bằng Email và Mật khẩu. Đòi hỏi xác thực OTP thông qua liên kết với **Email Service**.
- **UC-02: Đăng nhập hệ thống (Khách vãng lai):** Cung cấp các phương thức đăng nhập bằng tài khoản mật khẩu thường hoặc qua Google OAuth (đăng nhập nhanh). Sau khi đăng nhập thành công, Khách vãng lai sẽ được nâng cấp quyền thành **Hành khách**.
- **UC-03: Quản lý hồ sơ (Hành khách):** Cho phép xem thông tin hồ sơ cá nhân, cập nhật thông tin liên lạc và đổi mật khẩu an toàn.

### 2. Phân nhóm Tìm kiếm & Đặt vé (Trip Search & Booking)
- **UC-06: Tìm kiếm chuyến tàu (Khách vãng lai):** Tra cứu hành trình dựa vào Ga đi, Ga đến và Ngày khởi hành mong muốn. Trả về danh sách chuyến tàu khả dụng kèm thông tin số lượng ghế trống.
- **UC-07: Xem chuyến đang chạy (Khách vãng lai):** Xem vị trí địa lý thời gian thực giả lập (GPS) của các tàu đang di chuyển trên bản đồ số GIS.
- **UC-09: Đặt vé tàu (Hành khách):** Quy trình nghiệp vụ cốt lõi bao gồm chọn ghế (có cơ chế giữ ghế tạm thời), nhập thông tin hành khách tương ứng (để tự động tính giá ưu đãi cho trẻ em, sinh viên, người cao tuổi) và thanh toán hóa đơn. Kết nối với **Payment Gateway** để trừ tiền và **Email Service** để gửi vé điện tử QR code.
- **UC-10: Xem lịch sử đặt vé (Hành khách):** Xem danh sách tất cả hóa đơn đặt vé trong quá trình sử dụng hệ thống, hỗ trợ hủy vé hoàn tiền hoặc tải file PDF vé điện tử.

### 3. Phân nhóm Quản lý Ví (Wallet Management)
- **UC-08: Quản lý ví điện tử (Hành khách):** Nơi khách hàng quản lý dòng tiền nội bộ. Bao gồm xem số dư, xem lịch sử biến động số dư, nạp tiền vào ví (qua **Payment Gateway**), rút tiền về tài khoản ngân hàng và quản lý mã PIN bảo mật khi giao dịch.

### 4. Phân nhóm Hỗ trợ (Support)
- **UC-05: Chat với Chatbot (Khách vãng lai):** Giao tiếp tự nhiên với trợ lý ảo AI để nhận hỗ trợ tìm kiếm lộ trình hoặc hướng dẫn đặt vé nhanh (kết nối trực tiếp với **Chatbot AI** qua Gemini/Groq API).
- **UC-04: Xác nhận đổi ghế (Hành khách):** Khi có sự cố ghế hỏng xảy ra trên tàu, hành khách nhận được thông báo qua **Email Service** và có thể truy cập hệ thống để xác nhận đổi sang một vị trí ghế trống tương đương được hệ thống đề xuất tự động.
