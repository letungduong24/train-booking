# Tài Liệu Phân Tích Use Case - Hệ Thống Đặt Vé Tàu Hỏa (Railway Booking System)

Tài liệu này cung cấp cái nhìn toàn cảnh về các Tác nhân (Actors) và Use Case (Nghiệp vụ) của dự án hệ thống thông tin địa lý đặt vé tàu hỏa tuyến Bắc - Nam.

---

## 1. Xác Định Tác Nhân (Actors)

### 1.1 Tác Nhân Hệ Thống (Primary Actors)

#### 1.1.1 Khách vãng lai (Guest)
- **Mô tả:** Người dùng chưa đăng ký hoặc chưa đăng nhập vào hệ thống.
- **Vai trò:**
  - Tìm kiếm chuyến tàu, xem sơ đồ ghế trống.
  - Xem vị trí di chuyển thực tế (GPS giả lập) của các tàu đang chạy trên bản đồ.
  - Chat tương tác hỏi đáp thông tin với Chatbot AI.
  - Đăng ký tài khoản mới và Đăng nhập vào hệ thống.

#### 1.1.2 Hành khách (Customer / Member)
- **Mô tả:** Người dùng đã có tài khoản và đăng nhập thành công.
- **Mối quan hệ:** Kế thừa toàn bộ quyền hạn từ **Khách vãng lai** (`Customer --|> Guest`).
- **Vai trò bổ sung:**
  - Thực hiện quy trình đặt vé tàu và thanh toán vé.
  - Quản lý thông tin hồ sơ cá nhân và đổi mật khẩu.
  - Xem lịch sử đặt vé, tải vé điện tử PDF/QR hoặc hủy vé hoàn tiền.
  - Quản lý ví điện tử nội bộ (nạp tiền, rút tiền, đổi mã PIN).
  - Xác nhận đổi ghế mới khi nhận thông báo ghế cũ bị sự cố hỏng hóc.

#### 1.1.3 Quản Trị Viên (Admin)
- **Mô tả:** Nhân sự quản lý vận hành lõi, có quyền hạn cao nhất trong hệ thống.
- **Mối quan hệ:** Kế thừa toàn bộ quyền hạn từ **Hành khách** (`Admin --|> Customer`).
- **Vai trò bổ sung:**
  - Quản lý tàu và toa xe (Danh mục Tàu chạy, Toa xe, thiết lập mẫu toa xe tự động sinh ghế).
  - Quản lý trạng thái hoạt động của ghế ngồi (Khóa ghế, Mở khóa, xử lý sự cố đổi ghế cho khách).
  - Quản lý chuyến tàu (Tạo chuyến chạy, cấu hình thời gian delay ga đi/đến, giám sát GPS).
  - Quản lý cơ sở hạ tầng mạng lưới (Nhà ga dừng đỗ, Tuyến chạy, Mạng lưới đường ray GeoJSON).
  - Quản lý tài khoản người dùng (Khóa/mở khóa tài khoản, phân quyền hệ thống).
  - Giám sát các biểu đồ dashboard thống kê và doanh thu.

#### 1.1.4 Lái Tàu (Driver)
- **Mô tả:** Nhân sự điều hành lái tàu thực tế, cập nhật thông số hành trình thời gian thực.
- **Mối quan hệ:** Kế thừa toàn bộ quyền hạn từ **Hành khách** (`Driver --|> Customer`).
- **Vai trò bổ sung:**
  - Xem danh sách chuyến tàu được phân công điều khiển.
  - Báo cáo số phút delay khi tàu chạy thực tế.
  - Gửi yêu cầu hủy chuyến khẩn cấp khi gặp sự cố bất khả kháng.
  - Báo cáo vị trí ghế hỏng trên tàu về cho Admin xử lý.

### 1.2 Tác Nhân Liên Kết Ngoài (Secondary Actors)
*Lưu ý học thuật:* Để đảm bảo tính tinh gọn của biểu đồ tổng quát, các tác nhân phụ/liên kết ngoài này chỉ được đặc tả trong tài liệu chi tiết và sơ đồ phân rã phân hệ.
- **Payment Gateway (Cổng thanh toán):** Cổng thanh toán trực tuyến (VNPay) xử lý dòng tiền nạp ví hoặc thanh toán vé.
- **Email Service (Dịch vụ email):** Hệ thống gửi email tự động (Gửi OTP, Gửi vé QR, Thông báo sự cố đổi ghế).
- **Chatbot AI (Trợ lý ảo):** Engine AI (Gemini/Groq API) xử lý và trả lời thông minh các câu hỏi của khách hàng.

---

## 2. Danh Mục 20 Use Cases Khái Quát

### 2.1 Phân hệ Khách hàng (Khách vãng lai & Hành khách) - 10 UCs
- **UC-01:** Đăng ký tài khoản (Khách vãng lai)
- **UC-02:** Đăng nhập hệ thống (Khách vãng lai)
- **UC-03:** Quản lý hồ sơ (Hành khách)
- **UC-04:** Xác nhận đổi ghế (Hành khách)
- **UC-05:** Chat với Chatbot (Khách vãng lai)
- **UC-06:** Tìm kiếm chuyến tàu (Khách vãng lai)
- **UC-07:** Xem chuyến đang chạy (Khách vãng lai)
- **UC-08:** Quản lý ví điện tử (Hành khách)
- **UC-09:** Đặt vé tàu (Hành khách)
- **UC-10:** Xem lịch sử đặt vé (Hành khách)

### 2.2 Phân hệ Quản trị (Admin) - 6 UCs
- **UC-11:** Xem dashboard và báo cáo
- **UC-12:** Quản lý người dùng
- **UC-13:** Quản lý trạng thái ghế *(Bao gồm khóa ghế và xử lý sự cố)*
- **UC-14:** Quản lý tàu và toa xe *(Tàu, Toa, CoachTemplate)*
- **UC-19:** Quản lý chuyến tàu *(Lập lịch chuyến, delay, và giám sát bản đồ)*
- **UC-20:** Quản lý cơ sở hạ tầng *(Ga dừng đỗ, Tuyến lộ trình, và Ray vẽ GeoJSON)*

### 2.3 Phân hệ Lái tàu (Driver) - 4 UCs
- **UC-15:** Yêu cầu hủy chuyến khẩn cấp
- **UC-16:** Xem chuyến được phân công
- **UC-17:** Báo cáo delay
- **UC-18:** Báo cáo ghế hỏng

---

## 3. Sơ Đồ Use Case
Hệ thống sơ đồ phân tích bao gồm biểu đồ tổng quát và biểu đồ phân rã chi tiết cho từng tác nhân:
- **Hình 2.1: Biểu đồ Use Case tổng quát hệ thống** | Xem: [01-overall-usecase-diagram.md](file:///c:/Study/train-booking/diagrams/usecases/01-overall-usecase-diagram.md) (Có kèm file XML Draw.io: [01-overall-usecase-diagram.xml](file:///c:/Study/train-booking/diagrams/usecases/01-overall-usecase-diagram.xml))
- **Hình 2.2: Biểu đồ Use Case phân rã phân hệ Khách hàng** | Xem: [02-customer-usecase-diagram.md](file:///c:/Study/train-booking/diagrams/usecases/02-customer-usecase-diagram.md)
- **Hình 2.3: Biểu đồ Use Case phân rã phân hệ Quản trị viên** | Xem: [03-admin-usecase-diagram.md](file:///c:/Study/train-booking/diagrams/usecases/03-admin-usecase-diagram.md)
- **Hình 2.4: Biểu đồ Use Case phân rã phân hệ Lái tàu** | Xem: [04-driver-usecase-diagram.md](file:///c:/Study/train-booking/diagrams/usecases/04-driver-usecase-diagram.md)

---

## 4. Tài Liệu Đặc Tả Chi Tiết (Specifications)
Các luồng xử lý và Quy tắc nghiệp vụ chi tiết được lưu trong thư mục `specifications/`:

- **4.1 Phân hệ Khách hàng:**
  - [UC-01: Đăng ký tài khoản](file:///c:/Study/train-booking/diagrams/usecases/specifications/01-dang-ky-tai-khoan.md)
  - [UC-02: Đăng nhập hệ thống](file:///c:/Study/train-booking/diagrams/usecases/specifications/02-dang-nhap.md)
  - [UC-03: Quản lý hồ sơ](file:///c:/Study/train-booking/diagrams/usecases/specifications/03-quan-ly-ho-so.md)
  - [UC-04: Xác nhận đổi ghế](file:///c:/Study/train-booking/diagrams/usecases/specifications/04-xac-nhan-doi-ghe.md)
  - [UC-05: Chat với Chatbot](file:///c:/Study/train-booking/diagrams/usecases/specifications/05-chat-chatbot.md)
  - [UC-06: Tìm kiếm chuyến tàu](file:///c:/Study/train-booking/diagrams/usecases/specifications/06-tim-kiem-chuyen-tau.md)
  - [UC-07: Xem chuyến đang chạy](file:///c:/Study/train-booking/diagrams/usecases/specifications/07-xem-chuyen-dang-chay.md)
  - [UC-08: Quản lý ví điện tử](file:///c:/Study/train-booking/diagrams/usecases/specifications/08-quan-ly-vi.md)
  - [UC-09: Đặt vé tàu](file:///c:/Study/train-booking/diagrams/usecases/specifications/09-dat-ve.md)
  - [UC-10: Xem lịch sử đặt vé](file:///c:/Study/train-booking/diagrams/usecases/specifications/10-xem-lich-su-dat-ve.md)

- **4.2 Phân hệ Quản trị (Admin):**
  - [UC-11: Xem dashboard và báo cáo](file:///c:/Study/train-booking/diagrams/usecases/specifications/11-xem-dashboard-bao-cao.md)
  - [UC-12: Quản lý người dùng](file:///c:/Study/train-booking/diagrams/usecases/specifications/12-quan-ly-nguoi-dung.md)
  - [UC-13: Quản lý trạng thái ghế](file:///c:/Study/train-booking/diagrams/usecases/specifications/13-xu-ly-ghe-hong.md)
  - [UC-14: Quản lý tàu và toa xe](file:///c:/Study/train-booking/diagrams/usecases/specifications/14-quan-ly-tau.md)
  - [UC-19: Quản lý chuyến tàu](file:///c:/Study/train-booking/diagrams/usecases/specifications/19-quan-ly-chuyen-tau.md)
  - [UC-20: Quản lý cơ sở hạ tầng](file:///c:/Study/train-booking/diagrams/usecases/specifications/20-quan-ly-co-so-ha-tang.md)

- **4.3 Phân hệ Lái tàu:**
  - [UC-15: Yêu cầu hủy chuyến khẩn cấp](file:///c:/Study/train-booking/diagrams/usecases/specifications/15-yeu-cau-huy-chuyen.md)
  - [UC-16: Xem chuyến được phân công](file:///c:/Study/train-booking/diagrams/usecases/specifications/16-xem-chuyen-phan-cong.md)
  - [UC-17: Báo cáo delay](file:///c:/Study/train-booking/diagrams/usecases/specifications/17-bao-cao-delay.md)
  - [UC-18: Báo cáo ghế hỏng](file:///c:/Study/train-booking/diagrams/usecases/specifications/18-bao-cao-ghe-hong.md)
