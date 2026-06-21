Use Case ID	UC-05
Use Case Name	Chat với trợ lý ảo
Description	Là người dùng, tôi muốn trao đổi với trợ lý ảo để tìm chuyến tàu, xem vé đã đặt, xem số dư ví và nhận hướng dẫn sử dụng hệ thống.
Actor(s)	Người dùng, Chatbot AI, Hệ thống đặt vé
Priority	Should Have
Trigger	Người dùng mở khung chat hoặc gửi câu hỏi cho trợ lý ảo
Pre-Condition(s)	1. Hệ thống chatbot đang hoạt động
2. Một số chức năng cá nhân yêu cầu người dùng đã đăng nhập
Post-Condition(s)	1. Người dùng nhận được câu trả lời hoặc component phù hợp
2. Nếu chatbot gọi công cụ tìm chuyến, booking hoặc ví, kết quả được hiển thị bằng giao diện chuyên biệt khi có dữ liệu
Basic Flow	1. Người dùng mở chatbot
2. Hệ thống hiển thị khung chat và các gợi ý nhanh
3. Người dùng nhập yêu cầu
4. Hệ thống phân tích ý định
5. Nếu cần dữ liệu hệ thống, chatbot gọi công cụ phù hợp
6. Hệ thống trả kết quả cho chatbot
7. Chatbot hiển thị câu trả lời hoặc component kết quả
Alternative Flow	4a. Chatbot chưa đủ thông tin: Hệ thống hỏi lại thông tin còn thiếu
5a. Người dùng muốn tìm chuyến tàu: Chatbot gọi công cụ tìm chuyến và hiển thị danh sách chuyến bằng component
5b. Người dùng muốn xem vé đã đặt: Chatbot kiểm tra đăng nhập, sau đó hiển thị booking của người dùng nếu hợp lệ
5c. Người dùng muốn xem số dư ví: Chatbot kiểm tra đăng nhập, sau đó hiển thị số dư ví nếu hợp lệ
Exception Flow	5d. Công cụ AI trả tham số không hợp lệ: Hệ thống lọc hoặc chuẩn hóa tham số trước khi gọi nghiệp vụ
6a. Nhà cung cấp AI không hỗ trợ cấu hình model hiện tại: Hệ thống dùng cấu hình tương thích với model
6b. API lỗi: Hệ thống hiển thị thông báo thân thiện, không hiển thị log kỹ thuật
Business Rules	BR-01: Các chức năng cá nhân phải dùng phiên đăng nhập hiện tại
BR-02: Kết quả tìm chuyến phải ưu tiên hiển thị bằng component đặt vé
BR-03: Không hiển thị nội dung thinking hoặc dữ liệu trung gian của chatbot cho người dùng
BR-04: Trạng thái booking chỉ dùng các giá trị hợp lệ của hệ thống
Non-Functional Requirement	NFR-01: Chatbot phản hồi bằng tiếng Việt có dấu
NFR-02: Không làm treo giao diện khi AI hoặc tool lỗi
NFR-03: Component kết quả phải đồng bộ thiết kế với phần còn lại của web
