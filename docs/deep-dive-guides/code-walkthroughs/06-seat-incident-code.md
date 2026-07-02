# 06 - Seat Incident, Replacement Và Refund Code Walkthrough

## Mục tiêu

Hiểu code xử lý sự cố ghế: admin xác nhận report, disable ghế, tìm ghế thay thế, gửi email token, hoàn tiền nếu không có ghế, và cập nhật `TicketSeatSegment` khi khách xác nhận đổi ghế.

File chính:

- `api/src/modules/seat-issues/seat-issues.service.ts`
- `api/src/modules/mail/mail.service.ts`
- `api/src/modules/booking/booking.gateway.ts`

## 1. Admin xác nhận report

### Code

```ts
async confirmIssue(id: string) {
  const report = await this.prisma.seatIssueReport.findUnique({
    where: { id },
    include: {
      seat: {
        include: {
          coach: true,
        },
      },
      trip: true,
    },
  });

  if (!report) {
    throw new NotFoundException('Không tìm thấy báo cáo sự cố');
  }

  if (report.status !== SeatIssueStatus.PENDING) {
    throw new BadRequestException('Báo cáo đã được xử lý từ trước');
  }

  await this.prisma.seat.update({
    where: { id: report.seatId },
    data: { status: SeatStatus.DISABLED },
  });
```

### Giải thích nghiệp vụ

Admin chỉ xác nhận report đang `PENDING`. Nếu report đã xử lý, không cho xử lý lại để tránh:

- gửi email nhiều lần;
- hoàn tiền nhiều lần;
- đổi ghế nhiều lần.

Khi xác nhận, ghế vật lý bị chuyển sang `DISABLED`. Đây là trạng thái dài hạn của ghế, khác với booking status theo chặng.

## 2. Tìm vé bị ảnh hưởng

### Code

```ts
const ticket = await this.prisma.ticket.findFirst({
  where: {
    tripId: report.tripId,
    seatId: report.seatId,
    booking: {
      status: 'PAID',
    },
  },
  include: {
    booking: {
      include: {
        user: true,
      },
    },
  },
});

if (!ticket) {
  await this.prisma.seatIssueReport.update({
    where: { id },
    data: { status: SeatIssueStatus.RESOLVED },
  });
  this.bookingGateway.emitSeatIssuesUpdated(report.tripId, report.seatId, 'RESOLVED');

  return { status: 'RESOLVED', message: 'Xác nhận sự cố thành công (Không có vé bị ảnh hưởng)' };
}
```

### Giải thích

Không phải ghế hỏng nào cũng ảnh hưởng khách. Nếu chưa có vé paid trên ghế đó trong trip:

- chỉ disable ghế;
- mark report resolved;
- emit realtime;
- không gửi email đổi ghế;
- không hoàn tiền.

Nếu có ticket paid, phải xử lý quyền lợi khách.

## 3. Tìm ghế thay thế

### Code

```ts
const replacementSeat = await this.findAlternativeSeat(
  report.tripId,
  report.seatId,
  report.seat,
);
```

### Code `findAlternativeSeat`

```ts
private async findAlternativeSeat(tripId: string, oldSeatId: string, oldSeat: any) {
  const trip = await this.prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      train: {
        include: {
          coaches: {
            where: {
              status: 'ACTIVE',
            },
            include: {
              seats: {
                where: {
                  status: 'AVAILABLE',
                  type: oldSeat.type,
                  tier: oldSeat.tier,
                  id: { not: oldSeatId },
                },
              },
            },
          },
        },
      },
    },
  });
```

### Giải thích

Ghế thay thế cần cùng tính chất:

- thuộc cùng train của trip;
- coach active;
- seat available;
- cùng type;
- cùng tier;
- không phải ghế cũ.

Điều này giúp khách không bị đổi từ ghế tốt sang ghế kém hơn.

## 4. Loại ghế đã có vé

### Code

```ts
const bookedTickets = await this.prisma.ticket.findMany({
  where: {
    tripId,
    booking: {
      status: { in: ['PAID', 'PENDING'] },
    },
  },
  select: {
    seatId: true,
  },
});

const bookedSeatIds = new Set(bookedTickets.map((t) => t.seatId));
const availableCandidates = candidates.filter((c) => !bookedSeatIds.has(c.id));
```

### Giải thích

Code hiện tại loại ghế đã xuất hiện trong ticket/booking theo seatId. Ý tưởng nghiệp vụ là không đề xuất ghế đã bị khách khác dùng.

Điểm cần nắm để bảo vệ/debug:

- Với hệ thống bán ghế theo chặng, cách tối ưu hơn là kiểm tra bằng `TicketSeatSegment` trên đúng chặng bị ảnh hưởng.
- Nhưng đoạn này vẫn thể hiện nguyên tắc: ghế thay thế phải được kiểm tra lại trước khi đổi thật.

Thực tế confirm replacement ở bước sau có double-check bằng `TicketSeatSegment`, đó mới là lớp chặn quan trọng.

## 5. Ưu tiên ghế cùng toa/gần vị trí

### Code

```ts
availableCandidates.sort((a, b) => {
  const aSameCoach = a.coachId === oldSeat.coachId ? 1 : 0;
  const bSameCoach = b.coachId === oldSeat.coachId ? 1 : 0;

  if (aSameCoach !== bSameCoach) {
    return bSameCoach - aSameCoach;
  }

  const distA = Math.abs(a.rowIndex - oldSeat.rowIndex) + Math.abs(a.colIndex - oldSeat.colIndex);
  const distB = Math.abs(b.rowIndex - oldSeat.rowIndex) + Math.abs(b.colIndex - oldSeat.colIndex);
  return distA - distB;
});

return availableCandidates[0];
```

### Giải thích

Nếu có nhiều ghế thay thế:

1. Ưu tiên cùng coach.
2. Nếu cùng coach hoặc đều khác coach, chọn ghế gần nhất theo row/col.

Đây là heuristic đơn giản nhưng hợp lý:

- khách ít bị thay đổi vị trí;
- dễ giải thích trong đồ án.

## 6. Gửi email xác nhận đổi ghế

### Code

```ts
if (replacementSeat) {
  const token = crypto.randomUUID();
  const tokenExpires = dayjs().add(24, 'hour').toDate();

  await this.prisma.seatIssueReport.update({
    where: { id },
    data: {
      status: SeatIssueStatus.WAITING_CUSTOMER_CONFIRMATION,
      token,
      tokenExpires,
      proposedSeatId: replacementSeat.id,
    },
  });

  const customerEmail = ticket.booking.contactEmail || ticket.booking.user?.email;
  if (customerEmail) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
    const link = `${frontendUrl}/confirm-seat-replacement?token=${token}`;

    await this.mailService.sendSeatReplacementEmail(customerEmail, {
      link,
      oldSeatName: report.seat.name,
      oldCoachName: report.seat.coach?.name || report.seat.coach?.order,
      proposedSeatName: replacementSeat.name,
      proposedCoachName: replacementSeat.coach?.name || replacementSeat.coach?.order,
      tokenExpires,
    });
  }
```

### Giải thích

Hệ thống không tự đổi ghế ngay. Nó:

- lưu proposed seat;
- tạo token;
- gửi link cho khách xác nhận.

Lý do:

- khách có quyền biết ghế mới;
- khách có thể không đồng ý;
- token có hạn 24 giờ để tránh link sống mãi.

## 7. Nếu không có ghế thay thế, hoàn tiền

### Code

```ts
const refundResult = await this.refundAffectedTicket(id, 'NO_REPLACEMENT_AUTO_REFUND');
return {
  ...refundResult,
  message: 'Không tìm thấy ghế thay thế phù hợp. Hệ thống đã tự động hủy vé và hoàn tiền cho khách hàng.',
};
```

### Giải thích

Nếu không đảm bảo chỗ ngồi tương đương, hệ thống hoàn tiền. Đây là nhánh bảo vệ quyền lợi khách.

## 8. Refund transaction

### Code

```ts
await this.prisma.$transaction(async (tx) => {
  await tx.user.update({
    where: { id: userId },
    data: {
      balance: { increment: refundAmount },
    },
  });

  await tx.transaction.create({
    data: {
      userId,
      amount: refundAmount,
      type: 'REFUND',
      paymentMethod: 'WALLET',
      status: 'COMPLETED',
      referenceId: ticket.bookingId,
      idempotencyKey: `SEAT_ISSUE_REFUND:${id}:${ticket.id}`,
      description: `Hoàn tiền sự cố ghế hỏng #${report.seat.name} chuyến ${report.tripId}`,
    },
  });

  await tx.ticketSeatSegment.deleteMany({
    where: { ticketId: ticket.id },
  });

  await tx.booking.update({
    where: { id: ticket.bookingId },
    data: {
      status: 'CANCELLED',
    },
  });

  await tx.seatIssueReport.update({
    where: { id },
    data: {
      status: SeatIssueStatus.RESOLVED,
      token: null,
      tokenExpires: null,
      rejectReason: reason,
    },
  });
});
```

### Giải thích

Refund không chỉ cộng tiền:

1. Cộng balance user.
2. Ghi transaction `REFUND`.
3. Xóa `TicketSeatSegment` để giải phóng đoạn ghế.
4. Cancel booking.
5. Resolve issue.

Tất cả nằm trong transaction để không xảy ra trạng thái nửa vời.

`idempotencyKey` giúp tránh tạo refund trùng cho cùng issue/ticket.

## 9. Khách xác nhận đổi ghế

### Code

```ts
async confirmReplacement(token: string, newSeatId: string) {
  const report = await this.prisma.seatIssueReport.findUnique({
    where: { token },
    include: {
      seat: true,
      trip: {
        select: {
          trainId: true,
        },
      },
    },
  });

  if (!report) {
    throw new NotFoundException('Token đổi ghế không hợp lệ');
  }

  if (report.status !== SeatIssueStatus.WAITING_CUSTOMER_CONFIRMATION) {
    throw new BadRequestException('Yêu cầu đổi ghế đã được xử lý hoặc hết hạn');
  }

  if (report.tokenExpires && new Date() > report.tokenExpires) {
    throw new BadRequestException('Mã xác nhận đổi ghế đã hết hạn');
  }
```

### Giải thích

Trước khi đổi, backend kiểm tra:

- token tồn tại;
- report đang chờ khách xác nhận;
- token chưa hết hạn.

Không được tin link cũ hoặc report đã xử lý.

## 10. Double-check ghế mới bằng TicketSeatSegment

### Code

```ts
const alreadyBooked = await this.prisma.ticketSeatSegment.findFirst({
  where: {
    tripId: report.tripId,
    seatId: newSeatId,
    segmentIndex: {
      gte: ticket.fromStationIndex,
      lt: ticket.toStationIndex,
    },
    ticket: {
      booking: {
        status: 'PAID',
      },
    },
  },
});

if (alreadyBooked) {
  throw new ConflictException('Ghế ngồi này đã bị hành khách khác chọn trước. Vui lòng chọn ghế khác.');
}
```

### Giải thích

Đây là đoạn quan trọng nhất của đổi ghế.

Ngay cả khi trước đó hệ thống đã đề xuất ghế, trong 24 giờ chờ khách xác nhận, ghế đó có thể bị đặt bởi người khác. Vì vậy phải kiểm tra lại bằng `TicketSeatSegment`.

Điều kiện:

```text
segmentIndex >= ticket.fromStationIndex
segmentIndex < ticket.toStationIndex
```

chính là kiểm tra tất cả đoạn mà ticket cũ cần đi.

## 11. Transaction đổi ghế

### Code

```ts
await this.prisma.$transaction(
  async (tx) => {
    await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        seatId: newSeatId,
      },
    });

    await tx.ticketSeatSegment.deleteMany({
      where: { ticketId: ticket.id },
    });

    await tx.ticketSeatSegment.createMany({
      data: this.buildTicketSeatSegments({
        id: ticket.id,
        tripId: ticket.tripId,
        seatId: newSeatId,
        fromStationIndex: ticket.fromStationIndex,
        toStationIndex: ticket.toStationIndex,
      }),
    });

    await tx.seatIssueReport.update({
      where: { id: report.id },
      data: {
        status: SeatIssueStatus.RESOLVED,
        token: null,
        tokenExpires: null,
      },
    });
  },
  {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  },
);
```

### Giải thích

Đổi ghế đúng phải làm 4 việc trong cùng transaction:

1. Update `Ticket.seatId`.
2. Xóa segment ghế cũ.
3. Tạo segment ghế mới.
4. Resolve report và xóa token.

Nếu chỉ update `Ticket.seatId`, hệ thống sẽ hiển thị vé ghế mới nhưng database vẫn khóa segment ghế cũ. Đó là lỗi toàn vẹn dữ liệu.

## Tự kiểm tra

- Vì sao admin confirm issue không tự đổi ghế ngay?
- Vì sao cần token?
- Refund phải cập nhật những bảng nào?
- Đổi ghế phải cập nhật `TicketSeatSegment` như thế nào?
- Vì sao confirm replacement vẫn phải check ghế mới lần nữa?

