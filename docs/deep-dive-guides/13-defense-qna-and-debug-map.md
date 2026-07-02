# 13 - Câu Hỏi Bảo Vệ Và Bản Đồ Debug

## Mục tiêu

Tài liệu này gom các câu hỏi dễ gặp khi bảo vệ và cách lần ngược code khi debug lỗi lớn.

## Câu hỏi về toàn vẹn đặt vé

### Hỏi: Hệ thống chống bán trùng ghế thế nào?

Trả lời ngắn:

Railflow dùng hai lớp. Redis giữ ghế tạm thời trong giai đoạn booking pending, có TTL và realtime event. Sau thanh toán, hệ thống tạo `TicketSeatSegment` trong PostgreSQL với unique constraint `tripId + seatId + segmentIndex`, đây là lớp chặn cuối để không bán trùng ghế theo chặng.

File dẫn chứng:

- `api/src/modules/booking/booking.service.ts`
- `api/prisma/schema.prisma`

### Hỏi: Vì sao không unique `tripId + seatId`?

Vì cùng một ghế có thể bán cho nhiều hành khách nếu chặng không giao nhau. Unique theo cả `segmentIndex` mới đúng nghiệp vụ tàu hỏa.

## Câu hỏi về route algorithm

### Hỏi: Tạo tuyến có nối thẳng các ga không?

Không. Backend lấy `RailwayLine.pathCoordinates`, snap ga vào đường ray, ưu tiên direct segment, nếu không được thì BFS qua các segment nối nhau. Kết quả lưu vào `Route.pathCoordinates`.

### Hỏi: Grid index để làm gì?

Để giảm số segment cần xét khi snap ga. Nếu không có grid index, mỗi cặp ga phải duyệt toàn bộ đường ray, performance kém.

## Câu hỏi về GPS

### Hỏi: GPS có phải dữ liệu thật không?

Không phải thiết bị GPS thật. Đây là GPS giả lập dựa trên `Route.pathCoordinates`, thời gian, tốc độ trung bình của tàu và delay. Mục đích là mô phỏng theo dõi hành trình trong phạm vi đồ án.

### Hỏi: Delay xử lý thế nào?

`departureDelayMinutes` làm lùi thời điểm bắt đầu chạy. `arrivalDelayMinutes` làm kéo dài thời lượng đến nơi. Giờ gốc vẫn giữ để hiển thị so sánh.

## Câu hỏi về chatbot

### Hỏi: Chatbot có tự bịa lịch tàu không?

Không. Khi câu hỏi có dữ liệu ga/ngày rõ ràng, backend direct search bằng service thật. Khi dùng LLM, system prompt ép model gọi tool để lấy dữ liệu hệ thống.

## Câu hỏi về email/PDF

### Hỏi: Khi nào gửi email vé?

Sau khi booking confirm `PAID`, backend tạo PDF vé bằng `TicketService`, rồi gửi email receipt bằng `MailService`.

### Hỏi: Nếu gửi email lỗi thì booking có rollback không?

Không nên rollback booking đã thanh toán chỉ vì email lỗi. Backend log lỗi và có fallback gửi receipt không attachment nếu PDF lỗi.

## Câu hỏi về sự cố ghế

### Hỏi: Vì sao không cho admin khóa ghế trực tiếp khi đã có khách?

Khóa ghế trực tiếp thiếu ngữ cảnh trip/ticket/passenger, không biết khách nào bị ảnh hưởng để đổi ghế hoặc hoàn tiền. Luồng đúng là driver báo sự cố ghế theo trip, admin duyệt, hệ thống tìm vé bị ảnh hưởng rồi đổi ghế hoặc hoàn tiền.

## Bản đồ debug nhanh

### Lỗi đặt vé báo ghế bị giữ

Kiểm tra:

1. Redis lock còn không.
2. `getLockedSeats` có lọc đúng chặng không.
3. Booking pending cũ đã hết hạn chưa.
4. Socket event có release không.
5. `TicketSeatSegment` có segment paid thật không.

File:

- `booking.service.ts`
- `booking.processor.ts`
- `booking.gateway.ts`
- `use-locked-seats.ts`

### Lỗi thanh toán xong lịch sử vẫn pending

Kiểm tra:

1. Payment callback có gọi `confirmBooking` không.
2. Booking status trong DB là gì.
3. Frontend invalidate query nào.
4. Trang history detail có refetch khi mount không.
5. Socket `booking.status_update` có emit không.

### Lỗi route báo sai đoạn

Kiểm tra:

1. Thứ tự routeStations gửi lên.
2. `calculateRoutePath` duyệt pair nào.
3. `findDirectSegment` fail hay `findConnectedSegment` fail.
4. `hasIntermediateOverlap` có bắt sai không.
5. Network line có thuộc đúng `networkId` không.

### Lỗi GPS không cộng delay

Kiểm tra:

1. Backend snapshot có trả delay minutes không.
2. `calculateLiveLocationSnapshot` có cộng departure/arrival delay không.
3. Frontend helper hiển thị giờ có dùng cùng logic không.
4. Có màn hình nào tự format giờ riêng không.

### Lỗi PDF không đính kèm production

Kiểm tra:

1. Log `generateBookingTicketsPDF`.
2. Font/path trong container.
3. Buffer PDF có size > 0 không.
4. `sendBookingReceipt` có nhận attachment không.
5. Resend API key/domain có hợp lệ không.

## Thứ tự nói khi bảo vệ demo

1. Vào trang chủ/tìm chuyến.
2. Chọn route có nhiều ga để chứng minh đặt vé theo chặng.
3. Chọn ghế và mở thêm tab để thấy realtime lock.
4. Thanh toán bằng ví để nhanh.
5. Xem lịch sử, PDF/QR.
6. Vào admin route creation để nói network versioning và thuật toán.
7. Vào driver trip detail để nói GPS/delay/incident.
8. Mở chatbot hỏi tìm chuyến bằng tiếng Việt.

