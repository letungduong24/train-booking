# 09 - GPS Giả Lập, Delay Và Theo Dõi Chuyến

## Mục tiêu học

Hiểu cách Railflow mô phỏng vị trí realtime của tàu, cách dùng `Route.pathCoordinates`, cách tính progress, speed, bearing, và cách delay ảnh hưởng đến giờ khởi hành/giờ đến.

File cần đọc:

- `api/src/modules/trip/utils/live-location-calculator.ts`
- `api/src/modules/trip/trip.service.ts`
- `api/src/modules/trip/trip.cron.ts`
- `api/src/modules/trip-delay-reports/trip-delay-reports.service.ts`
- `web/app/(protected)/dashboard/history/[code]/page.tsx`
- `web/app/(protected)/driver/trips/[id]/page.tsx`
- `web/app/(protected)/admin/trips/[tripId]/page.tsx`
- `web/lib/utils/trip-time.ts`
- `web/lib/trip-status.ts`

## Bài toán

Hệ thống không có thiết bị GPS thật. Tuy nhiên, vì route đã có `pathCoordinates` bám theo đường ray, backend có thể mô phỏng vị trí tàu theo thời gian.

Dữ liệu đầu vào:

- route path;
- departure time;
- route distance;
- train average speed;
- delay khởi hành;
- delay đến nơi;
- thời điểm hiện tại.

Dữ liệu đầu ra:

- latitude;
- longitude;
- bearing;
- speed;
- progress;
- status;
- delay minutes;
- flag có nên mark completed không.

## Model Trip liên quan

`Trip` có:

- `departureTime`: giờ gốc khởi hành.
- `endTime`: giờ gốc kết thúc.
- `departureDelayMinutes`: số phút trễ khởi hành.
- `arrivalDelayMinutes`: số phút trễ đến.
- `status`: `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.

Điểm quan trọng:

- Không sửa đè `departureTime` khi có delay.
- Không sửa đè `endTime` khi có delay.
- Delay được cộng khi tính giờ thực tế và hiển thị.

## Hàm chính

```text
calculateLiveLocationSnapshot(trip, speedup?, nowMs?)
```

`speedup` dùng để giả lập nhanh trong demo.

## Bước 1: lấy route points

Hàm:

```text
extractRoutePoints(pathCoordinates, stations)
```

Luồng:

1. Nếu `Route.pathCoordinates` hợp lệ:
   - flatten tất cả segment coordinates.
   - normalize từng coordinate.
   - bỏ điểm trùng liên tiếp.
2. Nếu không có path:
   - fallback sang tọa độ các station.

Vì sao cần fallback:

- Một route cũ có thể chưa có pathCoordinates.
- Hệ thống vẫn có thể hiển thị tuyến đơn giản bằng station coordinate.

## Bước 2: tính thời lượng chạy

Code tính:

```text
durationMinutes =
  route.totalDistanceKm > 0 && averageSpeedKmH > 0
    ? round(route.totalDistanceKm / averageSpeedKmH * 60)
    : route.durationMinutes || 60
```

Ý nghĩa:

- Nếu có khoảng cách thật và tốc độ tàu, tính thời gian chạy từ vật lý.
- Nếu không, dùng `route.durationMinutes`.

Sau đó:

```text
totalDurationMs = durationMinutes + arrivalDelayMinutes
```

`arrivalDelayMinutes` kéo dài hành trình, làm tàu tới muộn hơn.

## Bước 3: tính giờ bắt đầu thực tế

```text
startMs = departureTime + departureDelayMinutes
```

Nếu delay khởi hành 55 phút:

- giờ gốc vẫn giữ nguyên;
- giờ thực tế để GPS bắt đầu chạy bị lùi 55 phút.

## Bước 4: tính elapsed và progress

```text
elapsedMs = (nowMs - startMs) * speedup
progress = elapsedMs / totalDurationMs
```

Progress:

- trước giờ chạy: 0;
- đang chạy: từ 0 đến 1;
- hoàn thành: 1.

## Bước 5: nội suy trên polyline

Hàm:

```text
interpolateOnPath(points, progress)
```

Quy trình:

1. Tính khoảng cách tích lũy giữa các điểm.
2. Lấy `targetDistance = progress * totalDistance`.
3. Tìm segment chứa targetDistance.
4. Nội suy tuyến tính giữa start/end point.
5. Tính bearing.

Nội suy tuyến tính đủ dùng cho demo vì các điểm trên đường ray đã khá dày. Khoảng cách dùng Haversine để tính km giữa hai điểm.

## Bước 6: speed và bearing

Speed:

```text
baseSpeed = train.averageSpeedKmH || 60
speed = IN_PROGRESS ? baseSpeed + dao động nhỏ : 0
```

Bearing:

- tính góc từ điểm hiện tại sang điểm tiếp theo;
- frontend dùng để xoay marker tàu nếu cần.

## Bước 7: status và auto complete

Logic:

- Nếu `SCHEDULED` và đã tới startMs -> `IN_PROGRESS`.
- Nếu `IN_PROGRESS` và simulatedNow >= endMs -> `COMPLETED`.
- Nếu status gốc đang `IN_PROGRESS` nhưng snapshot tính ra `COMPLETED`, trả `shouldMarkCompleted = true`.

`TripService.getLiveLocation` có thể dùng flag này để cập nhật trip completed.

## Delay report

Driver tạo delay report:

- type `DEPARTURE`: trễ khởi hành.
- type `ARRIVAL`: trễ đến nơi.

Admin duyệt:

- departure report cập nhật `Trip.departureDelayMinutes`.
- arrival report cập nhật `Trip.arrivalDelayMinutes`.

Ảnh hưởng:

- departure delay làm lùi giờ bắt đầu chạy.
- arrival delay làm kéo dài thời lượng tới nơi.

## Hiển thị frontend đúng

Frontend nên hiển thị:

```text
Giờ gốc: 20:24
Giờ sau delay: 21:19
+55m
```

Không nên chỉ hiển thị giờ sau delay vì người dùng không biết chuyến bị trễ bao nhiêu.

Với giờ đến:

```text
Giờ gốc đến: 23:15
Giờ sau delay: 00:10 ngày hôm sau
```

Cần xử lý đổi ngày.

## Các màn hình dùng GPS

- Passenger history detail: theo dõi chuyến đã đặt.
- Driver trip detail: lái tàu theo dõi chuyến được phân công.
- Admin trip detail: giám sát vận hành.

Các màn hình này nên dùng cùng helper tính giờ để tránh lệch logic.

## Các lỗi thường gặp

### Chỉ cộng delay vào giờ đi, không cộng giờ đến

Sai. Nếu khởi hành trễ, giờ đến cũng phải bị ảnh hưởng. Nếu có thêm arrival delay, giờ đến còn bị cộng thêm.

### Hiển thị giờ sau delay nhưng không hiển thị giờ gốc

Không đủ thông tin cho người dùng.

### PathCoordinates rỗng

GPS fallback sang station coordinates, nhưng độ mượt và độ đúng thấp hơn.

### Speed quá lớn

Nếu demo dùng `speedup`, speed hiển thị cần được hiểu là mô phỏng, không phải tốc độ thật.

## Câu hỏi bảo vệ

- Vì sao GPS giả lập vẫn có ý nghĩa?
- Delay khởi hành và delay đến nơi khác nhau thế nào?
- `Route.pathCoordinates` được dùng ở đâu ngoài hiển thị route?
- Khi nào trip được auto completed?
- Nếu route không có pathCoordinates thì hệ thống fallback thế nào?

