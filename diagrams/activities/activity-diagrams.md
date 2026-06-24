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
    Start([Bắt đầu]) --> SelectTrain[Chọn Tàu & Toa xe]
    SelectTrain --> ShowLayout[Hiển thị sơ đồ ghế]
    ShowLayout --> ClickSeat[Click chọn một ghế]
    ClickSeat --> ShowDialog[Hiển thị dialog thông tin ghế]
    ShowDialog --> SelectStatus[Chọn trạng thái mới: AVAILABLE/DISABLED/MAINTENANCE]
    SelectStatus --> ClickUpdate[Bấm Cập nhật]
    ClickUpdate --> SaveDB[Hệ thống cập nhật trạng thái ghế]
    SaveDB --> ShowSuccess[Cập nhật màu sắc & thông báo thành công]
    ShowSuccess --> End([Kết thúc])
```

### UC-21: Xử lý sự cố ghế hỏng
```mermaid
flowchart TD
    Start([Bắt đầu]) --> ViewIssues[Xem danh sách báo cáo ghế hỏng PENDING]
    ViewIssues --> SelectIssue[Chọn 1 sự cố để xem chi tiết]
    SelectIssue --> LoadDetail[Hiển thị chuyến, toa, ghế, mô tả, người báo cáo và vé bị ảnh hưởng]
    LoadDetail --> CheckStatus{Báo cáo còn PENDING?}
    CheckStatus -- Không --> ShowInvalid[Thông báo báo cáo đã được xử lý] --> End([Kết thúc])
    CheckStatus -- Có --> Decide{Quyết định của Admin}

    Decide -- Từ chối --> RejectForm[Nhập lý do từ chối]
    RejectForm --> SubmitReject[Xác nhận từ chối]
    SubmitReject --> UpdateReject[Cập nhật SeatIssueReport thành REJECTED và lưu rejectReason]
    UpdateReject --> EmitReject[Gửi realtime/event cập nhật trạng thái báo cáo]
    EmitReject --> End

    Decide -- Xác nhận sự cố --> ConfirmIssue[Xác nhận ghế bị hỏng]
    ConfirmIssue --> DisableIncidentSeat[Cập nhật Seat.status = DISABLED]
    DisableIncidentSeat --> ScanTickets[Quét Ticket PAID bị ảnh hưởng theo tripId, seatId và đoạn ghế]
    ScanTickets --> CheckTickets{Có vé bị ảnh hưởng?}

    CheckTickets -- Không --> ResolveNoTicket[Cập nhật SeatIssueReport thành RESOLVED]
    ResolveNoTicket --> EmitNoTicket[Gửi realtime/event cập nhật ghế và báo cáo]
    EmitNoTicket --> End

    CheckTickets -- Có --> SearchReplacement[Tìm ghế thay thế còn trống trên cùng chuyến và cùng chặng]
    SearchReplacement --> CheckReplacement{Có ghế thay thế phù hợp?}

    CheckReplacement -- Có --> CreateToken[Tạo token xác nhận đổi ghế 24h và lưu proposedSeatId]
    CreateToken --> SetWaiting[Cập nhật SeatIssueReport thành WAITING_CUSTOMER_CONFIRMATION]
    SetWaiting --> SendReplacementEmail[Gửi email kèm link /confirm-seat-replacement]
    SendReplacementEmail --> WaitCustomer{Hành khách phản hồi trong 24h?}

    WaitCustomer -- Đồng ý đổi ghế --> ReplaceSeat[Giải phóng TicketSeatSegment cũ, cập nhật Ticket.seatId và tạo TicketSeatSegment mới]
    ReplaceSeat --> ResolveReplacement[Cập nhật SeatIssueReport thành RESOLVED]
    ResolveReplacement --> SendSuccessEmail[Gửi email xác nhận đổi ghế thành công]
    SendSuccessEmail --> End

    WaitCustomer -- Từ chối đổi ghế --> RefundByChoice[Giải phóng TicketSeatSegment, hủy vé/booking bị ảnh hưởng và hoàn tiền vào ví]
    WaitCustomer -- Hết hạn 24h --> RefundByChoice
    RefundByChoice --> ResolveRefund[Cập nhật SeatIssueReport thành RESOLVED]
    ResolveRefund --> SendRefundEmail[Gửi email hoàn tiền]
    SendRefundEmail --> End

    CheckReplacement -- Không --> AutoRefund[Giải phóng TicketSeatSegment và hoàn tiền 100% vào ví]
    AutoRefund --> CancelAffectedBooking[Cập nhật booking/vé bị ảnh hưởng theo chính sách hủy]
    CancelAffectedBooking --> ResolveNoSeat[Cập nhật SeatIssueReport thành RESOLVED]
    ResolveNoSeat --> SendRefundNoSeatEmail[Gửi email thông báo không có ghế thay thế và chi tiết hoàn tiền]
    SendRefundNoSeatEmail --> End
```

### UC-14: Quản lý tàu
```mermaid
flowchart TD
    Start([Bắt đầu]) --> OpenTrainPage[Mở trang Quản lý tàu]
    OpenTrainPage --> ChooseOption{Chọn thao tác quản lý}

    ChooseOption -- Thêm tàu mới --> CreateTrain[Nhập mã tàu, tên, vận tốc trung bình và trạng thái]
    CreateTrain --> CheckTrainDup{Mã tàu hợp lệ và chưa tồn tại?}
    CheckTrainDup -- Không --> ShowTrainDupError[Báo lỗi dữ liệu tàu hoặc trùng mã] --> CreateTrain
    CheckTrainDup -- Có --> SaveTrain[Tạo Train]
    SaveTrain --> SuccessTrain[Thông báo 201 Created] --> End([Kết thúc])
    
    ChooseOption -- Cập nhật tàu --> EditTrain[Sửa tên, vận tốc hoặc trạng thái tàu]
    EditTrain --> UpdateTrain[Cập nhật Train]
    UpdateTrain --> SuccessEdit[Thông báo cập nhật thành công] --> End
    
    ChooseOption -- Thêm toa cho tàu --> SelectTrain["Chọn tàu, chọn template và trạng thái toa"]
    SelectTrain --> ValidateCoachInput{Train và CoachTemplate tồn tại?}
    ValidateCoachInput -- Không --> ShowCoachInputError[Báo lỗi dữ liệu toa không hợp lệ] --> SelectTrain
    ValidateCoachInput -- Có --> GetCoachOrder[Lấy order lớn nhất của toa trong tàu]
    GetCoachOrder --> SaveCoach[Tạo Coach với tên tự sinh Toa N]
    SaveCoach --> AutoGenSeats[Sinh danh sách Seat/Bed theo layout, hàng, cột và tầng của template]
    AutoGenSeats --> CreateSeats[createMany Seat cho Coach]
    CreateSeats --> SuccessCoach[Trả Coach kèm template và seats] --> End

    ChooseOption -- Sắp xếp lại thứ tự toa --> DragCoach[Kéo thả thứ tự toa]
    DragCoach --> ReorderCoach[Cập nhật order và tự sinh lại tên Toa 1, Toa 2...]
    ReorderCoach --> SuccessReorder[Hiển thị thứ tự toa mới] --> End
```

### UC-19: Quản lý chuyến tàu
```mermaid
flowchart TD
    Start([Bắt đầu]) --> ChooseAction{Chọn thao tác quản lý chuyến tàu}

    ChooseAction -->|Thêm chuyến mới| CreateTrip[Chọn Route, Tàu, Driver và thời gian khởi hành]
    CreateTrip --> PostTrip["POST /trip"]
    PostTrip --> ValidateTrip[Kiểm tra Route, Train và Driver hợp lệ]
    ValidateTrip --> CalcEndTime[Tính endTime theo route.totalDistanceKm, train.averageSpeedKmH và turnaroundMinutes]
    CalcEndTime --> CheckConflict[Kiểm tra xung đột lịch của Train với Trip chưa CANCELLED]
    CheckConflict --> SaveTrip[Tạo Trip trạng thái SCHEDULED]
    SaveTrip --> SuccessTrip[Thêm chuyến thành công]
    SuccessTrip --> End([Kết thúc])

    ChooseAction -->|Cập nhật chuyến| EditTrip[Chọn chuyến cần sửa Route hoặc Driver]
    EditTrip --> PatchTrip["PATCH /trip/{id}"]
    PatchTrip --> CheckTripExists[Kiểm tra Trip tồn tại]
    CheckTripExists --> CheckScheduled{Trip còn SCHEDULED?}
    CheckScheduled -->|Không| RejectUpdate[Báo lỗi chỉ được sửa chuyến chưa chạy]
    RejectUpdate --> End
    CheckScheduled -->|Có| ValidateUpdate[Kiểm tra Route và Driver nếu có thay đổi]
    ValidateUpdate --> RecalcEndTime[Nếu đổi Route thì tính lại endTime]
    RecalcEndTime --> CheckUpdateConflict[Nếu đổi Route thì kiểm tra trùng lịch, loại trừ chính Trip hiện tại]
    CheckUpdateConflict --> SaveUpdate[Cập nhật routeId và/hoặc driverId]
    SaveUpdate --> SuccessUpdate[Cập nhật chuyến thành công]
    SuccessUpdate --> End

    ChooseAction -->|Xóa chuyến| ConfirmDeleteTrip[Xác nhận xóa chuyến]
    ConfirmDeleteTrip --> DeleteTrip["DELETE /trip/{id}"]
    DeleteTrip --> CheckDeleteTrip[Kiểm tra Trip tồn tại]
    CheckDeleteTrip --> ProceedDeleteTrip[Xóa Trip]
    ProceedDeleteTrip --> SuccessDeleteTrip[Xóa chuyến thành công]
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
    SuccessSync --> End([Kết thúc])

    %% Tạo / cập nhật Route
    ChooseOption -->|Tạo hoặc cập nhật tuyến đường| EditRoute[Nhập mã tuyến, tên, network, cấu hình giá và danh sách ga]
    EditRoute --> ValidateRoute{Route có đủ ga và ga thuộc đúng network?}
    ValidateRoute -->|Không| ShowRouteError[Báo lỗi dữ liệu tuyến không hợp lệ] --> EditRoute
    ValidateRoute -->|Có| CalcRoutePath[Tính pathCoordinates và totalDistanceKm từ RailwayLine cùng network]
    CalcRoutePath --> PathValid{Các đoạn ga nối được bằng đường ray?}
    PathValid -->|Không| RollbackRoute[Rollback, không lưu route/path sai] --> ShowRouteError
    PathValid -->|Có| RouteVersion{Route đang ACTIVE/INACTIVE cần giữ lịch sử?}
    RouteVersion -->|Có| CloneRouteVersion[Tạo version route mới và chuyển version song song sang INACTIVE]
    RouteVersion -->|Không| SaveRouteInPlace[Cập nhật route hiện tại]
    CloneRouteVersion --> SuccessRoute[Thông báo lưu tuyến thành công]
    SaveRouteInPlace --> SuccessRoute
    SuccessRoute --> End

    %% Chỉnh ga trong tuyến
    ChooseOption -->|Thêm, xóa hoặc sắp xếp ga trong tuyến| ModifyStations[Thao tác với RouteStation]
    ModifyStations --> ValidateStationNetwork{Ga thuộc network của route và không trùng?}
    ValidateStationNetwork -->|Không| ShowStationError[Báo lỗi danh sách ga không hợp lệ] --> ModifyStations
    ValidateStationNetwork -->|Có| ReindexStations[Cập nhật thứ tự ga và distanceFromStart]
    ReindexStations --> RecalculatePath[Tính lại pathCoordinates]
    RecalculatePath --> PathAfterStationChange{Path hợp lệ?}
    PathAfterStationChange -->|Không| RollbackStationChange[Rollback thay đổi ga] --> ShowStationError
    PathAfterStationChange -->|Có| SuccessStationChange[Thông báo cập nhật lộ trình thành công] --> End
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
