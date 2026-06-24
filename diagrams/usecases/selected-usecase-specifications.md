2.3 Đặc tả Use Case

Trong hệ thống đặt vé tàu hỏa RailFlow, số lượng Use Case được phân tích tương đối nhiều do hệ thống bao gồm nhiều nhóm chức năng như xác thực người dùng, đặt vé, thanh toán, quản lý chuyến tàu, xử lý sự cố vận hành và quản lý dữ liệu bản đồ. Tuy nhiên, nhiều Use Case thuộc nhóm quản trị có cấu trúc xử lý tương tự nhau, chủ yếu là thêm, sửa, xóa, tìm kiếm và cập nhật trạng thái dữ liệu.

Vì vậy, trong phần đặc tả chi tiết, báo cáo chỉ trình bày các Use Case chính, có vai trò quan trọng hoặc thể hiện rõ nghiệp vụ đặc thù của hệ thống. Các Use Case quản lý có tính chất tương đồng sẽ không đặc tả lặp lại toàn bộ, mà chỉ chọn một số Use Case tiêu biểu để minh họa cách hệ thống xử lý dữ liệu, kiểm tra điều kiện nghiệp vụ và phản hồi cho người dùng. Cách trình bày này giúp phần đặc tả tập trung vào các luồng nghiệp vụ cốt lõi, tránh trùng lặp nội dung nhưng vẫn đảm bảo thể hiện đầy đủ chức năng quan trọng của hệ thống.

Các Use Case được chọn để đặc tả chi tiết gồm:

1. UC-01 - Đăng ký người dùng
2. UC-14 - Quản lý tàu và toa xe
3. UC-05 - Chat với trợ lý ảo
4. UC-06 - Tìm kiếm chuyến tàu
5. UC-09 - Đặt vé
6. UC-08 - Quản lý ví
7. UC-18 - Báo cáo ghế hỏng
8. UC-21 - Xử lý sự cố ghế hỏng
9. UC-04 - Xác nhận đổi ghế
10. UC-19 - Quản lý chuyến tàu
11. UC-20 - Quản lý dữ liệu mạng lưới đường sắt

Các Use Case không đặc tả chi tiết trong phần này vẫn được thể hiện trong sơ đồ Use Case tổng quát và các sơ đồ Use Case theo tác nhân. Những Use Case như đăng nhập hệ thống, quản lý hồ sơ, xem lịch sử đặt vé, xem dashboard, quản lý người dùng, quản lý trạng thái ghế, xem chuyến được phân công, báo cáo delay chuyến tàu hoặc xử lý báo cáo delay chuyến tàu có thể được xem là các chức năng hỗ trợ hoặc có luồng xử lý tương đồng với các Use Case đã chọn. Riêng nghiệp vụ delay có quy trình báo cáo và duyệt tương tự luồng xử lý sự cố ghế hỏng nên không đặc tả lặp lại.

2.3.1 Đặc tả Use Case Đăng ký người dùng (UC-01)

Use Case này được chọn vì đây là luồng đầu vào của hệ thống, liên quan đến việc tạo tài khoản, kiểm tra dữ liệu, xác thực email và thiết lập quyền người dùng ban đầu.

2.3.2 Đặc tả Use Case Quản lý tàu và toa xe (UC-14)

Use Case này được chọn vì đây là chức năng quản trị dữ liệu tàu quan trọng, liên quan đến tàu, toa xe, mẫu toa và cơ chế sinh ghế tự động. Đây là dữ liệu nền để lập chuyến, hiển thị sơ đồ ghế và phục vụ luồng đặt vé.

2.3.3 Đặc tả Use Case Chat với trợ lý ảo (UC-05)

Use Case này được chọn vì chatbot là chức năng có tính khác biệt của hệ thống, cho phép người dùng tìm chuyến, xem vé đã đặt, xem số dư ví và nhận hỗ trợ thông qua giao diện hội thoại.

2.3.4 Đặc tả Use Case Tìm kiếm chuyến tàu (UC-06)

Use Case này được chọn vì tìm kiếm chuyến tàu là bước khởi đầu của nghiệp vụ đặt vé, liên quan trực tiếp đến dữ liệu ga, tuyến đường, ngày khởi hành và số chỗ còn lại.

2.3.5 Đặc tả Use Case Đặt vé (UC-09)

Use Case này được chọn vì đây là nghiệp vụ trung tâm của hệ thống, bao gồm chọn chuyến, chọn chặng, chọn ghế, nhập thông tin hành khách, tạo booking và xử lý thanh toán.

2.3.6 Đặc tả Use Case Quản lý ví (UC-08)

Use Case này được chọn vì ví điện tử liên quan trực tiếp đến thanh toán, hoàn tiền và lịch sử giao dịch của người dùng, đặc biệt trong các luồng hủy vé hoặc xử lý sự cố.

2.3.7 Đặc tả Use Case Báo cáo ghế hỏng (UC-18)

Use Case này được chọn vì đây là nghiệp vụ vận hành dành cho lái tàu, thể hiện việc kiểm tra chuyến được phân công, kiểm tra trạng thái chuyến và ngăn báo cáo trùng lặp.

2.3.8 Đặc tả Use Case Xử lý sự cố ghế hỏng (UC-21)

Use Case này được chọn vì đây là luồng xử lý sự cố phức tạp, có sự tham gia của admin, lái tàu, hành khách, email và ví điện tử. Luồng này bao gồm xác nhận sự cố, đổi ghế, hành khách xác nhận hoặc từ chối và hoàn tiền khi cần thiết.

2.3.9 Đặc tả Use Case Xác nhận đổi ghế (UC-04)

Use Case này được chọn để hoàn thiện luồng xử lý ghế hỏng sau khi admin xác nhận sự cố. Đây là bước hành khách quyết định đồng ý đổi sang ghế thay thế hoặc từ chối để hệ thống thực hiện hoàn tiền theo chính sách.

2.3.10 Đặc tả Use Case Quản lý chuyến tàu (UC-19)

Use Case này được chọn làm đại diện cho nhóm chức năng quản trị vận hành, bao gồm tạo chuyến, phân công lái tàu, cập nhật route/driver khi chuyến còn SCHEDULED và xóa chuyến khi không vi phạm toàn vẹn dữ liệu. Nghiệp vụ delay được tách sang UC-17/UC-22.

2.3.11 Đặc tả Use Case Quản lý dữ liệu mạng lưới đường sắt (UC-20)

Use Case này được chọn vì đây là chức năng đặc thù của hệ thống, liên quan đến đồng bộ GeoJSON, quản lý phiên bản network, nhà ga, tuyến đường và dữ liệu bản đồ phục vụ tìm kiếm, đặt vé và hiển thị hành trình.
