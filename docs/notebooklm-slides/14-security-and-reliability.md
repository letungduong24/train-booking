# Slide 14 - Security, Reliability and Data Safety

## Slide Title
Bảo mật và độ tin cậy trong hệ thống

## NotebookLM Instruction
Create a slide about non-functional concerns that are actually implemented: auth, role, email verification, wallet PIN, transaction idempotency, booking expiration, DB constraints.

## Main Slide Content
- Xác thực:
  - email/password;
  - Google OAuth;
  - JWT access/refresh token;
  - email verification.
- Phân quyền:
  - USER, ADMIN, DRIVER;
  - driver chỉ xử lý chuyến được phân công.
- Ví điện tử:
  - mã PIN hash bằng bcrypt;
  - nạp/rút/thanh toán/hoàn tiền qua transaction log;
  - idempotency key chống tạo giao dịch trùng.
- Đặt vé:
  - Redis TTL + BullMQ hết hạn đơn;
  - PostgreSQL unique constraint cho segment ghế;
  - transaction khi tạo vé/đổi ghế/hoàn tiền.
- Email và PDF vé giúp người dùng nhận bằng chứng giao dịch sau thanh toán.

## Speaker Notes
Đây là phần chứng minh hệ thống có suy nghĩ về rủi ro thực tế: double payment, double booking, mất phiên đăng nhập, quên PIN, đơn treo, ghế lỗi sau khi khách đã mua vé.

## Visual Suggestion
- 4 lớp bảo vệ: Auth/Role, Redis TTL, DB constraints, Idempotency/Transaction.

## Source Evidence
- `api/src/modules/auth/auth.service.ts`
- `api/src/modules/wallet/wallet.service.ts`
- `api/src/modules/booking/booking.service.ts`
- `api/prisma/schema.prisma`
- `api/src/modules/payment/payment.service.ts`

