# 04 - Thuật Toán Tạo Tuyến Đường

## Mục tiêu học

Hiểu tận gốc cách Railflow tạo route bám theo đường ray thật: dữ liệu đầu vào, cách snap ga vào line, cách tìm direct segment, cách BFS qua nhiều segment, cách kiểm tra tuyến sai, và dữ liệu đầu ra được lưu vào database.

File cần đọc:

- `api/src/modules/route/utils/route-path-calculator.ts`
- `api/src/modules/route/route.service.ts`
- `web/features/routes/components/interactive-route-builder.tsx`
- `web/app/(protected)/admin/routes/create/page.tsx`

## Bài toán

Admin chọn các ga trên bản đồ để tạo route. Nếu chỉ nối tọa độ ga bằng đường thẳng, route sẽ không phản ánh đường ray thật. Railflow phải tạo đường đi theo `RailwayLine.pathCoordinates` đã import từ GeoJSON.

Ví dụ:

```text
Chí Chủ -> Hà Nội -> Phú Xuyên
```

Hệ thống không nối ba điểm bằng hai đoạn thẳng tự do. Với từng cặp liên tiếp:

- Chí Chủ -> Hà Nội
- Hà Nội -> Phú Xuyên

Backend phải tìm đoạn đường ray thật tương ứng. Nếu cặp nào không có đường ray hợp lệ, lỗi phải chỉ đúng cặp đó.

## Dữ liệu đầu vào

Hàm chính:

```text
calculateRoutePath(routeStations, networkLines)
```

### routeStations

Danh sách ga theo thứ tự admin chọn.

Mỗi phần tử có:

- `stationId`
- `station.name`
- `station.longitude`
- `station.latitude`

### networkLines

Danh sách đường ray thuộc cùng network.

Mỗi phần tử có:

- `id`
- `pathCoordinates`

`pathCoordinates` có thể là:

- một LineString coordinates;
- hoặc mảng nhiều LineString coordinates.

## Dữ liệu đầu ra

`CalculatedRoutePath` gồm:

- `pathCoordinates`: danh sách các đoạn tọa độ đã cắt đúng theo từng cặp ga.
- `totalDistanceKm`: tổng chiều dài route.
- `stationDistancesKm`: mảng khoảng cách tích lũy đến từng ga.

Ví dụ:

```text
Ga A distance = 0
Ga B distance = 42.3
Ga C distance = 97.8
```

Giá vé sau này dùng khoảng cách:

```text
distance = toStation.distanceFromStart - fromStation.distanceFromStart
```

## Các hằng số thuật toán

Trong `route-path-calculator.ts`:

- `SNAP_THRESHOLD_KM = 5`: ga chỉ được snap vào đường ray nếu đủ gần.
- `CONNECT_DEG = 0.01`: ngưỡng coi hai endpoint của line segment là nối nhau.
- `MAX_BFS_HOPS = 10`: giới hạn số bước BFS để tránh tìm quá rộng.
- `SNAP_PREFILTER_DEG = 0.08`: vùng lọc sơ bộ quanh ga.
- `SEGMENT_GRID_DEG = 0.1`: kích thước ô grid để tăng tốc tìm segment.
- `STATION_ON_PATH_THRESHOLD_KM = 0.35`: ngưỡng phát hiện đi xuyên qua ga trung gian.
- `BACKTRACKING_THRESHOLD_KM = 0.15`: ngưỡng chống quay lại/chồng đường.

Các hằng số này là trade-off giữa độ chính xác địa lý và khả năng chịu sai số dữ liệu GeoJSON.

## Bước 1: normalize line

Hàm:

```text
normalizeSubSegments()
normalizeLineSegments()
```

Mục tiêu:

- chuyển mọi dữ liệu `pathCoordinates` thành danh sách sub-segment;
- bỏ qua dữ liệu không phải coordinates hợp lệ;
- đảm bảo mỗi sub-segment có ít nhất 2 điểm.

Vì sao cần:

- GeoJSON thực tế có thể là LineString hoặc MultiLineString.
- Thuật toán tìm đường cần xử lý từng đoạn line riêng.

## Bước 2: build segment node

Hàm:

```text
buildSegmentNodes()
```

Mỗi segment node gồm:

- `idx`: chỉ số segment.
- `coords`: tọa độ segment.
- `head`: điểm đầu.
- `tail`: điểm cuối.
- `line`: Turf lineString để snap/slice.
- `bbox`: bounding box để lọc nhanh.

Tư duy:

- Mỗi đường ray con được coi là một cạnh trong đồ thị.
- Endpoint là nơi các cạnh có thể nối nhau.

## Bước 3: build grid index

Hàm:

```text
buildSegmentGridIndex()
```

Mục tiêu:

- không duyệt toàn bộ segment cho mọi ga;
- chia bản đồ thành các ô grid;
- segment nào đi qua bbox của ô nào thì đưa vào bucket ô đó.

Khi cần tìm segment gần ga:

```text
getCandidateSegmentsNearPoint()
```

Hệ thống chỉ lấy segment trong vùng gần tọa độ ga.

Vì sao quan trọng:

- Dữ liệu railway line có thể nhiều.
- Nếu mỗi cặp ga đều Turf nearest trên tất cả line thì chậm.

## Bước 4: build adjacency

Hàm:

```text
buildAdjacency()
buildEndpointIndex()
findEndpointNeighbors()
```

Mục tiêu:

- biết segment nào nối với segment nào.
- Nếu tail/head của hai segment đủ gần, coi là connected.

Kết quả có:

- `tailAdj`
- `headAdj`

Khi BFS, nếu đi tới đầu/cuối của segment, thuật toán biết nên nhảy sang segment nào tiếp theo.

## Bước 5: duyệt từng cặp ga liên tiếp

Trong `calculateRoutePath`:

```text
for i from 0 to routeStations.length - 2:
  try findDirectSegment
  else try findConnectedSegment
  else throw BadRequestException
```

Đây là điểm cực quan trọng.

Route có 3 ga thì không tính một phát từ ga 1 đến ga 3. Hệ thống tính:

- ga 1 -> ga 2;
- ga 2 -> ga 3.

Nhờ vậy nếu lỗi, thông báo đúng đoạn lỗi.

## Bước 6: direct segment

Hàm:

```text
findDirectSegment()
```

Ý tưởng:

- Tìm segment gần cả ga đầu và ga cuối.
- Snap hai ga vào cùng line.
- Nếu khoảng cách snap đủ gần, cắt đoạn line giữa hai điểm snap.

Turf dùng:

- `nearestPointOnLine`: tìm điểm trên line gần station nhất.
- `lineSlice`: cắt line từ điểm snap đầu đến điểm snap cuối.
- `length`: tính km.

Khi nào direct hợp lệ:

- cả hai ga gần cùng một segment;
- đoạn cắt có chiều dài hợp lý;
- không đi xuyên qua ga trung gian chưa chọn;
- không bị backtracking với đoạn đã đi trước.

## Bước 7: connected segment bằng BFS

Hàm:

```text
findConnectedSegment()
findBfsPath()
stitchBfsPath()
```

Dùng khi hai ga không nằm trên cùng segment.

Quy trình:

1. Tìm các segment gần ga đầu.
2. Tìm các segment gần ga cuối.
3. Chạy BFS từ segment đầu đến một segment đích.
4. Dùng adjacency để đi qua các endpoint nối nhau.
5. Stitch các segment thành một polyline dài.
6. Snap và slice polyline đã stitch.

Vì sao cần BFS:

- Dữ liệu đường ray thường bị tách thành nhiều đoạn.
- Một chặng thương mại có thể đi qua nhiều segment vật lý.

Vì sao giới hạn hop:

- tránh tìm quá rộng;
- tránh route sai vòng vèo;
- tránh performance kém.

## Bước 8: chống đi xuyên ga trung gian

Hàm:

```text
hasIntermediateOverlap()
```

Ý nghĩa:

Nếu route đang tính đoạn A -> C, nhưng trên đường cắt lại đi qua B mà B là ga trong route nằm giữa hoặc chưa đúng thứ tự, cần phát hiện để tránh tạo route sai.

Trong thực tế, user từng gặp lỗi hệ thống báo sai đoạn. Cách đúng là:

- tính từng pair liên tiếp;
- chỉ kiểm tra overlap theo ngữ cảnh pair đó;
- báo lỗi đúng `from -> to`.

## Bước 9: chống quay ngược/chồng đường

Hàm:

```text
hasBacktracking()
```

Mục tiêu:

- Nếu route đã đi qua một đoạn, đoạn tiếp theo không nên chồng lại quá nhiều.
- Tránh tuyến bị quay ngược hoặc loop bất thường.

Cách làm:

- sample các điểm trên đoạn mới;
- snap sample vào các đoạn đã đi;
- nếu overlap vượt ngưỡng thì coi là backtracking.

## Bước 10: lưu kết quả ở service

`RouteService` gọi `calculateRoutePath`, sau đó lưu:

- `Route.pathCoordinates`
- `Route.totalDistanceKm`
- `RouteStation.distanceFromStart`

Toàn bộ nên nằm trong transaction khi tạo/cập nhật route để nếu tính path lỗi thì không lưu route nửa vời.

## Luồng frontend tạo tuyến

`interactive-route-builder.tsx` chịu trách nhiệm:

- hiển thị map;
- hiển thị station marker;
- cho admin chọn station theo thứ tự;
- hiển thị route đã chọn;
- gửi payload create route.

Frontend không tự quyết định tuyến hợp lệ hay không. Nó chỉ hỗ trợ thao tác và preview. Backend mới là nơi kiểm tra nghiệp vụ cuối cùng.

## Các lỗi thường gặp

### Lỗi đoạn đường không hợp lệ

Nguyên nhân có thể:

- ga quá xa đường ray;
- đường ray bị thiếu trong network;
- thứ tự ga không đúng chiều;
- BFS không tìm được đường nối trong giới hạn hop;
- bị phát hiện backtracking/intermediate overlap.

### Route hiển thị đúng nhưng save lỗi

Có thể frontend chỉ vẽ đường thẳng/preview, còn backend tính theo railway line thật nên chặt chẽ hơn.

### Chọn ga phía nam bị scroll/focus

Đây là lỗi UI map/focus, không phải lỗi thuật toán backend. Cần tách rõ khi debug.

## Câu hỏi bảo vệ

- Vì sao cần Turf?
- Vì sao cần grid index?
- Vì sao direct segment không đủ?
- BFS chạy trên graph nào?
- Điều kiện nào khiến đoạn `A -> B` không hợp lệ?
- Dữ liệu nào được lưu để sau này GPS và tính giá dùng lại?

