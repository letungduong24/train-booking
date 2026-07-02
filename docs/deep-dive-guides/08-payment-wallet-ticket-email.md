# 08 - Thanh Toán, Ví, PDF Vé Và Email

## Mục tiêu học

Hiểu cách Railflow xử lý thanh toán bằng VNPAY và ví nội bộ, cách xác nhận booking, cách tạo PDF vé QR, và cách gửi email biên lai.

File cần đọc:

- `api/src/modules/payment/payment.service.ts`
- `api/src/modules/payment/payment.controller.ts`
- `api/src/modules/wallet/wallet.service.ts`
- `api/src/modules/wallet/wallet.controller.ts`
- `api/src/modules/ticket/ticket.service.ts`
- `api/src/modules/mail/mail.service.ts`
- `api/src/modules/booking/booking.service.ts`
- `web/features/booking/components/payment-method-dialog.tsx`
- `web/features/wallet/components/wallet-dashboard.tsx`
- `web/features/wallet/components/deposit-dialog.tsx`
- `web/features/wallet/components/withdraw-dialog.tsx`

## Các phương thức thanh toán

Railflow có hai nhóm:

1. VNPAY sandbox:
   - dùng khi người dùng thanh toán qua cổng ngoài;
   - backend tạo URL;
   - VNPAY callback/return về backend.

2. Ví nội bộ:
   - user nạp tiền;
   - thanh toán booking bằng balance;
   - bảo vệ bằng wallet PIN.

## VNPAY flow

Luồng:

```text
Frontend chọn VNPAY
-> Backend tạo payment URL
-> Browser redirect sang VNPAY
-> User thanh toán
-> VNPAY redirect về backend return URL
-> Backend verify chữ ký
-> Backend xác nhận transaction/booking
-> Backend redirect về frontend payment-result
```

### Tạo payment URL

`PaymentService.createPaymentUrl` cần:

- amount;
- orderId;
- orderInfo;
- ipAddr;
- VNP config:
  - `VNP_TMN_CODE`
  - `VNP_HASH_SECRET`
  - `VNP_URL`
  - `VNP_RETURN_URL`

Điểm cần nhớ:

- URL phải được ký đúng.
- Amount thường cần nhân theo format VNPAY nếu VNPAY yêu cầu đơn vị nhỏ hơn.

### Verify callback

Backend phải:

- đọc query VNPAY trả về;
- kiểm tra secure hash;
- xác định `vnp_ResponseCode`;
- tìm booking/transaction theo orderId;
- nếu thành công, gọi `confirmBooking`.

Không được chỉ tin `success=true` ở frontend.

## Wallet flow

### Thiết lập PIN

User có `walletPin`. Backend lưu hash, không lưu PIN plain text.

Luồng:

```text
User nhập PIN
-> bcrypt hash
-> lưu User.walletPin
```

### Nạp tiền

Tạo transaction:

- type `DEPOSIT`
- status `PENDING`
- amount
- reference/idempotency key nếu cần

Sau khi thanh toán nạp thành công:

- update transaction `COMPLETED`;
- tăng `User.balance`.

### Rút tiền

User gửi yêu cầu:

- bankName;
- bankAccount;
- accountName;
- amount;
- pin.

Backend:

- verify PIN;
- kiểm tra balance;
- trừ hoặc tạo transaction pending tùy chính sách;
- admin duyệt/từ chối.

### Thanh toán booking bằng ví

Hàm chính:

```text
WalletService.payBookingWithWallet()
```

Luồng:

1. Tìm user.
2. Kiểm tra user có wallet PIN.
3. So sánh PIN bằng bcrypt.
4. Tìm booking theo bookingCode.
5. Kiểm tra booking `PENDING`.
6. Kiểm tra balance đủ.
7. Tạo idempotency key:

```text
PAYMENT:WALLET:{bookingCode}
```

8. Trong transaction:
   - trừ balance bằng `updateMany` có điều kiện balance đủ;
   - tạo transaction `PAYMENT`;
   - gọi hoặc sau đó gọi confirm booking.

## Idempotency

Idempotency là kỹ thuật tránh xử lý trùng.

Ví dụ:

- user bấm thanh toán 2 lần;
- VNPAY callback 2 lần;
- request bị retry.

Nếu không có idempotency:

- user có thể bị trừ tiền 2 lần;
- booking confirm nhiều lần;
- transaction bị nhân đôi.

Railflow dùng `Transaction.idempotencyKey` unique.

## Refund

Hoàn tiền dùng:

```text
WalletService.refundToWallet(userId, amount, bookingCode, reason)
```

Idempotency key thường dạng:

```text
REFUND:{bookingCode}:{reason}
```

Các case hoàn tiền:

- trip đã khởi hành khi confirm;
- ghế đã bị người khác mua do race condition;
- ghế đang lock bởi booking khác;
- sự cố ghế không có ghế thay thế.

## Tạo vé sau thanh toán

Vé không được tạo trước thanh toán. Khi `confirmBooking` thành công:

- tạo `Ticket`;
- tạo `TicketSeatSegment`;
- booking sang `PAID`;
- metadata được xóa hoặc giảm dữ liệu tạm.

## PDF ticket

File:

- `api/src/modules/ticket/ticket.service.ts`

Nhiệm vụ:

- tạo QR code;
- render thông tin booking/ticket;
- render thông tin passenger;
- render seat/coach;
- render route/time;
- xuất PDF buffer.

PDF dùng trong:

- email booking receipt;
- tải/xem vé nếu frontend hỗ trợ.

## Email receipt

File:

- `api/src/modules/mail/mail.service.ts`

Sau khi confirm:

```text
TicketService.generateBookingTicketsPDF(updatedBooking)
MailService.sendBookingReceipt(email, booking, pdfBuffer)
```

Nếu tạo PDF lỗi:

- backend log lỗi;
- gửi email receipt không attachment như fallback.

Điểm này quan trọng khi debug production:

- Nếu local có PDF nhưng production không có, cần kiểm tra môi trường tạo PDF, font/path, buffer, Resend attachment format, log backend.

## Email đổi ghế/hoàn tiền

Seat issue flow dùng mail:

- gửi email xác nhận đổi ghế với token;
- gửi email hoàn tiền nếu không còn ghế thay thế;
- có thể gửi email thông báo đổi ghế thành công tùy service.

## Các lỗi thường gặp

### Payment result thành công nhưng lịch sử vẫn pending

Nguyên nhân:

- frontend cache chưa invalidate;
- callback confirm booking chưa xong;
- redirect về frontend quá sớm;
- socket event chưa tới.

Backend vẫn là nguồn sự thật: kiểm tra booking status trong database.

### Gửi email không có PDF trên production

Cần kiểm tra:

- `TicketService.generateBookingTicketsPDF` có throw không;
- font hoặc asset path có tồn tại trong container không;
- Resend API nhận attachment đúng field không;
- log fallback có chạy không;
- kích thước PDF buffer có vượt giới hạn không.

### Ví bị trừ nhưng booking fail

Backend phải hoàn tiền bằng `refundToWallet` nếu confirm fail do ghế/trip.

## Câu hỏi bảo vệ

- Vì sao phải verify VNPAY ở backend?
- Vì sao cần idempotency key?
- Khi nào ticket được tạo?
- Vì sao PDF gửi sau confirm chứ không gửi trước?
- Nếu gửi email lỗi thì booking có bị rollback không?

