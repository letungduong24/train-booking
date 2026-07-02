# Slide 01 - Title and Problem

## Slide Title
Railflow - Hệ thống đặt vé và quản lý vận tải đường sắt trực tuyến

## NotebookLM Instruction
Create an opening slide that clearly states the project name, topic, student project context, and the practical problem being solved. Keep it formal and suitable for a graduation defense.

## Main Slide Content
- Đề tài xây dựng hệ thống đặt vé tàu hỏa trực tuyến kết hợp quản lý vận hành cơ sở đường sắt.
- Bài toán tập trung vào ba nhóm người dùng: hành khách, quản trị viên và lái tàu.
- Hệ thống giải quyết các vấn đề: tìm chuyến, chọn ghế theo chặng, thanh toán, quản lý tuyến/tàu/toa/chuyến, xử lý sự cố ghế và theo dõi hành trình.
- Điểm nổi bật là không chỉ làm giao diện đặt vé, mà còn xử lý dữ liệu đường ray, khóa ghế thời gian thực và theo dõi chuyến tàu.

## Speaker Notes
Mở đầu bằng bối cảnh: các hệ thống đặt vé tàu không chỉ cần bán vé, mà còn phải đảm bảo dữ liệu ghế không bị bán trùng, lịch trình đúng, tuyến đường có cơ sở hạ tầng rõ ràng và người vận hành có công cụ xử lý sự cố trong quá trình chạy tàu.

## Visual Suggestion
- Logo/name Railflow.
- Một sơ đồ đơn giản gồm 3 actor: Hành khách, Quản trị viên, Lái tàu.
- Một ảnh demo trang chủ hoặc trang đặt vé.

## Source Evidence
- `api/prisma/schema.prisma`
- `web/app/(public)/booking/page.tsx`
- `web/app/(protected)/dashboard/booking/[tripId]/page.tsx`

