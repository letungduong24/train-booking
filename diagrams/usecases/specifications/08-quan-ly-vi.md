Use Case ID	UC-08
Use Case Name	Quản lý ví
Description	Là người dùng, tôi muốn quản lý ví điện tử để xem số dư, đặt mã PIN, nạp tiền, rút tiền, thanh toán booking và theo dõi lịch sử giao dịch.
Actor(s)	Người dùng, Admin, Payment Gateway, Email Service, Hệ thống ví
Priority	Must Have
Trigger	Người dùng mở trang ví hoặc thực hiện thao tác liên quan đến ví
Pre-Condition(s)	1. Người dùng đã đăng nhập
2. Người dùng có tài khoản ví trong hệ thống
Post-Condition(s)	1. Số dư, trạng thái PIN và lịch sử giao dịch được hiển thị
2. Giao dịch ví được ghi nhận đúng loại và đúng trạng thái
3. Số dư ví thay đổi khi giao dịch nạp tiền, rút tiền, thanh toán hoặc hoàn tiền hoàn tất
Basic Flow	1. Người dùng mở trang ví của tôi
2. Hệ thống tải số dư hiện tại, trạng thái đã đặt PIN hay chưa và 20 giao dịch gần nhất
3. Nếu có giao dịch nạp tiền đang chờ xử lý, hệ thống hiển thị lại liên kết thanh toán và thời hạn hết hạn
4. Người dùng xem danh sách giao dịch
5. Hệ thống hiển thị loại giao dịch, số tiền, trạng thái, mô tả và thời gian phát sinh
Alternative Flow	2a. Người dùng đặt mã PIN ví: Người dùng nhập PIN 6 chữ số; hệ thống hash PIN và lưu vào tài khoản
2b. Người dùng quên mã PIN: Hệ thống gửi email chứa liên kết đặt lại PIN; người dùng mở liên kết và đặt PIN mới bằng token hợp lệ
4a. Người dùng nạp tiền: Người dùng nhập số tiền; hệ thống tạo giao dịch DEPOSIT ở trạng thái PENDING và trả về URL thanh toán VNPay
4b. Người dùng hủy giao dịch nạp tiền đang chờ: Hệ thống chuyển giao dịch DEPOSIT PENDING sang FAILED với lý do người dùng hủy
4c. Giao dịch nạp tiền thanh toán thành công: Hệ thống cộng tiền vào ví và chuyển giao dịch sang COMPLETED
4d. Người dùng yêu cầu rút tiền: Người dùng nhập số tiền và thông tin ngân hàng; hệ thống trừ tạm số dư và tạo giao dịch WITHDRAW ở trạng thái PENDING
4e. Admin duyệt yêu cầu rút tiền: Hệ thống chuyển giao dịch WITHDRAW sang COMPLETED
4f. Admin từ chối yêu cầu rút tiền: Hệ thống hoàn lại số tiền đã trừ và chuyển giao dịch WITHDRAW sang FAILED
4g. Người dùng thanh toán booking bằng ví: Người dùng nhập mã PIN; hệ thống kiểm tra booking, trừ tiền ví, ghi giao dịch PAYMENT và xác nhận booking
4h. Hệ thống hoàn tiền: Hệ thống cộng tiền vào ví và ghi giao dịch REFUND khi booking hoặc xử lý sự cố cần hoàn tiền
Exception Flow	1a. Người dùng chưa đăng nhập: Hệ thống yêu cầu đăng nhập
2c. Người dùng đặt PIN khi đã có PIN: Hệ thống từ chối và yêu cầu dùng luồng khôi phục nếu quên PIN
2d. Token đặt lại PIN không hợp lệ hoặc hết hạn: Hệ thống từ chối đặt lại PIN
4i. Số tiền nạp hoặc rút nhỏ hơn 10.000 VND: Hệ thống từ chối giao dịch
4j. Số dư không đủ khi rút tiền hoặc thanh toán booking: Hệ thống từ chối giao dịch
4k. Mã PIN không chính xác khi thanh toán: Hệ thống từ chối thanh toán
4l. Booking không tồn tại, không thuộc người dùng hoặc không ở trạng thái PENDING: Hệ thống từ chối thanh toán
4m. Giao dịch nạp tiền quá hạn: Hệ thống chuyển giao dịch DEPOSIT PENDING sang FAILED
4n. Lỗi xác nhận booking sau khi trừ ví: Hệ thống hoàn lại tiền vào ví và thông báo giao dịch thất bại
Business Rules	BR-01: Người dùng chỉ xem và thao tác ví của chính mình
BR-02: PIN ví gồm đúng 6 chữ số và được hash trước khi lưu
BR-03: Giao dịch nạp tiền và rút tiền tối thiểu 10.000 VND
BR-04: Giao dịch nạp tiền tạo trạng thái PENDING và chỉ cộng số dư khi thanh toán thành công
BR-05: Giao dịch rút tiền trừ tạm số dư khi tạo yêu cầu và chỉ hoàn lại nếu admin từ chối
BR-06: Thanh toán booking bằng ví yêu cầu booking thuộc người dùng, đang PENDING, số dư đủ và PIN chính xác
BR-07: Mọi thay đổi số dư phải có giao dịch tương ứng
Non-Functional Requirement	NFR-01: Số tiền hiển thị đúng định dạng VND
NFR-02: Không hiển thị sai số dư khi giao dịch đang chờ xử lý
NFR-03: Lịch sử giao dịch phải dễ đọc và hiển thị rõ trạng thái PENDING, COMPLETED hoặc FAILED
NFR-04: Thông báo lỗi ví phải dùng tiếng Việt rõ ràng
