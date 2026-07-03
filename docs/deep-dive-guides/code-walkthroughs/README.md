# Code Walkthroughs - Học Railflow Bằng Code Thật

Thư mục này bổ sung cho `docs/deep-dive-guides`. Các file ở đây không chỉ mô tả nghiệp vụ, mà trích trực tiếp các đoạn code quan trọng rồi giải thích chi tiết từng khối.

## Cách đọc

1. Đọc đoạn nghiệp vụ trước để biết code đang giải quyết bài toán gì.
2. Đọc snippet code.
3. Đọc phần giải thích ngay dưới snippet.
4. Mở file gốc trong IDE và đối chiếu.
5. Tự trả lời phần "Tự kiểm tra".

## Danh sách walkthrough

1. `01-booking-frontend-code.md` - frontend chọn chặng, chọn ghế, gọi giữ chỗ.
2. `02-booking-backend-locking-code.md` - backend giữ ghế, cập nhật passenger, confirm booking, Redis/PostgreSQL.
3. `03-route-algorithm-code.md` - thuật toán tạo tuyến bằng snap, grid index, BFS.
4. `04-gps-delay-code.md` - GPS giả lập, progress, delay, nội suy polyline.
5. `05-chatbot-code.md` - chatbot direct search, normalize tiếng Việt, tool calling.
6. `06-seat-incident-code.md` - driver báo ghế hỏng, admin xử lý đổi ghế/hoàn tiền.
7. `07-coach-template-seat-map-code.md` - CoachTemplate, tự động sinh ghế/giường và render sơ đồ ghế trên frontend.
8. `08-ticket-pricing-code.md` - tính giá theo chặng, hệ số toa/tầng, nhóm hành khách và lưu giá chốt vào `Ticket.price`.
9. `09-wallet-payment-code.md` - ví điện tử, VNPAY, idempotency, refund và toàn vẹn giao dịch.
10. `10-auth-role-security-code.md` - đăng ký, verify email, cookie JWT, refresh token rotation, Google OAuth và role guard.
11. `11-trip-search-network-compat-code.md` - tìm chuyến theo ga xuyên phiên bản network và resolve station khi đặt vé.
