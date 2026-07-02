# 07 - CoachTemplate, Sinh Ghế Tự Động Và Render Sơ Đồ Ghế

## Bài toán nghiệp vụ

Trong Railflow, admin không tạo từng ghế thủ công. Admin tạo hoặc chọn một `CoachTemplate`, sau đó khi thêm toa vào tàu, backend tự sinh toàn bộ ghế/giường theo mẫu đó.

Luồng đầy đủ:

```text
Admin chọn Train + CoachTemplate
-> POST /coaches
-> Backend kiểm tra Train và Template
-> Tạo Coach theo thứ tự toa
-> Sinh Seat/Bed theo layout, hàng, cột, tầng
-> createMany Seat
-> Frontend lấy Coach kèm template + seats
-> Render sơ đồ ghế/giường bằng rowIndex, colIndex, tier
```

Điểm hay của phần này là `CoachTemplate` đóng vai trò "khuôn". Một template có thể tái sử dụng để tạo nhiều toa cùng cấu trúc, giảm lỗi nhập liệu và giúp frontend render layout có quy luật.

## 1. Dữ liệu nền: CoachTemplate, Coach, Seat

File nên đọc:

- `api/prisma/schema.prisma`
- `api/src/modules/coaches/coaches.service.ts`
- `web/features/trains/components/seat-layout-viewer.tsx`
- `web/features/trains/components/bed-layout-viewer.tsx`
- `web/features/booking/components/seat-layout-viewer.tsx`
- `web/features/booking/components/bed-layout-viewer.tsx`
- `web/lib/utils/seat-helper.ts`

Các trường quan trọng trong template:

```text
layout       SEAT hoặc BED
totalRows   số hàng ghế hoặc số khoang
totalCols   số cột ghế
tiers       số tầng, chủ yếu dùng cho giường nằm
```

Các trường quan trọng trong seat:

```text
rowIndex    hàng hoặc khoang
colIndex    vị trí trái/phải/cột
tier        tầng
name        số ghế/giường hiển thị
status      trạng thái vật lý: AVAILABLE, DISABLED, MAINTENANCE
```

Ràng buộc dữ liệu:

```prisma
@@unique([coachId, rowIndex, colIndex, tier])
```

Ràng buộc này đảm bảo trong cùng một toa không có hai ghế trùng vị trí vật lý.

## 2. Backend tạo coach và tự sinh ghế

File: `api/src/modules/coaches/coaches.service.ts`

Khi admin tạo toa, service không chỉ insert `Coach`. Nó còn kiểm tra dữ liệu liên quan, tính thứ tự toa, sinh ghế rồi insert hàng loạt trong một transaction.

```ts
async create(createCoachDto: CreateCoachDto) {
  const train = await this.prisma.train.findUnique({
    where: { id: createCoachDto.trainId },
  });
  if (!train) {
    throw new NotFoundException(`Tàu không tồn tại`);
  }

  const template = await this.prisma.coachTemplate.findUnique({
    where: { id: createCoachDto.templateId },
  });
  if (!template) {
    throw new NotFoundException('Mẫu toa không tồn tại');
  }

  const maxOrderCoach = await this.prisma.coach.findFirst({
    where: { trainId: createCoachDto.trainId },
    orderBy: { order: 'desc' },
  });
  const nextOrder = maxOrderCoach ? maxOrderCoach.order + 1 : 1;

  return this.prisma.$transaction(async (tx) => {
    const coach = await tx.coach.create({
      data: {
        name: `Toa ${nextOrder}`,
        order: nextOrder,
        status: (createCoachDto.status as CoachStatus) || CoachStatus.ACTIVE,
        trainId: createCoachDto.trainId,
        templateId: createCoachDto.templateId,
      },
      include: { template: true },
    });

    const seats = this.generateSeats(coach.id, template);

    await tx.seat.createMany({
      data: seats,
    });

    return tx.coach.findUnique({
      where: { id: coach.id },
      include: {
        template: true,
        seats: true,
      },
    });
  });
}
```

Giải thích:

- `trainId` xác định toa thuộc tàu nào.
- `templateId` xác định toa dùng layout nào.
- `nextOrder` giúp tự sinh tên `Toa 1`, `Toa 2`, ...
- Transaction đảm bảo nếu tạo ghế lỗi thì coach cũng không bị lưu dở.
- `createMany` dùng để insert nhiều seat nhanh hơn tạo từng seat riêng lẻ.

## 3. Hàm generateSeats cho toa ghế ngồi

Với template `SEAT`, backend tạo một grid theo hàng và cột. Tất cả ghế ngồi dùng `tier = 0`.

```ts
private generateSeats(
  coachId: string,
  template: {
    layout: CoachLayout;
    totalRows: number;
    totalCols: number;
    tiers: number;
  },
) {
  const seats: Prisma.SeatCreateManyInput[] = [];
  let seatNumber = 1;

  if (template.layout === 'SEAT') {
    for (let row = 0; row < template.totalRows; row++) {
      for (let col = 0; col < template.totalCols; col++) {
        seats.push({
          name: `${seatNumber}`,
          rowIndex: row,
          colIndex: col,
          status: 'AVAILABLE',
          type: 'STANDARD',
          tier: 0,
          coachId,
        });
        seatNumber++;
      }
    }
  }

  return seats;
}
```

Ví dụ template:

```text
layout = SEAT
totalRows = 10
totalCols = 4
tiers = 1
```

Kết quả:

```text
10 x 4 = 40 ghế
rowIndex: 0..9
colIndex: 0..3
tier: 0
```

Ý nghĩa khi render:

- `rowIndex` cho biết ghế thuộc hàng nào.
- `colIndex` cho biết ghế nằm cột nào.
- `name` là số ghế hiển thị cho người dùng.

## 4. Hàm generateSeats cho toa giường nằm

Với template `BED`, `totalRows` được hiểu như số khoang, `tiers` là số tầng, còn `colIndex` chỉ trái/phải trong khoang.

```ts
for (let row = 0; row < template.totalRows; row++) {
  for (let tier = 0; tier < template.tiers; tier++) {
    for (let side = 0; side < 2; side++) {
      seats.push({
        name: `${seatNumber}`,
        rowIndex: row,
        colIndex: side,
        status: 'AVAILABLE',
        type: 'STANDARD',
        tier: tier,
        coachId,
      });
      seatNumber++;
    }
  }
}
```

Ví dụ template:

```text
layout = BED
totalRows = 7 khoang
tiers = 3 tầng
2 bên mỗi khoang
```

Kết quả:

```text
7 x 3 x 2 = 42 giường
rowIndex = khoang
colIndex = 0 hoặc 1
tier = 0, 1, 2
```

Đây là lý do `Seat` vẫn dùng chung cho cả ghế và giường. Hệ thống không cần bảng `Bed` riêng, chỉ cần diễn giải `rowIndex`, `colIndex`, `tier` theo `CoachTemplate.layout`.

## 5. Render sơ đồ ghế trong admin train detail

File: `web/features/trains/components/seat-layout-viewer.tsx`

Ở màn hình quản trị tàu, seat map chủ yếu hiển thị trạng thái vật lý của ghế: hoạt động, bảo trì, vô hiệu hóa. Component nhận `coach`, lấy `template` và `seats`.

```tsx
export function SeatLayoutViewer({
  coach,
  onSeatClick,
  selectedSeats = [],
  isAdmin = false,
}: SeatLayoutViewerProps) {
  const { template, seats } = coach;
  const { totalRows, totalCols } = template;
```

Component tạo grid theo số hàng trong template:

```tsx
{Array.from({ length: totalRows }).map((_, rowIndex) => {
  const rowSeats = seats
    .filter(s => s.rowIndex === rowIndex)
    .sort((a, b) => a.colIndex - b.colIndex);

  return (
    <React.Fragment key={rowIndex}>
      ...
    </React.Fragment>
  );
})}
```

Giải thích:

- Không hard-code danh sách ghế.
- UI đọc `totalRows` từ template.
- Mỗi hàng lọc seat theo `rowIndex`.
- Sau đó sort theo `colIndex` để ghế hiển thị đúng thứ tự.

Với layout ghế 4 cột, UI tách:

```tsx
{rowSeats.slice(0, 2).map((seat) => ...)}
...
{rowSeats.slice(2, 4).map((seat) => ...)}
```

Hai ghế đầu nằm một bên, hai ghế sau nằm bên còn lại, ở giữa là lối đi. Đây là phần biến dữ liệu dạng bảng thành hình ảnh sơ đồ toa.

## 6. Render sơ đồ giường theo khoang và tầng

File: `web/features/booking/components/bed-layout-viewer.tsx`

Với giường nằm, component không render theo cột ghế như `SEAT`, mà render theo khoang:

```tsx
const { totalRows, tiers } = template;

{Array.from({ length: totalRows }).map((_, compartmentIndex) => {
  const compartmentBeds = seats.filter(
    s => s.rowIndex === compartmentIndex
  );
```

Trong mỗi khoang, UI duyệt từ tầng trên xuống tầng dưới:

```tsx
{Array.from({ length: tiers }).reverse().map((_, reversedIndex) => {
  const tierIndex = tiers - reversedIndex - 1;
  const tierNumber = tierIndex + 1;

  const leftBed = compartmentBeds.find(
    s => s.tier === tierIndex && s.colIndex === 0
  );

  const rightBed = compartmentBeds.find(
    s => s.tier === tierIndex && s.colIndex === 1
  );
```

Giải thích:

- `rowIndex` là khoang.
- `tier` là tầng.
- `colIndex = 0` là bên trái.
- `colIndex = 1` là bên phải.

Nhờ vậy cùng bảng `Seat` có thể render ra sơ đồ giường trực quan mà không cần cấu trúc dữ liệu khác.

## 7. Booking seat map: kết hợp trạng thái vật lý, trạng thái đặt vé và lock realtime

File: `web/features/booking/components/seat-layout-viewer.tsx`

Ở màn hình đặt vé, trạng thái hiển thị không chỉ là `seat.status`. Component còn cần biết:

- Ghế có bị disable vật lý không.
- Ghế đã được đặt trên chặng đang xem chưa.
- Ghế đang bị người khác giữ tạm thời trong Redis không.
- Người dùng hiện tại có đang chọn ghế đó không.

Component lấy danh sách ghế đang lock:

```tsx
const { data: initialLockedSeats, refetch: refetchLockedSeats } =
  useLockedSeats(tripId, fromStationId, toStationId);

useEffect(() => {
  if (initialLockedSeats) {
    setLockedSeatIds(initialLockedSeats);
  }
}, [initialLockedSeats]);
```

Sau đó nghe socket để refetch khi trạng thái ghế đổi:

```tsx
useEffect(() => {
  if (!tripId || !socket) return;

  function onSeatLockChanged(data: { tripId: string }) {
    if (data.tripId === tripId) {
      void refetchLockedSeats();
    }
  }

  socket.on("seats.locked", onSeatLockChanged);
  socket.on("seats.released", onSeatLockChanged);
  socket.on("seats.booked", onSeatLockChanged);

  return () => {
    socket.off("seats.locked", onSeatLockChanged);
    socket.off("seats.released", onSeatLockChanged);
    socket.off("seats.booked", onSeatLockChanged);
  };
}, [tripId, socket, refetchLockedSeats]);
```

Ý nghĩa:

- Khi một người giữ ghế, client khác nhận event `seats.locked`.
- Component không tự đoán trạng thái mới, mà refetch danh sách locked seats theo trip/chặng.
- Nếu ghế đang chọn bị người khác lock, component có thể tự bỏ chọn để tránh thanh toán lỗi.

```tsx
useEffect(() => {
  if (selectedSeats.length > 0 && onSeatsForceDeselected && !isSubmitting) {
    const conflicts = selectedSeats.filter(
      id => lockedSeatIds.includes(id)
    );

    if (conflicts.length > 0) {
      onSeatsForceDeselected(conflicts);
    }
  }
}, [lockedSeatIds, selectedSeats, onSeatsForceDeselected, isSubmitting]);
```

## 8. Hàm tính trạng thái hiển thị của ghế

File: `web/lib/utils/seat-helper.ts`

```ts
export function getComputedSeatStatus(
  seat: Seat,
  lockedSeatIds: string[] = [],
  isAdmin: boolean = false
): SeatStatus | BookingStatus {
  const isLocked = lockedSeatIds.includes(seat.id);
  let displayStatus = (seat.bookingStatus || seat.status);

  if (seat.status === 'DISABLED') {
    return 'DISABLED';
  }

  if (isLocked && displayStatus === 'AVAILABLE') {
    return 'HOLDING';
  }

  return displayStatus;
}
```

Thứ tự ưu tiên rất quan trọng:

1. Nếu ghế vật lý bị `DISABLED`, luôn hiển thị không thể mua.
2. Nếu ghế đang bị lock tạm thời, hiển thị `HOLDING`.
3. Nếu không, dùng `bookingStatus` nếu có.
4. Cuối cùng mới dùng `seat.status`.

Đây là lớp ghép giữa dữ liệu vật lý và dữ liệu đặt vé.

```text
Seat.status       = trạng thái vật lý của ghế
Seat.bookingStatus = trạng thái theo trip/chặng đang xem
lockedSeatIds     = trạng thái giữ chỗ tạm thời trong Redis
```

## 9. Vì sao thiết kế này tốt?

### Tái sử dụng template

Một template có thể tạo nhiều toa giống nhau. Admin không cần thao tác từng ghế.

### Dữ liệu render đơn giản

Frontend chỉ cần biết:

```text
totalRows, totalCols, tiers
rowIndex, colIndex, tier
```

Từ đó tự dựng layout.

### Tách trạng thái vật lý và trạng thái nghiệp vụ

Một ghế vật lý có thể `AVAILABLE`, nhưng trên một chuyến/chặng cụ thể lại đã `BOOKED` hoặc `HOLDING`. Đây là điểm rất quan trọng trong hệ thống bán vé theo chặng.

### Bulk insert hiệu quả

`createMany` giúp tạo hàng chục ghế/giường chỉ bằng một thao tác database.

## 10. Tự kiểm tra

1. Nếu template `SEAT` có `totalRows = 12`, `totalCols = 4`, backend tạo bao nhiêu ghế?
2. Nếu template `BED` có `totalRows = 7`, `tiers = 3`, backend tạo bao nhiêu giường?
3. Vì sao `Seat` có cả `rowIndex`, `colIndex`, `tier`?
4. Vì sao không nên chỉ dựa vào `Seat.status` khi render màn hình đặt vé?
5. `getComputedSeatStatus` ưu tiên `DISABLED` trước `HOLDING` để làm gì?
6. Khi socket nhận `seats.locked`, vì sao component refetch thay vì tự set trạng thái ghế?

## 11. Câu trả lời ngắn để bảo vệ

Nếu hội đồng hỏi: "Hệ thống sinh sơ đồ ghế như thế nào?"

Có thể trả lời:

> Hệ thống dùng `CoachTemplate` làm khuôn cho toa. Khi admin thêm toa vào tàu, backend đọc template để biết layout là ghế hay giường, số hàng, số cột và số tầng. Sau đó service tự sinh danh sách `Seat` với `rowIndex`, `colIndex`, `tier` rồi insert bằng `createMany`. Frontend không hard-code sơ đồ, mà render dựa trên template và các tọa độ logic này. Ở màn hình đặt vé, trạng thái hiển thị còn được ghép thêm `bookingStatus` và danh sách ghế đang lock realtime để tránh người dùng chọn ghế đã bị giữ hoặc đã bán.
