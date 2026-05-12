# Biểu Đồ Tuần Tự (Sequence Diagrams) - 18 Use Cases

Tài liệu này cung cấp biểu đồ tuần tự theo chuẩn **Best Practice** cho 18 Use Cases. Các biểu đồ tập trung vào luồng giao tiếp cốt lõi (Happy Path) giữa các service và các rẽ nhánh nghiệp vụ quan trọng nhất, lược bỏ các logic validation nội bộ để đảm bảo tính dễ đọc khi đưa vào báo cáo.

---

## 1. Khách Hàng (Customer)

### UC-01: Đăng ký tài khoản
```mermaid
sequenceDiagram
    actor User as Khách Hàng
    participant FE as Frontend
    participant API as Backend
    participant DB as Database
    participant Email as Email Service
    
    User->>FE: Gửi thông tin đăng ký
    FE->>API: POST /auth/register
    API->>DB: Kiểm tra email tồn tại
    alt Email hợp lệ & Chưa tồn tại
        API->>DB: Lưu User (UNVERIFIED) & Khởi tạo Wallet
        API->>Email: Gửi link/OTP xác thực email
        API-->>FE: 201 Created
        FE-->>User: Yêu cầu kiểm tra email
    else Email đã tồn tại
        API-->>FE: 409 Conflict
        FE-->>User: Báo lỗi email đã sử dụng
    end
```

### UC-02: Đăng nhập hệ thống
```mermaid
sequenceDiagram
    actor User as Khách Hàng
    participant FE as Frontend
    participant API as Backend
    participant DB as Database
    
    User->>FE: Chọn Đăng nhập (Email hoặc Google)
    FE->>API: POST /auth/login (hoặc OAuth)
    API->>DB: Xác thực thông tin User
    alt Hợp lệ & Không bị khóa
        API->>API: Generate Access/Refresh JWT
        API-->>FE: 200 OK (Tokens)
        FE-->>User: Đăng nhập thành công, vào Trang chủ
    else Sai thông tin / Bị khóa
        API-->>FE: 401 Unauthorized / 403 Forbidden
        FE-->>User: Báo lỗi tương ứng
    end
```

### UC-03: Quản lý hồ sơ
```mermaid
sequenceDiagram
    actor User as Khách Hàng
    participant FE as Frontend
    participant API as Backend
    participant DB as Database
    
    User->>FE: Yêu cầu xem hồ sơ
    FE->>API: GET /users/profile
    API->>DB: Lấy dữ liệu User
    API-->>FE: Trả về dữ liệu
    FE-->>User: Hiển thị form hồ sơ
    
    User->>FE: Cập nhật thông tin
    FE->>API: PUT /users/profile
    API->>DB: Lưu thay đổi
    API-->>FE: 200 OK
    FE-->>User: Cập nhật thành công
```

### UC-04: Xác nhận đổi ghế
```mermaid
sequenceDiagram
    actor User as Khách Hàng
    participant FE as Frontend
    participant API as Backend
    participant DB as Database
    
    User->>FE: Bấm link Đổi ghế (từ email sự cố)
    FE->>API: GET /tickets/replacement-options
    API->>DB: Tìm ghế trống tương đương
    API-->>FE: Danh sách ghế đề xuất
    FE-->>User: Hiển thị các ghế khả dụng
    
    User->>FE: Chọn ghế mới & Xác nhận
    FE->>API: POST /tickets/confirm-replacement
    API->>DB: Cập nhật Ticket sang ghế mới, giải phóng ghế cũ
    API-->>FE: 200 OK
    FE-->>User: Đổi ghế thành công
```

### UC-05: Chat với Chatbot
```mermaid
sequenceDiagram
    actor User as Khách Hàng
    participant FE as Frontend
    participant API as Backend
    participant AI as AI Engine (Gemini)
    
    User->>FE: Gửi tin nhắn
    FE->>API: POST /chatbot/message
    API->>API: Lấy Context (Tuyến, Ga, Giá)
    API->>AI: Gửi Prompt (Context + Tin nhắn)
    AI-->>API: Trả về câu trả lời tự nhiên
    API-->>FE: Response Text
    FE-->>User: Hiển thị tin nhắn Chatbot
```

### UC-06: Tìm kiếm chuyến tàu
```mermaid
sequenceDiagram
    actor User as Khách Hàng
    participant FE as Frontend
    participant API as Backend
    participant DB as Database
    
    User->>FE: Nhập Ga đi, Ga đến, Ngày đi
    FE->>API: GET /trips/search
    API->>DB: Tìm Trips (SCHEDULED) & Tính ghế trống
    API-->>FE: Danh sách chuyến tàu
    FE-->>User: Hiển thị kết quả tìm kiếm
    
    User->>FE: Xem chi tiết 1 chuyến
    FE->>API: GET /trips/{id}/details
    API->>DB: Lấy cấu trúc Toa, Ghế
    API-->>FE: Chi tiết sơ đồ ghế
    FE-->>User: Hiển thị sơ đồ ghế để chọn
```

### UC-07: Xem chuyến đang chạy
```mermaid
sequenceDiagram
    actor User as Khách Hàng
    participant FE as Frontend
    participant API as Backend
    
    User->>FE: Bấm "Xem vị trí tàu"
    FE->>API: GET /trips/{id}/live-location
    API->>API: Nội suy tọa độ GPS dựa trên Thời gian & Delay
    API-->>FE: Trả về tọa độ (Lat, Lng)
    FE-->>User: Cập nhật vị trí tàu trên bản đồ
```

### UC-08: Quản lý ví điện tử
```mermaid
sequenceDiagram
    actor User as Khách Hàng
    participant FE as Frontend
    participant API as Backend
    participant DB as Database
    participant VNPay as VNPay Gateway
    
    %% Nạp tiền
    alt Nạp tiền
        User->>FE: Nhập số tiền nạp
        FE->>API: POST /wallet/deposit
        API->>VNPay: Tạo URL thanh toán
        API-->>FE: Payment URL
        FE->>VNPay: Redirect
        User->>VNPay: Thanh toán
        VNPay->>API: Webhook: Nạp tiền thành công
        API->>DB: Cộng tiền vào Wallet
    end
    
    %% Rút tiền
    alt Rút tiền
        User->>FE: Nhập STK, Số tiền, Mã PIN
        FE->>API: POST /wallet/withdraw
        API->>DB: Xác thực PIN & Kiểm tra số dư
        alt PIN đúng & Đủ số dư
            API->>DB: Trừ tiền (tạm giữ), tạo Yêu cầu Rút tiền
            API-->>FE: Gửi yêu cầu thành công
            FE-->>User: Chờ Admin duyệt
        else Sai PIN / Thiếu số dư
            API-->>FE: 400 Bad Request
            FE-->>User: Báo lỗi
        end
    end
```

### UC-09: Đặt vé tàu
```mermaid
sequenceDiagram
    actor User as Khách Hàng
    participant FE as Frontend
    participant API as Backend
    participant DB as Database
    participant VNPay as VNPay Gateway
    participant Email as Email Service
    
    User->>FE: Chọn ghế, nhập thông tin hành khách & Đặt vé
    FE->>API: POST /bookings
    API->>DB: Giữ ghế tạm thời (Lock) & Tạo Booking PENDING
    alt Lock ghế thất bại (Race condition)
        API-->>FE: 409 Conflict
        FE-->>User: Báo ghế đã bị đặt, vui lòng chọn lại
    else Lock thành công
        API->>VNPay: Tạo URL thanh toán
        API-->>FE: Payment URL
        FE->>VNPay: Redirect
        
        alt Thanh toán thành công (Webhook)
            User->>VNPay: Thanh toán
            VNPay->>API: Webhook (Success)
            API->>DB: Đổi trạng thái Booking (PAID), Chốt ghế (BOOKED)
            API->>Email: Gửi vé điện tử (PDF/QR)
        else Timeout (10 phút không thanh toán)
            DB->>API: Job Hủy Booking hết hạn
            API->>DB: Hủy Booking, Nhả ghế trống
        end
    end
```

### UC-10: Xem lịch sử đặt vé
```mermaid
sequenceDiagram
    actor User as Khách Hàng
    participant FE as Frontend
    participant API as Backend
    participant DB as Database
    
    User->>FE: Vào Lịch sử đặt vé
    FE->>API: GET /bookings/history
    API->>DB: Lấy danh sách Bookings
    API-->>FE: 200 OK
    FE-->>User: Hiển thị danh sách vé
    
    User->>FE: Chọn Tải vé PDF
    FE->>API: GET /bookings/{id}/ticket-pdf
    API->>API: Generate PDF & QR Code
    API-->>FE: File Blob
    FE-->>User: Tải file xuống
```

---

## 2. Quản Trị Viên (Admin)

### UC-11: Xem dashboard và báo cáo
```mermaid
sequenceDiagram
    actor Admin as Quản Trị Viên
    participant FE as Admin Portal
    participant API as Backend
    participant DB as Database
    
    Admin->>FE: Xem thống kê tháng
    FE->>API: GET /analytics/revenue
    API->>DB: Aggregate Data (Doanh thu, Lượt vé)
    API-->>FE: 200 OK
    FE-->>Admin: Render Biểu đồ
```

### UC-12: Quản lý người dùng
```mermaid
sequenceDiagram
    actor Admin as Quản Trị Viên
    participant FE as Admin Portal
    participant API as Backend
    participant DB as Database
    
    Admin->>FE: Xem danh sách Users
    FE->>API: GET /admin/users
    API-->>FE: 200 OK (Danh sách Users)
    
    Admin->>FE: Bấm Khóa/Mở khóa User
    FE->>API: PATCH /admin/users/{id}/ban
    API->>DB: Cập nhật isBanned
    API-->>FE: 200 OK
    FE-->>Admin: Thực hiện thành công
```

### UC-13: Xử lý ghế hỏng
```mermaid
sequenceDiagram
    actor Admin as Quản Trị Viên
    participant FE as Admin Portal
    participant API as Backend
    participant DB as Database
    participant Email as Email Service
    
    Admin->>FE: Bấm Xử lý ghế hỏng
    FE->>API: POST /admin/seat-issues/{id}/resolve
    API->>DB: Vô hiệu hóa ghế (DISABLED)
    API->>DB: Lấy danh sách vé đã đặt vào ghế này
    API->>Email: Gửi thông báo sự cố & Link tự đổi ghế (UC-04)
    API-->>FE: 200 OK
    FE-->>Admin: Xử lý thành công
```

### UC-14: Quản lý tàu
```mermaid
sequenceDiagram
    actor Admin as Quản Trị Viên
    participant FE as Admin Portal
    participant API as Backend
    participant DB as Database
    
    Admin->>FE: Tạo/Cập nhật Chuyến tàu
    FE->>API: POST/PUT /admin/trips
    API->>DB: Kiểm tra trùng lặp lịch trình (Conflict)
    alt Hợp lệ
        API->>DB: Lưu Chuyến tàu
        API-->>FE: 200/201 Success
    else Trùng lặp
        API-->>FE: 409 Conflict
    end
```

---

## 3. Lái Tàu (Driver)

### UC-15: Yêu cầu hủy chuyến khẩn cấp
```mermaid
sequenceDiagram
    actor Driver as Lái Tàu
    participant FE as Driver Portal
    participant API as Backend
    participant DB as Database
    participant Email as Email Service
    
    Driver->>FE: Báo cáo Hủy chuyến khẩn cấp
    FE->>API: POST /driver/trips/{id}/cancel
    API->>DB: Hủy chuyến, Hủy tất cả vé
    API->>DB: Hoàn tiền (Refund) tự động vào Ví người dùng
    API->>Email: Gửi email xin lỗi & thông báo hoàn tiền
    API-->>FE: 200 OK
    FE-->>Driver: Hủy thành công
```

### UC-16: Xem chuyến được phân công
```mermaid
sequenceDiagram
    actor Driver as Lái Tàu
    participant FE as Driver Portal
    participant API as Backend
    
    Driver->>FE: Xem lịch trình
    FE->>API: GET /driver/my-trips
    API-->>FE: Danh sách chuyến phân công
    FE-->>Driver: Hiển thị lịch chạy tàu
```

### UC-17: Báo cáo delay
```mermaid
sequenceDiagram
    actor Driver as Lái Tàu
    participant FE as Driver Portal
    participant API as Backend
    participant DB as Database
    
    Driver->>FE: Cập nhật Delay (số phút)
    FE->>API: POST /driver/trips/{id}/delay
    API->>DB: Lưu thời gian trễ
    API-->>FE: 200 OK
    Note right of API: Hệ thống sẽ tự động cập nhật<br/>vị trí GPS dựa trên độ trễ
```

### UC-18: Báo cáo ghế hỏng
```mermaid
sequenceDiagram
    actor Driver as Lái Tàu
    participant FE as Driver Portal
    participant API as Backend
    participant DB as Database
    
    Driver->>FE: Báo sự cố ghế (Kèm ảnh chụp)
    FE->>API: POST /driver/seat-issues
    API->>DB: Lưu Yêu cầu (PENDING)
    API-->>FE: 201 Created
    FE-->>Driver: Báo cáo đã gửi cho Admin xử lý
```

---

## 4. Hệ Thống Tự Động (Cron Job)

Luồng xử lý tự động vòng đời chuyến tàu.

```mermaid
sequenceDiagram
    participant Cron as Cron Job
    participant API as Backend
    participant DB as Database
    
    loop Mỗi 1 phút
        Cron->>API: Kích hoạt Trigger Check Trips
        
        %% Chuyển trạng thái
        API->>DB: Cập nhật Trip SCHEDULED -> IN_PROGRESS (Nếu đến giờ chạy)
        API->>DB: Cập nhật Trip IN_PROGRESS -> COMPLETED (Nếu đã tới đích)
    end
```
