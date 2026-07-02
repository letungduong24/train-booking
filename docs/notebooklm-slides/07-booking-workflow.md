# Slide 07 - Booking Workflow

## Slide Title
Luồng đặt vé từ tìm chuyến đến thanh toán

## NotebookLM Instruction
Describe the passenger booking flow as implemented. Include search, select segment, choose coach/seat, pending booking, passenger information, payment, ticket creation.

## Main Slide Content
- Hành khách tìm chuyến theo ga đi, ga đến và ngày khởi hành.
- Hệ thống tìm các trip có route đi qua cặp ga theo đúng chiều.
- Người dùng có thể chọn lại chặng con trong route trước khi chọn ghế.
- UI hiển thị toa, sơ đồ ghế/giường, trạng thái ghế, giá theo từng chặng.
- Khi chọn ghế và tiếp tục, hệ thống tạo `Booking` trạng thái `PENDING` và giữ ghế tạm thời bằng Redis.
- Sau khi nhập thông tin hành khách, hệ thống tính giá theo route, toa, tầng ghế và loại hành khách.
- Thanh toán qua ví hoặc VNPAY; thanh toán thành công mới tạo `Ticket` và `TicketSeatSegment`.

## Speaker Notes
Nhấn mạnh booking trong Railflow gồm 2 giai đoạn: giữ chỗ tạm thời để bảo vệ trải nghiệm người dùng và ghi nhận vé chính thức sau thanh toán để bảo vệ dữ liệu lâu dài.

## Visual Suggestion
- Screenshot trang tìm chuyến.
- Screenshot trang chọn ghế.
- Flow: Search -> Select Segment -> Select Seat -> Pending Booking -> Passenger Info -> Payment -> Ticket PDF.

## Source Evidence
- `web/app/(public)/booking/page.tsx`
- `web/app/(protected)/dashboard/booking/[tripId]/page.tsx`
- `web/app/(protected)/dashboard/booking/passengers/page.tsx`
- `api/src/modules/booking/booking.service.ts`

