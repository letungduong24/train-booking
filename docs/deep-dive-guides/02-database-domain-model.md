# 02 - Database Và Domain Model

## Mục tiêu học

Hiểu các bảng chính trong Prisma schema, vì sao có bảng trung gian, quan hệ nào là composition, quan hệ nào là association, và bảng nào đảm bảo toàn vẹn dữ liệu trong nghiệp vụ đặt vé.

File chính:

- `api/prisma/schema.prisma`

## Nhóm người dùng và bảo mật

### User

`User` lưu tài khoản hành khách, admin và driver.

Trường quan trọng:

- `email`, `phone`, `googleId`: các định danh unique.
- `password`: nullable để hỗ trợ Google OAuth.
- `role`: `USER`, `ADMIN`, `DRIVER`.
- `isEmailVerified`, `verificationToken`: xác thực email.
- `passwordResetToken`, `walletPinResetToken`: reset mật khẩu/PIN.
- `balance`, `walletPin`: ví nội bộ.
- `isBanned`: khóa tài khoản.

Quan hệ:

- Một user có nhiều `Booking`.
- Một user có nhiều `Transaction`.
- Driver là user được gắn vào `Trip.driverId`.
- User có thể tạo `SeatIssueReport` và `TripDelayReport`.

### RefreshToken

Lưu refresh token theo user. Có `onDelete: Cascade` nên nếu user bị xóa thì refresh token bị xóa theo.

## Nhóm ví và giao dịch

### Transaction

Mỗi biến động tiền là một transaction.

Trường quan trọng:

- `amount`: số tiền VND, có thể cộng hoặc trừ tùy type.
- `type`: `DEPOSIT`, `WITHDRAW`, `PAYMENT`, `REFUND`.
- `status`: `PENDING`, `COMPLETED`, `FAILED`, `CANCELLED`.
- `referenceId`: liên kết nghiệp vụ, ví dụ booking code.
- `idempotencyKey`: unique để tránh xử lý trùng callback/thanh toán/hoàn tiền.

Điểm cần nhớ:

- Không nên chỉ thay đổi `User.balance` mà không ghi `Transaction`.
- `Transaction` là nhật ký tài chính để kiểm tra sau này.

## Nhóm bản đồ đường sắt

### Network

`Network` đại diện cho một phiên bản bản đồ đường sắt.

Trường quan trọng:

- `version`: unique.
- `stations`: danh sách ga thuộc network.
- `lines`: đường ray vật lý thuộc network.
- `routes`: route thương mại thuộc network.

Ý nghĩa:

- Khi dữ liệu bản đồ thay đổi, hệ thống có thể tạo network version mới thay vì sửa trực tiếp dữ liệu cũ.

### Station

Ga thuộc một network.

Unique:

- `@@unique([code, networkId])`

Điều này cho phép cùng mã ga có thể tồn tại ở network version khác nhau.

### RailwayLine

Đường ray vật lý. Trường `pathCoordinates` lưu tọa độ GeoJSON.

Điểm quan trọng:

- Route thương mại không tự bịa đường đi; route phải tính từ các railway line này.

### Route

Tuyến thương mại.

Trường quan trọng:

- `code`, `version`: unique theo cặp.
- `networkId`: route thuộc network nào.
- `pathCoordinates`: đường tuyến đã tính và bám theo đường ray.
- `totalDistanceKm`: tổng km.
- `durationMinutes`, `turnaroundMinutes`: phục vụ tạo trip.
- `basePricePerKm`, `stationFee`: phục vụ tính giá.

### RouteStation

Bảng nối `Route` và `Station`.

Trường quan trọng:

- `index`: thứ tự ga trong route.
- `distanceFromStart`: km tích lũy từ ga đầu.
- `durationFromStart`: thời gian tích lũy.

Primary key:

- `@@id([routeId, stationId])`

Unique:

- `@@unique([routeId, index])`

Ý nghĩa:

- Một route không được có hai ga cùng index.
- Giá vé theo chặng lấy khoảng cách từ `distanceFromStart` của ga đi và ga đến.

## Nhóm tàu, toa, ghế

### CoachTemplate

Mẫu toa. Ví dụ toa ghế, toa giường, số hàng, số cột, số tầng.

Trường giá:

- `coachMultiplier`
- `tierMultipliers`

### Train

Tàu vật lý.

Quan hệ:

- Một train có nhiều coach.
- Một train được dùng trong nhiều trip.

### Coach

Toa thuộc train.

Quan hệ:

- `trainId` có `onDelete: Cascade`, thể hiện composition: train mất thì coach mất.
- Coach có nhiều seat.

### Seat

Ghế/giường thuộc coach.

Unique:

- `@@unique([coachId, rowIndex, colIndex, tier])`

Ý nghĩa:

- Trong một toa, không thể có hai ghế cùng vị trí hàng/cột/tầng.

Composition:

- Train chứa Coach.
- Coach chứa Seat.

## Nhóm chuyến và đặt vé

### Trip

Chuyến chạy cụ thể của một train trên một route tại một thời điểm.

Trường quan trọng:

- `routeId`
- `trainId`
- `driverId`
- `departureTime`
- `endTime`
- `status`
- `departureDelayMinutes`
- `arrivalDelayMinutes`

Điểm cần nhớ:

- Delay không ghi đè giờ gốc. Delay được lưu riêng để hiển thị giờ gốc và giờ sau delay.

### Booking

Đơn đặt chỗ tổng.

Trạng thái:

- `PENDING`: đang giữ chỗ/chờ thanh toán.
- `PAID`: đã thanh toán, đã tạo vé.
- `CANCELLED`: đã hủy/hết hạn.
- `PAYMENT_FAILED`: thanh toán lỗi hoặc race condition.

`metadata` dùng trong giai đoạn pending:

- lưu tripId;
- ga đi/đến;
- seatIds;
- passenger data tạm;
- from/to station index.

Sau khi confirm thành công, metadata có thể được xóa để giảm dữ liệu tạm.

### Ticket

Vé lẻ của từng hành khách.

Trường quan trọng:

- `bookingId`
- `tripId`
- `seatId`
- `passengerGroupId`
- `fromStationIndex`
- `toStationIndex`
- `price`

Ticket cho biết hành khách nào ngồi ghế nào từ ga nào đến ga nào.

### TicketSeatSegment

Bảng khóa đoạn ghế chính thức sau thanh toán.

Trường quan trọng:

- `ticketId`
- `tripId`
- `seatId`
- `segmentIndex`

Unique:

- `@@unique([tripId, seatId, segmentIndex])`

Ý nghĩa:

- Đây là lớp chặn cuối ở database.
- Một ghế trên cùng một trip không thể bị bán trùng cùng một đoạn.
- Nếu hai vé dùng cùng ghế nhưng segment không giao nhau, dữ liệu vẫn hợp lệ.

Ví dụ:

```text
Route: ga 1 -> ga 2 -> ga 3 -> ga 4

Vé A: ga 1 -> ga 3
TicketSeatSegment:
- segment 1
- segment 2

Vé B: ga 3 -> ga 4
TicketSeatSegment:
- segment 3

Vé A và B có thể cùng seatId vì không trùng segment.
```

## Nhóm sự cố vận hành

### SeatIssueReport

Driver báo ghế hỏng theo trip.

Trường quan trọng:

- `tripId`
- `seatId`
- `reportedById`
- `status`
- `proposedSeatId`
- `token`, `tokenExpires`

Luồng chính:

- Driver tạo report.
- Admin xác nhận.
- Hệ thống disable ghế.
- Nếu có khách bị ảnh hưởng, tìm ghế thay thế.
- Gửi email token để khách xác nhận đổi ghế.
- Nếu không có ghế thay thế, hoàn tiền.

### TripDelayReport

Driver báo trễ.

Trường quan trọng:

- `type`: `DEPARTURE` hoặc `ARRIVAL`.
- `minutes`
- `status`
- `reviewedAt`

Admin duyệt thì cập nhật delay vào `Trip`.

## Điểm cần nói khi bảo vệ

- `TicketSeatSegment` là bảng quan trọng nhất để chứng minh không bán trùng ghế theo chặng.
- `RouteStation.distanceFromStart` giúp tính giá chính xác theo ga đi/đến.
- `Network` giúp dữ liệu bản đồ có versioning.
- Composition chỉ rõ ở các quan hệ sở hữu vật lý như train -> coach -> seat. Các quan hệ nghiệp vụ còn lại chủ yếu là association và được bảo vệ bằng service/constraint.

