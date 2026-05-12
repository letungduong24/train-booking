# Biểu Đồ Hoạt Động (Activity Diagrams) - 18 Use Cases

Tài liệu này cung cấp các biểu đồ hoạt động (Activity Diagrams) sử dụng cú pháp `flowchart TD` của Mermaid để mô tả luồng thực thi nghiệp vụ chi tiết của 18 Use Cases trong hệ thống Railway Booking System.
Các biểu đồ này được ánh xạ trực tiếp từ Biểu Đồ Tuần Tự (Sequence Diagrams), Use Cases, và mô hình dữ liệu (Prisma Schema).

---

## 1. Khách Hàng (Customer)

### UC-01: Đăng ký tài khoản
```mermaid
flowchart TD
    Start([Bắt đầu]) --> Input[Nhập Email, Mật khẩu, Họ tên]
    Input --> Submit[Gửi yêu cầu đăng ký]
    Submit --> CheckEmail{Email đã tồn tại?}
    
    CheckEmail -- Có --> ShowError["Hiển thị lỗi 'Email đã sử dụng'"]
    ShowError --> Input
    
    CheckEmail -- Không --> SaveUser[Lưu User trạng thái UNVERIFIED]
    SaveUser --> InitWallet["Khởi tạo Ví điện tử (Balance = 0)"]
    InitWallet --> SendEmail[Gửi Email chứa Link/OTP xác thực]
    SendEmail --> NotifyCheck[Thông báo người dùng kiểm tra Email]
    NotifyCheck --> End([Kết thúc])
```

### UC-02: Đăng nhập hệ thống
```mermaid
flowchart TD
    Start([Bắt đầu]) --> ChooseMethod{Chọn phương thức}
    ChooseMethod -- Google OAuth --> GoogleLogin[Xác thực qua Google]
    ChooseMethod -- Email/Mật khẩu --> InputCreds[Nhập Email và Mật khẩu]
    InputCreds --> Submit[Gửi yêu cầu đăng nhập]
    
    Submit --> VerifyCreds{Thông tin hợp lệ?}
    GoogleLogin --> CheckLock
    
    VerifyCreds -- Không --> ShowError[Báo lỗi sai thông tin]
    ShowError --> ChooseMethod
    
    VerifyCreds -- Có --> CheckLock{Tài khoản bị khóa?}
    CheckLock -- Có --> ShowBanError[Báo lỗi tài khoản bị khóa] --> End([Kết thúc])
    CheckLock -- Không --> GenerateTokens[Tạo Access & Refresh JWT]
    GenerateTokens --> Success[Đăng nhập thành công, chuyển đến Trang chủ]
    Success --> End
```

### UC-03: Quản lý hồ sơ
```mermaid
flowchart TD
    Start([Bắt đầu]) --> RequestProfile[Yêu cầu xem hồ sơ]
    RequestProfile --> FetchData[Hệ thống lấy dữ liệu User từ DB]
    FetchData --> ShowForm[Hiển thị form hồ sơ]
    ShowForm --> EditData[Người dùng chỉnh sửa thông tin]
    EditData --> Submit[Gửi yêu cầu cập nhật]
    Submit --> UpdateDB[Lưu thay đổi vào Database]
    UpdateDB --> Success[Thông báo cập nhật thành công]
    Success --> End([Kết thúc])
```

### UC-04: Xác nhận đổi ghế (khi ghế bị hỏng)
```mermaid
flowchart TD
    Start([Bắt đầu]) --> ClickLink[Bấm link Đổi ghế từ email sự cố]
    ClickLink --> FindSeats[Hệ thống tìm ghế trống tương đương trên cùng chuyến]
    FindSeats --> ShowOptions[Hiển thị danh sách ghế khả dụng]
    ShowOptions --> SelectSeat[Người dùng chọn ghế mới]
    SelectSeat --> Confirm[Xác nhận đổi ghế]
    Confirm --> UpdateTicket[Hệ thống cập nhật Ticket sang ghế mới]
    UpdateTicket --> ReleaseOldSeat[Giải phóng ghế cũ bị hỏng]
    ReleaseOldSeat --> Success[Thông báo đổi ghế thành công]
    Success --> End([Kết thúc])
```

### UC-05: Chat với Chatbot
```mermaid
flowchart TD
    Start([Bắt đầu]) --> InputMsg[Người dùng nhập tin nhắn]
    InputMsg --> SendMsg[Gửi tin nhắn lên Backend]
    SendMsg --> GetContext["Hệ thống lấy Context: Tuyến, Ga, Giá"]
    GetContext --> SendToAI[Gửi Prompt gồm Context + Tin nhắn tới Gemini AI]
    SendToAI --> ReceiveAI[Nhận câu trả lời từ AI]
    ReceiveAI --> ReturnFE[Trả nội dung về Frontend]
    ReturnFE --> ShowMsg[Hiển thị tin nhắn của Chatbot]
    ShowMsg --> End([Kết thúc])
```

### UC-06: Tìm kiếm chuyến tàu
```mermaid
flowchart TD
    Start([Bắt đầu]) --> InputSearch[Nhập Ga đi, Ga đến, Ngày đi]
    InputSearch --> Submit[Bấm Tìm kiếm]
    Submit --> FindTrips[Hệ thống tìm các chuyến SCHEDULED phù hợp]
    FindTrips --> CalcSeats[Tính toán số lượng ghế trống]
    CalcSeats --> ShowResults[Hiển thị danh sách chuyến tàu]
    
    ShowResults --> ChooseTrip[Người dùng chọn Xem chi tiết 1 chuyến]
    ChooseTrip --> FetchCoach[Hệ thống lấy thông tin Toa và Ghế]
    FetchCoach --> ShowLayout[Hiển thị sơ đồ ghế]
    ShowLayout --> End([Kết thúc])
```

### UC-07: Xem chuyến đang chạy
```mermaid
flowchart TD
    Start([Bắt đầu]) --> ClickMap[Bấm 'Xem vị trí tàu' trên chuyến IN_PROGRESS]
    ClickMap --> RequestGPS[Yêu cầu lấy vị trí hiện tại]
    RequestGPS --> CalcLocation[Backend nội suy tọa độ dựa trên Thời gian thực & Delay]
    CalcLocation --> ReturnGPS[Trả về tọa độ Lat, Lng]
    ReturnGPS --> UpdateMap[Frontend cập nhật vị trí tàu trên bản đồ]
    UpdateMap --> End([Kết thúc])
```

### UC-08: Quản lý ví điện tử
```mermaid
flowchart TD
    Start([Bắt đầu]) --> ChooseAction{Chọn hành động}
    
    %% Nạp tiền
    ChooseAction -- Nạp tiền --> InputDeposit[Nhập số tiền cần nạp]
    InputDeposit --> CreatePayment[Backend tạo Payment URL qua VNPay]
    CreatePayment --> RedirectVNPay[Chuyển hướng sang VNPay]
    RedirectVNPay --> Pay[Thanh toán trên VNPay]
    Pay --> Webhook[VNPay Webhook trả kết quả]
    Webhook --> AddBalance[Cộng tiền vào Ví điện tử]
    AddBalance --> EndDeposit([Kết thúc nạp tiền])
    
    %% Rút tiền
    ChooseAction -- Rút tiền --> InputWithdraw[Nhập Số tài khoản, Số tiền, Mã PIN]
    InputWithdraw --> VerifyWithdraw{Xác thực PIN & Số dư?}
    VerifyWithdraw -- Sai/Không đủ --> ErrorWithdraw[Báo lỗi] --> InputWithdraw
    VerifyWithdraw -- Hợp lệ --> HoldMoney[Trừ tiền khỏi Ví tạm giữ]
    HoldMoney --> CreateRequest[Tạo yêu cầu Rút tiền PENDING]
    CreateRequest --> WaitAdmin[Chờ Admin duyệt]
    WaitAdmin --> EndWithdraw([Kết thúc rút tiền])
```

### UC-09: Đặt vé tàu
```mermaid
flowchart TD
    Start([Bắt đầu]) --> SelectSeat[Chọn ghế trống]
    SelectSeat --> InputPassenger[Nhập thông tin hành khách]
    InputPassenger --> SubmitBooking[Xác nhận đặt vé]
    
    SubmitBooking --> TryLock[Hệ thống cố gắng Lock ghế tạm thời]
    TryLock --> CheckLock{Lock thành công?}
    
    CheckLock -- Không --> ConflictError["Lỗi: Ghế đã có người đặt"]
    ConflictError --> SelectSeat
    
    CheckLock -- Có --> CreateBooking[Tạo Booking trạng thái PENDING]
    CreateBooking --> GeneratePayment[Tạo Payment URL VNPay]
    GeneratePayment --> Redirect[Redirect sang VNPay]
    
    Redirect --> WaitPayment{Trạng thái thanh toán}
    WaitPayment -- Timeout 10 phút --> CancelBooking[Cronjob Hủy Booking, Nhả ghế] --> End([Hủy bỏ])
    WaitPayment -- Thanh toán VNPay --> Webhook[Webhook VNPay trả kết quả]
    Webhook --> UpdateStatus[Đổi trạng thái Booking PAID, chốt ghế BOOKED]
    UpdateStatus --> SendETicket[Gửi vé điện tử qua Email]
    SendETicket --> Success([Thành công])
```

### UC-10: Xem lịch sử đặt vé
```mermaid
flowchart TD
    Start([Bắt đầu]) --> OpenHistory[Mở trang Lịch sử đặt vé]
    OpenHistory --> FetchBookings[Hệ thống lấy danh sách Bookings từ DB]
    FetchBookings --> ShowList[Hiển thị danh sách vé]
    ShowList --> ChooseTicket[Người dùng chọn Tải vé PDF]
    ChooseTicket --> GeneratePDF[Backend tạo file PDF và mã QR]
    GeneratePDF --> ReturnBlob[Trả về dữ liệu Blob]
    ReturnBlob --> Download[Trình duyệt tải file xuống]
    Download --> End([Kết thúc])
```

---

## 2. Quản Trị Viên (Admin)

### UC-11: Xem dashboard và báo cáo
```mermaid
flowchart TD
    Start([Bắt đầu]) --> OpenDashboard[Mở trang Dashboard]
    OpenDashboard --> FetchStats[API tổng hợp số liệu Doanh thu, Lượt vé, Lấp đầy]
    FetchStats --> ReturnStats[Trả dữ liệu về Frontend]
    ReturnStats --> RenderCharts[Render các biểu đồ thống kê]
    RenderCharts --> End([Kết thúc])
```

### UC-12: Quản lý người dùng
```mermaid
flowchart TD
    Start([Bắt đầu]) --> OpenUsers[Mở trang Quản lý Người dùng]
    OpenUsers --> FetchUsers[Lấy danh sách Users]
    FetchUsers --> SelectUser[Chọn một người dùng]
    SelectUser --> ToggleBan[Bấm Khóa / Mở khóa]
    ToggleBan --> Confirm[Xác nhận hành động]
    Confirm --> UpdateStatus[API cập nhật trạng thái isBanned]
    UpdateStatus --> NotifySuccess[Báo thành công]
    NotifySuccess --> End([Kết thúc])
```

### UC-13: Xử lý ghế hỏng
```mermaid
flowchart TD
    Start([Bắt đầu]) --> ViewIssues[Xem danh sách sự cố ghế hỏng từ Lái tàu]
    ViewIssues --> SelectIssue[Chọn 1 sự cố để Xử lý]
    SelectIssue --> ConfirmResolve[Xác nhận vô hiệu hóa ghế]
    ConfirmResolve --> DisableSeat[Cập nhật ghế thành DISABLED]
    DisableSeat --> FindTickets[Tìm các vé đã đặt vào ghế này]
    FindTickets --> CheckTickets{Có vé bị ảnh hưởng?}
    CheckTickets -- Không --> ResolveSuccess["Cập nhật trạng thái sự cố: Đã xử lý"]
    CheckTickets -- Có --> SendEmails[Gửi Email thông báo & Link tự đổi ghế cho khách hàng]
    SendEmails --> ResolveSuccess
    ResolveSuccess --> End([Kết thúc])
```

### UC-14: Quản lý tàu (Tuyến, Chuyến)
```mermaid
flowchart TD
    Start([Bắt đầu]) --> Action[Tạo hoặc Cập nhật Chuyến tàu]
    Action --> InputForm["Nhập thông tin: Tuyến, Tàu, Thời gian khởi hành"]
    InputForm --> Submit[Gửi yêu cầu]
    Submit --> CheckConflict[API kiểm tra trùng lặp lịch trình & Tàu]
    
    CheckConflict --> IsValid{Hợp lệ?}
    IsValid -- Không --> ErrorConflict["Báo lỗi: Trùng lịch hoặc Tàu đang bận"]
    ErrorConflict --> InputForm
    
    IsValid -- Có --> SaveTrip[Lưu thông tin Chuyến tàu vào Database]
    SaveTrip --> Success[Báo thành công]
    Success --> End([Kết thúc])
```

---

## 3. Lái Tàu (Driver)

### UC-15: Yêu cầu hủy chuyến khẩn cấp
```mermaid
flowchart TD
    Start([Bắt đầu]) --> OpenCancel[Mở tính năng Hủy chuyến khẩn cấp]
    OpenCancel --> InputReason[Nhập lý do hủy chuyến]
    InputReason --> Submit[Xác nhận Hủy chuyến]
    Submit --> CancelTrip[Backend cập nhật trạng thái Trip thành CANCELLED]
    CancelTrip --> CancelTickets[Hủy toàn bộ vé thuộc chuyến]
    CancelTickets --> Refund[Tự động hoàn tiền vào Ví người dùng]
    Refund --> SendEmails[Gửi Email xin lỗi và thông báo hoàn tiền]
    SendEmails --> Success[Thông báo xử lý hoàn tất]
    Success --> End([Kết thúc])
```

### UC-16: Xem chuyến được phân công
```mermaid
flowchart TD
    Start([Bắt đầu]) --> OpenSchedule[Mở màn hình Lịch trình]
    OpenSchedule --> FetchTrips[API lấy danh sách chuyến phân công cho Lái tàu]
    FetchTrips --> Filter[Lọc theo Hôm nay, Tuần này, Lịch sử]
    Filter --> DisplayTrips[Hiển thị danh sách chuyến]
    DisplayTrips --> End([Kết thúc])
```

### UC-17: Báo cáo delay
```mermaid
flowchart TD
    Start([Bắt đầu]) --> SelectTrip[Chọn chuyến tàu hiện tại]
    SelectTrip --> ClickDelay[Bấm Báo cáo Delay]
    ClickDelay --> InputTime[Nhập số phút Delay]
    InputTime --> Submit[Gửi báo cáo]
    Submit --> UpdateDB[Lưu thời gian trễ vào Trip]
    UpdateDB --> AutoGPS[Hệ thống tự động điều chỉnh tọa độ GPS dựa trên Delay]
    AutoGPS --> Success[Báo cập nhật thành công]
    Success --> End([Kết thúc])
```

### UC-18: Báo cáo ghế hỏng
```mermaid
flowchart TD
    Start([Bắt đầu]) --> SelectTrip[Chọn chuyến tàu]
    SelectTrip --> ClickIssue[Bấm Báo sự cố ghế]
    ClickIssue --> InputDetails[Nhập thông tin ghế, mô tả và tải ảnh chụp]
    InputDetails --> Submit[Gửi yêu cầu]
    Submit --> SaveIssue[Lưu Yêu cầu trạng thái PENDING vào Database]
    SaveIssue --> Success[Thông báo gửi thành công chờ Admin duyệt]
    Success --> End([Kết thúc])
```
