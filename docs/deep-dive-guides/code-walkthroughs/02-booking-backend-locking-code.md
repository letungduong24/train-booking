# 02 - Booking Backend, Redis Lock Và TicketSeatSegment

## Mục tiêu

Hiểu backend đặt vé ở mức code: giữ chỗ bằng Redis, cập nhật passenger, xác nhận thanh toán, tạo `Ticket`, tạo `TicketSeatSegment`, xử lý race condition và phát realtime event.

File chính:

- `api/src/modules/booking/booking.service.ts`
- `api/src/modules/booking/booking.gateway.ts`
- `api/src/modules/booking/booking.processor.ts`
- `api/prisma/schema.prisma`

## 1. `initBooking`: từ seatIds sang Redis lock

### Code rút gọn

```ts
async initBooking(
  userId: string | null,
  dto: InitBookingDto,
  ipAddr: string,
) {
  const { tripId, seatIds, fromStationId, toStationId } = dto;

  if (userId) {
    await this.validateBookingPolicy(userId, tripId, seatIds.length);
  }

  const trip = await this.prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      route: {
        include: {
          stations: {
            include: { station: true },
          },
        },
      },
    },
  });

  if (!trip) {
    throw new BadRequestException('Không tìm thấy chuyến tàu');
  }

  const { fromStation, toStation } = await this.resolveRouteStationPair(
    trip.routeId,
    trip.route.stations,
    fromStationId,
    toStationId,
  );
```

### Giải thích

`initBooking` là bước đầu của booking hiện đại. Nó chưa tạo vé, chỉ giữ ghế.

Các bước đầu:

1. Lấy `tripId`, `seatIds`, `fromStationId`, `toStationId`.
2. Nếu có user, kiểm tra policy, ví dụ không giữ quá nhiều đơn pending.
3. Load trip và route stations.
4. Resolve ga đi/đến trong route.

`resolveRouteStationPair` cực quan trọng vì backend không tin query frontend. Nếu user tự sửa URL thành ga không thuộc route, backend phải chặn.

## 2. Kiểm tra ghế đã bán bằng công thức overlap

### Code

```ts
const occupiedTickets = await this.prisma.ticket.findMany({
  where: {
    tripId,
    seatId: { in: seatIds },
    booking: {
      status: 'PAID',
    },
    fromStationIndex: { lt: toStation.index },
    toStationIndex: { gt: fromStation.index },
  },
  select: {
    seat: {
      select: {
        name: true,
        coach: {
          select: { name: true },
        },
      },
    },
  },
});
```

### Giải thích

Đây là kiểm tra với dữ liệu đã thanh toán. Công thức:

```text
existing.from < requested.to
existing.to > requested.from
```

Nếu đúng, hai chặng giao nhau.

Ví dụ:

```text
Existing: 1 -> 3
Request: 2 -> 4
1 < 4 = true
3 > 2 = true
=> overlap
```

Ví dụ không overlap:

```text
Existing: 1 -> 3
Request: 3 -> 5
1 < 5 = true
3 > 3 = false
=> không overlap
```

Điểm cần nhớ:

- `toStationIndex` là exclusive trong logic segment.
- Đi từ 1 đến 3 chiếm segment 1 và 2, không chiếm segment 3.

## 3. Tạo lockSegments từ seatIds

### Code

```ts
const bookingCode = `RAILFLOW-${dayjs().format('YYYYMMDD')}-${Math.floor(Math.random() * 10000)}`;
const acquiredLocks: string[] = [];
const lockSegments = seatIds.map((seatId) => ({
  seatId,
  fromStationIndex: fromStation.index,
  toStationIndex: toStation.index,
}));
```

### Giải thích

Mỗi seat trong đơn sẽ có một lock theo chặng. Nếu user chọn 3 ghế cùng chặng:

```text
G12: 1 -> 3
G13: 1 -> 3
G14: 1 -> 3
```

thì backend tạo 3 lock segment.

`bookingCode` được dùng làm value trong Redis. Nhờ đó backend phân biệt:

- lock của chính booking này;
- lock của booking khác.

## 4. Redis Lua lock: atomic check và set

### Code

```ts
private async acquireSeatSegmentLock(
  tripId: string,
  segment: SeatLockSegment,
  bookingCode: string,
  ttlSeconds: number,
) {
  const prefix = this.buildSeatLockPrefix(tripId, segment.seatId);
  const key = this.buildSeatLockKey(tripId, segment);
  const script = `
    local legacy = redis.call("GET", KEYS[1])
    if legacy and legacy ~= ARGV[1] then
      return "LOCKED"
    end

    local keys = redis.call("KEYS", KEYS[1] .. ":*")
    for _, existingKey in ipairs(keys) do
      local value = redis.call("GET", existingKey)
      if value and value ~= ARGV[1] then
        local parts = {}
        for part in string.gmatch(existingKey, "[^:]+") do
          table.insert(parts, part)
        end
        local fromIndex = tonumber(parts[#parts - 1])
        local toIndex = tonumber(parts[#parts])
        if fromIndex and toIndex and fromIndex < tonumber(ARGV[3]) and toIndex > tonumber(ARGV[2]) then
          return "LOCKED"
        end
      end
    end

    local current = redis.call("GET", KEYS[2])
    if current and current == ARGV[1] then
      redis.call("EXPIRE", KEYS[2], ARGV[4])
      return "OK"
    end

    return redis.call("SET", KEYS[2], ARGV[1], "EX", ARGV[4], "NX")
  `;
```

### Giải thích từng khối

#### `prefix`

`prefix` đại diện cho nhóm lock theo trip + seat.

Ví dụ:

```text
lock:seat:trip123:seatG12
```

`key` là lock cụ thể theo chặng:

```text
lock:seat:trip123:seatG12:1:3
```

#### Check legacy lock

```lua
local legacy = redis.call("GET", KEYS[1])
if legacy and legacy ~= ARGV[1] then
  return "LOCKED"
end
```

Đoạn này giữ tương thích nếu từng có lock cũ chỉ theo seat, chưa theo segment. Nếu prefix đã bị booking khác giữ, chặn luôn.

#### Check các segment lock hiện có

```lua
local keys = redis.call("KEYS", KEYS[1] .. ":*")
...
if fromIndex and toIndex and fromIndex < tonumber(ARGV[3]) and toIndex > tonumber(ARGV[2]) then
  return "LOCKED"
end
```

Đây là overlap check trong Redis. Nếu lock cũ và lock mới giao nhau, trả `LOCKED`.

Ví dụ:

```text
Lock cũ: 1 -> 3
Lock mới: 3 -> 5
1 < 5 true
3 > 3 false
=> không lock
```

#### Cùng booking thì gia hạn

```lua
local current = redis.call("GET", KEYS[2])
if current and current == ARGV[1] then
  redis.call("EXPIRE", KEYS[2], ARGV[4])
  return "OK"
end
```

Nếu cùng booking gọi lại, backend không tự chặn chính nó. Nó gia hạn TTL.

#### Set lock mới

```lua
return redis.call("SET", KEYS[2], ARGV[1], "EX", ARGV[4], "NX")
```

`NX` nghĩa là chỉ set nếu key chưa tồn tại.

### Vì sao dùng Lua

Nếu check và set tách thành hai request Redis, hai user có thể cùng check thấy trống rồi cùng set. Lua giúp thao tác atomic.

## 5. Rollback lock nếu một ghế fail

### Code

```ts
try {
  for (const segment of lockSegments) {
    const key = this.buildSeatLockKey(tripId, segment);
    const result = await this.acquireSeatSegmentLock(
      tripId,
      segment,
      bookingCode,
      lockTimeSec,
    );

    if (!result) {
      throw new BadRequestException(...);
    }
    acquiredLocks.push(key);
  }

  const booking = await this.prisma.booking.create(...);
  ...
} catch (error) {
  if (acquiredLocks.length > 0) {
    await Promise.all(acquiredLocks.map((key) => this.redis.del(key)));
  }
  throw error;
}
```

### Giải thích

Nếu user chọn 4 ghế:

- ghế 1 lock thành công;
- ghế 2 lock thành công;
- ghế 3 fail;

thì phải xóa lock ghế 1 và 2. Nếu không, hệ thống sẽ giữ ghế bẩn dù booking không được tạo.

Đây là rollback thủ công ở Redis vì Redis không nằm trong transaction PostgreSQL.

## 6. Tạo booking pending và queue hết hạn

### Code

```ts
const booking = await this.prisma.booking.create({
  data: {
    code: bookingCode,
    userId: userId,
    tripId: tripId,
    totalPrice: 0,
    status: 'PENDING',
    metadata: {
      tripId,
      fromStationId: fromStation.stationId,
      toStationId: toStation.stationId,
      requestedFromStationId: fromStationId,
      requestedToStationId: toStationId,
      fromStationIndex: fromStation.index,
      toStationIndex: toStation.index,
      seatIds,
    },
  },
});

await this.bookingQueue.add(
  'expire',
  { bookingCode },
  { delay: lockTimeMs },
);

this.emitSeatLocksLocked(tripId, lockSegments, seatIds);
this.triggerStatsUpdate(tripId);
```

### Giải thích

Booking pending lưu trong DB để:

- user quay sang trang passenger;
- hệ thống biết đơn nào đang chờ;
- queue biết đơn nào cần expire;
- admin/user có thể thấy trạng thái pending.

`metadata` là dữ liệu tạm. Nó chưa phải ticket chính thức.

Queue expire là lớp dọn dẹp:

- user bỏ ngang;
- user đóng tab;
- payment không xảy ra.

Socket giúp các client khác thấy ghế chuyển sang trạng thái giữ.

## 7. `buildTicketSeatSegments`: biến ticket thành các đoạn ghế

### Code

```ts
private buildTicketSeatSegments(ticket: {
  id: string;
  tripId: string;
  seatId: string;
  fromStationIndex: number;
  toStationIndex: number;
}) {
  const segments: {
    ticketId: string;
    tripId: string;
    seatId: string;
    segmentIndex: number;
  }[] = [];
  for (
    let segmentIndex = ticket.fromStationIndex;
    segmentIndex < ticket.toStationIndex;
    segmentIndex++
  ) {
    segments.push({
      ticketId: ticket.id,
      tripId: ticket.tripId,
      seatId: ticket.seatId,
      segmentIndex,
    });
  }

  return segments;
}
```

### Giải thích nghiệp vụ

Nếu route station index:

```text
0: Hà Nội
1: Phủ Lý
2: Ninh Bình
3: Thanh Hóa
```

Ticket:

```text
fromStationIndex = 0
toStationIndex = 2
```

Loop tạo:

```text
segmentIndex = 0
segmentIndex = 1
```

Không tạo segment 2, vì segment 2 là Ninh Bình -> Thanh Hóa, hành khách đã xuống ở Ninh Bình.

## 8. Confirm booking: transaction và unique constraint

### Code

```ts
updatedBooking = await this.prisma.$transaction(
  async (tx) => {
    const statusLock = await tx.booking.updateMany({
      where: { code: bookingCode, status: 'PENDING' },
      data: {
        status: 'PAID',
        metadata: Prisma.JsonNull,
      },
    });

    if (statusLock.count === 0) {
      const paidBooking = await this.findPaidBookingForReceipt(
        bookingCode,
        tx,
      );
      if (paidBooking) return paidBooking;
      throw new BadRequestException(
        'Đơn đặt chỗ không còn ở trạng thái chờ thanh toán',
      );
    }

    const createdTickets = [];
    for (const ticket of tickets) {
      createdTickets.push(
        await tx.ticket.create({
          data: {
            bookingId: booking.id,
            ...ticket,
          },
        }),
      );
    }

    const occupiedSegments = createdTickets.flatMap((ticket) =>
      this.buildTicketSeatSegments(ticket),
    );

    if (occupiedSegments.length > 0) {
      await tx.ticketSeatSegment.createMany({
        data: occupiedSegments,
      });
    }

    return this.findPaidBookingForReceipt(bookingCode, tx);
  },
  {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  },
);
```

### Giải thích từng ý

#### `updateMany` với điều kiện status

```ts
where: { code: bookingCode, status: 'PENDING' }
```

Đây là cách khóa trạng thái logic. Nếu callback thứ hai chạy sau callback thứ nhất, booking không còn `PENDING`, `count = 0`.

#### Xóa metadata

```ts
metadata: Prisma.JsonNull
```

Sau khi paid, dữ liệu chính thức nằm ở `Ticket` và `TicketSeatSegment`, không cần giữ metadata tạm.

#### Tạo Ticket

Mỗi passenger tạo một ticket.

Ticket lưu:

- passenger;
- seat;
- trip;
- from/to station index;
- price.

#### Tạo TicketSeatSegment

Mỗi ticket bung ra nhiều row segment. Đây là lớp toàn vẹn cuối.

#### Serializable

Isolation level cao giúp giảm race condition trong lúc nhiều callback/payment request cùng xác nhận.

## 9. P2002: database chặn bán trùng

### Code

```ts
} catch (error: any) {
  if (error?.code !== 'P2002') {
    throw error;
  }

  const paidBooking = await this.prisma.booking.findUnique(...);

  if (paidBooking?.status === 'PAID') {
    this.logger.warn(`Booking ${bookingCode} was confirmed by another callback`);
    return paidBooking;
  }

  if (booking.userId) {
    await this.walletService.refundToWallet(
      booking.userId,
      booking.totalPrice,
      bookingCode,
      'Hoàn tiền tự động do ghế đã được đặt bởi người khác',
    );
  }

  await this.prisma.booking.update({
    where: { code: bookingCode },
    data: { status: 'PAYMENT_FAILED' },
  });

  throw new BadRequestException(
    'Ghế đã được đặt bởi người khác. Tiền đã được hoàn về ví của bạn.',
  );
}
```

### Giải thích

`P2002` là lỗi unique constraint của Prisma. Ở đây thường đến từ:

```prisma
@@unique([tripId, seatId, segmentIndex])
```

Nếu database báo unique fail, nghĩa là có request khác đã insert cùng trip/seat/segment trước.

Backend xử lý đúng:

1. Nếu chính booking đã paid bởi callback khác thì return.
2. Nếu không, hoàn tiền.
3. Mark `PAYMENT_FAILED`.
4. Báo lỗi tiếng Việt.

## 10. Nhả lock và emit booked

### Code

```ts
await this.releaseSeatLocks(tripId, lockSegments, seatIds);

this.emitSeatLocksReleased(tripId, lockSegments, seatIds);
this.emitSeatLocksBooked(tripId, lockSegments, seatIds);
```

### Giải thích

Khi booking đã paid:

- lock tạm Redis không còn cần nữa;
- dữ liệu chính thức là `TicketSeatSegment`;
- frontend cần bỏ trạng thái holding;
- frontend cần chuyển ghế sang booked.

Vì vậy emit cả:

- `released`;
- `booked`.

## Tự kiểm tra

- Redis lock bảo vệ giai đoạn nào?
- PostgreSQL unique constraint bảo vệ giai đoạn nào?
- Vì sao confirm booking cần `updateMany` status `PENDING`?
- `P2002` có nghĩa gì trong luồng này?
- Vì sao paid xong vẫn cần release Redis lock?

