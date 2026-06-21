# Biểu Đồ Hoạt Động (Activity Diagrams) - 20 Use Cases

Tài liệu này cung cấp các biểu đồ hoạt động (Activity Diagrams) sử dụng cú pháp `flowchart TD` của Mermaid để mô tả luồng nghiệp vụ chính của 20 Use Cases trong hệ thống Railway Booking System.
Các biểu đồ này được ánh xạ từ đặc tả Use Case và trạng thái triển khai hiện tại của project.

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
    SaveUser --> SendEmail[Gửi Email chứa liên kết xác thực]
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
    GoogleLogin --> SetupSession
    
    VerifyCreds -- Không --> ShowError[Báo lỗi sai thông tin]
    ShowError --> ChooseMethod
    
    VerifyCreds -- Có --> SetupSession[Thiết lập phiên đăng nhập]
    SetupSession --> Success[Đăng nhập thành công, điều hướng theo vai trò]
    Success --> End
```

### UC-03: Quản lý hồ sơ
```mermaid
flowchart TD
    Start([Bắt đầu]) --> RequestProfile[Yêu cầu xem hồ sơ]
    RequestProfile --> FetchData[Hệ thống lấy hồ sơ người dùng]
    FetchData --> ShowForm[Hiển thị form hồ sơ]
    ShowForm --> EditData[Người dùng chỉnh sửa thông tin]
    EditData --> Submit[Gửi yêu cầu cập nhật]
    Submit --> UpdateDB[Lưu thay đổi hồ sơ]
    UpdateDB --> Success[Thông báo cập nhật thành công]
    Success --> End([Kết thúc])
```

### UC-04: Xác nhận đổi ghế (khi ghế bị hỏng)
```mermaid
flowchart TD
    Start([Bắt đầu]) --> ClickLink[Bấm link Đổi ghế từ email sự cố]
    ClickLink --> FindSeats[Hệ thống tìm ghế trống tương đương trên cùng chuyến]
    FindSeats --> ShowOptions[Hiển thị danh sách ghế khả dụng]
    ShowOptions --> ChooseAction{Hành khách chọn}
    ChooseAction -- Đồng ý đổi ghế --> SelectSeat[Người dùng chọn ghế mới]
    SelectSeat --> Confirm[Xác nhận đổi ghế]
    Confirm --> UpdateTicket[Hệ thống cập nhật vé sang ghế mới]
    UpdateTicket --> Success[Thông báo đổi ghế thành công]
    ChooseAction -- Không đồng ý --> Refund[Giải phóng đoạn ghế, hủy vé bị ảnh hưởng và hoàn tiền về ví]
    Refund --> SuccessRefund[Thông báo hoàn tiền]
    SuccessRefund --> End
    Success --> End([Kết thúc])
```

### UC-05: Chat với Chatbot
```mermaid
flowchart TD
    Start([Bắt đầu]) --> InputMsg[Người dùng nhập tin nhắn]
    InputMsg --> SendMsg[Gửi tin nhắn lên Backend]
    SendMsg --> DetectIntent[Hệ thống xác định ý định câu hỏi]
    DetectIntent --> NeedTool{Cần tra cứu dữ liệu?}
    NeedTool -- Có --> FetchData[Tra cứu chuyến, vé hoặc ví phù hợp]
    NeedTool -- Không --> BuildAnswer[Chuẩn bị câu trả lời]
    FetchData --> BuildAnswer
    BuildAnswer --> ShowMsg[Hiển thị text hoặc component kết quả]
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
    WaitPayment -- Quá thời gian thanh toán --> CancelBooking[Hệ thống hủy Booking, nhả ghế] --> End([Hủy bỏ])
    WaitPayment -- Thanh toán VNPay --> Webhook[Webhook VNPay trả kết quả]
    Webhook --> UpdateStatus[Đổi Booking sang PAID, tạo Ticket và TicketSeatSegment]
    UpdateStatus --> CheckDbSeat{DB chặn trùng đoạn ghế?}
    CheckDbSeat -- Trùng --> RefundOnRace[Đánh dấu PAYMENT_FAILED và hoàn tiền nếu đã thu]
    RefundOnRace --> End
    CheckDbSeat -- Không trùng --> SendETicket[Gửi vé điện tử qua Email]
    SendETicket --> Success([Thành công])
```

### UC-10: Xem lịch sử đặt vé
```mermaid
flowchart TD
    Start([Bắt đầu]) --> OpenHistory[Mở trang Lịch sử đặt vé]
    OpenHistory --> FetchBookings[Hệ thống lấy danh sách Bookings từ DB]
    FetchBookings --> ShowList[Hiển thị danh sách vé]
    ShowList --> ChooseTicket[Người dùng chọn một booking]
    ChooseTicket --> FetchDetail[Hệ thống lấy chi tiết vé và hành khách]
    FetchDetail --> ShowDetail[Hiển thị chi tiết booking]
    ShowDetail --> End([Kết thúc])
```

---

## 2. Quản Trị Viên (Admin)

### UC-11: Xem dashboard và báo cáo
```mermaid
flowchart TD
    Start([Bắt đầu]) --> OpenDashboard[Mở trang Dashboard]
    OpenDashboard --> FetchStats[Hệ thống tổng hợp số liệu Doanh thu, Lượt vé, Lấp đầy]
    FetchStats --> RenderCharts[Hiển thị dashboard thống kê]
    RenderCharts --> End([Kết thúc])
```

### UC-12: Quản lý người dùng
```mermaid
flowchart TD
    Start([Bắt đầu]) --> OpenUsers[Mở trang Quản lý Người dùng]
    OpenUsers --> ShowScope[Hiển thị ghi chú phạm vi hiện tại]
    ShowScope --> NotImplemented[Chưa có module/trang quản lý người dùng hoàn chỉnh]
    NotImplemented --> End([Kết thúc])
```

### UC-13: Quản lý trạng thái ghế
```mermaid
flowchart TD
    Start([Bắt đầu]) --> ChooseAction{Admin chọn nghiệp vụ}
    
    %% Luồng 1: Chủ động quản lý
    ChooseAction -- Chủ động cập nhật trạng thái --> SelectTrain[Chọn Tàu & Toa xe]
    SelectTrain --> ShowLayout[Hiển thị sơ đồ ghế]
    ShowLayout --> ClickSeat[Click chọn một ghế]
    ClickSeat --> ShowDialog[Hiển thị dialog thông tin ghế]
    ShowDialog --> SelectStatus[Chọn trạng thái mới: AVAILABLE/DISABLED/MAINTENANCE]
    SelectStatus --> ClickUpdate[Bấm Cập nhật]
    ClickUpdate --> SaveDB[Hệ thống cập nhật trạng thái ghế]
    SaveDB --> ShowSuccess[Cập nhật màu sắc & thông báo thành công]
    ShowSuccess --> End([Kết thúc])
    
    %% Luồng 2: Xử lý sự cố từ Lái tàu
    ChooseAction -- Xử lý báo cáo sự cố từ Lái tàu --> ViewIssues[Xem danh sách báo cáo PENDING]
    ViewIssues --> SelectIssue[Chọn 1 sự cố để xem chi tiết]
    SelectIssue --> Decide{Quyết định của Admin}
    
    %% Nhánh từ chối
    Decide -- Từ chối --> RejectForm[Nhập lý do từ chối]
    RejectForm --> SubmitReject[Xác nhận từ chối]
    SubmitReject --> UpdateReject[Cập nhật báo cáo thành REJECTED & Lưu lý do]
    UpdateReject --> NotifyDriver[Gửi thông báo phản hồi cho Lái tàu]
    NotifyDriver --> End
    
    %% Nhánh xác nhận
    Decide -- Xác nhận sự cố --> ConfirmIssue[Xác nhận sự cố]
    ConfirmIssue --> DisableIncidentSeat[Cập nhật trạng thái Ghế thành DISABLED]
    DisableIncidentSeat --> ScanTickets[Quét các vé Ticket trạng thái PAID bị ảnh hưởng]
    ScanTickets --> CheckTickets{Có vé bị ảnh hưởng?}
    
    CheckTickets -- Không --> ResolveNoTicket[Cập nhật báo cáo thành RESOLVED]
    ResolveNoTicket --> End
    
    CheckTickets -- Có --> SearchReplacement[Thuật toán tìm kiếm ghế trống thay thế tương đương]
    SearchReplacement --> CheckReplacement{Tìm thấy ghế trống?}
    
    %% Tìm thấy ghế
    CheckReplacement -- Có --> LockNewSeat[Tạo token đổi ghế 24h & Lưu ghế đề xuất]
    LockNewSeat --> SetWaitingConfirm[Cập nhật báo cáo thành WAITING_CUSTOMER_CONFIRMATION]
    SetWaitingConfirm --> SendIncidentEmail[Email Service gửi email đổi ghế riêng với link /confirm-seat-replacement và đề xuất]
    SendIncidentEmail --> CustomerAction{Hành khách phản hồi trong 24h?}
    
    CustomerAction -- Bấm link & Chọn vị trí (UC-04) --> CustomerConfirm[Xác nhận đổi ghế]
    CustomerAction -- Không ưng ý ghế đề xuất --> CustomerRefund[Giải phóng đoạn ghế, hủy vé bị ảnh hưởng & hoàn tiền về ví]
    CustomerAction -- Hết hạn 24 giờ (Timeout) --> CustomerRefund
    
    CustomerConfirm --> UpdateTicketSeat[Giải phóng đoạn ghế cũ, cập nhật Ticket và TicketSeatSegment sang ghế mới]
    UpdateTicketSeat --> SetResolved[Cập nhật báo cáo thành RESOLVED]
    SetResolved --> SendSuccessEmail[Gửi email xác nhận đổi ghế thành công]
    SendSuccessEmail --> End
    CustomerRefund --> SetResolved
    
    %% Không tìm thấy ghế
    CheckReplacement -- Không --> CancelRefund[Hệ thống tự động giải phóng đoạn ghế, hủy vé & hoàn tiền]
    CancelRefund --> CancelBooking[Cập nhật Booking thành CANCELLED & hủy Ticket]
    CancelBooking --> RefundMoney[Hoàn tiền 100% vào Ví điện tử nội bộ khách hàng]
    RefundMoney --> SetResolvedFail[Cập nhật báo cáo thành RESOLVED]
    SetResolvedFail --> SendApologyEmail[Gửi email xin lỗi & chi tiết giao dịch hoàn tiền]
    SendApologyEmail --> End
```

### UC-14: Quản lý tàu
```mermaid
flowchart TD
    Start([Bắt đầu]) --> ChooseOption{Chọn nghiệp vụ cấu trúc vật lý}
    
    %% Quản lý Tàu
    ChooseOption -- Quản lý Tàu --> ManageTrain{Chọn thao tác với Tàu}
    ManageTrain -- Thêm Tàu mới --> CreateTrain[Nhập thông tin Tàu: Mã, Tên, Vận tốc]
    CreateTrain --> CheckTrainDup{Mã tàu trùng?}
    CheckTrainDup -- Có --> ShowTrainDupError[Báo lỗi: Mã tàu đã tồn tại] --> CreateTrain
    CheckTrainDup -- Không --> SaveTrain[Lưu thực thể Train]
    SaveTrain --> SuccessTrain[Thông báo thêm tàu thành công] --> End([Kết thúc])
    
    ManageTrain -- Sửa thông tin Tàu --> EditTrain[Nhập thông tin chỉnh sửa]
    EditTrain --> UpdateTrain[Hệ thống cập nhật thông tin tàu]
    UpdateTrain --> SuccessEdit[Thông báo cập nhật thành công] --> End
    
    ManageTrain -- Xóa Tàu khỏi hệ thống --> DeleteTrain[Kiểm tra Trip của tàu có status SCHEDULED/IN_PROGRESS?]
    DeleteTrain -- Có --> DeleteTrainError[Báo lỗi: Không thể xóa tàu đang có chuyến chạy] --> End
    DeleteTrain -- Không --> ConfirmDelete[Hiển thị cảnh báo xác nhận xóa]
    ConfirmDelete --> ProceedDelete[Xóa tàu cùng toa và ghế liên quan]
    ProceedDelete --> SuccessDelete[Thông báo xóa tàu thành công] --> End
    
    %% Quản lý Toa xe
    ChooseOption -- Thêm Toa & Sinh Ghế --> SelectTrain["Chọn một Tàu hỏa"]
    SelectTrain --> SelectTemplate["Nhập Mã, Tên, Thứ tự toa & Chọn mẫu Toa (CoachTemplate)"]
    SelectTemplate --> SaveCoach[Hệ thống tạo toa mới]
    SaveCoach --> AutoGenSeats[Hệ thống tự động tạo ghế dựa trên mẫu toa]
    AutoGenSeats --> SuccessCoach[Thông báo thêm toa xe và khởi tạo ghế thành công] --> End
    
```

### UC-19: Quản lý chuyến tàu
```mermaid
flowchart TD
    Start([Bắt đầu]) --> ChooseAction{Chọn nghiệp vụ Chuyến tàu}
    
    %% Lập lịch Chuyến tàu
    ChooseAction -->|Lập lịch chuyến tàu mới| CreateTrip[Chọn Tàu, Tuyến, Nhập thời gian đi/đến]
    CreateTrip --> CheckConflict[Hệ thống kiểm tra xung đột lịch chạy của đầu tàu]
    CheckConflict --> IsConflict{Trùng lịch chạy?}
    
    IsConflict -->|Có| ShowConflictError[Báo lỗi: Tàu đang bận chạy trong khoảng thời gian này]
    ShowConflictError --> CreateTrip
    
    IsConflict -->|Không| CheckTime{Thời gian kết thúc > Thời gian bắt đầu?}
    
    CheckTime -->|Không| ShowTimeError[Báo lỗi: Thời gian kết thúc phải lớn hơn thời gian khởi hành]
    ShowTimeError --> CreateTrip
    
    CheckTime -->|Có| SaveTrip[Lưu chuyến tàu trạng thái SCHEDULED]
    SaveTrip --> SuccessTrip[Thông báo thêm chuyến tàu thành công]
    SuccessTrip --> End([Kết thúc])
    
    %% Cập nhật / Duyệt Delay
    ChooseAction -->|Quản lý Delay chuyến tàu| DelayMode{Nguồn delay}
    DelayMode -->|Admin cập nhật trực tiếp| SelectTripDelay[Chọn chuyến và nhập số phút delay phù hợp trạng thái]
    SelectTripDelay --> SaveDelay[Hệ thống lưu delay đã duyệt vào chuyến]
    DelayMode -->|Duyệt báo cáo từ Lái tàu| ReviewDelayReport[Xem báo cáo delay đang chờ duyệt]
    ReviewDelayReport --> DecideDelay{Quyết định}
    DecideDelay -->|Duyệt| SaveDelay
    DecideDelay -->|Từ chối| RejectDelay[Lưu lý do từ chối báo cáo delay]
    RejectDelay --> End
    SaveDelay --> SuccessDelay[Thông báo cập nhật delay thành công]
    SuccessDelay --> End
    
    %% Giám sát GPS GIS
    ChooseAction -->|Giám sát bản đồ chạy tàu| FetchLiveTrips[Lấy các chuyến tàu đang hoạt động IN_PROGRESS]
    FetchLiveTrips --> CalcGPS[Hệ thống nội suy vị trí dựa trên ga đỗ, khoảng cách và delay]
    CalcGPS --> RenderMap[Render đường ray GeoJSON, nhà ga & vẽ icon tàu trên MapLibre]
    RenderMap --> RefreshInterval[Tự động làm mới dữ liệu sau mỗi 30 giây]
    RefreshInterval --> CalcGPS
    
    %% Sửa đổi/Hủy/Xóa
    ChooseAction -->|Sửa đổi / Hủy / Xóa chuyến| ManageTrip{Chọn thao tác}
    
    ManageTrip -->|Sửa đổi lịch chạy| EditTrip[Nhập lịch trình mới cho chuyến SCHEDULED]
    EditTrip --> CheckConflict
    
    ManageTrip -->|Hủy chuyến tàu| CancelTrip[Cập nhật Trip.status = CANCELLED]
    CancelTrip --> RefundTickets[Hoàn tiền 100% về Ví khách hàng & Gửi email xin lỗi]
    RefundTickets --> SuccessCancel[Thông báo hủy chuyến thành công]
    SuccessCancel --> End
    
    ManageTrip -->|Xóa chuyến tàu| CheckTicketsSold{Chuyến tàu đã bán vé?}
    
    CheckTicketsSold -->|Có| DeleteTripError[Báo lỗi: Không thể xóa chuyến tàu đã bán vé]
    DeleteTripError --> End
    
    CheckTicketsSold -->|Không| ProceedDeleteTrip[Xóa chuyến tàu khỏi hệ thống]
    ProceedDeleteTrip --> SuccessDeleteTrip[Thông báo xóa chuyến tàu thành công]
    SuccessDeleteTrip --> End
```

### UC-20: Quản lý cơ sở hạ tầng
```mermaid
flowchart TD
    Start([Bắt đầu]) --> ChooseOption{Chọn nghiệp vụ mạng lưới hạ tầng}
    
    %% Đồng bộ GeoJSON
    ChooseOption -->|Đồng bộ từ GeoJSON| UploadFile[Tải lên file GeoJSON mapData]
    UploadFile --> ParseJSON{File hợp lệ?}
    
    ParseJSON -->|Không| ShowJSONError[Báo lỗi: File mapData bắt buộc và phải đúng định dạng GeoJSON]
    ShowJSONError --> UploadFile
    
    ParseJSON -->|Có| PostSync[Hệ thống bắt đầu transaction đồng bộ bản đồ mạng lưới]
    PostSync --> CreateNetwork[Tạo thực thể Network mới với version tự động tăng]
    CreateNetwork --> ExtractStations[Quét trích xuất các trạm ga Point & tự sinh Code]
    ExtractStations --> SaveStations[Lưu danh sách Station vào DB gắn với Network]
    SaveStations --> ExtractLines[Quét trích xuất và gộp các đường ray LineString/MultiLineString]
    ExtractLines --> SaveLines[Lưu danh sách RailwayLine vào DB gắn với Network]
    SaveLines --> CheckSyncError{Toàn bộ dữ liệu hợp lệ?}
    CheckSyncError -->|Không| RollbackSync[Rollback transaction, không lưu dữ liệu dở dang]
    RollbackSync --> ShowJSONError
    CheckSyncError -->|Có| SuccessSync[Commit transaction và phản hồi số lượng đã xử lý]
    SuccessSync --> UpdateMap[Cập nhật bản vẽ vector ga và ray lên bản đồ GIS]
    UpdateMap --> End([Kết thúc])
    
    %% Xem danh sách Network
    ChooseOption -->|Xem danh sách mạng lưới| GetNetworks[Lấy danh sách mạng lưới đã đồng bộ]
    GetNetworks --> RenderNetworkList[Hiển thị danh sách các Network đã đồng bộ]
    RenderNetworkList --> End
    
    %% Chi tiết Network
    ChooseOption -->|Xem chi tiết mạng lưới| SelectNetwork[Chọn một Network]
    SelectNetwork --> FetchNetworkData[Lấy dữ liệu chi tiết của mạng lưới]
    FetchNetworkData --> RenderMapGIS[Hiển thị chi tiết ga và uốn lượn đường ray lên bản đồ GIS]
    RenderMapGIS --> End
```


---

## 3. Lái Tàu (Driver)

### UC-15: Yêu cầu hủy chuyến khẩn cấp
```mermaid
flowchart TD
    Start([Bắt đầu]) --> OpenCancel[Mở tính năng Hủy chuyến khẩn cấp]
    OpenCancel --> ShowScope[Hiển thị ghi chú phạm vi hiện tại]
    ShowScope --> NotImplemented[Chưa có module tài xế gửi yêu cầu hủy chuyến và admin duyệt]
    NotImplemented --> End([Kết thúc])
```

### UC-16: Xem chuyến được phân công
```mermaid
flowchart TD
    Start([Bắt đầu]) --> OpenSchedule[Mở màn hình Lịch trình]
    OpenSchedule --> FetchTrips[Hệ thống lấy danh sách chuyến phân công cho Lái tàu]
    FetchTrips --> Filter[Lọc theo Hôm nay, Tuần này, Lịch sử]
    Filter --> DisplayTrips[Hiển thị danh sách chuyến]
    DisplayTrips --> End([Kết thúc])
```

### UC-17: Báo cáo delay
```mermaid
flowchart TD
    Start([Bắt đầu]) --> SelectTrip[Chọn chuyến tàu hiện tại]
    SelectTrip --> ClickDelay[Bấm Báo cáo Delay]
    ClickDelay --> InputTime[Nhập số phút Delay và lý do]
    InputTime --> Submit[Gửi báo cáo]
    Submit --> ValidateDelay{Hợp lệ và không trùng báo cáo chờ duyệt?}
    ValidateDelay -- Không --> ShowError[Hiển thị lỗi] --> InputTime
    ValidateDelay -- Có --> SaveReport[Lưu báo cáo delay trạng thái PENDING]
    SaveReport --> WaitAdmin[Chờ Admin duyệt hoặc từ chối]
    WaitAdmin --> Success[Báo cáo đã gửi thành công]
    Success --> End([Kết thúc])
```

### UC-18: Báo cáo ghế hỏng
```mermaid
flowchart TD
    Start([Bắt đầu]) --> SelectTrip[Chọn chuyến tàu]
    SelectTrip --> CheckTrip{Chuyến còn hoạt động và chưa kết thúc?}
    CheckTrip -- Không --> Locked[Khóa thao tác báo cáo ghế hỏng]
    Locked --> End([Kết thúc])
    CheckTrip -- Có --> ClickIssue[Bấm Báo sự cố ghế]
    ClickIssue --> InputDetails[Chọn ghế, loại sự cố và nhập mô tả]
    InputDetails --> Submit[Gửi yêu cầu]
    Submit --> CheckDuplicate{Ghế đã có báo cáo đang mở?}
    CheckDuplicate -- Có --> DuplicateError[Báo lỗi không thể gửi trùng] --> End
    CheckDuplicate -- Không --> SaveIssue[Lưu yêu cầu trạng thái PENDING]
    SaveIssue --> Success[Thông báo gửi thành công chờ Admin duyệt]
    Success --> End([Kết thúc])
```
