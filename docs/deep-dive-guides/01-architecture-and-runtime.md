# 01 - Kiến Trúc Và Runtime

## Mục tiêu học

Hiểu Railflow chạy bằng những thành phần nào, mỗi thành phần giữ vai trò gì, request đi qua đâu và dữ liệu realtime được đẩy bằng cách nào.

## Kiến trúc tổng quan

Railflow là ứng dụng full-stack:

- Frontend: Next.js 16, React 19, TypeScript.
- Backend: NestJS 11.
- Database: PostgreSQL qua Prisma.
- Cache/lock/queue: Redis và BullMQ.
- Realtime: Socket.IO.
- Bản đồ: MapLibre ở frontend, Turf/GeoJSON ở backend.
- Email/PDF: Resend, PDFKit, QRCode.
- AI: Vercel AI SDK, Groq provider.

## Frontend runtime

### App Router

Các route chính nằm trong `web/app`:

- `(public)`: các trang không cần đăng nhập như trang chủ, tìm kiếm công khai, xác thực email.
- `(protected)`: các trang cần đăng nhập như dashboard hành khách, admin, driver.
- `dashboard/booking`: luồng đặt vé.
- `admin/routes`, `admin/trains`, `admin/trips`: quản trị hạ tầng và vận hành.
- `driver/trips`: khu vực lái tàu.

### Feature module

Code UI nghiệp vụ nằm trong `web/features`:

- `features/booking`: hook và component đặt vé.
- `features/routes`: bản đồ tuyến, tạo tuyến, đồng bộ GeoJSON.
- `features/trains`: tạo tàu/toa/ghế.
- `features/trips`: tạo chuyến, báo delay.
- `features/wallet`: ví điện tử.
- `features/chatbot`: hiển thị kết quả tool calling.

### API client và cache

Frontend thường đi qua:

- `web/lib/api-client.ts` để cấu hình gọi API.
- TanStack Query hooks, ví dụ:
  - `useSearchTrips`
  - `useInitBooking`
  - `useBooking`
  - `useCoachWithPrices`
  - `useLockedSeats`
  - `useWallet`

Mỗi hook giữ một query key riêng. Khi có realtime event hoặc mutation thành công, frontend invalidate query để lấy dữ liệu mới.

### Socket frontend

Socket state nằm ở:

- `web/lib/store/socket.store.ts`
- `web/lib/socket.ts`
- `web/app/layout.tsx` hoặc provider khởi tạo socket.

Các event quan trọng:

- `seats.locked`
- `seats.released`
- `seats.booked`
- `booking.status_update`
- `trip.stats_update`
- `seat-issues.updated`

## Backend runtime

### AppModule

File `api/src/app.module.ts` gom các module:

- `AuthModule`
- `BookingModule`
- `PaymentModule`
- `WalletModule`
- `RouteModule`
- `GeojsonModule`
- `TripModule`
- `SeatIssuesModule`
- `TripDelayReportsModule`
- `ChatbotModule`
- `MailModule`
- `DashboardModule`

`ScheduleModule` dùng cho tác vụ định kỳ. `BullModule` cấu hình queue với Redis.

### Controller - Service - Prisma

Một request backend thường đi theo chuỗi:

```text
HTTP request
-> Controller
-> DTO validation
-> Service
-> PrismaService / Redis / Queue / Socket / Mail
-> Response
```

Ví dụ đặt vé:

```text
POST /booking/init
-> BookingController
-> InitBookingDto
-> BookingService.initBooking()
-> Prisma kiểm tra trip/seat
-> Redis lock
-> BullMQ expire job
-> BookingGateway emit seats.locked
```

## Redis và BullMQ

Redis trong Railflow có hai vai trò lớn:

1. Lưu lock giữ ghế tạm thời:
   - lock có TTL.
   - lock theo trip, seat, from/to segment.

2. Là backend cho BullMQ:
   - queue `booking` xử lý đơn hết hạn.
   - khi booking hết hạn, backend chuyển `PENDING` sang `CANCELLED`, nhả lock và emit socket.

## Socket.IO Gateway

Backend dùng `BookingGateway` để phát event realtime. Đây là cầu nối giữa nghiệp vụ backend và giao diện đang mở ở nhiều máy.

Điểm quan trọng:

- Socket không thay thế database.
- Socket chỉ thông báo trạng thái thay đổi.
- Frontend vẫn phải refetch dữ liệu khi event quan trọng xảy ra.

## Các tích hợp ngoài

### VNPAY

`PaymentService` tạo URL thanh toán. `PaymentController` nhận callback return URL, verify chữ ký, cập nhật transaction/booking.

### Wallet

`WalletService` quản lý:

- thiết lập PIN;
- thanh toán bằng ví;
- nạp/rút tiền;
- hoàn tiền;
- idempotency key để tránh cộng/trừ tiền hai lần.

### Mail và PDF

`TicketService` tạo PDF vé. `MailService` gửi email xác nhận, email biên lai, email đổi ghế, email hoàn tiền.

## Điểm cần nhớ khi bảo vệ

- Kiến trúc không chỉ là frontend/backend/database. Điểm mạnh của Railflow nằm ở việc phối hợp nhiều lớp: Redis, PostgreSQL, Socket.IO, BullMQ, email, PDF và AI.
- Với các chức năng rủi ro cao như đặt vé, dữ liệu chính thức luôn nằm ở PostgreSQL; Redis chỉ phục vụ trạng thái ngắn hạn.
- Socket giúp trải nghiệm realtime nhưng không được dùng làm nguồn sự thật.

