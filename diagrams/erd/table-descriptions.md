### 2.9.2 Mô tả các bảng

Cơ sở dữ liệu của hệ thống RailFlow được thiết kế trên PostgreSQL và ánh xạ thông qua Prisma ORM. Các bảng được tổ chức theo các nhóm nghiệp vụ chính gồm quản lý người dùng và ví điện tử, hạ tầng đường sắt, đoàn tàu và toa ghế, chuyến tàu, đặt vé, chiếm dụng ghế theo chặng và báo cáo vận hành. Phần dưới đây trình bày chi tiết mục đích, kiểu dữ liệu và các ràng buộc của từng bảng; nội dung được đối chiếu trực tiếp với `api/prisma/schema.prisma` và migration hiện hành để bảo đảm thống nhất với cấu trúc cơ sở dữ liệu đang triển khai.

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
| 9 | balance | Int | Not Null | Số dư ví điện tử theo đơn vị VND |
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
| 3 | amount | Int | Not Null | Số tiền giao dịch theo đơn vị VND |
| 4 | type | Varchar(50) | Not Null | Loại giao dịch (DEPOSIT, WITHDRAW...) |
| 5 | status | Varchar(50) | Not Null | Trạng thái (PENDING, COMPLETED...) |
| 6 | paymentMethod | Varchar(50) | Null | Phương thức thanh toán (VNPAY, WALLET) |
| 7 | referenceId | Varchar(255) | Null | Mã tham chiếu liên kết ngoài |
| 8 | idempotencyKey | Varchar(255) | Unique, Null | Khóa chống xử lý trùng giao dịch |
| 9 | description | Text | Null | Nội dung chi tiết giao dịch |
| 10 | bankName | Varchar(255) | Null | Tên ngân hàng nhận (khi rút tiền) |
| 11 | bankAccount | Varchar(255) | Null | Số tài khoản nhận |
| 12 | accountName | Varchar(255) | Null | Tên chủ tài khoản |
| 13 | createdAt | Timestamp | Not Null | Ngày tạo giao dịch |
| 14 | updatedAt | Timestamp | Not Null | Ngày cập nhật giao dịch |

#### 2.9.2.3a Bảng `Network`
Bảng `Network` sẽ chứa phiên bản mạng lưới đường sắt, dùng để gom nhóm ga, đường ray GeoJSON và tuyến thương mại theo cùng một phiên bản dữ liệu.

*Bảng 2.3a Mô tả bảng Network*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã phiên bản mạng lưới |
| 2 | version | Int | Unique, Not Null | Số phiên bản mạng lưới |
| 3 | name | Varchar(255) | Not Null | Tên phiên bản mạng lưới |
| 4 | createdAt | Timestamp | Not Null | Ngày tạo |
| 5 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

#### 2.9.2.4 Bảng `Station`
Bảng `Station` sẽ chứa thông tin về danh mục các nhà ga trên mạng lưới, gồm các trường được mô tả như sau:

*Bảng 2.4 Mô tả bảng Station*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã nhà ga |
| 2 | code | Varchar(50) | Unique cùng networkId, Not Null | Mã định danh ga (VD: SGO, HNO) |
| 3 | name | Varchar(255) | Not Null | Tên nhà ga |
| 4 | latitude | Double | Not Null | Vĩ độ địa lý (GPS) |
| 5 | longitude | Double | Not Null | Kinh độ địa lý (GPS) |
| 6 | networkId | Varchar(36) | Khóa ngoại | Mã phiên bản mạng lưới |
| 7 | createdAt | Timestamp | Not Null | Ngày tạo |
| 8 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

#### 2.9.2.5 Bảng `Route`
Bảng `Route` sẽ chứa thông tin về cấu hình các tuyến đường di chuyển, gồm các trường được mô tả như sau:

*Bảng 2.5 Mô tả bảng Route*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã tuyến đường |
| 2 | code | Varchar(50) | Unique cùng version, Not Null | Mã tuyến (VD: HN-SG) |
| 3 | version | Int | Not Null | Phiên bản tuyến thương mại theo mã tuyến |
| 4 | networkId | Varchar(36) | Khóa ngoại | Mã phiên bản mạng lưới |
| 5 | name | Varchar(255) | Not Null | Tên tuyến đường (VD: Hà Nội - Sài Gòn) |
| 6 | status | Varchar(50) | Not Null | Trạng thái tuyến (ACTIVE, DRAFT) |
| 7 | durationMinutes | Int(11) | Not Null | Tổng thời gian chạy dự kiến toàn tuyến |
| 8 | turnaroundMinutes | Int(11) | Not Null | Thời gian nghỉ quay đầu tối thiểu |
| 9 | totalDistanceKm | Double | Not Null | Tổng chiều dài tuyến (km) |
| 10 | basePricePerKm | Int | Not Null | Giá vé cơ sở cho mỗi km (VND) |
| 11 | stationFee | Int | Not Null | Phí dịch vụ cố định đi qua ga (VND) |
| 12 | pathCoordinates | Jsonb | Null | Dữ liệu tọa độ bản đồ tuyến |
| 13 | createdAt | Timestamp | Not Null | Ngày tạo |
| 14 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

#### 2.9.2.6 Bảng `RouteStation`
Bảng `RouteStation` sẽ chứa thông tin trung gian thể hiện thứ tự các trạm dừng trên một tuyến, gồm các trường được mô tả như sau:

*Bảng 2.6 Mô tả bảng RouteStation*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | routeId | Varchar(36) | Khóa chính, Khóa ngoại | Mã tuyến đường |
| 2 | stationId | Varchar(36) | Khóa chính, Khóa ngoại | Mã nhà ga |
| 3 | index | Int(11) | Unique theo routeId, Not Null | Thứ tự dừng trên tuyến |
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
| 4 | networkId | Varchar(36) | Khóa ngoại | Mã phiên bản mạng lưới |
| 5 | createdAt | Timestamp | Not Null | Ngày tạo |
| 6 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

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
| 4 | driverId | Varchar(36) | Khóa ngoại, Null | Mã tài xế được phân công vận hành chuyến |
| 5 | departureTime | Timestamp | Not Null | Thời gian khởi hành dự kiến |
| 6 | endTime | Timestamp | Not Null | Thời gian kết thúc dự kiến |
| 7 | status | Varchar(50) | Not Null | Trạng thái (SCHEDULED, IN_PROGRESS...) |
| 8 | departureDelayMinutes | Int(11) | Not Null | Thời gian trễ khởi hành (phút) |
| 9 | arrivalDelayMinutes | Int(11) | Not Null | Thời gian đến trễ (phút) |
| 10 | createdAt | Timestamp | Not Null | Ngày tạo |
| 11 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

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
| 9 | totalPrice | Int | Not Null | Tổng giá trị đơn hàng theo đơn vị VND |
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
| 10 | price | Int | Not Null | Giá tiền cuối cùng của riêng vé này theo đơn vị VND |
| 11 | createdAt | Timestamp | Not Null | Ngày tạo |
| 12 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

#### 2.9.2.16 Bảng `TicketSeatSegment`
Bảng `TicketSeatSegment` sẽ chứa các đoạn ga mà một vé đang chiếm dụng trên một ghế cụ thể. Bảng này dùng để chống bán trùng ghế theo chặng.

*Bảng 2.16 Mô tả bảng TicketSeatSegment*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã bản ghi chiếm dụng đoạn ghế |
| 2 | ticketId | Varchar(36) | Khóa ngoại | Vé tạo ra bản ghi chiếm dụng |
| 3 | tripId | Varchar(36) | Khóa ngoại, Unique cùng seatId và segmentIndex | Mã chuyến tàu |
| 4 | seatId | Varchar(36) | Khóa ngoại, Unique cùng tripId và segmentIndex | Mã ghế |
| 5 | segmentIndex | Int(11) | Unique cùng tripId và seatId, Not Null | Chỉ số đoạn giữa hai ga liên tiếp |
| 6 | createdAt | Timestamp | Not Null | Ngày tạo |

#### 2.9.2.17 Bảng `SeatIssueReport`
Bảng `SeatIssueReport` sẽ chứa báo cáo sự cố ghế hỏng do lái tàu gửi và trạng thái xử lý đổi ghế cho khách hàng.

*Bảng 2.17 Mô tả bảng SeatIssueReport*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã báo cáo sự cố ghế |
| 2 | tripId | Varchar(36) | Khóa ngoại | Mã chuyến tàu phát sinh sự cố |
| 3 | seatId | Varchar(36) | Khóa ngoại | Mã ghế bị báo cáo |
| 4 | issueType | Varchar(255) | Not Null | Loại sự cố ghế |
| 5 | description | Text | Not Null | Mô tả sự cố |
| 6 | reportedById | Varchar(36) | Khóa ngoại | Mã lái tàu báo cáo |
| 7 | status | Varchar(50) | Not Null | Trạng thái xử lý báo cáo |
| 8 | rejectReason | Text | Null | Lý do từ chối nếu có |
| 9 | token | Varchar(255) | Unique, Null | Token xác nhận đổi ghế của khách hàng |
| 10 | tokenExpires | Timestamp | Null | Thời gian hết hạn token |
| 11 | proposedSeatId | Varchar(36) | Khóa ngoại, Null | Ghế thay thế được đề xuất |
| 12 | createdAt | Timestamp | Not Null | Ngày tạo |
| 13 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

#### 2.9.2.18 Bảng `TripDelayReport`
Bảng `TripDelayReport` sẽ chứa báo cáo delay chuyến tàu do lái tàu gửi và kết quả duyệt của admin.

*Bảng 2.18 Mô tả bảng TripDelayReport*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :---: | :--- | :--- | :--- | :--- |
| 1 | id | Varchar(36) | Khóa chính | Mã báo cáo delay |
| 2 | tripId | Varchar(36) | Khóa ngoại | Mã chuyến tàu bị delay |
| 3 | reportedById | Varchar(36) | Khóa ngoại | Mã lái tàu báo cáo |
| 4 | type | Varchar(50) | Not Null | Loại delay (DEPARTURE, ARRIVAL) |
| 5 | minutes | Int(11) | Not Null | Số phút delay |
| 6 | reason | Text | Not Null | Lý do delay |
| 7 | status | Varchar(50) | Not Null | Trạng thái duyệt báo cáo |
| 8 | rejectReason | Text | Null | Lý do từ chối nếu có |
| 9 | reviewedAt | Timestamp | Null | Thời điểm admin duyệt/từ chối |
| 10 | createdAt | Timestamp | Not Null | Ngày tạo |
| 11 | updatedAt | Timestamp | Not Null | Ngày cập nhật |

### Ghi Chú Ràng Buộc Toàn Vẹn Dữ Liệu

- Các trường tiền tệ được lưu bằng `Int` theo đơn vị VND để tránh sai số khi tính toán tài chính.
- `Transaction.idempotencyKey` là khóa duy nhất để chống xử lý trùng giao dịch thanh toán, nạp tiền hoặc hoàn tiền.
- `TicketSeatSegment` có ràng buộc unique trên `tripId`, `seatId`, `segmentIndex`, giúp database chặn bán trùng một ghế trên cùng đoạn ga.
- `RouteStation` có ràng buộc unique trên `routeId`, `index`, đảm bảo một tuyến không có hai ga cùng thứ tự.
- Các bảng lịch sử như `Trip`, `Booking`, `Ticket`, `SeatIssueReport`, `TripDelayReport` dùng ràng buộc khóa ngoại theo hướng bảo toàn dữ liệu, không cho xóa dây chuyền làm mất lịch sử đặt vé hoặc báo cáo vận hành.
- Hệ thống có thêm unique index ở database để chặn báo cáo ghế hỏng active trùng theo `tripId`, `seatId` và báo cáo delay pending trùng theo `tripId`, `type`.
