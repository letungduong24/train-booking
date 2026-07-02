# Slide 09 - Dynamic Pricing, Payment and E-ticket

## Slide Title
Tính giá động, thanh toán và vé điện tử

## NotebookLM Instruction
Explain pricing, payment, and ticket generation. Keep it tied to the code: PricingService, WalletService, PaymentService, TicketService, MailService.

## Main Slide Content
- Giá vé phụ thuộc vào:
  - khoảng cách giữa ga đi và ga đến;
  - `basePricePerKm` và `stationFee` của route;
  - hệ số loại toa (`coachMultiplier`);
  - hệ số tầng ghế/giường (`tierMultipliers`);
  - giảm giá theo `PassengerGroup`.
- Thanh toán hỗ trợ:
  - VNPAY sandbox với kiểm tra chữ ký HMAC SHA512;
  - ví nội bộ có mã PIN, nạp tiền, rút tiền, thanh toán và hoàn tiền.
- Sau thanh toán:
  - booking chuyển sang `PAID`;
  - tạo `Ticket`, `TicketSeatSegment`;
  - sinh QR Code và PDF vé;
  - gửi email hóa đơn kèm PDF.

## Speaker Notes
Nói rõ thanh toán không chỉ là redirect. Khi callback VNPAY hoặc ví thành công, backend vẫn phải confirm booking, kiểm tra race condition, tạo vé và gửi email. Nếu confirm thất bại, ví có cơ chế hoàn tiền.

## Visual Suggestion
- Screenshot payment result hoặc email receipt.
- Một thẻ vé QR/PDF.

## Source Evidence
- `api/src/modules/pricing/pricing.service.ts`
- `api/src/modules/payment/payment.service.ts`
- `api/src/modules/payment/payment.controller.ts`
- `api/src/modules/wallet/wallet.service.ts`
- `api/src/modules/ticket/ticket.service.ts`
- `api/src/modules/mail/mail.service.ts`

