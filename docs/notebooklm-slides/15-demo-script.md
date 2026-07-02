# Slide 15 - Demo Script

## Slide Title
Kịch bản demo các chức năng chính

## NotebookLM Instruction
Create a demo slide that guides the presenter through the most impressive flows. Keep it realistic and short enough for defense.

## Demo Flow 1 - Admin creates infrastructure
- Vào khu vực quản trị.
- Đồng bộ hoặc chọn network hiện có.
- Tạo tuyến trên bản đồ bằng cách chọn các ga theo thứ tự.
- Nhấn lưu để backend tính đường ray, tổng khoảng cách và khoảng cách từng ga.
- Mở chi tiết tuyến để xem path trên bản đồ.

## Demo Flow 2 - Passenger books a ticket
- Tìm chuyến theo ga đi, ga đến, ngày.
- Mở chi tiết chuyến, đổi chặng con nếu cần.
- Chọn toa và ghế/giường.
- Tạo giữ chỗ, nhập thông tin hành khách.
- Thanh toán bằng ví hoặc VNPAY.
- Vào lịch sử để xem vé, QR/PDF/email.

## Demo Flow 3 - Real-time locking
- Mở cùng một chuyến ở hai trình duyệt/tài khoản.
- Tài khoản A giữ ghế.
- Tài khoản B thấy ghế bị giữ hoặc nhận thông báo khi cố chọn ghế đang bị giữ.
- Sau khi A hủy hoặc hết hạn, ghế được nhả.

## Demo Flow 4 - Driver operation
- Đăng nhập tài khoản lái tàu.
- Mở chuyến được phân công.
- Xem GPS giả lập.
- Gửi báo cáo trễ hoặc báo cáo sự cố ghế.
- Admin duyệt và hệ thống cập nhật delay/ghế/email.

## Speaker Notes
Nếu thời gian demo ít, ưu tiên 3 flow: tạo tuyến, đặt vé realtime, GPS/sự cố ghế. Đây là những điểm thể hiện nhiều kỹ thuật nhất.

## Visual Suggestion
- Bảng 4 hàng: Admin, User, Realtime, Driver.
- Mỗi hàng có 2-3 ảnh chụp nhỏ.

## Source Evidence
- All core modules listed in `00-master-prompt.md`.

