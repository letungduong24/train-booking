# 07 - Seat Locking Và Toàn Vẹn Dữ Liệu

## Mục tiêu học

Hiểu bài toán khóa ghế theo chặng, Redis temporary lock, Socket.IO realtime, và PostgreSQL `TicketSeatSegment` để chặn bán trùng ghế ở lớp database.

File cần đọc:

- `api/src/modules/booking/booking.service.ts`
- `api/src/modules/booking/booking.gateway.ts`
- `api/src/modules/booking/booking.processor.ts`
- `api/prisma/schema.prisma`
- `web/features/booking/hooks/use-locked-seats.ts`
- `web/features/booking/components/seat-layout-viewer.tsx`
- `web/lib/store/socket.store.ts`

## Bài toán thật

Với tàu hỏa, một ghế có thể được bán nhiều lần trên cùng một chuyến nếu các chặng không giao nhau.

Route:

```text
Ga 1 -> Ga 2 -> Ga 3 -> Ga 4
```

Các segment:

```text
segment 1: Ga 1 -> Ga 2
segment 2: Ga 2 -> Ga 3
segment 3: Ga 3 -> Ga 4
```

Vé A:

```text
Ga 1 -> Ga 3
Chiếm segment 1, 2
```

Vé B:

```text
Ga 3 -> Ga 4
Chiếm segment 3
```

Vé A và B được phép dùng cùng seatId.

Vé C:

```text
Ga 2 -> Ga 4
Chiếm segment 2, 3
```

Vé C không được dùng cùng seatId với vé A vì trùng segment 2.

## Công thức overlap

Hai khoảng `[from, to)` giao nhau nếu:

```text
existing.from < requested.to
existing.to > requested.from
```

Trong code:

```text
fromStationIndex: { lt: toStation.index }
toStationIndex: { gt: fromStation.index }
```

Đây là công thức cần nắm chắc.

## Vì sao cần 2 lớp locking

### Redis

Dùng trước thanh toán:

- nhanh;
- có TTL;
- phù hợp với trạng thái tạm;
- giúp người khác thấy ghế đang giữ.

Nhược điểm:

- không phải nguồn dữ liệu lâu dài;
- có thể hết hạn;
- không đủ để chứng minh toàn vẹn sau thanh toán.

### PostgreSQL

Dùng sau thanh toán:

- lưu dữ liệu chính thức;
- có unique constraint;
- chặn race condition ở lớp database;
- là bằng chứng toàn vẹn dữ liệu.

## Redis lock trong Railflow

Lock segment gồm:

- `tripId`
- `seatId`
- `fromStationIndex`
- `toStationIndex`
- `bookingCode`
- TTL.

Ý nghĩa:

- `tripId`: cùng ghế ở chuyến khác không liên quan.
- `seatId`: ghế cụ thể.
- `from/to`: khoảng chặng.
- `bookingCode`: cho phép cùng booking gia hạn/kiểm tra lock của chính nó.

## Acquire lock

Trong `initBooking`, backend lặp qua từng seat:

```text
for each seat segment:
  acquireSeatSegmentLock()
  if fail:
    rollback locks already acquired
```

Rollback rất quan trọng. Nếu user chọn 3 ghế, lock ghế 1 và 2 thành công nhưng ghế 3 fail, backend phải xóa lock ghế 1 và 2 để không giữ bẩn.

## Lua script / atomic check

Redis lock cần atomic:

- check các lock trùng seat/trip;
- kiểm tra overlap;
- nếu không có conflict thì set lock.

Nếu tách thành hai lệnh:

```text
GET locks
SET lock
```

hai request song song có thể cùng pass. Lua script giúp check và set là một thao tác nguyên tử.

## Locked seats API

Frontend dùng `useLockedSeats` để lấy danh sách ghế đang bị giữ trên chặng hiện tại.

Backend phải trả theo:

- tripId;
- fromStationId/fromStationIndex;
- toStationId/toStationIndex;
- seat locks overlap với chặng đang xem.

Nếu không lọc theo chặng, UI sẽ sai: ghế bị giữ ở đoạn không giao nhau vẫn bị tô màu không khả dụng.

## Socket event

Khi lock thành công:

```text
emit seats.locked
```

Khi cancel/expire:

```text
emit seats.released
```

Khi confirm paid:

```text
emit seats.released
emit seats.booked
```

Vì sao paid vừa release vừa booked:

- release để bỏ trạng thái đang giữ;
- booked để client refetch và chuyển sang trạng thái đã bán.

## PostgreSQL TicketSeatSegment

Schema:

```prisma
model TicketSeatSegment {
  id           String @id @default(uuid())
  ticketId     String
  tripId       String
  seatId       String
  segmentIndex Int

  @@unique([tripId, seatId, segmentIndex])
}
```

Hàm build:

```text
buildTicketSeatSegments(ticket)
```

Với ticket:

```text
fromStationIndex = 1
toStationIndex = 4
```

Tạo:

```text
segmentIndex = 1
segmentIndex = 2
segmentIndex = 3
```

Chú ý:

- `toStationIndex` không được include như segment.
- Đi từ 1 đến 4 nghĩa là đi qua segment 1, 2, 3.

## Vì sao Ticket và TicketSeatSegment đều có seatId

`Ticket.seatId`:

- phục vụ hiển thị vé;
- biết hành khách ngồi ghế nào;
- query lịch sử, PDF, email.

`TicketSeatSegment.seatId`:

- phục vụ unique constraint;
- query nhanh ghế nào bị khóa ở đoạn nào;
- không cần join qua ticket khi kiểm tra conflict.

Đây là denormalization có chủ đích cho toàn vẹn và performance.

## Case race condition

Giả sử hai user bằng cách nào đó cùng đi tới confirm:

1. User A tạo ticket segment `(trip1, G12, segment2)`.
2. User B cũng tạo ticket segment `(trip1, G12, segment2)`.
3. PostgreSQL unique constraint từ chối User B.
4. Backend bắt lỗi `P2002`, hoàn tiền, chuyển booking `PAYMENT_FAILED`.

Đây là lý do có thể nói hệ thống có lớp bảo vệ cuối ở database.

## Những sai lầm cần tránh

- Chỉ dùng `Seat.status` để xác định ghế trống.
- Chỉ unique `tripId + seatId`.
- Không phân biệt holding và booked.
- Không release lock khi cancel/expire.
- Không kiểm tra overlap theo segment.
- Tin vào socket mà không refetch dữ liệu.

## Câu hỏi bảo vệ

- Redis lock khác `TicketSeatSegment` thế nào?
- Vì sao một seat có thể xuất hiện trong nhiều ticket?
- `segmentIndex` được tính từ đâu?
- Vì sao unique không phải `[tripId, seatId]`?
- Khi booking hết hạn thì database có xóa booking không?

