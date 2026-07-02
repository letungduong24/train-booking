# 00 - Bản Đồ Học Sâu Railflow

## Mục tiêu

Tài liệu này hướng dẫn cách học toàn bộ project Railflow theo luồng nghiệp vụ thay vì học rời rạc từng file. Railflow có nhiều phần giao nhau: đặt vé, bản đồ, thanh toán, realtime, email, tài khoản, lái tàu, admin. Nếu học theo thư mục sẽ rất dễ thấy rối; nếu học theo request thì mạch xử lý rõ hơn.

## Tư duy tổng thể

Railflow có thể chia thành 5 lớp:

1. Lớp giao diện:
   - Next.js App Router.
   - Các trang `web/app/(public)`, `web/app/(protected)`.
   - Các component/hook trong `web/features`.

2. Lớp gọi API và state:
   - TanStack Query dùng cho fetch/cache/invalidate.
   - Zustand dùng cho auth/socket state.
   - Socket.IO client dùng để nhận sự kiện realtime.

3. Lớp API backend:
   - NestJS controller nhận request.
   - DTO validate dữ liệu đầu vào.
   - Service xử lý nghiệp vụ.

4. Lớp dữ liệu và hạ tầng:
   - PostgreSQL lưu dữ liệu chính.
   - Prisma schema định nghĩa model, unique constraint, quan hệ.
   - Redis lưu lock tạm thời.
   - BullMQ xử lý booking hết hạn.

5. Lớp tích hợp:
   - VNPAY sandbox.
   - Resend email.
   - PDFKit + QRCode.
   - Groq/Vercel AI SDK.
   - MapLibre/Turf/GeoJSON.

## Luồng nghiệp vụ lớn

### Luồng 1: Tạo dữ liệu hạ tầng

Admin import hoặc đồng bộ dữ liệu GeoJSON. Backend tạo `Network` mới, tạo `Station` và `RailwayLine` thuộc `networkId`. Từ đó admin mới tạo `Route` bằng cách chọn các ga trên bản đồ.

File cần đọc:

- `api/src/modules/geojson/geojson.service.ts`
- `api/src/modules/route/route.service.ts`
- `api/src/modules/route/utils/route-path-calculator.ts`
- `web/features/routes/components/sync-geojson-modal.tsx`
- `web/features/routes/components/interactive-route-builder.tsx`

### Luồng 2: Tạo tuyến

Admin chọn danh sách ga theo thứ tự. Frontend gửi route station list. Backend lấy đường ray cùng network, tính path thật, tính tổng km, tính khoảng cách tích lũy cho từng ga, rồi lưu vào `Route` và `RouteStation`.

Điểm phải hiểu:

- Vì sao không nối thẳng ga bằng polyline tự vẽ.
- Vì sao phải kiểm tra từng cặp ga liên tiếp.
- Vì sao cần chống đi xuyên ga trung gian hoặc quay ngược.

### Luồng 3: Tạo tàu, toa, ghế

Admin tạo `Train`, tạo `Coach` từ `CoachTemplate`, backend tự sinh danh sách `Seat` theo layout, số hàng/cột/tầng. Đây là composition rõ nhất trong project: `Train` chứa `Coach`, `Coach` chứa `Seat`.

File cần đọc:

- `api/src/modules/train/train.service.ts`
- `api/src/modules/coaches/coaches.service.ts`
- `api/src/modules/coach-template/coach-template.service.ts`
- `web/features/trains/components/create-train-dialog.tsx`
- `web/features/trains/components/create-coach-dialog.tsx`
- `web/features/trains/components/seat-layout-viewer.tsx`
- `web/features/trains/components/bed-layout-viewer.tsx`

### Luồng 4: Tạo chuyến

Admin tạo `Trip` bằng cách chọn route, train, driver và thời gian khởi hành. Backend kiểm tra route/train/driver hợp lệ, tính `endTime`, kiểm tra xung đột lịch tàu, rồi lưu `Trip`.

File cần đọc:

- `api/src/modules/trip/trip.service.ts`
- `web/features/trips/components/create-trip-dialog.tsx`
- `web/app/(protected)/admin/trips/create/page.tsx`

### Luồng 5: Đặt vé

Hành khách tìm chuyến, chọn chặng con, chọn ghế, hệ thống giữ chỗ bằng Redis, nhập thông tin hành khách, thanh toán, rồi backend tạo `Ticket` và `TicketSeatSegment`.

File cần đọc:

- `web/app/(protected)/dashboard/booking/page.tsx`
- `web/app/(protected)/dashboard/booking/[tripId]/page.tsx`
- `web/app/(protected)/dashboard/booking/passengers/page.tsx`
- `api/src/modules/booking/booking.service.ts`
- `api/src/modules/payment/payment.controller.ts`
- `api/src/modules/wallet/wallet.service.ts`

### Luồng 6: Vận hành chuyến và GPS

Lái tàu xem chuyến được phân công. Người dùng/admin/driver xem vị trí chuyến theo GPS giả lập. Backend dùng `Route.pathCoordinates`, delay và tốc độ trung bình để nội suy vị trí.

File cần đọc:

- `api/src/modules/trip/utils/live-location-calculator.ts`
- `api/src/modules/trip/trip.service.ts`
- `web/app/(protected)/dashboard/history/[code]/page.tsx`
- `web/app/(protected)/driver/trips/[id]/page.tsx`

### Luồng 7: Sự cố ghế và delay

Driver báo trễ hoặc báo lỗi ghế. Admin duyệt. Với lỗi ghế, hệ thống disable ghế vật lý, tìm ghế thay thế nếu có, gửi email xác nhận đổi ghế; nếu không có ghế thì hoàn tiền vào ví.

File cần đọc:

- `api/src/modules/seat-issues/seat-issues.service.ts`
- `api/src/modules/trip-delay-reports/trip-delay-reports.service.ts`
- `api/src/modules/mail/mail.service.ts`
- `web/app/(protected)/driver/trips/[id]/page.tsx`
- `web/app/(protected)/admin/seat-issues/page.tsx`

### Luồng 8: Chatbot

Frontend gửi message. Backend chuẩn hóa tiếng Việt, nếu đủ ga/ngày thì direct search bằng service thật. Nếu chưa đủ thì dùng Groq model với tool calling.

File cần đọc:

- `api/src/modules/chatbot/chatbot.service.ts`
- `api/src/modules/chatbot/chatbot.tools.ts`
- `api/src/modules/chatbot/chatbot.prompt.ts`
- `web/components/chatbot/global-chatbot.tsx`
- `web/features/chatbot/components/chat-tool-part.tsx`

## Cách tự kiểm tra đã hiểu chưa

Sau khi học xong, cần tự giải thích được các câu sau:

- Một ghế G12 có thể bán cho hai người trên cùng chuyến không? Khi nào được, khi nào không?
- Vì sao Redis lock không đủ để chứng minh toàn vẹn dữ liệu?
- `TicketSeatSegment` khác `Ticket` ở điểm nào?
- Khi admin tạo tuyến, dữ liệu nào chứng minh tuyến bám theo đường ray?
- Khi delay khởi hành 30 phút và delay đến nơi 20 phút, GPS và giờ hiển thị thay đổi thế nào?
- Chatbot tìm chuyến bằng LLM hay bằng dữ liệu thật?
- Khi ghế hỏng mà không còn ghế thay thế, hệ thống xử lý tiền thế nào?

