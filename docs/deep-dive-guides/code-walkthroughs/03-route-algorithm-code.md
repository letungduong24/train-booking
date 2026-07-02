# 03 - Route Creation Algorithm Code Walkthrough

## Mục tiêu

Hiểu code tạo tuyến đường trong Railflow ở mức thuật toán: normalize GeoJSON, build graph, tìm direct segment, BFS qua segment nối nhau, snap/slice bằng Turf, chống đi xuyên ga trung gian và chống quay ngược.

File chính:

- `api/src/modules/route/utils/route-path-calculator.ts`
- `api/src/modules/route/route.service.ts`
- `web/features/routes/components/interactive-route-builder.tsx`

## 1. Các hằng số thuật toán

### Code

```ts
const CONNECT_DEG = 0.01;
const MAX_BFS_HOPS = 10;
const SNAP_PREFILTER_DEG = 0.08;
const SEGMENT_GRID_DEG = 0.1;
const STATION_ON_PATH_THRESHOLD_KM = 0.35;
const BACKTRACKING_THRESHOLD_KM = 0.15;
```

### Giải thích

Các hằng số này quyết định độ "dễ tính" của thuật toán.

- `CONNECT_DEG`: hai endpoint đủ gần thì coi như nối nhau.
- `MAX_BFS_HOPS`: không cho BFS đi quá xa, tránh vòng vèo.
- `SNAP_PREFILTER_DEG`: lọc segment gần ga trước khi dùng Turf.
- `SEGMENT_GRID_DEG`: kích thước ô grid để tăng tốc lookup.
- `STATION_ON_PATH_THRESHOLD_KM`: phát hiện đoạn route đi qua ga trung gian.
- `BACKTRACKING_THRESHOLD_KM`: phát hiện đoạn mới chồng lên đoạn cũ.

Đây là phần rất đáng nói khi bảo vệ: thuật toán có ngưỡng vì dữ liệu bản đồ thật luôn có sai số.

## 2. Hàm chính `calculateRoutePath`

### Code

```ts
export function calculateRoutePath(
  routeStations: RoutePathStation[],
  networkLines: RailwayPathLine[],
): CalculatedRoutePath {
  if (routeStations.length < 2) {
    return {
      pathCoordinates: [],
      totalDistanceKm: 0,
      stationDistancesKm: routeStations.map(() => 0),
    };
  }

  const subSegments = normalizeSubSegments(networkLines);
  if (subSegments.length === 0) {
    throw new BadRequestException('Mạng lưới đường sắt chưa có dữ liệu đường ray hợp lệ');
  }

  const segmentNodes = buildSegmentNodes(subSegments);
  const segmentIndex = buildSegmentGridIndex(segmentNodes);
  const adjacency = buildAdjacency(segmentNodes);
```

### Giải thích

Input:

- `routeStations`: các ga admin chọn theo thứ tự.
- `networkLines`: đường ray vật lý cùng network.

Nếu ít hơn 2 ga, route không có đoạn chạy nên trả distance 0.

Sau đó thuật toán chuẩn bị 3 cấu trúc:

1. `segmentNodes`: biến đường ray thành các node/cạnh có head/tail/bbox.
2. `segmentIndex`: grid index để tìm segment gần ga nhanh hơn.
3. `adjacency`: graph nối các segment qua endpoint.

## 3. Duyệt từng cặp ga liên tiếp

### Code

```ts
const pathCoordinates: LineCoordinates[] = [];
const segmentDistancesKm: number[] = [];
let totalDistanceKm = 0;

for (let i = 0; i < routeStations.length - 1; i++) {
  const result =
    findDirectSegment(routeStations, segmentNodes, segmentIndex, pathCoordinates, i) ??
    findConnectedSegment(
      routeStations,
      segmentNodes,
      segmentIndex,
      adjacency,
      pathCoordinates,
      i,
    );

  if (!result) {
    const from = routeStations[i].station.name;
    const to = routeStations[i + 1].station.name;
    throw new BadRequestException(`Đoạn đường từ ${from} đến ${to} không hợp lệ`);
  }

  pathCoordinates.push(result.slicedCoords);
  segmentDistancesKm.push(result.segKm);
  totalDistanceKm += result.segKm;
}
```

### Giải thích nghiệp vụ

Đây là đoạn sửa tận gốc cho kiểu lỗi báo sai đoạn.

Nếu route có:

```text
1 -> 2 -> 3
```

code không tính một phát `1 -> 3`. Nó tính:

```text
i = 0: 1 -> 2
i = 1: 2 -> 3
```

Nếu lỗi, message lấy đúng:

```ts
routeStations[i].station.name
routeStations[i + 1].station.name
```

Vì vậy lỗi phải báo đúng đoạn đang fail.

### Vì sao thử direct trước BFS

Direct segment rẻ và ít rủi ro hơn. Nếu hai ga cùng nằm gần một line, chỉ cần snap và slice. BFS chỉ dùng khi cần nối nhiều segment.

## 4. Normalize GeoJSON coordinates

### Code

```ts
function normalizeSubSegments(networkLines: RailwayPathLine[]): SubSegment[] {
  const subSegments: SubSegment[] = [];

  for (const line of networkLines) {
    const segments = normalizeLineSegments(line.pathCoordinates);

    for (const coords of segments) {
      subSegments.push({ coords, lineId: line.id });
    }
  }

  return subSegments;
}

function normalizeLineSegments(pathCoordinates: unknown): LineCoordinates[] {
  if (isLineCoordinates(pathCoordinates)) {
    return [pathCoordinates];
  }

  if (!Array.isArray(pathCoordinates)) {
    return [];
  }

  return pathCoordinates.filter(isLineCoordinates);
}
```

### Giải thích

Dữ liệu `RailwayLine.pathCoordinates` có thể là:

- một LineString: `[[lng, lat], [lng, lat], ...]`
- nhiều LineString: `[[[lng, lat], ...], [[lng, lat], ...]]`

Code normalize về một danh sách sub-segment thống nhất.

Nếu không normalize, các hàm Turf sẽ dễ nhận sai format.

## 5. Segment node và adjacency graph

### Code

```ts
function buildSegmentNodes(subSegments: SubSegment[]): SegmentNode[] {
  return subSegments.map(({ coords, lineId }, idx) => {
    const line = turf.lineString(coords);
    return {
      idx,
      lineId,
      coords,
      head: coords[0],
      tail: coords[coords.length - 1],
      line,
      bbox: getBoundingBox(coords),
    };
  });
}
```

### Giải thích

Mỗi sub-segment được biến thành node/cạnh có:

- `head`: điểm đầu.
- `tail`: điểm cuối.
- `line`: Turf line để snap/slice.
- `bbox`: để đưa vào grid index.

Thực chất thuật toán đang biến đường ray thành graph địa lý.

### Code adjacency

```ts
function buildAdjacency(segmentNodes: SegmentNode[]) {
  const tailAdj: AdjEntry[][] = segmentNodes.map(() => []);
  const headAdj: AdjEntry[][] = segmentNodes.map(() => []);
  const endpointIndex = buildEndpointIndex(segmentNodes);

  for (const segment of segmentNodes) {
    tailAdj[segment.idx] = findEndpointNeighbors(endpointIndex, segment.tail, segment.idx);
    headAdj[segment.idx] = findEndpointNeighbors(endpointIndex, segment.head, segment.idx);
  }

  return { tailAdj, headAdj };
}
```

### Giải thích

Với mỗi segment, code tìm các segment khác có endpoint gần head/tail của nó. Kết quả:

- nếu đang đi tới tail, có thể nhảy sang `tailAdj`;
- nếu đang đi tới head, có thể nhảy sang `headAdj`;
- `neighborFlipped` cho biết segment kế tiếp cần đảo chiều không.

## 6. Direct segment: snap 2 ga vào cùng line

### Code

```ts
function findDirectSegment(
  routeStations: RoutePathStation[],
  segmentNodes: SegmentNode[],
  segmentIndex: SegmentGridIndex,
  existingPath: LineCoordinates[],
  stationIndex: number,
): SlicedSegment | null {
  const pair = getStationPair(routeStations, stationIndex);
  const candidateIndexes = getSharedCandidateSegments(segmentIndex, segmentNodes, pair);
  let bestResult: SlicedSegment | null = null;
  let bestSnapSum = Infinity;

  for (const idx of candidateIndexes) {
    const segment = segmentNodes[idx];
    try {
      const startSnap = turf.nearestPointOnLine(segment.line, pair.startPt);
      const endSnap = turf.nearestPointOnLine(segment.line, pair.endPt);
      const snapSum =
        (startSnap.properties.dist ?? Infinity) + (endSnap.properties.dist ?? Infinity);

      if (snapSum >= bestSnapSum) continue;

      const result = trySnapAndSlice(segment.coords, pair, {
        line: segment.line,
        startSnap,
        endSnap,
      });
```

### Giải thích

Direct segment tìm line gần cả ga đầu và ga cuối.

`nearestPointOnLine` trả:

- điểm trên line gần ga nhất;
- khoảng cách `dist`;
- vị trí `location` dọc line.

`snapSum` càng nhỏ nghĩa là hai ga càng bám sát line đó. Code chọn result có tổng snap distance nhỏ nhất.

## 7. Validate direct result

### Code

```ts
if (
  result &&
  !hasIntermediateOverlap(result.slicedCoords, routeStations, stationIndex) &&
  !hasBacktracking(result.slicedCoords, existingPath)
) {
  bestSnapSum = snapSum;
  bestResult = result;
}
```

### Giải thích

Một đoạn snap được chưa chắc hợp lệ. Nó còn phải:

- không đi xuyên qua ga trung gian không đúng ngữ cảnh;
- không quay ngược/chồng lên path trước đó.

Đây là lớp chống route sai hình học.

## 8. BFS connected segment

### Code

```ts
function findConnectedSegment(
  routeStations: RoutePathStation[],
  segmentNodes: SegmentNode[],
  segmentIndex: SegmentGridIndex,
  adjacency: { tailAdj: AdjEntry[][]; headAdj: AdjEntry[][] },
  existingPath: LineCoordinates[],
  stationIndex: number,
): SlicedSegment | null {
  const pair = getStationPair(routeStations, stationIndex);
  const startIdxs: number[] = [];
  const endIdxs: number[] = [];
  const startCandidates = getCandidateSegmentsNearPoint(segmentIndex, segmentNodes, pair.startPt);
  const endCandidates = getCandidateSegmentsNearPoint(segmentIndex, segmentNodes, pair.endPt);
```

### Giải thích

Nếu direct không có, code tìm:

- các segment gần ga đầu;
- các segment gần ga cuối.

Sau đó BFS từ tập start đến tập end.

### Code BFS

```ts
const bfsPath = findBfsPath(segmentNodes, adjacency, startIdxs, new Set(endIdxs));
if (!bfsPath) return null;

const stitched = stitchBfsPath(segmentNodes, bfsPath);
const result = trySnapAndSlice(stitched, pair, { relaxLengthCheck: true });
if (!result) return null;
```

### Giải thích

BFS trả danh sách segment nối được. `stitchBfsPath` ghép tọa độ nhiều segment thành một polyline dài. Sau đó vẫn phải snap/slice từ ga đầu đến ga cuối trên polyline đã ghép.

`relaxLengthCheck: true` vì đường nối qua nhiều segment có thể dài hơn direct distance nhiều hơn.

## 9. BFS implementation

### Code

```ts
while (cursor < queue.length) {
  const node = queue[cursor++];
  if (endSet.has(node.segIdx)) return node.path;
  if (node.path.length >= MAX_BFS_HOPS) continue;

  const neighbors = node.flipped
    ? adjacency.headAdj[node.segIdx]
    : adjacency.tailAdj[node.segIdx];

  for (const { neighborIdx, neighborFlipped } of neighbors) {
    if (node.path.some((p) => p.segIdx === neighborIdx)) continue;

    const key = `${neighborIdx}-${neighborFlipped}`;
    if (visited.has(key)) continue;

    visited.add(key);
    queue.push({
      segIdx: neighborIdx,
      flipped: neighborFlipped,
      path: [...node.path, { segIdx: neighborIdx, flipped: neighborFlipped }],
    });
  }
}
```

### Giải thích

Đây là BFS kinh điển:

- queue chứa node đang xét;
- nếu segment hiện tại thuộc endSet thì tìm thấy đường;
- nếu path quá `MAX_BFS_HOPS` thì bỏ;
- lấy neighbor theo hướng đang đi;
- không đi lại segment đã có trong path để tránh loop.

`flipped` rất quan trọng vì cùng một segment có thể đi xuôi hoặc ngược.

## 10. Snap và slice

### Code

```ts
function trySnapAndSlice(
  coords: LineCoordinates,
  pair: ReturnType<typeof getStationPair>,
  options: {
    relaxLengthCheck?: boolean;
    line?: TurfLine;
    startSnap?: TurfPoint;
    endSnap?: TurfPoint;
  } = {},
): SlicedSegment | null {
  if (coords.length < 2) return null;

  try {
    const line = options.line ?? turf.lineString(coords);
    const startSnap = options.startSnap ?? turf.nearestPointOnLine(line, pair.startPt);
    const endSnap = options.endSnap ?? turf.nearestPointOnLine(line, pair.endPt);
    const dStart = startSnap.properties?.dist ?? Infinity;
    const dEnd = endSnap.properties?.dist ?? Infinity;

    if (dStart > SNAP_THRESHOLD_KM || dEnd > SNAP_THRESHOLD_KM) return null;
```

### Giải thích

Ga không cần nằm chính xác trên đường ray vì dữ liệu tọa độ có sai số. Nhưng nếu ga quá xa line, route không hợp lệ.

`SNAP_THRESHOLD_KM` là giới hạn khoảng cách snap.

### Code cắt line

```ts
const locStart = startSnap.properties?.location ?? 0;
const locEnd = endSnap.properties?.location ?? 0;
const sliceLen = Math.abs(locEnd - locStart);

if (!options.relaxLengthCheck && sliceLen > pair.directDistKm * 3 + 10) {
  return null;
}

const reversed = locStart > locEnd;
const effectiveCoords = reversed ? [...coords].reverse() : coords;
const effectiveLine = reversed ? turf.lineString(effectiveCoords) : line;
...
const sliced = turf.lineSlice(
  turf.point(effectiveStart.geometry.coordinates),
  turf.point(effectiveEnd.geometry.coordinates),
  effectiveLine,
);
```

### Giải thích

Nếu ga cuối nằm trước ga đầu trên line, code đảo line để slice đúng chiều.

Length check chống tình huống:

- hai ga gần nhau theo đường chim bay;
- nhưng line slice vòng rất xa;
- có thể do snap nhầm vào line không đúng.

## Tự kiểm tra

- Vì sao cần duyệt từng cặp ga liên tiếp?
- Direct segment dùng Turf hàm nào?
- BFS chạy trên dữ liệu gì?
- `flipped` nghĩa là gì?
- Vì sao route có thể fail dù hai ga nhìn gần nhau trên bản đồ?

