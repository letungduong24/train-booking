Use Case ID	UC-14
Use Case Name	Quản lý tàu và toa xe
Description	Là admin, tôi muốn quản lý tàu, toa xe, thứ tự toa và mẫu toa để hệ thống sinh ghế/giường phục vụ lập chuyến và đặt vé.
Actor(s)	Admin
Priority	Must Have
Trigger	Admin cần tạo, cập nhật hoặc xem cấu hình tàu/toa
Pre-Condition(s)	1. Admin đã đăng nhập
2. Hệ thống có mẫu toa khi admin thêm toa mới
Post-Condition(s)	1. Thông tin tàu hoặc toa được cập nhật nếu dữ liệu hợp lệ
2. Khi thêm toa thành công, hệ thống sinh danh sách ghế/giường theo mẫu toa
Basic Flow	1. Admin mở trang quản lý tàu
2. Hệ thống hiển thị danh sách tàu có phân trang, tìm kiếm và sắp xếp
3. Admin tạo tàu mới hoặc mở chi tiết một tàu
4. Hệ thống hiển thị thông tin tàu và danh sách toa theo thứ tự
5. Admin chọn thêm toa cho tàu
6. Hệ thống hiển thị danh sách mẫu toa
7. Admin chọn mẫu toa
8. Hệ thống tạo toa mới, tự sinh tên/toa theo thứ tự tiếp theo và sinh ghế/giường theo mẫu
9. Hệ thống hiển thị lại chi tiết tàu với toa và số lượng ghế đã được cập nhật
Alternative Flow	2a. Admin tìm kiếm hoặc lọc danh sách tàu: Hệ thống hiển thị danh sách phù hợp
3a. Admin cập nhật thông tin tàu: Hệ thống lưu tên, mã, tốc độ trung bình hoặc trạng thái tàu nếu dữ liệu hợp lệ
4a. Admin cập nhật thông tin toa: Hệ thống lưu thông tin hoặc trạng thái toa nếu dữ liệu hợp lệ
4b. Admin sắp xếp lại thứ tự toa: Hệ thống cập nhật thứ tự và tự đặt lại tên toa theo vị trí mới
4c. Admin xem chi tiết toa kèm giá ghế theo chuyến và chặng: Hệ thống trả về danh sách ghế, giá, trạng thái đặt chỗ và thông tin hành khách nếu ghế đã được đặt
4d. Admin xóa toa hoặc tàu: Hệ thống xóa dữ liệu nếu không vi phạm ràng buộc dữ liệu
Exception Flow	3b. Mã tàu đã tồn tại: Hệ thống từ chối tạo tàu và hiển thị lỗi
5a. Tàu không tồn tại: Hệ thống không cho thêm toa
7a. Mẫu toa không tồn tại: Hệ thống không cho thêm toa
4e. Toa không tồn tại: Hệ thống không cho cập nhật hoặc xóa toa
4f. Xóa tàu hoặc toa vi phạm ràng buộc dữ liệu: Hệ thống từ chối thao tác
Business Rules	BR-01: Mỗi tàu có mã duy nhất
BR-02: Toa phải thuộc một tàu hợp lệ
BR-03: Toa được tạo từ mẫu toa để đảm bảo sinh ghế/giường nhất quán
BR-04: Thứ tự toa trong cùng một tàu được đánh số tuần tự
BR-05: Ghế/giường được sinh tự động theo layout, số hàng, số cột và số tầng của mẫu toa
BR-06: Trạng thái tàu và toa ảnh hưởng đến khả năng khai thác trong nghiệp vụ lập chuyến/đặt vé
Non-Functional Requirement	NFR-01: Danh sách tàu và toa phải có phân trang/tìm kiếm khi dữ liệu lớn
NFR-02: Sơ đồ ghế/giường hiển thị ổn định và dễ kiểm tra
NFR-03: Thao tác thêm toa và sinh ghế phải phản hồi rõ thành công hoặc lỗi
