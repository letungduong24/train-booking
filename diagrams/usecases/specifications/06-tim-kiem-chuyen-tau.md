Use Case ID	UC-06
Use Case Name	Tìm kiếm chuyến tàu
Description	Là người dùng, tôi muốn tìm kiếm chuyến tàu theo ga đi, ga đến và ngày khởi hành để chọn chuyến phù hợp.
Actor(s)	Người dùng
Priority	Must Have
Trigger	Người dùng nhập thông tin tìm kiếm chuyến tàu
Pre-Condition(s)	1. Hệ thống có dữ liệu ga, tuyến đường và chuyến tàu hợp lệ
Post-Condition(s)	1. Danh sách chuyến phù hợp được hiển thị
2. Người dùng có thể chọn chuyến để đặt vé
Basic Flow	1. Người dùng mở trang tìm kiếm hoặc đặt vé
2. Hệ thống hiển thị ô chọn ga đi, ga đến và ngày khởi hành
3. Người dùng chọn ga đi
4. Người dùng chọn ga đến
5. Người dùng chọn ngày khởi hành
6. Người dùng bấm tìm kiếm
7. Hệ thống kiểm tra dữ liệu đầu vào
8. Hệ thống tìm các chuyến phù hợp với tuyến và chặng
9. Hệ thống hiển thị danh sách chuyến, giờ đi, giờ đến, tàu và số chỗ còn
10. Người dùng chọn một chuyến để vào trang đặt vé
Alternative Flow	8a. Không có chuyến phù hợp: Hệ thống hiển thị trạng thái không tìm thấy chuyến và cho phép người dùng đổi điều kiện tìm kiếm
Exception Flow	7a. Thiếu ga đi, ga đến hoặc ngày: Hệ thống yêu cầu nhập đủ thông tin
7b. Ga đi trùng ga đến: Hệ thống yêu cầu chọn hai ga khác nhau
8b. Lỗi tải dữ liệu chuyến: Hệ thống hiển thị lỗi và cho phép thử lại
Business Rules	BR-01: Chỉ hiển thị chuyến còn khả dụng để đặt vé
BR-02: Ga đi và ga đến phải thuộc cùng route hợp lệ theo phiên bản network của route
BR-03: Ngày khởi hành không được là ngày không hợp lệ theo quy định tìm kiếm
Non-Functional Requirement	NFR-01: Form tìm kiếm dễ dùng trên desktop và mobile
NFR-02: Kết quả tìm kiếm phản hồi nhanh
NFR-03: Danh sách chuyến phải hiển thị rõ thông tin quan trọng
