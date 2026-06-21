Use Case ID	UC-07
Use Case Name	Xem chuyến đang chạy
Description	Là người dùng, tôi muốn xem các chuyến tàu đang chạy và vị trí hoặc lộ trình hiện tại để theo dõi hành trình.
Actor(s)	Người dùng, Admin
Priority	Should Have
Trigger	Người dùng mở trang theo dõi chuyến đang chạy hoặc admin mở chi tiết chuyến
Pre-Condition(s)	1. Hệ thống có dữ liệu chuyến và route hợp lệ
2. Chuyến có trạng thái đang chạy hoặc có dữ liệu hành trình để hiển thị
Post-Condition(s)	1. Thông tin chuyến, lộ trình và bản đồ được hiển thị
Basic Flow	1. Người dùng mở trang chuyến đang chạy
2. Hệ thống tải danh sách chuyến phù hợp
3. Người dùng chọn một chuyến
4. Hệ thống hiển thị thông tin tàu, route, thời gian và trạng thái
5. Hệ thống hiển thị bản đồ hoặc lộ trình của chuyến
Alternative Flow	2a. Không có chuyến đang chạy: Hệ thống hiển thị trạng thái rỗng
5a. Không có dữ liệu live location: Hệ thống vẫn hiển thị route dự kiến nếu có
Exception Flow	5b. Lỗi tải bản đồ hoặc dữ liệu địa lý: Hệ thống hiển thị phần thông tin chuyến và thông báo lỗi bản đồ
Business Rules	BR-01: Chỉ hiển thị dữ liệu thuộc chuyến hợp lệ
BR-02: Dữ liệu lộ trình phải dùng đúng station, route và network version
BR-03: Trạng thái chuyến quyết định nhãn hiển thị đang chạy, sắp chạy hoặc đã kết thúc
Non-Functional Requirement	NFR-01: Bản đồ không được làm vỡ layout
NFR-02: Trang phải có trạng thái loading, rỗng và lỗi rõ ràng
NFR-03: Hiển thị tốt trên desktop và mobile
