# 12 - Quản Trị Tàu, Toa Và Ghế

## Mục tiêu học

Hiểu cách admin quản lý tàu, mẫu toa, toa và ghế; cách backend tự sinh sơ đồ ghế/giường từ template; cách reorder toa; và cách điều kiện xóa/khóa bảo vệ dữ liệu.

File cần đọc:

- `api/src/modules/train/train.service.ts`
- `api/src/modules/train/train.controller.ts`
- `api/src/modules/coaches/coaches.service.ts`
- `api/src/modules/coaches/coaches.controller.ts`
- `api/src/modules/coach-template/coach-template.service.ts`
- `api/src/modules/seats/seats.service.ts`
- `web/features/trains/components/create-train-dialog.tsx`
- `web/features/trains/components/create-coach-dialog.tsx`
- `web/features/trains/components/trains-table.tsx`
- `web/features/trains/components/seat-layout-viewer.tsx`
- `web/features/trains/components/bed-layout-viewer.tsx`
- `web/features/trains/components/sortable-coach-item.tsx`
- `web/features/trains/hooks/use-trains.ts`
- `web/features/trains/hooks/use-coach-mutations.ts`
- `web/features/trains/hooks/use-seat-mutations.ts`

Walkthrough code chi tiết:

- `docs/deep-dive-guides/code-walkthroughs/07-coach-template-seat-map-code.md`

## Domain model

```text
Train
  -> Coach
      -> Seat
CoachTemplate
  -> Coach
```

Quan hệ:

- Train chứa nhiều coach.
- Coach chứa nhiều seat.
- Coach được tạo dựa trên CoachTemplate.

Đây là phần composition rõ nhất:

- Xóa train có thể cascade coach/seat nếu DB cho phép.
- Nhưng service nên chặn hard delete nếu train đã có trip/ticket để bảo vệ dữ liệu lịch sử.

## CoachTemplate

Mẫu toa định nghĩa:

- `layout`: `SEAT` hoặc `BED`.
- `totalRows`
- `totalCols`
- `tiers`
- `coachMultiplier`
- `tierMultipliers`

Ví dụ:

- Toa ghế thường: 4 cột, nhiều hàng, 1 tầng.
- Toa giường: số tầng > 1.

Template giúp admin không phải tạo từng ghế thủ công.

## Tạo train

Input:

- code;
- name;
- averageSpeedKmH;
- status.

Backend kiểm tra:

- code unique;
- status hợp lệ;
- speed hợp lệ.

Train mới chưa có coach.

## Tạo coach

Input:

- trainId;
- templateId;
- status.

Backend:

1. Kiểm tra train tồn tại.
2. Kiểm tra template tồn tại.
3. Lấy order lớn nhất của coach trong train.
4. Tạo coach với tên tự sinh như Toa N.
5. Sinh danh sách seat/bed theo template.
6. `createMany` seat.
7. Trả coach kèm template/seats.

## Sinh seat/bed từ template

Dữ liệu template:

```text
totalRows
totalCols
tiers
layout
```

Backend lặp:

```text
for tier
  for row
    for col
      create seat
```

Mỗi seat có:

- name;
- rowIndex;
- colIndex;
- tier;
- type;
- status;
- coachId.

Unique:

```text
coachId + rowIndex + colIndex + tier
```

Chi tiết cần nắm:

- Với `SEAT`, backend duyệt `row x col` và sinh toàn bộ ghế với `tier = 0`.
- Với `BED`, backend xem `rowIndex` là khoang, `tier` là tầng, `colIndex` là bên trái/phải.
- Frontend không hard-code vị trí ghế; component lọc `seats` theo `rowIndex`, sắp xếp bằng `colIndex`, rồi render thành grid.
- Ở màn hình đặt vé, trạng thái hiển thị không chỉ dựa trên `Seat.status`, mà còn kết hợp `bookingStatus` và danh sách ghế đang bị Redis lock.

## Layout frontend

Frontend có hai component:

- `SeatLayoutViewer`: layout ghế ngồi.
- `BedLayoutViewer`: layout giường/tầng.

Component dựa vào:

- template layout;
- rows/cols/tiers;
- seat row/col/tier;
- status;
- selected/highlighted seat.

## Reorder coach

Admin kéo thả thứ tự toa.

Flow:

```text
Frontend sortable list
-> POST /coaches/train/{trainId}/reorder
-> Backend update order
-> Có thể tự sinh lại tên toa theo thứ tự
-> Frontend refetch danh sách coach
```

Điểm cần nhớ:

- Order ảnh hưởng UI và trải nghiệm chọn toa.
- Không nên reorder bằng cách xóa tạo lại coach vì sẽ mất seat/ticket relation.

## Khóa toa/ghế

Trong hệ thống có status:

- TrainStatus
- CoachStatus
- SeatStatus

Ý nghĩa:

- `ACTIVE`: có thể dùng.
- `INACTIVE`: không dùng tạm.
- `MAINTENANCE`: bảo trì.
- Seat còn có `DISABLED`.

Khi khóa toa/ghế cần kiểm tra:

- có trip sắp chạy không;
- có ticket paid trên trip liên quan không;
- nếu có khách bị ảnh hưởng thì nên đi qua luồng incident/seat issue thay vì khóa thẳng.

## Hard delete

Với dữ liệu đã phát sinh nghiệp vụ, hard delete nguy hiểm.

Ví dụ:

- Xóa train đã có trip sẽ làm mất lịch sử vận hành.
- Xóa coach/seat đã có ticket sẽ làm vé cũ không còn tham chiếu.

Do đó service nên:

- chặn xóa nếu đã có trip/ticket;
- hoặc chuyển status inactive/maintenance;
- trả message rõ bằng tiếng Việt.

## Quản lý seat trong admin trip detail

Admin có thể xem seat map theo trip:

- ghế booked;
- ghế holding;
- ghế available;
- passenger info;
- route segment đang xem.

Điểm cần hiểu:

- Seat physical status và booking status là hai lớp khác nhau.
- Một seat vật lý `AVAILABLE` vẫn có thể đã booked trên chặng đang xem.
- Một seat vật lý `DISABLED` không nên cho đặt dù chưa booked.

## Các lỗi thường gặp

### Khóa toa internal server

Nguyên nhân có thể:

- service chưa handle coach có ticket/trip;
- frontend gọi endpoint không còn đúng;
- backend throw lỗi tiếng Anh/raw Prisma.

Cách đúng:

- kiểm tra tồn tại coach;
- kiểm tra ràng buộc trip/ticket;
- nếu không cho khóa/xóa thì trả message rõ;
- nếu chức năng không hỗ trợ thì bỏ nút frontend.

### Xóa toa lỗi

Thường do FK constraint:

- seat có ticket;
- coach có seat;
- trip/ticket liên quan.

Không nên để Prisma error raw ra UI.

### Sơ đồ ghế sai layout

Kiểm tra:

- template rows/cols/tiers;
- seat rowIndex/colIndex/tier;
- component đang dùng SEAT hay BED.

## Câu hỏi bảo vệ

- Vì sao cần CoachTemplate?
- Tạo coach có sinh seat tự động không?
- Vì sao không nên xóa hard delete train/coach/seat đã có dữ liệu?
- Seat status và booking status khác nhau thế nào?
- Reorder coach nên update order hay tạo lại coach?
