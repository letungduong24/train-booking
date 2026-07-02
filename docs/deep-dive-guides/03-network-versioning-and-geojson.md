# 03 - Network Versioning Và GeoJSON

## Mục tiêu học

Hiểu cách Railflow quản lý dữ liệu bản đồ đường sắt theo phiên bản, cách import GeoJSON, và vì sao `Network` là nền tảng cho tạo tuyến.

File cần đọc:

- `api/src/modules/geojson/geojson.service.ts`
- `api/src/modules/geojson/geojson.controller.ts`
- `api/prisma/schema.prisma`
- `web/app/(protected)/admin/network-sync/page.tsx`
- `web/features/routes/components/sync-geojson-modal.tsx`
- `web/features/routes/lib/geojson.ts`

## Bài toán

Dữ liệu đường sắt không cố định mãi. Ga có thể được bổ sung, đường ray có thể thay đổi, dữ liệu tọa độ có thể được import lại từ file mới. Nếu sửa trực tiếp bảng `Station` và `RailwayLine`, các route cũ có nguy cơ mất tính nhất quán.

Railflow giải quyết bằng `Network`:

- Mỗi lần đồng bộ bản đồ có thể tạo một version mới.
- `Station`, `RailwayLine`, `Route` đều gắn với `networkId`.
- Route được tạo trên network nào thì dùng đường ray và ga của network đó.

## Model liên quan

```text
Network
  1 - N Station
  1 - N RailwayLine
  1 - N Route
```

### Network

- `id`: khóa chính.
- `version`: số phiên bản unique.
- `name`: tên phiên bản, ví dụ bản đồ tháng/năm.

### Station

- `code`: mã ga.
- `name`: tên ga.
- `latitude`, `longitude`: tọa độ.
- `networkId`: thuộc network nào.

### RailwayLine

- `name`: tên đoạn/tuyến đường ray.
- `pathCoordinates`: tọa độ đường ray dạng GeoJSON coordinates.
- `networkId`: thuộc network nào.

## Luồng import GeoJSON backend

Luồng tổng quát:

```text
Admin chọn file / dữ liệu GeoJSON
-> Frontend gửi lên backend
-> GeojsonController
-> GeojsonService
-> Tạo Network version mới
-> Parse stations
-> Parse railway lines
-> Lưu Station, RailwayLine
```

### Bước 1: tạo network version

Service cần xác định version mới. Thường logic sẽ lấy version lớn nhất hiện có rồi tăng lên.

Điểm cần nhớ:

- Không ghi đè network cũ.
- Dữ liệu import mới có không gian độc lập.

### Bước 2: tách station và railway line

GeoJSON có thể chứa nhiều loại feature. Hệ thống cần phân loại:

- Feature điểm hoặc thuộc tính ga -> `Station`.
- Feature đường -> `RailwayLine`.

Với station:

- cần name;
- cần tọa độ;
- cần sinh hoặc lấy code.

Với railway line:

- cần name;
- cần `pathCoordinates`.

### Bước 3: lưu vào database

Mỗi station/line đều được lưu với `networkId`. Đây là điểm quan trọng nhất. Nếu quên `networkId`, dữ liệu giữa các version sẽ trộn lẫn.

## Luồng frontend đồng bộ bản đồ

Frontend liên quan:

- Trang admin network sync.
- Modal chọn file hoặc kích hoạt đồng bộ.
- Helper tạo feature collection.

Trách nhiệm frontend:

- hiển thị file/dữ liệu được chọn;
- gửi đúng payload;
- thông báo kết quả đồng bộ;
- invalidate query để admin thấy network/route mới.

Trách nhiệm frontend không nên làm:

- không tự tính route path thật;
- không tự quyết định version database;
- không tự sửa station cũ khi import network mới.

## Vì sao network versioning quan trọng cho route algorithm

Khi tạo route, backend chỉ được dùng:

- các `Station` thuộc `route.networkId`;
- các `RailwayLine` thuộc cùng `networkId`.

Nếu dùng nhầm line của network khác, tọa độ ga và đường ray có thể lệch nhau, thuật toán snap sẽ báo lỗi hoặc tạo đường sai.

## Case lỗi cần hiểu

### GeoJSON thiếu tọa độ hợp lệ

Kết quả:

- không tạo được station/line tương ứng;
- hoặc service bỏ qua feature lỗi tùy cách xử lý.

### Network có station nhưng không có railway line

Khi tạo route:

- `calculateRoutePath` sẽ không có segment hợp lệ;
- backend báo mạng lưới đường sắt chưa có dữ liệu đường ray hợp lệ.

### Station và railway line lệch xa nhau

Khi snap:

- nếu khoảng cách snap vượt `SNAP_THRESHOLD_KM`;
- route pair sẽ không hợp lệ.

## Câu hỏi bảo vệ nên chuẩn bị

- Vì sao cần `Network.version` thay vì chỉ một bảng station?
- Khi import bản đồ mới, route cũ có bị ảnh hưởng không?
- Vì sao route cần `networkId`?
- Nếu một ga cùng tên xuất hiện ở hai network khác nhau, hệ thống phân biệt bằng gì?

