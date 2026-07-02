# Slide 13 - Admin Infrastructure Management

## Slide Title
Phân hệ quản trị cơ sở hạ tầng và vận hành

## NotebookLM Instruction
Summarize the admin capabilities. Do not list every button. Focus on the core management flows that support the railway domain.

## Main Slide Content
- Đồng bộ bản đồ đường sắt từ GeoJSON thành Network version mới.
- Quản lý ga, tuyến thương mại, thứ tự ga và trạng thái tuyến.
- Tạo tuyến bằng bản đồ tương tác và thuật toán kiểm tra đường ray.
- Quản lý tàu, mẫu toa, toa, sơ đồ ghế/giường.
- Tạo chuyến tàu dựa trên tuyến, tàu, lái tàu và thời gian khởi hành.
- Theo dõi báo cáo trễ, sự cố ghế, giao dịch ví/rút tiền và dashboard doanh thu.

## Speaker Notes
Nhấn mạnh admin không chỉ nhập dữ liệu tĩnh. Admin chịu trách nhiệm quản lý hạ tầng, lịch trình và sự cố phát sinh trong vận hành. Đây là phân hệ làm cho hệ thống giống một nền tảng quản lý vận tải chứ không chỉ là trang bán vé.

## Visual Suggestion
- Một dashboard gồm các module: Network, Route, Train, Trip, Issues, Finance.
- Screenshot trang tạo tuyến hoặc trang quản lý tàu/toa.

## Source Evidence
- `web/app/(protected)/admin/routes/create/page.tsx`
- `web/features/routes/components/interactive-route-builder.tsx`
- `web/app/(protected)/admin/trains/[id]/page.tsx`
- `web/app/(protected)/admin/trips/page.tsx`
- `api/src/modules/dashboard/dashboard.service.ts`

