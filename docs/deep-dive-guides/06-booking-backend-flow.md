# 06 - Luồng Đặt Vé Ở Backend

## Mục tiêu học

Hiểu chi tiết cách backend xử lý booking: tạo giữ chỗ, cập nhật hành khách, tính giá, thanh toán, confirm booking, tạo ticket, gửi email và nhả lock.

File cần đọc:

- `api/src/modules/booking/booking.controller.ts`
- `api/src/modules/booking/booking.service.ts`
- `api/src/modules/booking/booking.processor.ts`
- `api/src/modules/booking/booking.gateway.ts`
- `api/src/modules/booking/dto/init-booking.dto.ts`
- `api/src/modules/booking/dto/update-booking-passengers.dto.ts`
- `api/src/modules/booking/interfaces/booking-metadata.interface.ts`
- `api/src/modules/pricing/pricing.service.ts`
- `api/src/modules/payment/payment.controller.ts`
- `api/src/modules/wallet/wallet.service.ts`

## Hai kiểu booking trong code

Trong `BookingService` có hai đường:

1. `initBooking`:
   - luồng hiện đại, tạo booking pending trước;
   - giữ ghế bằng Redis;
   - sau đó user nhập passenger.

2. `createBooking`:
   - luồng kiểu cũ/legacy hoặc dùng khi request đã có passenger ngay;
   - tính giá và tạo payment URL trực tiếp.

Khi học hoặc bảo vệ, nên tập trung vào luồng chính:

```text
initBooking -> updateBookingPassengers -> payment/wallet -> confirmBooking
```

## Bước 1: initBooking

Hàm:

```text
BookingService.initBooking(userId, dto, ipAddr)
```

DTO gồm:

- `tripId`
- `seatIds`
- `fromStationId`
- `toStationId`

### 1. Policy guard

Nếu có `userId`, service gọi:

```text
validateBookingPolicy(userId, tripId, seatCount)
```

Mục tiêu:

- tránh user tạo quá nhiều pending booking;
- kiểm soát chính sách đặt vé.

### 2. Load trip và route stations

Backend tìm trip:

- theo `tripId`;
- include route;
- include route stations và station.

Nếu không có trip:

- throw `Không tìm thấy chuyến tàu`.

### 3. Resolve ga đi/đến

Hàm:

```text
resolveRouteStationPair(routeId, route.stations, fromStationId, toStationId)
```

Nhiệm vụ:

- xác định ga đi/đến thực tế trong route;
- kiểm tra cùng route;
- kiểm tra đúng chiều.

Nếu không hợp lệ:

- throw `Ga đến hoặc ga đi không hợp lệ`.

### 4. Validate seat

Backend tìm seat theo `seatIds`.

Nếu số seat tìm được khác số seat gửi lên:

- throw `Một số ghế không hợp lệ`.

### 5. Kiểm tra vé đã thanh toán

Backend query `Ticket`:

```text
tripId = tripId
seatId in seatIds
booking.status = PAID
fromStationIndex < toStation.index
toStationIndex > fromStation.index
```

Điều kiện overlap:

```text
existing.from < requested.to
existing.to > requested.from
```

Đây là công thức chuẩn để kiểm tra hai khoảng giao nhau.

Nếu có ticket đã thanh toán giao chặng:

- báo ghế đã được đặt trên chặng này.

### 6. Redis lock

Với mỗi seat, tạo lock segment:

```text
seatId
fromStationIndex
toStationIndex
```

Gọi:

```text
acquireSeatSegmentLock()
```

Nếu lock thất bại:

- rollback những lock đã lấy;
- báo ghế đang được giữ bởi người khác.

### 7. Tạo booking pending

Booking được tạo:

- `status = PENDING`
- `totalPrice = 0`
- `metadata` chứa:
  - `tripId`
  - `fromStationId`
  - `toStationId`
  - `fromStationIndex`
  - `toStationIndex`
  - `seatIds`

Tại thời điểm này:

- chưa có ticket;
- chưa có passenger;
- chưa có totalPrice chính thức.

### 8. Tạo job hết hạn

BullMQ:

```text
bookingQueue.add('expire', { bookingCode }, { delay: lockTimeMs })
```

Nếu user không thanh toán trong thời gian giữ chỗ, processor sẽ cancel booking.

### 9. Emit socket

Backend emit:

- `seats.locked`
- `trip.stats_update`

Frontend khác sẽ thấy ghế đang giữ.

## Bước 2: updateBookingPassengers

Hàm:

```text
BookingService.updateBookingPassengers(code, dto, ipAddr, userId)
```

DTO gồm danh sách passenger:

- `seatId`
- `passengerName`
- `passengerId`
- `passengerGroupId`

### Kiểm tra booking

Backend phải đảm bảo:

- booking tồn tại;
- đúng user nếu có userId;
- booking còn `PENDING`;
- metadata còn đủ seatIds/trip/from/to.

### Validate passenger group

Backend lấy `PassengerGroup` theo id. Nếu thiếu group thì lỗi.

### Validate CCCD và tuổi

Service dùng:

- `validateCCCD`
- `validateCCCDAgeForGroup`

Mục tiêu:

- CCCD hợp lệ;
- tuổi khớp group, ví dụ trẻ em/người cao tuổi nếu có rule.

### Tính giá

Backend lấy:

- route base price;
- station fee;
- coach multiplier;
- tier multiplier;
- passenger discount.

Sau đó gọi:

```text
PricingService.calculateSeatPrice()
```

Input chính:

- khoảng cách từ `fromStation.distanceFromStart` đến `toStation.distanceFromStart`;
- multiplier của toa;
- multiplier của tầng;
- discountRate của passenger group.

### Cập nhật metadata

Sau khi tính giá:

- `totalPrice` được cập nhật;
- metadata có passengers chi tiết;
- booking vẫn `PENDING`.

Backend trả:

- bookingCode;
- totalPrice;
- payment URL nếu chọn VNPAY ở bước này tùy flow.

## Bước 3: thanh toán

Có hai luồng:

### VNPAY

```text
Frontend redirect VNPAY
-> VNPAY callback backend
-> verify return URL
-> update transaction
-> confirmBooking
-> redirect frontend payment-result
```

### Wallet

```text
Frontend nhập PIN
-> WalletService.payBookingWithWallet
-> trừ balance trong transaction
-> tạo transaction PAYMENT
-> confirmBooking
```

## Bước 4: confirmBooking

Hàm:

```text
BookingService.confirmBooking(bookingCode)
```

Đây là phần quan trọng nhất backend booking.

### 1. Tìm booking

Nếu không có:

- `Không tìm thấy đơn đặt chỗ`.

Nếu đã `PAID`:

- return booking, tránh confirm trùng.

Nếu không có metadata:

- lỗi metadata thiếu.

### 2. Build tickets từ metadata

Metadata passengers được chuyển thành danh sách ticket input:

- seatId;
- tripId;
- passengerName;
- passengerId;
- passengerGroupId;
- fromStationIndex;
- toStationIndex;
- price.

### 3. Kiểm tra trip còn SCHEDULED

Nếu trip không còn `SCHEDULED`:

- hoàn tiền nếu có user;
- cập nhật booking `CANCELLED`;
- báo chuyến đã khởi hành.

### 4. Kiểm tra race condition bằng Ticket

Query `Ticket` paid overlap như ở init. Đây là kiểm tra trước transaction.

Nếu có ticket trùng:

- hoàn tiền;
- booking `PAYMENT_FAILED`;
- báo ghế đã được đặt bởi người khác.

### 5. Kiểm tra Redis lock của người khác

Gọi:

```text
findOverlappingSeatLocks(tripId, tickets, bookingCode)
```

Nếu có lock của booking khác:

- hoàn tiền;
- booking `PAYMENT_FAILED`;
- báo ghế đang được giữ bởi người khác.

### 6. Transaction Serializable

Backend mở transaction với isolation:

```text
Prisma.TransactionIsolationLevel.Serializable
```

Trong transaction:

1. Update booking từ `PENDING` sang `PAID` bằng `updateMany`.
2. Nếu count = 0, kiểm tra có booking paid do callback khác xử lý chưa.
3. Tạo từng `Ticket`.
4. Build `TicketSeatSegment`.
5. `createMany` các segment.
6. Query booking đã paid để gửi receipt.

Điểm quan trọng:

- `updateMany` với điều kiện status là cách lock trạng thái booking.
- `TicketSeatSegment` unique constraint là lớp chặn cuối.
- Serializable giảm rủi ro race condition.

### 7. Xử lý P2002

Nếu Prisma lỗi unique `P2002` khi tạo segment:

- nghĩa là segment đã bị tạo bởi request khác;
- nếu booking đã paid bởi callback song song thì return paid booking;
- nếu chưa, hoàn tiền và chuyển `PAYMENT_FAILED`.

### 8. Emit socket và gửi email

Sau khi paid:

- emit `booking.status_update`;
- tạo PDF bằng `TicketService.generateBookingTicketsPDF`;
- gửi email bằng `MailService.sendBookingReceipt`;
- nếu PDF lỗi, vẫn gửi receipt không attachment như fallback;
- release Redis lock;
- emit `seats.released`;
- emit `seats.booked`;
- emit stats update.

## Bước 5: booking hết hạn

Hàm:

```text
handleBookingExpiration(bookingCode)
```

Khi queue chạy:

- tìm booking;
- nếu status vẫn `PENDING`;
- update `CANCELLED`;
- emit `booking.status_update`;
- release lock nếu còn metadata;
- emit `seats.released`;
- update trip stats.

Điểm cần nhớ:

- Redis lock có TTL, nhưng backend vẫn emit release để UI rõ ràng hơn.

## Bước 6: cancel booking

Hàm:

```text
cancelBooking(code, userId)
```

Chỉ cho hủy booking `PENDING`.

Sau khi hủy:

- status `CANCELLED`;
- release locks;
- emit status update;
- emit seats released;
- update stats.

## Các case cạnh biên

### Payment callback gọi hai lần

Backend xử lý bằng:

- nếu booking đã `PAID` thì return;
- transaction update status có điều kiện;
- nếu P2002 nhưng booking paid rồi thì return paid booking.

### User giữ ghế nhưng không nhập passenger

Queue hết hạn booking, lock được release.

### User thanh toán khi trip đã chạy

Backend hoàn tiền, cancel booking.

### Hai user cùng thanh toán gần như đồng thời

Redis giảm khả năng xảy ra. PostgreSQL unique `TicketSeatSegment` mới là lớp chặn cuối.

## Câu hỏi bảo vệ

- Vì sao không tạo `Ticket` ngay khi user chọn ghế?
- Vì sao `Booking` có metadata?
- `PENDING` khác `PAID` về mặt dữ liệu như thế nào?
- Vì sao confirm booking cần transaction?
- Vì sao phải release Redis lock sau khi paid?

