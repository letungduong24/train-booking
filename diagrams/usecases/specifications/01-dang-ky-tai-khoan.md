Use Case ID	UC-01
Use Case Name	Đăng ký tài khoản
Description	Là người dùng, tôi muốn đăng ký tài khoản mới để sử dụng hệ thống đặt vé tàu hỏa.
Actor(s)	Người dùng (Customer), Email Service, Google OAuth
Priority	Must Have
Trigger	Người dùng muốn tạo tài khoản mới trong hệ thống
Pre-Condition(s)	1. Người dùng chưa đăng nhập
2. Email đăng ký chưa được sử dụng trong hệ thống
Post-Condition(s)	1. Tài khoản mới được tạo với trạng thái chưa xác thực email
2. Email xác thực được gửi đến địa chỉ email đã đăng ký
3. Người dùng có thể yêu cầu gửi lại email xác thực nếu chưa xác thực thành công
Basic Flow	1. Người dùng truy cập trang đăng ký
2. Hệ thống hiển thị form đăng ký gồm họ tên, email, mật khẩu và xác nhận mật khẩu
3. Người dùng nhập thông tin và chọn "Đăng ký"
4. Hệ thống kiểm tra tính hợp lệ của dữ liệu
5. Hệ thống kiểm tra email đã tồn tại hay chưa
6. Hệ thống tạo tài khoản với vai trò USER và trạng thái chưa xác thực email
7. Hệ thống gửi email xác thực
8. Hệ thống hiển thị thông báo đăng ký thành công và hướng dẫn kiểm tra email
9. Người dùng mở liên kết xác thực email
10. Hệ thống xác thực liên kết và chuyển tài khoản sang trạng thái đã xác thực
Alternative Flow	2a. Người dùng chọn đăng ký bằng Google: Hệ thống xác thực với Google, tạo hoặc liên kết tài khoản phù hợp và xem email là đã xác thực nếu Google trả về email hợp lệ
Exception Flow	4a. Mật khẩu không đạt yêu cầu: Hệ thống hiển thị lỗi và yêu cầu nhập lại
4b. Mật khẩu xác nhận không khớp: Hệ thống hiển thị lỗi và quay lại form
5a. Email đã tồn tại: Hệ thống hiển thị lỗi và cho phép chuyển sang UC-02 Đăng nhập
6a. Lỗi tạo tài khoản: Hệ thống hiển thị lỗi và dừng Use Case
7a. Không gửi được email xác thực: Tài khoản vẫn được tạo; hệ thống thông báo lỗi gửi email và cho phép gửi lại email xác thực
10a. Liên kết xác thực hết hạn hoặc không hợp lệ: Hệ thống thông báo lỗi và cho phép gửi lại email xác thực
Business Rules	BR-01: Email phải là duy nhất
BR-02: Mật khẩu phải đáp ứng yêu cầu bảo mật tối thiểu
BR-03: Vai trò mặc định là USER
BR-04: Tài khoản đăng ký bằng email cần xác thực email trước khi sử dụng đầy đủ dịch vụ
BR-05: Email xác thực có thời hạn sử dụng giới hạn
BR-06: Tài khoản Google hợp lệ được xem là đã xác thực email
Non-Functional Requirement	NFR-01: Form đăng ký hiển thị tốt trên desktop và mobile
NFR-02: Thông báo lỗi phải rõ ràng, dễ hiểu
NFR-03: Email xác thực phải gửi bằng template đúng mục đích
NFR-04: Không hiển thị thông tin kỹ thuật nội bộ cho người dùng
