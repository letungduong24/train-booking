Use Case ID	UC-09
Use Case Name	Đặt vé
Description	Là người dùng, tôi muốn chọn chuyến, chọn chặng, chọn ghế, nhập thông tin hành khách và thanh toán để hoàn tất đặt vé tàu.
Actor(s)	Người dùng, Hệ thống thanh toán, Hệ thống vé
Priority	Must Have
Trigger	Người dùng chọn một chuyến tàu từ kết quả tìm kiếm hoặc chatbot
Pre-Condition(s)	1. Chuyến tàu còn khả dụng
2. Người dùng đã chọn ga đi và ga đến hợp lệ trên route của chuyến
Post-Condition(s)	1. Booking được tạo hoặc cập nhật theo trạng thái thanh toán
2. Ghế được giữ hoặc chọn đúng chặng
3. Vé được phát hành khi thanh toán thành công
Basic Flow	1. Người dùng mở trang đặt vé của chuyến
2. Hệ thống hiển thị tóm tắt chuyến, ga đi, ga đến và sơ đồ toa/ghế
3. Người dùng chọn hoặc đổi ga đi/ga đến trong trang đặt vé
4. Hệ thống cập nhật chặng đặt vé và tình trạng ghế theo chặng
5. Người dùng chọn ghế còn trống
6. Người dùng tiếp tục sang trang nhập thông tin hành khách
7. Hệ thống hiển thị tóm tắt chuyến và ghế đã chọn
8. Người dùng nhập thông tin hành khách
9. Người dùng chọn thanh toán
10. Hệ thống tạo booking và xử lý thanh toán
11. Nếu thanh toán thành công, hệ thống phát hành vé
Alternative Flow	3a. Người dùng đổi ga đi hoặc ga đến trong trang đặt vé: Hệ thống cập nhật lại chặng, giá và trạng thái ghế theo chặng mới
9a. Người dùng hủy trước thanh toán: Hệ thống hủy giữ chỗ hoặc booking chưa thanh toán nếu có
Exception Flow	5a. Ghế không còn khả dụng: Hệ thống yêu cầu chọn ghế khác
8a. Thiếu thông tin hành khách: Hệ thống hiển thị lỗi nhập liệu
10a. Thanh toán thất bại: Booking chuyển trạng thái thất bại hoặc chờ xử lý theo luồng thanh toán
10b. Lỗi tạo booking: Hệ thống thông báo lỗi và không trừ tiền
11a. Lỗi phát hành vé sau thanh toán: Hệ thống ghi nhận để xử lý bù hoặc hoàn tiền
Business Rules	BR-01: Ghế chỉ được bán nếu còn trống trên toàn bộ chặng người dùng chọn
BR-02: Ga đi và ga đến phải nằm đúng thứ tự trên route của chuyến
BR-03: Thông tin hành khách là bắt buộc trước khi thanh toán
BR-04: Booking thành công phải có vé tương ứng
BR-05: Giá vé tính theo chặng, loại ghế/toa và chính sách hiện tại
Non-Functional Requirement	NFR-01: Giao diện chọn ghế rõ ràng, không gây nhầm trạng thái
NFR-02: Trang nhập hành khách đồng bộ font, size và design với trang đặt vé
NFR-03: Không tạo booking trùng do bấm nhiều lần
NFR-04: Tóm tắt chuyến phải hiển thị rõ ga đi và ga đến
