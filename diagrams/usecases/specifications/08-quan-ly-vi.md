Use Case ID
UC-08

Use Case Name
Quản lý ví điện tử

Description
Là khách hàng, tôi muốn quản lý ví điện tử của mình bao gồm xem số dư, nạp tiền, rút tiền và quản lý mã PIN.

Actor(s)
Khách hàng (Customer), Payment Gateway, Email Service

Priority
Must Have

Trigger
Khách hàng muốn quản lý ví điện tử

Pre-Condition(s)
Khách hàng đã đăng nhập vào hệ thống
Thiết bị của khách hàng đã được kết nối internet

Post-Condition(s)
Thông tin ví được hiển thị hoặc cập nhật thành công
Giao dịch được ghi nhận vào lịch sử
Hệ thống ghi nhận hoạt động vào Activity Log

Basic Flow - Xem số dư và lịch sử giao dịch
1. Khách hàng chọn menu "Ví của tôi"
2. Hệ thống truy vấn thông tin ví: Số dư, Trạng thái PIN, Lịch sử giao dịch (20 giao dịch gần nhất)
3. Hệ thống hiển thị: Số dư hiện tại, Trạng thái PIN (Đã đặt/Chưa đặt), Danh sách giao dịch với: Loại (DEPOSIT/WITHDRAW/PAYMENT/REFUND), Số tiền, Trạng thái, Ngày giờ, Mô tả
4. Hệ thống sắp xếp giao dịch theo ngày giờ giảm dần
5. Hệ thống ghi nhận hoạt động xem ví vào Activity Log

Alternative Flow 1 - Nạp tiền vào ví
3a. Khách hàng chọn lệnh "Nạp tiền"
3a1. Hệ thống hiển thị form nạp tiền với trường: Số tiền (tối thiểu 10,000 VND, tối đa 50,000,000 VND)
4a. Khách hàng nhập số tiền và chọn lệnh "Nạp tiền"
5a. Hệ thống kiểm tra tính hợp lệ của số tiền
6a. Hệ thống tạo Transaction với type DEPOSIT, status PENDING
7a. Hệ thống tạo URL thanh toán VNPay với orderId = transactionId
8a. Hệ thống chuyển hướng khách hàng đến trang thanh toán VNPay
9a. Khách hàng thanh toán thành công trên VNPay
10a. VNPay callback về hệ thống với kết quả thanh toán
11a. Hệ thống cập nhật Transaction: status = SUCCESS
12a. Hệ thống cộng tiền vào User.balance
13a. Hệ thống gửi email thông báo nạp tiền thành công
14a. Hệ thống hiển thị thông báo: "Nạp tiền thành công! Số dư mới: {balance} VND"
Use Case quay lại bước 2

Alternative Flow 2 - Rút tiền từ ví
3b. Khách hàng chọn lệnh "Rút tiền"
3b1. Nếu chưa đặt PIN: Hệ thống hiển thị thông báo "Vui lòng đặt mã PIN trước khi rút tiền" và chuyển sang Alternative Flow 3
3b2. Hệ thống hiển thị form rút tiền với các trường: Số tiền (tối thiểu 50,000 VND, tối đa = số dư), Số tài khoản ngân hàng, Tên ngân hàng, Tên chủ tài khoản, Mã PIN
4b. Khách hàng nhập thông tin và chọn lệnh "Rút tiền"
5b. Hệ thống kiểm tra: Số tiền hợp lệ, Số dư đủ, Mã PIN đúng
6b. Hệ thống tạo Transaction với type WITHDRAW, status PENDING
7b. Hệ thống trừ tiền từ User.balance (tạm giữ)
8b. Hệ thống gửi yêu cầu rút tiền đến Admin để duyệt
9b. Hệ thống hiển thị thông báo: "Yêu cầu rút tiền đã được gửi. Chúng tôi sẽ xử lý trong vòng 24 giờ"
10b. Admin duyệt yêu cầu rút tiền
11b. Hệ thống cập nhật Transaction: status = SUCCESS
12b. Hệ thống gửi email thông báo rút tiền thành công
Use Case quay lại bước 2

Alternative Flow 3 - Đặt mã PIN
3c. Khách hàng chọn lệnh "Đặt mã PIN"
3c1. Nếu đã có PIN: Hệ thống hiển thị "Bạn đã có mã PIN. Vui lòng dùng chức năng Đổi PIN"
3c2. Hệ thống hiển thị form đặt PIN với các trường: Mã PIN (6 chữ số), Xác nhận mã PIN
4c. Khách hàng nhập mã PIN và chọn lệnh "Đặt mã PIN"
5c. Hệ thống kiểm tra: PIN có 6 chữ số, PIN và xác nhận khớp nhau
6c. Hệ thống mã hóa PIN bằng bcrypt
7c. Hệ thống lưu PIN vào User.walletPin
8c. Hệ thống hiển thị thông báo: "Đặt mã PIN thành công!"
Use Case quay lại bước 2

Alternative Flow 4 - Đổi mã PIN
3d. Khách hàng chọn lệnh "Đổi mã PIN"
3d1. Nếu chưa có PIN: Hệ thống hiển thị "Vui lòng đặt mã PIN trước" và chuyển sang Alternative Flow 3
3d2. Hệ thống hiển thị form đổi PIN với các trường: Mã PIN hiện tại, Mã PIN mới (6 chữ số), Xác nhận mã PIN mới
4d. Khách hàng nhập thông tin và chọn lệnh "Đổi mã PIN"
5d. Hệ thống kiểm tra: PIN hiện tại đúng, PIN mới có 6 chữ số, PIN mới và xác nhận khớp nhau, PIN mới khác PIN cũ
6d. Hệ thống mã hóa PIN mới bằng bcrypt
7d. Hệ thống cập nhật User.walletPin
8d. Hệ thống gửi email thông báo đổi PIN thành công
9d. Hệ thống hiển thị thông báo: "Đổi mã PIN thành công!"
Use Case quay lại bước 2

Alternative Flow 5 - Quên mã PIN
3e. Khách hàng chọn lệnh "Quên mã PIN"
3e1. Hệ thống hiển thị xác nhận: "Bạn có chắc muốn reset mã PIN? Link reset sẽ được gửi đến email của bạn"
4e. Khách hàng chọn lệnh "Xác nhận"
5e. Hệ thống tạo token reset PIN (hết hạn sau 1 giờ)
6e. Hệ thống gửi email chứa link reset PIN
7e. Hệ thống hiển thị thông báo: "Link reset mã PIN đã được gửi đến email của bạn"
8e. Khách hàng click vào link trong email
9e. Hệ thống hiển thị form reset PIN với các trường: Mã PIN mới (6 chữ số), Xác nhận mã PIN mới
10e. Khách hàng nhập mã PIN mới và chọn lệnh "Reset mã PIN"
11e. Hệ thống kiểm tra: Token hợp lệ, PIN mới có 6 chữ số, PIN mới và xác nhận khớp nhau
12e. Hệ thống mã hóa PIN mới bằng bcrypt
13e. Hệ thống cập nhật User.walletPin
14e. Hệ thống xóa token reset
15e. Hệ thống gửi email thông báo reset PIN thành công
16e. Hệ thống hiển thị thông báo: "Reset mã PIN thành công!"
Use Case quay lại bước 2

Exception Flow
5a1. Số tiền không hợp lệ (< 10,000 hoặc > 50,000,000)
5a1a. Hệ thống hiển thị lỗi: "Số tiền nạp phải từ 10,000 đến 50,000,000 VND"
Use Case quay lại bước 3a1

9a1. Khách hàng hủy thanh toán trên VNPay
9a1a. VNPay callback về hệ thống với kết quả hủy
9a1b. Hệ thống cập nhật Transaction: status = CANCELLED
9a1c. Hệ thống hiển thị thông báo: "Thanh toán bị hủy"
Use Case quay lại bước 2

5b1. Số dư không đủ
5b1a. Hệ thống hiển thị lỗi: "Số dư không đủ. Số dư hiện tại: {balance} VND"
Use Case quay lại bước 3b2

5b2. Mã PIN sai
5b2a. Hệ thống hiển thị lỗi: "Mã PIN không đúng"
5b2b. Hệ thống tăng số lần nhập sai
5b2c. Nếu sai 5 lần liên tiếp: Hệ thống khóa chức năng rút tiền 15 phút
Use Case quay lại bước 3b2

5c1. PIN không có 6 chữ số
5c1a. Hệ thống hiển thị lỗi: "Mã PIN phải có đúng 6 chữ số"
Use Case quay lại bước 3c2

5c2. PIN và xác nhận không khớp
5c2a. Hệ thống hiển thị lỗi: "Mã PIN xác nhận không khớp"
Use Case quay lại bước 3c2

11e1. Token hết hạn hoặc không hợp lệ
11e1a. Hệ thống hiển thị lỗi: "Link reset đã hết hạn. Vui lòng yêu cầu lại"
Use Case dừng lại

Business Rules
BR-01: Số tiền nạp: Tối thiểu 10,000 VND, tối đa 50,000,000 VND
BR-02: Số tiền rút: Tối thiểu 50,000 VND, tối đa = số dư
BR-03: Mã PIN phải có đúng 6 chữ số
BR-04: Mã PIN được mã hóa bằng bcrypt
BR-05: Sau 5 lần nhập sai PIN: Khóa chức năng rút tiền 15 phút
BR-06: Token reset PIN hết hạn sau 1 giờ
BR-07: Yêu cầu rút tiền được xử lý trong vòng 24 giờ
BR-08: Giao dịch nạp tiền timeout sau 5 phút nếu không thanh toán
BR-09: Phí rút tiền: 0 VND (miễn phí)

Non-Functional Requirement
NFR-01: Thời gian load thông tin ví dưới 1 giây
NFR-02: Thời gian tạo URL thanh toán dưới 2 giây
NFR-03: Form responsive, hoạt động tốt trên mobile
NFR-04: Hiển thị số dư với định dạng tiền tệ (1,000,000 VND)
NFR-05: Hiển thị loading indicator khi đang xử lý
NFR-06: Lịch sử giao dịch hỗ trợ pagination (20 giao dịch/trang)
NFR-07: Lịch sử giao dịch hỗ trợ lọc theo loại và trạng thái
