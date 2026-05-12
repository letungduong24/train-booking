Use Case ID
UC-05

Use Case Name
Chat với Chatbot

Description
Là khách hàng, tôi muốn chat với chatbot AI để được hỗ trợ nhanh chóng về các thắc mắc liên quan đến đặt vé, chuyến tàu, và dịch vụ.

Actor(s)
Khách hàng (Customer), Chatbot AI

Priority
Should Have

Trigger
Khách hàng muốn được hỗ trợ hoặc có thắc mắc

Pre-Condition(s)
Khách hàng đã truy cập vào hệ thống (có thể chưa đăng nhập)
Chatbot AI đã được tích hợp và hoạt động
Thiết bị của khách hàng đã được kết nối internet

Post-Condition(s)
Khách hàng nhận được câu trả lời từ chatbot
Lịch sử chat được lưu lại (nếu đã đăng nhập)
Hệ thống ghi nhận hoạt động chat vào Activity Log

Basic Flow
1. Khách hàng click vào icon chatbot ở góc dưới bên phải màn hình
2. Hệ thống hiển thị cửa sổ chat với lời chào: "Xin chào! Tôi là trợ lý ảo của RailFlow. Tôi có thể giúp gì cho bạn?"
3. Hệ thống hiển thị các gợi ý câu hỏi phổ biến: "Tìm chuyến tàu", "Kiểm tra vé của tôi", "Chính sách hoàn vé", "Liên hệ hỗ trợ"
4. Khách hàng nhập câu hỏi hoặc chọn gợi ý
5. Hệ thống gửi câu hỏi đến Chatbot AI
6. Chatbot AI xử lý câu hỏi và trả về câu trả lời
7. Hệ thống hiển thị câu trả lời trong cửa sổ chat
8. Hệ thống ghi nhận hoạt động chat vào Activity Log

Alternative Flow
4a. Khách hàng chọn gợi ý "Tìm chuyến tàu"
4a1. Chatbot hỏi: "Bạn muốn đi từ ga nào đến ga nào?"
4a2. Khách hàng nhập ga đi và ga đến
4a3. Chatbot hỏi: "Bạn muốn đi vào ngày nào?"
4a4. Khách hàng nhập ngày
4a5. Chatbot tìm kiếm chuyến tàu và hiển thị kết quả (tối đa 5 chuyến)
4a6. Chatbot hiển thị nút "Xem chi tiết" cho mỗi chuyến
Use Case tiếp tục bước 8

4b. Khách hàng chọn gợi ý "Kiểm tra vé của tôi"
4b1. Nếu chưa đăng nhập: Chatbot hiển thị "Vui lòng đăng nhập để xem vé của bạn" với nút "Đăng nhập"
4b2. Nếu đã đăng nhập: Chatbot hiển thị danh sách vé gần nhất (tối đa 3 vé)
4b3. Chatbot hiển thị nút "Xem tất cả vé"
Use Case tiếp tục bước 8

4c. Khách hàng chọn gợi ý "Chính sách hoàn vé"
4c1. Chatbot hiển thị thông tin chính sách hoàn vé
4c2. Chatbot hỏi: "Bạn có muốn hủy vé không?"
4c3. Nếu có: Chatbot yêu cầu nhập mã đặt chỗ
Use Case tiếp tục bước 8

4d. Khách hàng chọn gợi ý "Liên hệ hỗ trợ"
4d1. Chatbot hiển thị thông tin liên hệ: Email, Hotline, Giờ làm việc
4d2. Chatbot hỏi: "Bạn có muốn để lại tin nhắn không?"
4d3. Nếu có: Chatbot hiển thị form liên hệ
Use Case tiếp tục bước 8

6a. Chatbot không hiểu câu hỏi
6a1. Chatbot trả lời: "Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể diễn đạt lại không?"
6a2. Chatbot hiển thị lại các gợi ý câu hỏi phổ biến
Use Case quay lại bước 4

6b. Câu hỏi cần hỗ trợ từ người thật
6b1. Chatbot trả lời: "Câu hỏi của bạn cần hỗ trợ từ nhân viên. Vui lòng liên hệ hotline hoặc để lại tin nhắn"
6b2. Chatbot hiển thị thông tin liên hệ và form để lại tin nhắn
Use Case tiếp tục bước 8

Exception Flow
5a. Không thể kết nối đến Chatbot AI
5a1. Hệ thống hiển thị lỗi: "Chatbot tạm thời không khả dụng. Vui lòng thử lại sau hoặc liên hệ hotline"
5a2. Hệ thống hiển thị thông tin liên hệ hotline
Use Case dừng lại

6a. Chatbot AI trả về lỗi
6a1. Hệ thống hiển thị: "Đã xảy ra lỗi. Vui lòng thử lại sau"
6a2. Hệ thống ghi log lỗi
Use Case dừng lại

Business Rules
BR-01: Chatbot có thể trả lời các câu hỏi về: Tìm chuyến tàu, Kiểm tra vé, Chính sách hoàn vé, Thông tin liên hệ, Hướng dẫn đặt vé
BR-02: Lịch sử chat được lưu tối đa 30 ngày (nếu đã đăng nhập)
BR-03: Khách hàng chưa đăng nhập vẫn có thể chat nhưng không lưu lịch sử
BR-04: Chatbot tự động gợi ý câu hỏi phổ biến sau mỗi câu trả lời
BR-05: Chatbot có thể chuyển sang hỗ trợ người thật nếu cần
BR-06: Giới hạn 50 tin nhắn/phiên chat để tránh spam

Non-Functional Requirement
NFR-01: Thời gian phản hồi của chatbot dưới 2 giây
NFR-02: Cửa sổ chat responsive, hoạt động tốt trên mobile
NFR-03: Chatbot hỗ trợ tiếng Việt có dấu
NFR-04: Hiển thị typing indicator khi chatbot đang xử lý
NFR-05: Hỗ trợ markdown trong câu trả lời (bold, link, list)
NFR-06: Lưu lịch sử chat trong session storage (nếu chưa đăng nhập)
NFR-07: Chatbot có thể hiển thị hình ảnh, link, button trong câu trả lời
