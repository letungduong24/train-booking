import {
    SeatStatus,
    SeatType,
    BookingStatus,
    Seat
} from "@/lib/schemas/seat.schema";

export function getComputedSeatStatus(
    seat: Seat,
    lockedSeatIds: string[] = [],
    isAdmin: boolean = false
): SeatStatus | BookingStatus {
    const isLocked = lockedSeatIds.includes(seat.id);
    let displayStatus = isAdmin ? seat.status : (seat.bookingStatus || seat.status);

    if (!isAdmin && isLocked && displayStatus === 'AVAILABLE') {
        return 'HOLDING';
    }
    return displayStatus;
}

// Get seat status color
export function getSeatStatusColor(status: SeatStatus | BookingStatus, isAdmin: boolean = false): string {
    const cursorClass = isAdmin ? 'cursor-pointer' : 'cursor-not-allowed';

    // In Admin mode, we treat LOCKED the same for visualization
    const effectiveStatus = isAdmin && status === 'LOCKED' ? 'LOCKED' : status;

    switch (effectiveStatus) {
        case 'AVAILABLE':
            return 'border-green-500 hover:bg-green-50 cursor-pointer';
        case 'BOOKED':
            return `border-red-500 ${cursorClass} opacity-60`;
        case 'LOCKED':
            return `border-yellow-500 bg-yellow-50 ${cursorClass}`;
        case 'HOLDING':
            return `border-yellow-500 bg-yellow-100 ${cursorClass}`;
        default:
            return 'border-gray-300';
    }
}

// Get seat type icon
export function getSeatTypeIcon(type: SeatType): string {
    switch (type) {
        case 'VIP':
            return '⭐';
        case 'STANDARD':
            return '🪑';
        case 'ECONOMY':
            return '💺';
        default:
            return '📍';
    }
}

// Get seat type label
export function getSeatTypeLabel(type: SeatType): string {
    switch (type) {
        case 'VIP':
            return 'Hạng VIP';
        case 'STANDARD':
            return 'Hạng tiêu chuẩn';
        case 'ECONOMY':
            return 'Hạng tiết kiệm';
        case 'OTHER':
            return 'Khác';
        default:
            return type;
    }
}

// Get seat status label
export function getSeatStatusLabel(status: SeatStatus | BookingStatus, isAdmin: boolean = false): string {
    if (isAdmin) {
        return status === 'LOCKED' ? 'Đã khóa/Bảo trì' : 'Hoạt động';
    }

    switch (status) {
        case 'AVAILABLE':
            return 'Còn trống';
        case 'BOOKED':
            return 'Đã đặt';
        case 'LOCKED':
            return 'Đã khóa';
        case 'HOLDING':
            return 'Đang giữ chỗ';
        default:
            return status;
    }
}
