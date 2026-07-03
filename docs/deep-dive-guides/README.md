# Railflow Deep Dive Guides

Thư mục này dùng để học sâu các phần kỹ thuật quan trọng nhất của Railflow. Khác với bộ prompt tạo slide ở `docs/notebooklm-slides`, các tài liệu ở đây không viết để trình bày ngắn, mà để hiểu cặn kẽ cách hệ thống chạy từ frontend đến backend, database và các tình huống lỗi.

## Cách học đề xuất

1. Đọc `00-study-map.md` để nắm bản đồ tổng thể.
2. Đọc `01-architecture-and-runtime.md` để hiểu các runtime chính.
3. Đọc `02-database-domain-model.md` trước khi vào các luồng nghiệp vụ.
4. Đọc theo nhóm chức năng:
   - Hạ tầng đường sắt: `03-network-versioning-and-geojson.md`, `04-route-creation-algorithm.md`.
   - Đặt vé: `05-booking-frontend-flow.md`, `06-booking-backend-flow.md`, `07-seat-locking-and-integrity.md`.
   - Thanh toán và vé: `08-payment-wallet-ticket-email.md`, `14-ticket-pricing-and-passenger-discounts.md`.
   - Vận hành chuyến: `09-live-gps-delay-tracking.md`, `10-driver-incidents-and-seat-replacement.md`.
   - AI chatbot: `11-chatbot-tool-calling.md`.
   - Quản trị tàu/toa/ghế: `12-train-coach-seat-management.md`.
   - Ví, thanh toán và bảo mật: `15-wallet-payment-transaction-integrity.md`, `16-auth-role-security.md`.
   - Tìm chuyến xuyên phiên bản network: `17-trip-search-network-compatibility.md`.
   - Ôn bảo vệ và debug: `13-defense-qna-and-debug-map.md`.
5. Sau khi nắm luồng, đọc thư mục `code-walkthroughs` để học từng đoạn code thật:
   - `code-walkthroughs/01-booking-frontend-code.md`.
   - `code-walkthroughs/02-booking-backend-locking-code.md`.
   - `code-walkthroughs/03-route-algorithm-code.md`.
   - `code-walkthroughs/04-gps-delay-code.md`.
   - `code-walkthroughs/05-chatbot-code.md`.
   - `code-walkthroughs/06-seat-incident-code.md`.
   - `code-walkthroughs/07-coach-template-seat-map-code.md`.
   - `code-walkthroughs/08-ticket-pricing-code.md`.
   - `code-walkthroughs/09-wallet-payment-code.md`.
   - `code-walkthroughs/10-auth-role-security-code.md`.
   - `code-walkthroughs/11-trip-search-network-compat-code.md`.

## Nguyên tắc đọc code

- Không đọc theo thứ tự file trong IDE. Hãy đọc theo luồng request.
- Với mỗi luồng, luôn trả lời được 5 câu:
  - UI gọi hook hoặc API nào?
  - Controller nhận endpoint nào?
  - Service xử lý nghiệp vụ gì?
  - Database đọc/ghi bảng nào?
  - Socket/queue/email/payment có tham gia không?
- Khi gặp thuật toán, không học thuộc code. Hãy học dữ liệu đầu vào, dữ liệu đầu ra, điều kiện lỗi, và lý do từng bước tồn tại.

## Các phần tinh túy cần nắm để bảo vệ

- Network versioning giúp dữ liệu bản đồ đường sắt có thể thay đổi theo phiên bản.
- Tạo tuyến không nối thẳng các ga, mà snap vào đường ray thật từ GeoJSON và tìm đường bằng direct segment/BFS.
- Đặt vé theo chặng không chỉ khóa `seatId`; hệ thống khóa từng đoạn giữa các ga.
- Redis giữ chỗ tạm thời, PostgreSQL `TicketSeatSegment` là lớp toàn vẹn dữ liệu cuối cùng.
- Socket.IO đồng bộ trạng thái ghế và booking cho nhiều client.
- GPS giả lập dùng `Route.pathCoordinates`, thời gian chạy, tốc độ tàu và delay.
- Chatbot không tự bịa dữ liệu; khi cần dữ liệu hệ thống, nó gọi tool hoặc direct search.
- Sự cố ghế do lái tàu báo cáo có ngữ cảnh trip/seat/ticket, từ đó admin xử lý đổi ghế hoặc hoàn tiền.
- CoachTemplate giúp backend tự sinh ghế/giường theo layout; frontend render sơ đồ từ `rowIndex`, `colIndex`, `tier` và trạng thái realtime.
- Giá vé không gán cứng vào ghế, mà được tính theo chặng, đơn giá tuyến, hệ số toa/tầng và nhóm hành khách; backend chốt giá cuối và lưu vào `Ticket.price`.
- Ví điện tử dùng `Transaction`, database transaction và `idempotencyKey` để tránh trừ tiền/hoàn tiền trùng.
- Auth dùng cookie `httpOnly`, refresh token lưu DB và role guard để chặn quyền ở backend.
- Tìm chuyến hỗ trợ network versioning bằng cách resolve station theo tên ga và kiểm tra chiều bằng `RouteStation.index`.
