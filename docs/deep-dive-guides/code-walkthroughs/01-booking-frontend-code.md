# 01 - Booking Frontend Code Walkthrough

## Mục tiêu

Hiểu frontend đặt vé không chỉ là UI chọn ghế. Nó phải giữ đúng ngữ cảnh chặng đi, giá ghế, lock realtime và điều hướng sang trang nhập hành khách sau khi backend giữ chỗ thành công.

File chính:

- `web/app/(protected)/dashboard/booking/[tripId]/page.tsx`
- `web/app/(protected)/dashboard/booking/passengers/page.tsx`
- `web/features/booking/components/seat-layout-viewer.tsx`
- `web/features/booking/hooks/use-init-booking.ts`
- `web/features/booking/hooks/use-locked-seats.ts`

## 1. Lấy chặng hiện tại từ URL và dữ liệu trip

### Code

```tsx
const fromStation = trip.resolvedFrom || trip.route.stations.find((rs: any) => rs.stationId === fromStationId);
const toStation = trip.resolvedTo || trip.route.stations.find((rs: any) => rs.stationId === toStationId);
const routeStations = [...trip.route.stations].sort((a: any, b: any) => a.index - b.index);
const currentFromStationId = fromStation?.stationId || fromStationId;
const currentToStationId = toStation?.stationId || toStationId;
const currentFromIndex = routeStations.find((rs: any) => rs.stationId === currentFromStationId)?.index ?? -1;
const currentToIndex = routeStations.find((rs: any) => rs.stationId === currentToStationId)?.index ?? -1;
```

### Giải thích nghiệp vụ

Một chuyến tàu có thể đi qua nhiều ga, nhưng người dùng không nhất thiết đi toàn tuyến. Ví dụ route:

```text
Hà Nội -> Phủ Lý -> Ninh Bình -> Thanh Hóa
```

Người dùng có thể chỉ đặt:

```text
Phủ Lý -> Thanh Hóa
```

Vì vậy trang chọn ghế không được chỉ biết `tripId`; nó phải biết thêm:

- ga đi hiện tại;
- ga đến hiện tại;
- index của ga đi;
- index của ga đến.

`currentFromIndex` và `currentToIndex` là nền tảng để:

- tính giá;
- hỏi backend ghế nào đã bị đặt trên chặng này;
- hỏi Redis lock nào overlap với chặng này.

### Vì sao phải sort routeStations

Route station trong API có thể không bảo đảm thứ tự nếu query include không order. Frontend sort theo `index` để mọi thao tác chọn ga đi/ga đến đúng chiều tuyến.

## 2. Khi đổi ga đi/ga đến, cập nhật URL và reset ghế

### Code

```tsx
const updateRouteSegment = (nextFromStationId: string, nextToStationId: string) => {
    if (!nextFromStationId || !nextToStationId || nextFromStationId === nextToStationId) {
        return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('from', nextFromStationId);
    nextParams.set('to', nextToStationId);
    setSelectedSeats([]);
    router.replace(`/dashboard/booking/${tripId}?${nextParams.toString()}`, { scroll: false });
};
```

### Giải thích nghiệp vụ

Khi người dùng đổi chặng, các ghế đang chọn trước đó không còn chắc hợp lệ nữa.

Ví dụ:

- Ban đầu chọn ghế G12 cho chặng Hà Nội -> Phủ Lý.
- Sau đó đổi thành Hà Nội -> Thanh Hóa.

Ghế G12 có thể đã bị người khác đặt ở đoạn Phủ Lý -> Thanh Hóa, nên frontend phải:

1. Xóa `selectedSeats`.
2. Cập nhật URL query.
3. Refetch giá/lock theo chặng mới.

`{ scroll: false }` giúp đổi query mà không đẩy trang nhảy lung tung, nhất là trang có bản đồ và sơ đồ ghế dài.

## 3. Chặn chọn ga sai chiều

### Code

```tsx
const handleFromStationChange = (nextFromStationId: string) => {
    const nextFrom = routeStations.find((rs: any) => rs.stationId === nextFromStationId);
    if (!nextFrom) return;

    const nextTo =
        routeStations.find((rs: any) => rs.stationId === currentToStationId && rs.index > nextFrom.index) ||
        routeStations.find((rs: any) => rs.index > nextFrom.index);

    if (!nextTo) {
        toast.error('Ga đi phải đứng trước ga đến');
        return;
    }

    updateRouteSegment(nextFrom.stationId, nextTo.stationId);
};
```

### Giải thích nghiệp vụ

Route có chiều. Nếu route được tạo theo chiều:

```text
A -> B -> C -> D
```

thì chặng hợp lệ là:

```text
A -> C
B -> D
```

nhưng không hợp lệ:

```text
C -> A
```

Đoạn code trên bảo đảm ga đi mới luôn đứng trước ga đến. Nếu ga đến hiện tại không còn hợp lệ, frontend tự chọn ga tiếp theo sau ga đi.

Backend vẫn phải validate lại, nhưng frontend làm trước để trải nghiệm tốt hơn.

## 4. Chọn/bỏ chọn ghế

### Code

```tsx
const handleSeatToggle = (seat: any) => {
    const isSelected = selectedSeats.some((s) => s.id === seat.id);

    if (isSelected) {
        setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));
        return;
    }

    if (selectedSeats.length >= 6) {
        toast.warning("Mỗi đơn hàng chỉ được chọn tối đa 6 ghế");
        return;
    }

    const type = coachWithPrices?.template.layout ?? 'SEAT';
    setSelectedSeats((prev) => [...prev, { id: seat.id, name: seat.name, price: seat.price, type }]);
};
```

### Giải thích nghiệp vụ

Frontend lưu ghế đã chọn ở state tạm:

- `id`: gửi backend lock seat.
- `name`: hiển thị summary.
- `price`: tính tổng tạm trên UI.
- `type`: biết ghế hay giường.

Giới hạn 6 ghế là policy UI để tránh một booking quá lớn. Backend cũng nên có policy guard vì frontend không đáng tin tuyệt đối.

## 5. Khi socket báo conflict, tự bỏ chọn ghế

### Code

```tsx
const handleSeatsForceDeselected = (seatIds: string[]) => {
    // Remove conflicted seats from selection
    setSelectedSeats(prev => prev.filter(s => !seatIds.includes(s.id)));
    setConflictMessage(`Các ghế sau vừa được người khác giữ chỗ: ${seatIds.map(id => selectedSeats.find(s => s.id === id)?.name || 'Ghế').join(', ')}`);
    setIsConflictDialogOpen(true);
};
```

### Giải thích nghiệp vụ

Trong realtime booking, người dùng có thể đang nhìn một ghế trống, nhưng người khác giữ trước vài mili giây. Khi frontend nhận event và thấy ghế hiện tại bị conflict, nó:

1. Loại ghế đó khỏi `selectedSeats`.
2. Hiện dialog giải thích.
3. Không cho người dùng tiếp tục với state đã sai.

Điểm quan trọng: UI không âm thầm đổi ghế cho người dùng. Nó báo rõ để người dùng chọn lại.

## 6. Gọi backend giữ chỗ

### Code

```tsx
const handleProceedToPassengerInfo = () => {
    if (selectedSeats.length > 0) {
        setIsProcessing(true);
        initBooking({
            tripId,
            seatIds: selectedSeats.map(s => s.id),
            fromStationId,
            toStationId
        }, {
            onSuccess: (data) => {
                router.push(`/dashboard/booking/passengers?bookingCode=${data.bookingCode}`);
            },
            onError: (error: any) => {
                console.error('Init booking failed:', error);
                const message = error.response?.data?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.';

                if (message.includes("Tối đa 3") || message.includes("chờ thanh toán") || message.includes("chưa thanh toán")) {
                    setPendingError(message);
                    setIsMaxPendingDialogOpen(true);
                } else {
                    toast.error(message);
                }
                setIsProcessing(false);
            }
        });
    }
};
```

### Giải thích nghiệp vụ

Đây là thời điểm chuyển từ UI tạm sang trạng thái backend.

Frontend gửi:

- `tripId`
- `seatIds`
- `fromStationId`
- `toStationId`

Backend sẽ:

- kiểm tra trip;
- kiểm tra ghế đã bán chưa;
- kiểm tra Redis lock;
- tạo booking `PENDING`;
- đặt Redis lock;
- trả `bookingCode`.

Frontend không gửi passenger ở bước này. Passenger nằm ở trang sau.

### Vì sao không set `isProcessing=false` khi success

Comment trong code nói rõ: trong lúc redirect, socket event của chính booking này có thể quay về. Nếu UI mở lại trạng thái bình thường quá sớm, event `seats.locked` có thể bị hiểu nhầm là người khác giữ ghế và hiện conflict sai.

Đây là ví dụ frontend phải hiểu realtime event, không chỉ gọi API xong là xong.

## 7. SeatLayoutViewer refetch lock theo socket

### Code

```tsx
const { data: initialLockedSeats, refetch: refetchLockedSeats } = useLockedSeats(tripId, fromStationId, toStationId);

useEffect(() => {
    if (!tripId || !socket) return

    function onSeatLockChanged(data: { tripId: string }) {
        if (data.tripId === tripId) {
            refetchLockedSeats()
        }
    }

    socket.on("seats.locked", onSeatLockChanged)
    socket.on("seats.released", onSeatLockChanged)
    socket.on("seats.booked", onSeatLockChanged)

    return () => {
        socket.off("seats.locked", onSeatLockChanged)
        socket.off("seats.released", onSeatLockChanged)
        socket.off("seats.booked", onSeatLockChanged)
    }
}, [tripId, socket, refetchLockedSeats])
```

### Giải thích nghiệp vụ

Component không tự tin tuyệt đối vào payload socket. Nó dùng socket như tín hiệu:

```text
"Có thay đổi ghế trên trip này, refetch lại lock state"
```

Đây là pattern tốt:

- socket nhẹ;
- API vẫn là nguồn dữ liệu;
- tránh UI bị lệch nếu event thiếu field.

## 8. Trang passenger cập nhật hành khách

### Code

```tsx
const { mutate: updatePassengers, isPending: isUpdating } = useUpdateBookingPassengers();
```

Và khi submit form:

```tsx
updatePassengers(
    {
        code: bookingCode,
        passengers: data.passengers.map((p) => ({
            seatId: p.seatId,
            passengerName: p.passengerName,
            passengerId: p.passengerId,
            passengerGroupId: p.passengerGroupId,
        })),
    },
    {
        onSuccess: (data) => {
            setPaymentDialog({
                open: true,
                amount: data.totalPrice,
                paymentUrl: data.paymentUrl,
                bookingCode: data.bookingCode
            });
        },
    },
);
```

### Giải thích nghiệp vụ

Sau khi backend đã giữ chỗ, user nhập thông tin hành khách cho từng ghế. Lúc này backend mới tính giá cuối cùng vì cần biết:

- passenger group;
- discount;
- seat tier;
- coach multiplier;
- chặng đi.

Sau khi update passenger thành công, frontend mới mở dialog thanh toán.

## Tự kiểm tra

- Vì sao đổi chặng phải reset `selectedSeats`?
- Vì sao socket event không trực tiếp sửa toàn bộ state ghế?
- Vì sao init booking chưa cần passenger?
- Vì sao frontend phải gửi cả `fromStationId` và `toStationId` khi lock ghế?
- Vì sao success của `initBooking` không set `isProcessing=false` ngay?

