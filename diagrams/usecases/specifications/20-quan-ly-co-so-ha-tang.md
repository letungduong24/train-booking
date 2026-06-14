Use Case ID
UC-20

Use Case Name
Quản lý cơ sở hạ tầng

Description
Là Admin, tôi muốn tải lên file bản đồ GeoJSON để hệ thống tự động đồng bộ hóa danh mục nhà ga (Station) và mạng lưới đường ray (RailwayLine) vào cơ sở dữ liệu, định hình mạng lưới vận tải đường sắt.

Actor(s)
Admin

Priority
Must Have

Trigger
Admin muốn đồng bộ hóa hoặc cập nhật phiên bản mạng lưới nhà ga và đường sắt bằng file GeoJSON mới.

Pre-Condition(s)
Admin đã đăng nhập thành công vào hệ thống với vai trò ADMIN
Admin có sẵn file GeoJSON hợp lệ chứa dữ liệu nhà ga (Point) và đường ray (LineString/MultiLineString)
Thiết bị của Admin đã được kết nối Internet

Post-Condition(s)
Phiên bản mạng lưới mới (Network) được khởi tạo
Toàn bộ danh sách ga (Station) và đường ray (RailwayLine) được trích xuất và tạo tự động trong CSDL PostgreSQL
Bản đồ số GIS cập nhật tự động dữ liệu không gian mới
Hệ thống ghi nhật ký vào Activity Log

Basic Flow
1. Admin chọn menu "Quản lý cơ sở hạ tầng"
2. Hệ thống hiển thị danh sách các phiên bản mạng lưới đường sắt (Network) đã đồng bộ bao gồm: Tên mạng lưới, Phiên bản, Ngày tạo, Số lượng nhà ga, và Số lượng đoạn đường ray
3. Admin chọn lệnh "Đồng bộ từ GeoJSON" (sync-geojson-dialog)
4. Hệ thống hiển thị form yêu cầu upload file bản đồ GeoJSON (trường mapData)
5. Admin chọn file GeoJSON hợp lệ từ thiết bị và bấm "Xác nhận đồng bộ"
6. Hệ thống thực hiện kiểm tra tính hợp lệ của cấu trúc file GeoJSON
7. Backend gọi API POST /geojson/sync để xử lý dữ liệu:
   - Tạo thực thể Network mới với version tự động tăng.
   - Quét các đối tượng hình học Point có tên ga để tự động tạo các bản ghi Station (tự tạo mã ga duy nhất từ tên ga).
   - Quét các đối tượng hình học LineString/MultiLineString để tự động gộp và tạo các bản ghi RailwayLine.
8. Hệ thống phản hồi kết quả đồng bộ thành công với số lượng ga và đoạn ray đã xử lý
9. Hệ thống cập nhật bản vẽ vector nhà ga và đường sắt trên bản đồ số GIS
10. Hệ thống ghi nhận hoạt động vào nhật ký (Activity Log)

Alternative Flow
20a. Xem danh sách nhà ga và đường ray của phiên bản mạng lưới
20a1. Admin chọn một phiên bản mạng lưới (Network) từ danh sách
20a2. Hệ thống gọi API GET /geojson/network?networkId={id} để lấy dữ liệu không gian
20a3. Hệ thống hiển thị chi tiết danh sách ga dừng đỗ và các đoạn đường sắt thuộc phiên bản đó dạng bảng hoặc trực quan trên bản đồ

Exception Flow
6a. File tải lên không có trường mapData hoặc không phải định dạng GeoJSON hợp lệ
6a1. Hệ thống hiển thị thông báo lỗi: "File bản đồ GeoJSON mapData là bắt buộc và phải đúng định dạng JSON"
Use Case quay lại bước 4

7a. Hệ thống lỗi trong quá trình xử lý hoặc ghi CSDL
7a1. Hệ thống thực hiện rollback giao dịch (Transaction)
7a2. Hệ thống hiển thị thông báo lỗi: "Đồng bộ thất bại. Chi tiết lỗi hệ thống..."
Use Case dừng lại

Business Rules
BR-01: Hệ thống tự động tạo mã ga duy nhất (Code) bằng cách trích xuất ký tự đầu không dấu từ tên ga kết hợp chuỗi ngẫu nhiên để tránh trùng lặp
BR-02: Mỗi lần đồng bộ thành công sẽ sinh ra một phiên bản mạng lưới (Network) mới trong cơ sở dữ liệu để phục vụ việc lưu trữ lịch sử cấu trúc hạ tầng
BR-03: Dữ liệu tọa độ GPS của Ga và Đường ray bắt buộc phải tuân thủ hệ tọa độ WGS 84 (Kinh độ: -180 đến 180, Vĩ độ: -90 đến 90)

Non-Functional Requirement
NFR-01: Thời gian Backend đọc và xử lý file GeoJSON dưới 5000 đối tượng phải hoàn tất dưới 3 giây
NFR-02: Bản đồ số (MapLibre GL JS) phải render mạng lưới đường ray vector uốn lượn GeoJSON mượt mà dưới 3 giây
NFR-03: Áp dụng cơ chế Database Transaction để đảm bảo tính toàn vẹn dữ liệu khi tạo hàng loạt ga và đường ray cùng lúc
