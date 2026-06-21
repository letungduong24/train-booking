Use Case ID	UC-10
Use Case Name	Xem lịch sử đặt vé
Description	Là người dùng, tôi muốn xem các vé hoặc booking đã đặt để theo dõi trạng thái và thông tin chuyến đi.
Actor(s)	Người dùng
Priority	Must Have
Trigger	Người dùng mở trang lịch sử hoặc hỏi chatbot về vé đã đặt
Pre-Condition(s)	1. Người dùng đã đăng nhập
Post-Condition(s)	1. Danh sách booking và vé của người dùng được hiển thị
Basic Flow	1. Người dùng mở trang lịch sử đặt vé
2. Hệ thống tải danh sách booking của người dùng
3. Hệ thống hiển thị mã booking, chuyến, trạng thái, tổng tiền và thời gian
4. Người dùng chọn một booking
5. Hệ thống hiển thị chi tiết vé, hành khách và chuyến đi
Alternative Flow	2a. Không có booking: Hệ thống hiển thị trạng thái rỗng
3a. Người dùng lọc theo trạng thái nếu giao diện hỗ trợ
Exception Flow	2b. Lỗi tải lịch sử: Hệ thống hiển thị lỗi và cho phép thử lại
Business Rules	BR-01: Người dùng chỉ xem được booking của chính mình
BR-02: Trạng thái booking phải dùng đúng danh mục trạng thái của hệ thống
BR-03: Vé đã hủy hoặc hoàn tiền phải hiển thị trạng thái rõ ràng
Non-Functional Requirement	NFR-01: Danh sách dễ đọc trên mobile
NFR-02: Thông tin ngày giờ và số tiền định dạng thống nhất
NFR-03: Chatbot khi hiển thị booking phải dùng cùng dữ liệu phân quyền người dùng
