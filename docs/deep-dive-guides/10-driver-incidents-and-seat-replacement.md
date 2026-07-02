# 10 - Driver, Sự Cố Ghế, Đổi Ghế Và Hoàn Tiền

## Mục tiêu học

Hiểu phân hệ lái tàu và luồng xử lý sự cố ghế: driver báo cáo, admin duyệt, hệ thống khóa ghế vật lý, tìm ghế thay thế theo chặng, gửi email xác nhận đổi ghế hoặc hoàn tiền.

File cần đọc:

- `api/src/modules/seat-issues/seat-issues.service.ts`
- `api/src/modules/seat-issues/seat-issues.controller.ts`
- `api/src/modules/trip-delay-reports/trip-delay-reports.service.ts`
- `api/src/modules/trip-delay-reports/trip-delay-reports.controller.ts`
- `api/src/modules/mail/mail.service.ts`
- `api/src/modules/booking/booking.gateway.ts`
- `web/app/(protected)/driver/trips/page.tsx`
- `web/app/(protected)/driver/trips/[id]/page.tsx`
- `web/app/(protected)/admin/seat-issues/page.tsx`
- `web/app/(protected)/admin/delay-reports/page.tsx`

## Phân quyền driver

Driver là `User` có role `DRIVER`. Một trip có thể gán:

```text
Trip.driverId -> User.id
```

Driver chỉ được thao tác trên trip được phân công.

Trong service:

```text
getDriverTripDetail(tripId, driverId)
```

query bằng:

```text
where: { id: tripId, driverId }
```

Nếu không có:

- báo không tìm thấy chuyến hoặc không được phân công.

## Điều kiện được báo cáo sự cố

Hàm:

```text
isTripReportable(trip)
```

Logic:

- trip phải `SCHEDULED` hoặc `IN_PROGRESS`;
- thời điểm hiện tại chưa vượt quá actual end time;
- actual end time = `endTime + departureDelayMinutes + arrivalDelayMinutes`.

Điểm cần nhớ:

- Delay cũng ảnh hưởng đến thời gian cho phép báo cáo.
- Chuyến đã kết thúc không nên cho báo sự cố mới.

## Driver báo cáo ghế hỏng

Hàm:

```text
createDriverIssue(driverId, data)
```

Input:

- `tripId`
- `seatId`
- `issueType`
- `description`

Backend kiểm tra:

1. Trip tồn tại.
2. Driver đúng là người được phân công.
3. Trip còn reportable.
4. Seat tồn tại.
5. Seat thuộc train của trip.
6. Chưa có report mở cho cùng trip/seat.

Nếu hợp lệ:

- tạo `SeatIssueReport` status `PENDING`;
- emit `seat-issues.updated`.

## Vì sao admin không nên khóa ghế chủ động thiếu ngữ cảnh

Nếu admin chỉ khóa `Seat.status = DISABLED` ở cấp ghế vật lý, hệ thống không biết:

- khóa do trip nào;
- khách nào bị ảnh hưởng;
- chặng nào bị ảnh hưởng;
- có cần đổi ghế hay hoàn tiền không;
- gửi email cho ai.

Luồng driver issue có đủ ngữ cảnh:

- `tripId`
- `seatId`
- ticket paid liên quan;
- passenger;
- booking/user email;
- segment đang chiếm.

Vì vậy xử lý sự cố ghế nên đi qua `SeatIssueReport`.

## Admin xác nhận sự cố

Khi admin xác nhận:

1. Update report status.
2. Update `Seat.status = DISABLED`.
3. Tìm vé bị ảnh hưởng.
4. Nếu có vé:
   - tìm ghế thay thế;
   - tạo token xác nhận;
   - gửi email khách.
5. Nếu không có ghế thay thế:
   - hoàn tiền;
   - gửi email hoàn tiền.

## Tìm ghế thay thế

Ghế thay thế phải thỏa:

- cùng trip/train;
- không phải ghế hỏng;
- không disabled/maintenance;
- không bị ticket paid khác chiếm trên cùng chặng;
- phù hợp layout/toa/tầng nếu service có ràng buộc tương đương;
- tốt nhất cùng coach type hoặc cùng template nếu có thể.

Điểm quan trọng:

- Không chỉ tìm seat trống toàn chuyến.
- Phải kiểm tra overlap theo `TicketSeatSegment` hoặc ticket from/to.

## Email xác nhận đổi ghế

Report lưu:

- `token`
- `tokenExpires`
- `proposedSeatId`
- `status = WAITING_CUSTOMER_CONFIRMATION`

Mail gửi link cho khách xác nhận.

Lý do cần token:

- khách không cần đăng nhập ngay;
- link có hạn;
- tránh người khác xác nhận thay.

## Khách xác nhận đổi ghế

Khi khách mở link:

1. Backend kiểm tra token còn hạn.
2. Report còn `WAITING_CUSTOMER_CONFIRMATION`.
3. Proposed seat còn hợp lệ.
4. Transaction:
   - update `Ticket.seatId`;
   - xóa/free segment ghế cũ;
   - tạo `TicketSeatSegment` mới cho ghế mới;
   - update report `RESOLVED`.
5. Emit socket để seat map cập nhật.

Điểm cần nhớ:

- Đổi ghế không chỉ update `Ticket.seatId`.
- Phải cập nhật `TicketSeatSegment`, nếu không database vẫn giữ ghế cũ.

## Hoàn tiền khi không có ghế

Nếu không tìm được ghế thay thế:

- gọi `WalletService.refundToWallet`;
- update report resolved/rejected tùy policy;
- gửi email thông báo hoàn tiền.

Ý nghĩa nghiệp vụ:

- khách không bị mất tiền;
- hệ thống có transaction refund để đối soát.

## Delay report

Driver báo trễ bằng `TripDelayReport`.

Input:

- `tripId`
- `type`: `DEPARTURE` hoặc `ARRIVAL`
- `minutes`
- `reason`

Admin duyệt:

- update report `APPROVED`;
- update trip delay minutes.

Admin từ chối:

- update report `REJECTED`;
- lưu `rejectReason`.

## Realtime sau sự cố

Sau khi issue tạo hoặc xử lý:

- backend emit `seat-issues.updated`;
- frontend refetch seat map;
- ghế disabled đổi màu;
- khách/admin/driver thấy trạng thái mới.

## Case lỗi cần hiểu

### Driver báo ghế không thuộc tàu

Backend từ chối bằng kiểm tra `seat.coach.trainId !== trip.trainId`.

### Driver gửi trùng report

Nếu đã có report `PENDING` hoặc `WAITING_CUSTOMER_CONFIRMATION`, backend báo conflict.

### Token hết hạn

Không cho xác nhận đổi ghế.

### Proposed seat bị người khác chiếm trước khi khách xác nhận

Backend phải kiểm tra lại trước transaction. Nếu không còn hợp lệ, cần tìm lại hoặc hoàn tiền tùy policy.

## Câu hỏi bảo vệ

- Vì sao sự cố ghế phải gắn với trip?
- Vì sao không chỉ update `Seat.status`?
- Đổi ghế cần cập nhật những bảng nào?
- Nếu không có ghế thay thế thì hệ thống làm gì?
- Delay ảnh hưởng đến quyền báo cáo sự cố thế nào?

