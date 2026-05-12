Use Case ID
UC-09

Use Case Name
Đặt vé tàu

Description
Là khách hàng, tôi muốn đặt vé tàu hỏa để đi từ ga này đến ga khác.

Actor(s)
Khách hàng (Customer), Payment Gateway, Email Service

Priority
Must Have

Trigger
Khách hàng muốn đặt vé tàu sau khi tìm kiếm chuyến

Pre-Condition(s)
Khách hàng đã tìm kiếm và chọn chuyến tàu
Chuyến tàu có status SCHEDULED
Chuyến tàu còn ghế trống
Thiết bị của khách hàng đã được kết nối internet

Post-Condition(s)
Đơn đặt vé được tạo thành công
Vé được tạo sau khi thanh toán thành công
Email xác nhận và vé PDF được gửi đến khách hàng
Ghế được đánh dấu đã đặt
Hệ thống ghi nhận hoạt động đặt vé vào Activity Log

Basic Flow - Luồng 1: Init → Passengers → Payment (2 bước)
1. Khách hàng chọn chuyến tàu từ kết quả tìm kiếm
2. Hệ thống hiển thị trang chi tiết chuyến với: Thông tin chuyến, Sơ đồ ghế (màu xanh: trống, màu đỏ: đã đặt, màu vàng: đang giữ, màu xám: disabled)
3. Khách hàng chọn ga đi và ga đến từ dropdown
4. Khách hàng chọn ghế trên sơ đồ (có thể chọn nhiều ghế)
5. Hệ thống hiển thị thông tin ghế đã chọn: Toa, Ghế, Loại, Giá tạm tính (chưa có giảm giá)
6. Khách hàng chọn lệnh "Tiếp tục"
7. Hệ thống gọi API POST /bookings/init với: tripId, seatIds, fromStationId, toStationId
8. Hệ thống kiểm tra: Chuyến tàu hợp lệ, Ga hợp lệ, Ghế hợp lệ
9. Hệ thống tạo Redis lock cho các ghế (TTL 10 phút)
10. Hệ thống tạo Booking với: code, userId, tripId, totalPrice = 0, status PENDING, metadata (tripId, fromStationId, toStationId, seatIds)
11. Hệ thống thêm job vào queue để tự động hủy sau 10 phút nếu không thanh toán
12. Hệ thống emit socket event "seats.locked" để các client khác thấy ghế chuyển sang màu vàng
13. Hệ thống trả về: bookingId, bookingCode
14. Hệ thống hiển thị form nhập thông tin hành khách với: Họ tên, CCCD, Đối tượng (Người lớn/Trẻ em/Sinh viên/Người cao tuổi) cho mỗi ghế
15. Khách hàng nhập thông tin hành khách và chọn lệnh "Thanh toán"
16. Hệ thống gọi API POST /bookings/:code/passengers với: passengers (seatId, passengerName, passengerId, passengerGroupId)
17. Hệ thống kiểm tra: CCCD hợp lệ, Độ tuổi phù hợp với đối tượng
18. Hệ thống tính giá vé cho từng ghế: price = (distance × basePricePerKm × coachMultiplier × tierMultiplier + stationFee) × (1 - discountRate)
19. Hệ thống cập nhật Booking: totalPrice, metadata (thêm passengers với price)
20. Hệ thống tạo URL thanh toán VNPay
21. Hệ thống trả về: bookingCode, paymentUrl, totalPrice
22. Hệ thống chuyển hướng khách hàng đến trang thanh toán VNPay
23. Khách hàng thanh toán thành công trên VNPay
24. VNPay callback về hệ thống với kết quả thanh toán
25. Hệ thống gọi API POST /payment/vnpay-callback
26. Hệ thống kiểm tra: Chữ ký hợp lệ, Kết quả thanh toán thành công
27. Hệ thống gọi confirmBooking(bookingCode)
28. Hệ thống kiểm tra: Booking tồn tại, status PENDING, Chuyến tàu vẫn SCHEDULED, Ghế chưa bị người khác đặt
29. Hệ thống tạo Ticket cho từng hành khách với: seatId, tripId, price, passengerName, passengerId, passengerGroupId, fromStationIndex, toStationIndex
30. Hệ thống cập nhật Booking: status = PAID, metadata = null
31. Hệ thống xóa Redis lock
32. Hệ thống emit socket event "seats.released" và "seats.booked" để các client khác thấy ghế chuyển sang màu đỏ
33. Hệ thống tạo PDF vé với QR code
34. Hệ thống gửi email xác nhận kèm PDF vé
35. Hệ thống chuyển hướng khách hàng đến trang xác nhận đặt vé thành công
36. Hệ thống ghi nhận hoạt động đặt vé vào Activity Log

Alternative Flow - Luồng 2: All-in-one → Payment (1 bước)
7a. Hệ thống gọi API POST /bookings với: tripId, passengers (seatId, passengerName, passengerId, passengerGroupId), fromStationId, toStationId
8a. Hệ thống kiểm tra: Chuyến tàu hợp lệ, Ga hợp lệ, Ghế hợp lệ, CCCD hợp lệ, Độ tuổi phù hợp
9a. Hệ thống tính giá vé cho từng ghế
10a. Hệ thống tạo Booking với: code, userId, tripId, totalPrice, status PENDING, metadata (tripId, fromStationId, toStationId, passengers)
11a. Hệ thống tạo URL thanh toán VNPay
12a. Hệ thống trả về: bookingId, bookingCode, paymentUrl
Use Case tiếp tục bước 22

Exception Flow
8a. Chuyến tàu không còn SCHEDULED (đã khởi hành hoặc hủy)
8a1. Hệ thống hiển thị lỗi: "Chuyến tàu đã khởi hành hoặc không khả dụng"
Use Case dừng lại

9a. Không thể tạo Redis lock (ghế đã bị người khác giữ)
9a1. Hệ thống hiển thị lỗi: "Ghế {seatName} đang được giữ bởi người khác. Vui lòng chọn ghế khác"
9a2. Hệ thống rollback các lock đã tạo
Use Case quay lại bước 2

17a. CCCD không hợp lệ
17a1. Hệ thống hiển thị lỗi: "CCCD {cccd} không hợp lệ"
Use Case quay lại bước 14

17b. Độ tuổi không phù hợp với đối tượng
17b1. Hệ thống hiển thị lỗi: "Độ tuổi không phù hợp với đối tượng {groupName}"
Use Case quay lại bước 14

23a. Khách hàng hủy thanh toán trên VNPay
23a1. VNPay callback về hệ thống với kết quả hủy
23a2. Hệ thống cập nhật Booking: status = CANCELLED
23a3. Hệ thống xóa Redis lock
23a4. Hệ thống emit socket event "seats.released"
23a5. Hệ thống hiển thị thông báo: "Thanh toán bị hủy. Đơn hàng đã bị hủy"
Use Case dừng lại

28a. Ghế đã bị người khác đặt (race condition)
28a1. Hệ thống cập nhật Booking: status = PAYMENT_FAILED
28a2. Nếu thanh toán bằng ví: Hệ thống hoàn tiền về ví
28a3. Hệ thống hiển thị lỗi: "Ghế đã được đặt bởi người khác. Tiền đã được hoàn về ví của bạn"
Use Case dừng lại

28b. Chuyến tàu đã khởi hành
28b1. Hệ thống cập nhật Booking: status = CANCELLED
28b2. Nếu thanh toán bằng ví: Hệ thống hoàn tiền về ví
28b3. Hệ thống hiển thị lỗi: "Chuyến tàu đã khởi hành. Tiền đã được hoàn về ví của bạn"
Use Case dừng lại

34a. Không thể gửi email
34a1. Hệ thống vẫn cập nhật thành công
34a2. Hệ thống ghi log lỗi gửi email
34a3. Khách hàng có thể tải vé từ trang "Vé của tôi"
Use Case tiếp tục bước 35

Timeout Flow
11a. Khách hàng không thanh toán trong 10 phút
11a1. Job trong queue được trigger
11a2. Hệ thống kiểm tra Booking vẫn PENDING
11a3. Hệ thống cập nhật Booking: status = CANCELLED
11a4. Redis lock tự động hết hạn (TTL 10 phút)
11a5. Hệ thống emit socket event "seats.released"
Use Case dừng lại

Business Rules
BR-01: Chỉ cho phép đặt vé cho chuyến có status SCHEDULED
BR-02: Ghế được lock trong 10 phút, sau đó tự động hủy nếu không thanh toán
BR-03: CCCD phải hợp lệ (12 chữ số, checksum đúng)
BR-04: Độ tuổi phải phù hợp với đối tượng (Trẻ em < 15, Sinh viên 15-22, Người cao tuổi > 60)
BR-05: Giá vé được tính động dựa trên: distance, basePricePerKm, coachMultiplier, tierMultiplier, stationFee, discountRate
BR-06: Mỗi user chỉ được đặt tối đa 10 vé/chuyến
BR-07: Booking code format: RAILFLOW-YYYYMMDD-XXXX
BR-08: Vé PDF chứa QR code để quét khi lên tàu

Non-Functional Requirement
NFR-01: Thời gian load sơ đồ ghế dưới 2 giây
NFR-02: Thời gian tạo booking dưới 1 giây
NFR-03: Thời gian tạo URL thanh toán dưới 2 giây
NFR-04: Sơ đồ ghế responsive, hoạt động tốt trên mobile
NFR-05: Sơ đồ ghế cập nhật real-time qua WebSocket
NFR-06: Hiển thị countdown 10 phút khi đang giữ ghế
NFR-07: Tạo PDF vé dưới 3 giây
NFR-08: Email được gửi trong vòng 30 giây
