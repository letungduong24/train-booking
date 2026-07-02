# 05 - Luồng Đặt Vé Ở Frontend

## Mục tiêu học

Hiểu toàn bộ hành trình người dùng đặt vé trên frontend: tìm chuyến, chọn chặng, chọn toa/ghế, giữ ghế, nhập hành khách, chọn phương thức thanh toán, xem kết quả và lịch sử.

File cần đọc:

- `web/app/(protected)/dashboard/booking/page.tsx`
- `web/app/(protected)/dashboard/booking/[tripId]/page.tsx`
- `web/app/(protected)/dashboard/booking/passengers/page.tsx`
- `web/app/(protected)/dashboard/booking/payment-result/page.tsx`
- `web/app/(protected)/dashboard/history/page.tsx`
- `web/app/(protected)/dashboard/history/[code]/page.tsx`
- `web/features/booking/hooks/use-search-trips.ts`
- `web/features/booking/hooks/use-init-booking.ts`
- `web/features/booking/hooks/use-booking.ts`
- `web/features/booking/hooks/use-update-booking-passengers.ts`
- `web/features/booking/hooks/use-coach-with-prices.ts`
- `web/features/booking/hooks/use-locked-seats.ts`
- `web/features/booking/components/seat-layout-viewer.tsx`
- `web/features/booking/components/bed-layout-viewer.tsx`
- `web/features/booking/components/passenger-info-form.tsx`
- `web/features/booking/components/payment-method-dialog.tsx`
- `web/features/booking/components/booking-timer.tsx`
- `web/lib/store/socket.store.ts`

## Bức tranh tổng quan

Luồng frontend đặt vé gồm 5 màn hình chính:

```text
Tìm chuyến
-> Chi tiết chuyến / chọn chặng / chọn ghế
-> Thông tin hành khách
-> Thanh toán
-> Kết quả thanh toán / lịch sử
```

Điểm đặc biệt:

- Người dùng có thể chọn một chặng con trong route.
- Ghế được hiển thị theo trạng thái từng chặng.
- Khi bấm tiếp tục, frontend không tạo vé ngay mà gọi API giữ chỗ.
- Vé chỉ xuất hiện sau khi thanh toán thành công.

## Trang tìm chuyến

File:

- `web/app/(protected)/dashboard/booking/page.tsx`

Nhiệm vụ:

- nhận ga đi, ga đến, ngày;
- gọi `useSearchTrips`;
- hiển thị danh sách trip phù hợp;
- chuyển sang trang chọn ghế với query:

```text
/dashboard/booking/{tripId}?from={fromStationId}&to={toStationId}
```

Điểm cần hiểu:

- Trang này không quyết định route có đi qua ga hay không. Backend search trip trả về danh sách đã lọc.
- Query `from` và `to` rất quan trọng vì trang chọn ghế cần biết chặng con đang đặt.

## Trang chọn ghế

File:

- `web/app/(protected)/dashboard/booking/[tripId]/page.tsx`

Nhiệm vụ chính:

- lấy `tripId`, `from`, `to` từ URL;
- hiển thị route map;
- hiển thị danh sách toa;
- lấy sơ đồ ghế kèm giá bằng `useCoachWithPrices`;
- theo dõi ghế bị lock bằng `useLockedSeats` và Socket.IO;
- quản lý `selectedSeats`;
- gọi `useInitBooking` khi người dùng bấm tiếp tục.

### Chọn chặng con

Một trip có route nhiều ga. Người dùng có thể đặt:

```text
Ga A -> Ga C
```

trong route:

```text
Ga A -> Ga B -> Ga C -> Ga D
```

Trang chọn ghế cần biết:

- `currentFromStationId`
- `currentToStationId`
- `currentFromIndex`
- `currentToIndex`

Điều kiện hợp lệ:

- ga đi và ga đến đều thuộc route;
- index ga đi nhỏ hơn index ga đến.

Khi đổi ga đi/đến, trang dùng `router.replace(..., { scroll: false })` để cập nhật URL mà không phá trải nghiệm.

### Chọn toa

Frontend gọi API lấy coach với giá:

```text
useCoachWithPrices(tripId, coachId, fromStationId, toStationId)
```

Backend trả seat list đã tính:

- trạng thái vật lý;
- trạng thái booking theo chặng;
- giá theo chặng;
- thông tin passenger nếu có quyền.

### Hiển thị seat/bed layout

Component:

- `SeatLayoutViewer`
- `BedLayoutViewer`

Các trạng thái cần phân biệt:

- ghế trống;
- ghế đã được chọn bởi người hiện tại;
- ghế đang bị người khác giữ;
- ghế đã bán trên chặng hiện tại;
- ghế disabled/maintenance.

Hàm helper:

- `web/lib/utils/seat-helper.ts`

### Realtime trong trang chọn ghế

Trang dùng socket để nghe:

- `seats.locked`
- `seats.released`
- `seats.booked`
- `seat-issues.updated`

Khi nhận event:

- refetch locked seats;
- refetch coach/seat data;
- nếu ghế đang chọn bị người khác giữ trước, có thể force deselect và hiện conflict dialog.

Điểm quan trọng:

- Socket event chỉ là tín hiệu.
- Data hiển thị vẫn nên refetch từ API để tránh lệch trạng thái.

## Gọi init booking

Khi bấm tiếp tục, frontend gửi:

```text
tripId
seatIds
fromStationId
toStationId
```

Hook:

- `useInitBooking`

Nếu thành công:

```text
router.push('/dashboard/booking/passengers?bookingCode=...')
```

Nếu lỗi:

- hiển thị thông báo lỗi từ backend;
- không tự tạo booking giả ở frontend.

## Trang nhập hành khách

File:

- `web/app/(protected)/dashboard/booking/passengers/page.tsx`

Nhiệm vụ:

- lấy `bookingCode` từ query;
- gọi `useBooking`;
- đọc `booking.metadata.seatIds` hoặc `metadata.passengers`;
- hiển thị form nhập passenger;
- validate CCCD/loại hành khách ở frontend theo schema;
- gọi `useUpdateBookingPassengers`.

Component:

- `PassengerInfoForm`
- `BookingTimer`
- `PaymentMethodDialog`

### BookingTimer

Timer dùng `booking.expiresAt`, được backend tính từ `createdAt + BOOKING_LOCK_TIME_MINUTES`.

Nếu hết hạn:

- booking có thể bị queue chuyển sang `CANCELLED`;
- frontend cần xử lý quay lại đặt vé hoặc báo đơn hết hạn.

### Payment method

Sau khi cập nhật passenger thành công, frontend mở dialog chọn:

- thanh toán bằng ví;
- thanh toán qua VNPAY.

Luồng ví:

- nhập PIN;
- gọi API wallet pay;
- backend trừ tiền, confirm booking;
- chuyển đến payment result.

Luồng VNPAY:

- backend trả payment URL;
- frontend chuyển sang VNPAY;
- VNPAY callback về backend;
- backend redirect về frontend result.

## Trang kết quả thanh toán

File:

- `web/app/(protected)/dashboard/booking/payment-result/page.tsx`

Nhiệm vụ:

- đọc query `success`, `orderId`, `code`, `error`;
- invalidate:
  - `my-bookings`;
  - `booking`;
  - wallet nếu cần;
- hiển thị thành công/thất bại;
- điều hướng về đặt vé hoặc trang chủ/dashboard.

Điểm cần nhớ:

- Sau payment callback, trạng thái có thể cần refetch.
- Nếu UI hiển thị stale status, cần invalidate query đúng key.

## Trang lịch sử và chi tiết vé

File:

- `web/app/(protected)/dashboard/history/page.tsx`
- `web/app/(protected)/dashboard/history/[code]/page.tsx`

Nhiệm vụ:

- liệt kê booking theo trạng thái;
- xem chi tiết trip, vé, hành khách;
- hiển thị bản đồ route/GPS;
- hiển thị trạng thái thanh toán;
- hỗ trợ hủy booking nếu còn pending.

## Các lỗi frontend cần hiểu

### Ghế bị giữ bởi người khác

Nguyên nhân:

- Redis lock của booking khác đang còn TTL.
- Socket event đến sau khi user đang chọn.

Frontend nên:

- bỏ chọn ghế xung đột;
- báo rõ ghế nào bị giữ;
- không cố submit lại với cùng seat.

### Lịch sử hiển thị pending sau khi thanh toán

Nguyên nhân thường gặp:

- query cache chưa invalidate;
- socket event chưa đến;
- redirect quá nhanh sau callback.

Cách xử lý đúng:

- invalidate `booking`, `my-bookings`, `wallet`;
- trang detail nên refetch khi mount;
- không hard-code status từ query.

### Booking hết hạn nhưng vẫn thấy đơn

Điều này không sai tuyệt đối. Booking có thể vẫn tồn tại trong database với trạng thái `CANCELLED`. Không nên hiểu "hết hạn" là xóa bản ghi.

## Câu hỏi tự kiểm tra

- URL chọn ghế cần query nào?
- Vì sao trang chọn ghế phải biết `fromStationId` và `toStationId`?
- Khi socket báo `seats.booked`, frontend nên làm gì?
- Khi người dùng nhập passenger xong, vé đã được tạo chưa?
- Vì sao cần `BookingTimer`?

