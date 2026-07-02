# Slide 02 - Reason for Choosing the Topic and Objectives

## Slide Title
Lý do chọn đề tài và mục tiêu xây dựng hệ thống

## NotebookLM Instruction
Explain why this topic is meaningful and list project objectives. Avoid generic claims. Tie every objective to actual project modules.

## Main Slide Content
- Nhu cầu số hóa quy trình đặt vé tàu đòi hỏi hệ thống xử lý được tìm kiếm chuyến, chọn chỗ, thanh toán và lưu vé điện tử.
- Bài toán đặt vé theo chặng phức tạp hơn đặt ghế thông thường vì cùng một ghế có thể bán lại ở các đoạn không giao nhau.
- Quản lý đường sắt cần dữ liệu cơ sở hạ tầng: network, ga, đường ray, tuyến thương mại, tàu, toa, ghế.
- Mục tiêu kỹ thuật: đảm bảo toàn vẹn dữ liệu đặt vé, hỗ trợ thao tác thời gian thực, mô phỏng GPS hành trình và tích hợp trợ lý AI.
- Mục tiêu nghiệp vụ: hỗ trợ hành khách đặt vé, admin quản trị hệ thống, lái tàu báo cáo sự cố và trễ chuyến.

## Speaker Notes
Nhấn mạnh điểm khó của đề tài: không phải chỉ là CRUD, mà là kết hợp bán vé, quản lý hạ tầng, thuật toán tuyến đường, concurrency và vận hành chuyến tàu.

## Visual Suggestion
- 4 ô mục tiêu: Đặt vé, Hạ tầng, Vận hành, AI/Realtime.
- Có thể dùng biểu tượng: vé, bản đồ, tàu, chatbot.

## Source Evidence
- `api/prisma/schema.prisma`
- `api/src/modules/booking/booking.service.ts`
- `api/src/modules/route/utils/route-path-calculator.ts`
- `api/src/modules/trip/utils/live-location-calculator.ts`
- `api/src/modules/chatbot/chatbot.tools.ts`

