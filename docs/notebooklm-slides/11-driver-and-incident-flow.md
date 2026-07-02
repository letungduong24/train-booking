# Slide 11 - Driver Operation and Incident Handling

## Slide Title
Phân hệ lái tàu: báo trễ và xử lý sự cố ghế

## NotebookLM Instruction
Explain the driver panel and the operational workflows. Focus on real business value, not UI details.

## Main Slide Content
- Lái tàu chỉ thao tác trên các chuyến được phân công.
- Lái tàu có thể báo cáo:
  - trễ khởi hành;
  - trễ đến nơi;
  - sự cố ghế theo từng chuyến.
- Báo cáo trễ được admin duyệt/từ chối; khi duyệt, hệ thống cập nhật `departureDelayMinutes` hoặc `arrivalDelayMinutes`.
- Sự cố ghế:
  - admin xác nhận báo cáo;
  - ghế vật lý chuyển sang `DISABLED`;
  - nếu có vé bị ảnh hưởng, hệ thống tìm ghế thay thế tương đương;
  - gửi email xác nhận đổi ghế cho khách;
  - nếu không có ghế phù hợp, hệ thống hoàn tiền vào ví.

## Speaker Notes
Nêu rõ vì sao không cho admin khóa ghế trực tiếp khi đã có khách: để đổi ghế/hoàn tiền đúng hành khách, hệ thống cần ngữ cảnh trip, ticket, seat segment, email và ví. Luồng báo cáo sự cố ghế cung cấp đủ ngữ cảnh đó.

## Visual Suggestion
- Swimlane: Driver -> Admin -> System -> Passenger.
- Screenshot driver trip detail hoặc admin seat issue page.

## Source Evidence
- `api/src/modules/trip-delay-reports/trip-delay-reports.service.ts`
- `api/src/modules/seat-issues/seat-issues.service.ts`
- `api/src/modules/mail/mail.service.ts`
- `web/app/(protected)/driver/trips/[id]/page.tsx`
- `web/app/(protected)/admin/seat-issues/page.tsx`

