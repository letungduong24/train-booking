import {
    SeatStatus,
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

    // In Admin mode, we treat DISABLED the same for visualization
    const effectiveStatus = isAdmin && status === 'DISABLED' ? 'DISABLED' : status;

    switch (effectiveStatus) {
        case 'AVAILABLE':
            return 'border-secondary hover:bg-secondary/10 cursor-pointer';
        case 'BOOKED':
            return `bg-primary text-primary-foreground ${cursorClass} opacity-50 border-primary`;
        case 'DISABLED':
            return `bg-gray-300 dark:bg-muted text-muted-foreground border-transparent cursor-not-allowed`; // Distinct gray in light, muted in dark
        case 'HOLDING':
            return `bg-[#E5BA41] text-white border-[#E5BA41] ${cursorClass}`;
        default:
            return 'border-border';
    }
}

// Get seat status label
export function getSeatStatusLabel(status: SeatStatus | BookingStatus, isAdmin: boolean = false): string {
    if (isAdmin) {
        return status === 'DISABLED' ? 'Đã vô hiệu hóa' : 'Hoạt động';
    }

    switch (status) {
        case 'AVAILABLE':
            return 'Còn trống';
        case 'BOOKED':
            return 'Đã đặt';
        case 'DISABLED':
            return 'Đã vô hiệu hóa';
        case 'LOCKED': // Runtime locked
            return 'Đang giữ chỗ';
        case 'HOLDING':
            return 'Đang giữ chỗ';
        default:
            return status;
    }
}

// Get seat name with prefix
export function getSeatName(name: string, type: 'SEAT' | 'BED' | string): string {
    if (!name) return '';
    const prefix = type === 'BED' ? 'Giường' : 'Ghế';
    // If name already starts with prefix, return as is (case insensitive check)
    if (name.toLowerCase().startsWith(prefix.toLowerCase())) {
        return name;
    }
    return `${prefix} ${name}`;
}

// Get seat type label
export function getSeatTypeLabel(type: string): string {
    switch (type) {
        case 'VIP':
            return 'Thương gia';
        case 'STANDARD':
            return 'Tiêu chuẩn';
        case 'ECONOMY':
            return 'Phổ thông';
        case 'OTHER':
            return 'Khác';
        default:
            return type;
    }
}

// Get seat type icon
export function getSeatTypeIcon(type: string): string {
    switch (type) {
        case 'VIP':
            return '⭐';
        case 'STANDARD':
            return '🪑';
        case 'ECONOMY':
            return '💺';
        case 'OTHER':
            return '📍';
        default:
            return '📍';
    }
}
