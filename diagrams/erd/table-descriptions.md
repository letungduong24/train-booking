### 2.9.2 Mô tả các bảng

#### 2.9.2.1 Bảng `User`
Bảng `User` sẽ chứa thông tin về tài khoản người dùng, phân quyền và dữ liệu ví điện tử, gồm các trường được mô tả như sau:

*Bảng 2.1 Mô tả bảng User*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã định danh người dùng (UUID) |
| 2 | email | Varchar(255) | Unique, Not Null | Địa chỉ email đăng nhập |
| 3 | phone | Varchar(50) | Unique, Null | Số điện thoại liên hệ |
| 4 | password | Varchar(255) | Null | Mật khẩu đã mã hóa |
| 5 | name | Varchar(255) | Null | Tên hiển thị người dùng |
| 6 | googleId | Varchar(255) | Unique, Null | ID Google OAuth |
| 7 | role | Varchar(50) | Not Null | Vai trò (USER, ADMIN, DRIVER) |
| 8 | isBanned | Boolean | Not Null | Trạng thái khóa tài khoản |
| 9 | balance | Double | Not Null | Số dư ví điện tử |
| 10 | walletPin | Varchar(255) | Null | Mã PIN ví điện tử |
| 11 | isEmailVerified | Boolean | Not Null | Trạng thái xác thực email |
| 12 | verificationToken | Varchar(255) | Unique, Null | Token xác thực email |
| 13 | verificationTokenExpires | Timestamp | Null | Thời gian hết hạn token xác thực email |
| 14 | passwordResetToken | Varchar(255) | Unique, Null | Token đặt lại mật khẩu |
| 15 | passwordResetTokenExpires | Timestamp | Null | Thời gian hết hạn token đặt lại MK |
| 16 | walletPinResetToken | Varchar(255) | Unique, Null | Token đặt lại PIN ví |
| 17 | walletPinResetTokenExpires| Timestamp | Null | Thời gian hết hạn token đặt lại PIN |
| 18 | profilePic | Text | Null | Đường dẫn ảnh đại diện |
| 19 | createdAt | Timestamp | Not Null | Ngày tạo tài khoản |
| 20 | updatedAt | Timestamp | Not Null | Ngày cập nhật gần nhất |

#### 2.9.2.2 Bảng `RefreshToken`
Bảng `RefreshToken` sẽ chứa thông tin về các mã thông báo duy trì phiên đăng nhập an toàn, gồm các trường được mô tả như sau:

*Bảng 2.2 Mô tả bảng RefreshToken*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã định danh token |
| 2 | token | Text | Unique, Not Null | Chuỗi mã JWT Refresh Token |
| 3 | userId | Varchar(36) | Khóa ngoại | Mã người dùng sở hữu token |
| 4 | expiresAt | Timestamp | Not Null | Thời gian token hết hạn |
| 5 | createdAt | Timestamp | Not Null | Ngày tạo token |

#### 2.9.2.3 Bảng `Transaction`
Bảng `Transaction` sẽ chứa thông tin về lịch sử giao dịch nạp, rút, thanh toán và hoàn tiền, gồm các trường được mô tả như sau:

*Bảng 2.3 Mô tả bảng Transaction*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã giao dịch |
| 2 | userId | Varchar(36) | Khóa ngoại | Mã người dùng thực hiện |
| 3 | amount | Double | Not Null | Số tiền giao dịch |
| 4 | type | Varchar(50) | Not Null | Loại giao dịch (DEPOSIT, WITHDRAW...) |
| 5 | status | Varchar(50) | Not Null | Trạng thái (PENDING, COMPLETED...) |
| 6 | paymentMethod | Varchar(50) | Null | Phương thức thanh toán (VNPAY, WALLET) |
| 7 | referenceId | Varchar(255) | Null | Mã tham chiếu liên kết ngoài |
| 8 | description | Text | Null | Nội dung chi tiết giao dịch |
| 9 | bankName | Varchar(255) | Null | Tên ngân hàng nhận (khi rút tiền) |
| 10 | bankAccount | Varchar(255) | Null | Số tài khoản nhận |
| 11 | accountName | Varchar(255) | Null | Tên chủ tài khoản |
| 12 | createdAt | Timestamp | Not Null | Ngày tạo giao dịch |
| 13 | updatedAt | Timestamp | Not Null | Ngày cập nhật giao dịch |

#### 2.9.2.4 Bảng `Station`
Bảng `Station` sẽ chứa thông tin về danh mục các nhà ga trên mạng lưới, gồm các trường được mô tả như sau:

*Bảng 2.4 Mô tả bảng Station*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã nhà ga |
| 2 | code | Varchar(50) | Unique, Not Null | Mã định danh ga (VD: SGO, HNO) |
| 3 | name | Varchar(255) | Not Null | Tên nhà ga |
| 4 | latitude | Double | Not Null | Vĩ độ địa lý (GPS) |
| 5 | longitude | Double | Not Null | Kinh độ địa lý (GPS) |
| 6 | createdAt | Timestamp | Not Null | Ngày tạo |
| 7 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

#### 2.9.2.5 Bảng `Route`
Bảng `Route` sẽ chứa thông tin về cấu hình các tuyến đường di chuyển, gồm các trường được mô tả như sau:

*Bảng 2.5 Mô tả bảng Route*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã tuyến đường |
| 2 | code | Varchar(50) | Unique, Not Null | Mã tuyến (VD: HN-SG) |
| 3 | name | Varchar(255) | Not Null | Tên tuyến đường (VD: Hà Nội - Sài Gòn) |
| 4 | status | Varchar(50) | Not Null | Trạng thái tuyến (ACTIVE, DRAFT) |
| 5 | durationMinutes | Int(11) | Not Null | Tổng thời gian chạy dự kiến toàn tuyến |
| 6 | turnaroundMinutes | Int(11) | Not Null | Thời gian nghỉ quay đầu tối thiểu |
| 7 | totalDistanceKm | Double | Not Null | Tổng chiều dài tuyến (km) |
| 8 | basePricePerKm | Double | Not Null | Giá vé cơ sở cho mỗi km (VND) |
| 9 | stationFee | Double | Not Null | Phí dịch vụ cố định đi qua ga (VND) |
| 10 | pathCoordinates | Jsonb | Null | Dữ liệu tọa độ bản đồ tuyến |
| 11 | createdAt | Timestamp | Not Null | Ngày tạo |
| 12 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

#### 2.9.2.6 Bảng `RouteStation`
Bảng `RouteStation` sẽ chứa thông tin trung gian thể hiện thứ tự các trạm dừng trên một tuyến, gồm các trường được mô tả như sau:

*Bảng 2.6 Mô tả bảng RouteStation*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | routeId | Varchar(36) | Khóa chính, Khóa ngoại | Mã tuyến đường |
| 2 | stationId | Varchar(36) | Khóa chính, Khóa ngoại | Mã nhà ga |
| 3 | index | Int(11) | Not Null | Thứ tự dừng trên tuyến |
| 4 | distanceFromStart | Double | Not Null | Khoảng cách lũy kế từ ga xuất phát |
| 5 | durationFromStart | Int(11) | Not Null | Thời gian chạy lũy kế từ ga xuất phát |
| 6 | createdAt | Timestamp | Not Null | Ngày tạo |
| 7 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

#### 2.9.2.7 Bảng `RailwayLine`
Bảng `RailwayLine` sẽ chứa dữ liệu hình học vật lý của đường ray để render bản đồ, gồm các trường được mô tả như sau:

*Bảng 2.7 Mô tả bảng RailwayLine*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã phân đoạn đường ray |
| 2 | name | Varchar(255) | Not Null | Tên phân đoạn |
| 3 | pathCoordinates | Jsonb | Not Null | Tọa độ MultiLineString chi tiết |
| 4 | createdAt | Timestamp | Not Null | Ngày tạo |
| 5 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

#### 2.9.2.8 Bảng `Train`
Bảng `Train` sẽ chứa thông tin về danh sách các đầu tàu hoặc đoàn tàu cố định, gồm các trường được mô tả như sau:

*Bảng 2.8 Mô tả bảng Train*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã đoàn tàu |
| 2 | code | Varchar(50) | Unique, Not Null | Mã hiệu tàu (VD: SE1, TN2) |
| 3 | name | Varchar(255) | Not Null | Tên gọi đoàn tàu |
| 4 | status | Varchar(50) | Not Null | Trạng thái (ACTIVE, MAINTENANCE) |
| 5 | averageSpeedKmH | Int(11) | Not Null | Tốc độ trung bình lý thuyết (km/h) |
| 6 | createdAt | Timestamp | Not Null | Ngày tạo |
| 7 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

#### 2.9.2.9 Bảng `CoachTemplate`
Bảng `CoachTemplate` sẽ chứa thông tin về thư viện thiết kế mẫu cho các loại toa xe, gồm các trường được mô tả như sau:

*Bảng 2.9 Mô tả bảng CoachTemplate*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã mẫu toa xe |
| 2 | code | Varchar(50) | Unique, Not Null | Mã loại toa |
| 3 | name | Varchar(255) | Not Null | Tên mẫu toa |
| 4 | description | Text | Null | Mô tả mẫu |
| 5 | layout | Varchar(50) | Not Null | Cấu trúc (SEAT, BED) |
| 6 | totalRows | Int(11) | Not Null | Số hàng ngang tối đa |
| 7 | totalCols | Int(11) | Not Null | Số cột dọc tối đa |
| 8 | tiers | Int(11) | Not Null | Số tầng giường/ghế |
| 9 | coachMultiplier | Double | Not Null | Hệ số nhân giá trị của toa |
| 10 | tierMultipliers | Jsonb | Not Null | Cấu hình hệ số giá theo từng tầng |
| 11 | createdAt | Timestamp | Not Null | Ngày tạo |
| 12 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

#### 2.9.2.10 Bảng `Coach`
Bảng `Coach` sẽ chứa thông tin về các toa xe thực tế gắn vào một đoàn tàu, gồm các trường được mô tả như sau:

*Bảng 2.10 Mô tả bảng Coach*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã toa xe |
| 2 | name | Varchar(255) | Not Null | Tên hiển thị (Toa số 1, Toa số 2) |
| 3 | order | Int(11) | Not Null | Thứ tự xếp toa trên tàu |
| 4 | status | Varchar(50) | Not Null | Trạng thái sử dụng |
| 5 | trainId | Varchar(36) | Khóa ngoại | Mã đoàn tàu chứa toa |
| 6 | templateId | Varchar(36) | Khóa ngoại | Mã mẫu thiết kế toa được áp dụng |
| 7 | createdAt | Timestamp | Not Null | Ngày tạo |
| 8 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

#### 2.9.2.11 Bảng `Seat`
Bảng `Seat` sẽ chứa thông tin về chỗ ngồi hoặc giường nằm cụ thể trong một toa, gồm các trường được mô tả như sau:

*Bảng 2.11 Mô tả bảng Seat*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã ghế |
| 2 | name | Varchar(50) | Not Null | Ký hiệu hiển thị (VD: 1A, 2B) |
| 3 | rowIndex | Int(11) | Not Null | Chỉ số hàng tọa độ đồ họa |
| 4 | colIndex | Int(11) | Not Null | Chỉ số cột tọa độ đồ họa |
| 5 | tier | Int(11) | Not Null | Tầng ghế (Dùng tính giá) |
| 6 | status | Varchar(50) | Not Null | Trạng thái vật lý (AVAILABLE, DISABLED) |
| 7 | type | Varchar(50) | Not Null | Phân loại (VIP, STANDARD, ECONOMY, OTHER) |
| 8 | coachId | Varchar(36) | Khóa ngoại | Mã toa tàu |
| 9 | createdAt | Timestamp | Not Null | Ngày tạo |
| 10 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

#### 2.9.2.12 Bảng `Trip`
Bảng `Trip` sẽ chứa thông tin về lịch trình chạy thực tế của tàu, gồm các trường được mô tả như sau:

*Bảng 2.12 Mô tả bảng Trip*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã chuyến đi |
| 2 | routeId | Varchar(36) | Khóa ngoại | Mã tuyến đường |
| 3 | trainId | Varchar(36) | Khóa ngoại | Mã đoàn tàu vận hành |
| 4 | departureTime | Timestamp | Not Null | Thời gian khởi hành dự kiến |
| 5 | endTime | Timestamp | Not Null | Thời gian kết thúc dự kiến |
| 6 | status | Varchar(50) | Not Null | Trạng thái (SCHEDULED, IN_PROGRESS...) |
| 7 | departureDelayMinutes | Int(11) | Not Null | Thời gian trễ khởi hành (phút) |
| 8 | arrivalDelayMinutes | Int(11) | Not Null | Thời gian đến trễ (phút) |
| 9 | createdAt | Timestamp | Not Null | Ngày tạo |
| 10 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

#### 2.9.2.13 Bảng `PassengerGroup`
Bảng `PassengerGroup` sẽ chứa thông tin về phân loại đối tượng hành khách, gồm các trường được mô tả như sau:

*Bảng 2.13 Mô tả bảng PassengerGroup*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã nhóm hành khách |
| 2 | code | Varchar(50) | Unique, Not Null | Mã (ADULT, STUDENT, ELDERLY, CHILD) |
| 3 | name | Varchar(255) | Not Null | Tên nhóm |
| 4 | discountRate | Double | Not Null | Tỷ lệ giảm giá (VD: 0.1 = Giảm 10%) |
| 5 | description | Text | Null | Mô tả |
| 6 | minAge | Int(11) | Null | Độ tuổi nhỏ nhất áp dụng |
| 7 | maxAge | Int(11) | Null | Độ tuổi lớn nhất áp dụng |
| 8 | createdAt | Timestamp | Not Null | Ngày tạo |
| 9 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

#### 2.9.2.14 Bảng `Booking`
Bảng `Booking` sẽ chứa thông tin về đơn hàng đặt vé tổng hợp, gồm các trường được mô tả như sau:

*Bảng 2.14 Mô tả bảng Booking*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã đơn hàng |
| 2 | code | Varchar(50) | Unique, Not Null | Mã vé tra cứu (VD: RAILFLOW-123) |
| 3 | tripId | Varchar(36) | Khóa ngoại | Mã chuyến tàu |
| 4 | userId | Varchar(36) | Khóa ngoại, Null | Mã người dùng đặt vé |
| 5 | contactName | Varchar(255) | Null | Tên người liên hệ |
| 6 | contactPhone | Varchar(50) | Null | Số điện thoại người liên hệ |
| 7 | contactEmail | Varchar(255) | Null | Email người liên hệ |
| 8 | status | Varchar(50) | Not Null | Trạng thái (PENDING, PAID...) |
| 9 | totalPrice | Double | Not Null | Tổng giá trị đơn hàng |
| 10 | metadata | Jsonb | Null | Lưu nháp dữ liệu trước khi thanh toán |
| 11 | createdAt | Timestamp | Not Null | Ngày tạo |
| 12 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

#### 2.9.2.15 Bảng `Ticket`
Bảng `Ticket` sẽ chứa thông tin về vé lẻ chi tiết cho từng hành khách, gồm các trường được mô tả như sau:

*Bảng 2.15 Mô tả bảng Ticket*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã vé lẻ |
| 2 | bookingId | Varchar(36) | Khóa ngoại | Mã đơn hàng tổng |
| 3 | tripId | Varchar(36) | Khóa ngoại | Mã chuyến đi |
| 4 | seatId | Varchar(36) | Khóa ngoại | Mã ghế đã phân bổ |
| 5 | passengerName | Varchar(255) | Not Null | Họ tên hành khách thực tế |
| 6 | passengerId | Varchar(50) | Not Null | Số CCCD / CMND |
| 7 | passengerGroupId | Varchar(36) | Khóa ngoại | Mã phân loại nhóm hành khách |
| 8 | fromStationIndex | Int(11) | Not Null | Thứ tự ga khởi hành |
| 9 | toStationIndex | Int(11) | Not Null | Thứ tự ga đến |
| 10 | price | Double | Not Null | Giá tiền cuối cùng của riêng vé này |
| 11 | createdAt | Timestamp | Not Null | Ngày tạo |
| 12 | updatedAt | Timestamp | Not Null | Ngày cập nhật |
