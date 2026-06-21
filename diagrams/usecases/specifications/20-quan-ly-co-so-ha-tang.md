Use Case ID	UC-20
Use Case Name	Quản lý dữ liệu mạng lưới đường sắt
Description	Là admin, tôi muốn đồng bộ GeoJSON và quản lý dữ liệu route/station/network để hệ thống có dữ liệu phục vụ tìm kiếm chuyến, lập lịch, tính đường đi và hiển thị bản đồ.
Actor(s)	Admin
Priority	Must Have
Trigger	Admin cần đồng bộ dữ liệu bản đồ hoặc quản lý tuyến đường
Pre-Condition(s)	1. Admin đã đăng nhập đối với các thao tác quản trị route
2. File GeoJSON hợp lệ khi thực hiện đồng bộ dữ liệu bản đồ
Post-Condition(s)	1. Khi đồng bộ thành công, hệ thống tạo network version mới, station và railway line tương ứng
2. Khi tạo hoặc cập nhật route thành công, route được gắn với network phù hợp và có dữ liệu ga/path phục vụ tìm kiếm, đặt vé và bản đồ
Basic Flow	1. Admin mở khu vực quản lý dữ liệu mạng lưới
2. Admin tải lên file GeoJSON để đồng bộ dữ liệu bản đồ
3. Hệ thống kiểm tra và đọc dữ liệu GeoJSON
4. Hệ thống tạo network version mới
5. Hệ thống tạo danh sách station từ các Point hợp lệ trong file
6. Hệ thống tạo railway line từ các LineString hoặc MultiLineString trong file
7. Admin mở danh sách route
8. Admin tạo route mới bằng cách nhập mã tuyến, tên tuyến, thời lượng, thời gian quay đầu, giá cơ bản, phí bến, network và danh sách ga dừng
9. Hệ thống kiểm tra dữ liệu route và danh sách ga
10. Hệ thống tính khoảng cách, pathCoordinates và lưu route
Alternative Flow	1a. Admin xem danh sách network: Hệ thống hiển thị các network version theo thứ tự mới nhất trước
1b. Admin xem dữ liệu một network: Hệ thống hiển thị stations và railway lines thuộc network được chọn; nếu không chọn network, hệ thống lấy network mới nhất
7a. Admin tìm kiếm hoặc lọc route theo tên/trạng thái: Hệ thống hiển thị danh sách route phù hợp
8a. Admin cập nhật route DRAFT: Hệ thống cập nhật trực tiếp route nếu dữ liệu hợp lệ
8b. Admin cập nhật route ACTIVE hoặc kích hoạt lại route cũ: Hệ thống tạo version route mới khi cần để giữ lịch sử phiên bản
8c. Admin thêm ga vào route: Hệ thống thêm ga và tính lại pathCoordinates
8d. Admin xóa ga khỏi route: Hệ thống xóa ga, đánh lại thứ tự ga còn lại và tính lại pathCoordinates
8e. Admin sắp xếp lại ga trong route: Hệ thống lưu thứ tự mới và tính lại pathCoordinates
8f. Admin yêu cầu tính lại path: Hệ thống tính lại pathCoordinates và totalDistanceKm từ railway lines của network
Exception Flow	2a. Không có file GeoJSON: Hệ thống từ chối đồng bộ
3a. File GeoJSON không đọc được hoặc sai cấu trúc: Hệ thống từ chối đồng bộ và hiển thị lỗi
8g. Không có network nào khi tạo route mà không truyền networkId: Hệ thống từ chối tạo route
8h. Route có ít hơn 2 ga dừng: Hệ thống từ chối tạo hoặc cập nhật route
8i. Ga không tồn tại hoặc không thuộc network được chọn: Hệ thống từ chối tạo hoặc cập nhật route
8j. Route ACTIVE/INACTIVE bị chuyển ngược về DRAFT: Hệ thống từ chối thao tác
10a. Không tìm thấy đường nối hợp lệ giữa các ga trên railway lines: Hệ thống không lưu thay đổi route
10b. Lỗi lưu dữ liệu route hoặc tính path: Hệ thống rollback và giữ nguyên dữ liệu cũ
Business Rules	BR-01: Mỗi lần đồng bộ GeoJSON tạo một network version mới
BR-02: Station và railway line luôn thuộc một network cụ thể
BR-03: Route phải thuộc một network cụ thể
BR-04: Route phải có ít nhất 2 ga dừng
BR-05: Station thêm mới vào route phải thuộc network của route
BR-06: Route ACTIVE khi cập nhật nội dung có thể tạo version mới để giữ lịch sử
BR-07: Khi một version route được kích hoạt, các version song song cùng code được chuyển sang INACTIVE
BR-08: Path của route được tính từ railway lines thuộc cùng network
Non-Functional Requirement	NFR-01: Đồng bộ GeoJSON phải có thông báo thành công hoặc thất bại rõ ràng
NFR-02: Tạo/cập nhật route phải rollback nếu tính path thất bại
NFR-03: Bản đồ hiển thị ổn định, không làm vỡ layout
NFR-04: Thuật toán route/path phải dễ bảo trì và có hiệu năng phù hợp với dữ liệu hiện tại
