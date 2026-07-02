# Slide 16 - Results and Evaluation

## Slide Title
Kết quả đạt được và đánh giá

## NotebookLM Instruction
Create a final evaluation slide. Be honest: state achieved results, limitations, and future development. Avoid overclaiming production readiness.

## Achieved Results
- Hoàn thiện luồng đặt vé từ tìm chuyến đến thanh toán, xuất vé và lịch sử đơn hàng.
- Xây dựng mô hình dữ liệu đủ cho hạ tầng đường sắt, tuyến, tàu, toa, ghế, chuyến, vé và giao dịch.
- Giải quyết bài toán bán ghế theo chặng bằng Redis lock và `TicketSeatSegment`.
- Tạo tuyến trên bản đồ với kiểm tra đường ray thực tế thay vì nối đường thẳng.
- Mô phỏng GPS theo path tuyến, delay và tốc độ trung bình của tàu.
- Hỗ trợ phân hệ quản trị, hành khách và lái tàu.
- Tích hợp chatbot tool calling để truy vấn dữ liệu hệ thống.
- Có email xác thực, email hóa đơn, PDF vé QR, email đổi ghế/hoàn tiền.

## Limitations
- GPS là mô phỏng theo lịch trình, chưa tích hợp thiết bị GPS thật trên tàu.
- Thanh toán VNPAY đang ở môi trường sandbox.
- Dữ liệu GeoJSON phụ thuộc chất lượng dữ liệu bản đồ đầu vào.
- Chưa tối ưu toàn bộ thuật toán route path cho network cực lớn.
- Chưa có đầy đủ báo cáo BI nâng cao cho vận hành thực tế.

## Future Development
- Tích hợp GPS thật từ thiết bị hoặc API vận hành tàu.
- Nâng cấp realtime bằng room theo trip để giảm broadcast toàn hệ thống.
- Hoàn thiện phân tích doanh thu, tỷ lệ lấp đầy, dự báo nhu cầu.
- Bổ sung kiểm thử tự động cho booking concurrency, route algorithm và payment callback.
- Mở rộng quản lý chính sách hoàn vé/phí đổi vé theo thời gian khởi hành.

## Speaker Notes
Kết luận nên nhấn mạnh đồ án đã xử lý được các bài toán quan trọng nhất: tuyến đường, đặt vé theo chặng, realtime, vận hành và AI hỗ trợ. Hạn chế được trình bày như hướng phát triển hợp lý, không phủ nhận kết quả hiện tại.

## Source Evidence
- `api/prisma/schema.prisma`
- `api/src/modules/booking/booking.service.ts`
- `api/src/modules/route/utils/route-path-calculator.ts`
- `api/src/modules/trip/utils/live-location-calculator.ts`
- `api/src/modules/chatbot/chatbot.tools.ts`

