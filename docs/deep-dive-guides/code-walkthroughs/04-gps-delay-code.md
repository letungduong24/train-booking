# 04 - GPS Giả Lập Và Delay Code Walkthrough

## Mục tiêu

Hiểu code tính GPS giả lập: lấy tọa độ route, tính thời lượng chạy, cộng delay, tính progress, nội suy vị trí trên polyline, tính bearing/speed và xác định status.

File chính:

- `api/src/modules/trip/utils/live-location-calculator.ts`
- `api/src/modules/trip/trip.service.ts`
- `api/src/modules/trip-delay-reports/trip-delay-reports.service.ts`

## 1. Kiểu dữ liệu đầu vào và đầu ra

### Code

```ts
interface TripLike {
  status: string;
  departureTime: Date;
  departureDelayMinutes: number;
  arrivalDelayMinutes: number;
  route: {
    durationMinutes: number;
    totalDistanceKm: number;
    pathCoordinates: unknown;
    stations: RouteStationLike[];
  };
  train?: {
    averageSpeedKmH: number;
  } | null;
}

export interface LiveLocationSnapshot {
  latitude: number;
  longitude: number;
  bearing: number;
  speed: number;
  progress: number;
  status: string;
  departureDelayMinutes: number;
  arrivalDelayMinutes: number;
  shouldMarkCompleted: boolean;
}
```

### Giải thích

Hàm GPS không cần toàn bộ object `Trip` từ Prisma. Nó chỉ cần những trường phục vụ mô phỏng:

- giờ gốc khởi hành;
- delay khởi hành;
- delay đến nơi;
- route path;
- tổng km;
- tốc độ trung bình của tàu.

Output là snapshot để frontend vẽ marker:

- `latitude`, `longitude`: vị trí.
- `bearing`: hướng.
- `speed`: tốc độ giả lập.
- `progress`: 0 -> 1.
- `status`: trạng thái suy ra tại thời điểm hiện tại.
- `shouldMarkCompleted`: báo service có thể cập nhật DB.

## 2. Fallback khi route thiếu path

### Code

```ts
const allPoints = extractRoutePoints(route.pathCoordinates, route.stations);
const firstStation = route.stations[0]?.station;
const defaultLng = firstStation?.longitude ?? 105.8542;
const defaultLat = firstStation?.latitude ?? 21.0285;

if (allPoints.length < 2) {
  return {
    latitude: defaultLat,
    longitude: defaultLng,
    bearing: 0,
    speed: 0,
    progress: 0,
    status,
    departureDelayMinutes,
    arrivalDelayMinutes,
    shouldMarkCompleted: false,
  };
}
```

### Giải thích nghiệp vụ

GPS giả lập cần ít nhất 2 điểm để nội suy. Nếu route chưa có `pathCoordinates` hoặc dữ liệu lỗi:

- không crash API;
- trả về vị trí ga đầu;
- speed/progress = 0;
- không auto complete.

Đây là defensive coding. Demo vẫn mở được trang chi tiết chuyến dù route path thiếu.

## 3. Tính thời lượng chạy từ distance và speed

### Code

```ts
const averageSpeedKmH = train?.averageSpeedKmH ?? 0;
const durationMinutes =
  route.totalDistanceKm > 0 && averageSpeedKmH > 0
    ? Math.round((route.totalDistanceKm / averageSpeedKmH) * 60)
    : route.durationMinutes || 60;

const totalDurationMs = Math.max(
  60 * 1000,
  (durationMinutes + arrivalDelayMinutes) * 60 * 1000,
);
```

### Giải thích

Công thức:

```text
time(hour) = distance(km) / speed(km/h)
time(minute) = time(hour) * 60
```

Nếu route có `totalDistanceKm` và train có `averageSpeedKmH`, hệ thống tính thời gian chạy vật lý hơn. Nếu không có, dùng `route.durationMinutes`.

`arrivalDelayMinutes` được cộng vào tổng thời lượng. Nghĩa là tàu chạy/tới nơi muộn hơn.

`Math.max(60 * 1000, ...)` tránh duration = 0 gây chia cho 0 hoặc progress vô hạn.

## 4. Delay khởi hành làm lùi start time

### Code

```ts
const startMs = new Date(departureTime).getTime() + departureDelayMinutes * 60 * 1000;
const elapsedMs = (nowMs - startMs) * (speedup && speedup > 0 ? speedup : 1);
const simulatedNow = startMs + elapsedMs;
const endMs = startMs + totalDurationMs;
```

### Giải thích nghiệp vụ

Nếu chuyến gốc khởi hành 20:24 và trễ 55 phút:

```text
startMs = 20:24 + 55 phút = 21:19
```

GPS chỉ bắt đầu chạy từ 21:19.

`arrivalDelayMinutes` không cộng vào start; nó cộng vào duration. Đây là khác biệt quan trọng:

- departure delay: lùi giờ bắt đầu;
- arrival delay: kéo dài giờ tới nơi.

`speedup` phục vụ demo. Nếu speedup = 10, 1 phút thật tương đương 10 phút mô phỏng.

## 5. Suy ra status và progress

### Code

```ts
let currentStatus = status;
if (currentStatus === 'SCHEDULED' && simulatedNow >= startMs) {
  currentStatus = 'IN_PROGRESS';
}
if (currentStatus === 'IN_PROGRESS' && simulatedNow >= endMs) {
  currentStatus = 'COMPLETED';
}

const progress =
  currentStatus === 'COMPLETED'
    ? 1
    : currentStatus === 'IN_PROGRESS'
      ? clamp(elapsedMs / totalDurationMs, 0, 1)
      : 0;
```

### Giải thích

Trước giờ chạy:

```text
status = SCHEDULED
progress = 0
```

Đang chạy:

```text
status = IN_PROGRESS
progress = elapsed / duration
```

Đã tới cuối:

```text
status = COMPLETED
progress = 1
```

`clamp` đảm bảo progress không nhỏ hơn 0 hoặc lớn hơn 1.

## 6. Nội suy tọa độ trên đường ray

### Code

```ts
function interpolateOnPath(points: Coordinate[], progress: number) {
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + distanceKm(points[i - 1], points[i]));
  }

  const totalDistance = distances[distances.length - 1];
  if (totalDistance <= 0) {
    return { longitude: points[0][0], latitude: points[0][1], bearing: 0 };
  }

  const targetDistance = clamp(progress, 0, 1) * totalDistance;
  let index = 0;
  while (index < distances.length - 2 && distances[index + 1] < targetDistance) {
    index++;
  }

  const segmentDistance = distances[index + 1] - distances[index];
  const t = segmentDistance > 0 ? (targetDistance - distances[index]) / segmentDistance : 0;
  const start = points[index];
  const end = points[index + 1];
  const longitude = start[0] + t * (end[0] - start[0]);
  const latitude = start[1] + t * (end[1] - start[1]);

  return {
    longitude,
    latitude,
    bearing: bearingDegrees(start, end),
  };
}
```

### Giải thích thuật toán

Route path là nhiều điểm:

```text
P0 -> P1 -> P2 -> P3 -> ...
```

Code tính khoảng cách tích lũy:

```text
distances[0] = 0
distances[1] = P0-P1
distances[2] = P0-P1 + P1-P2
...
```

Nếu `progress = 0.4`, tàu đang ở 40% tổng chiều dài path. Code tìm đoạn nhỏ chứa vị trí đó, rồi nội suy tuyến tính:

```text
lng = start.lng + t * (end.lng - start.lng)
lat = start.lat + t * (end.lat - start.lat)
```

Vì `pathCoordinates` đã bám đường ray, marker cũng chạy theo đường ray.

## 7. Tính khoảng cách bằng Haversine

### Code

```ts
function distanceKm(a: Coordinate, b: Coordinate) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b[1] - a[1]);
  const dLng = toRadians(b[0] - a[0]);
  const lat1 = toRadians(a[1]);
  const lat2 = toRadians(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}
```

### Giải thích

Tọa độ là kinh độ/vĩ độ, không phải hệ tọa độ phẳng. Haversine tính khoảng cách trên bề mặt trái đất. Với phạm vi Việt Nam, cách này đủ tốt cho mô phỏng.

## 8. Kết quả trả về

### Code

```ts
return {
  latitude,
  longitude,
  bearing,
  speed,
  progress,
  status: currentStatus,
  departureDelayMinutes,
  arrivalDelayMinutes,
  shouldMarkCompleted: status === 'IN_PROGRESS' && currentStatus === 'COMPLETED',
};
```

### Giải thích

Frontend nhận đủ thông tin để:

- vẽ marker;
- vẽ progress;
- hiển thị tốc độ;
- hiển thị delay;
- biết trạng thái hiện tại.

`shouldMarkCompleted` không tự update DB trong pure function. Pure function chỉ tính toán; service bên ngoài quyết định update database.

## Tự kiểm tra

- Delay khởi hành cộng vào biến nào?
- Delay đến nơi cộng vào biến nào?
- Vì sao cần `pathCoordinates`?
- Nếu progress = 0.5 thì marker nằm ở đâu?
- Vì sao pure function không tự gọi Prisma update trip?

