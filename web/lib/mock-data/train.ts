// Mock data for train detail page
import {
    SeatStatus,
    SeatType,
    Seat
} from "@/lib/schemas/seat.schema";
import {
    CoachLayout,
    CoachTemplate,
    Coach
} from "@/lib/schemas/coach.schema";
import { Train } from "@/lib/schemas/train.schema";

export type {
    CoachLayout,
    SeatStatus,
    SeatType,
    Seat,
    CoachTemplate,
    Coach,
    Train
};



// Generate seat name based on layout type
function generateSeatName(
    layout: CoachLayout,
    seatNumber: number
): string {
    if (layout === 'SEAT') {
        // Format: 1, 2, 3, 4, ... (sequential)
        return `${seatNumber}`;
    } else {
        // BED format: 1, 2, 3, ... (sequential)
        return `${seatNumber}`;
    }
}

// Generate seats for a coach
function generateSeats(
    coachId: string,
    template: CoachTemplate
): Seat[] {
    const seats: Seat[] = [];
    const { layout, totalRows, totalCols, tiers } = template;
    let seatNumber = 1;

    if (layout === 'SEAT') {
        // Generate grid of seats
        for (let row = 0; row < totalRows; row++) {
            for (let col = 0; col < totalCols; col++) {
                const seatName = generateSeatName(layout, seatNumber);
                // Randomize some statuses for demo
                const statuses: SeatStatus[] = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'BOOKED', 'LOCKED'];
                const types: SeatType[] = ['STANDARD', 'STANDARD', 'VIP', 'ECONOMY', 'OTHER'];

                seats.push({
                    id: `${coachId}-seat-${row}-${col}`,
                    name: seatName,
                    rowIndex: row,
                    colIndex: col,
                    status: statuses[Math.floor(Math.random() * statuses.length)],
                    type: types[Math.floor(Math.random() * types.length)],
                    coachId,
                    price: Math.floor(Math.random() * (1500000 - 500000) + 500000) // 500k - 1.5tr
                });

                seatNumber++;
            }
        }
    } else {
        // BED layout: Generate beds for each compartment and tier
        for (let row = 0; row < totalRows; row++) {
            for (let tier = 0; tier < tiers; tier++) {
                for (let side = 0; side < 2; side++) {
                    // 2 sides: left (0) and right (1)
                    const seatName = generateSeatName(layout, seatNumber);
                    const statuses: SeatStatus[] = ['AVAILABLE', 'AVAILABLE', 'BOOKED', 'LOCKED'];

                    seats.push({
                        id: `${coachId}-bed-${row}-${tier}-${side}`,
                        name: seatName,
                        rowIndex: row,
                        colIndex: side,
                        status: statuses[Math.floor(Math.random() * statuses.length)],
                        type: 'STANDARD',
                        coachId,
                        price: Math.floor(Math.random() * (2000000 - 800000) + 800000) // 800k - 2tr
                    });

                    seatNumber++;
                }
            }
        }
    }

    return seats;
}

// Generate a coach
function generateCoach(
    trainId: string,
    order: number,
    templateCode: string,
    templateName: string,
    layout: CoachLayout,
    totalRows: number,
    totalCols: number,
    tiers: number,
    description?: string
): Coach {
    const coachId = `coach-${order}`;
    const template: CoachTemplate = {
        id: `template-${templateCode}`,
        code: templateCode,
        name: templateName,
        description,
        layout,
        totalRows,
        totalCols,
        tiers,
    };

    return {
        id: coachId,
        name: `Toa ${order}`,
        order,
        status: 'ACTIVE',
        trainId,
        template,
        seats: generateSeats(coachId, template),
    };
}

// Generate mock train data
export function generateMockTrain(): Train {
    const trainId = 'train-1';

    return {
        id: trainId,
        code: 'SE1',
        name: 'Tàu Thống Nhất',
        status: 'ACTIVE',
        coaches: [
            generateCoach(
                trainId,
                1,
                'SEAT_AC',
                'Ngồi mềm (Điều hòa)',
                'SEAT',
                16,
                4,
                1,
                'Ghế ngồi mềm có điều hòa, bố trí 2-2.'
            ),
            generateCoach(
                trainId,
                2,
                'BED_K6',
                'Giường nằm (Khoang 6)',
                'BED',
                7,
                1,
                3,
                'Giường tầng 3 tầng, mỗi khoang 6 giường.'
            ),
            generateCoach(
                trainId,
                3,
                'BED_K4',
                'Giường nằm (Khoang 4)',
                'BED',
                7,
                1,
                2,
                'Giường tầng 2 tầng, mỗi khoang 4 giường.'
            ),
            generateCoach(
                trainId,
                4,
                'BED_VIP2',
                'Giường VIP (Khoang 2)',
                'BED',
                7,
                1,
                1,
                'Mỗi khoang 2 giường đơn, riêng tư cao cấp.'
            ),
            generateCoach(
                trainId,
                5,
                'SEAT_SOFT',
                'Ngồi mềm (Thường)',
                'SEAT',
                16,
                4,
                1,
                'Ghế ngồi mềm thường, bố trí 2-2.'
            ),
            generateCoach(
                trainId,
                6,
                'SEAT_HARD_STD',
                'Ngồi cứng (Thường)',
                'SEAT',
                20,
                4,
                1,
                'Ghế ngồi cứng, cửa sổ mở, quạt trần.'
            ),
            generateCoach(
                trainId,
                7,
                'SEAT_HARD_AC',
                'Ngồi cứng (Điều hòa)',
                'SEAT',
                20,
                4,
                1,
                'Ghế ngồi cứng, không gian mát mẻ với điều hòa.'
            ),
        ],
    };
}

// Get seat status color
export function getSeatStatusColor(status: SeatStatus, isAdmin: boolean = false): string {
    const cursorClass = isAdmin ? 'cursor-pointer' : 'cursor-not-allowed';

    // In Admin mode, we treat LOCKED and DISABLED the same for visualization
    const effectiveStatus = isAdmin && (status === 'LOCKED' || status === 'DISABLED') ? 'LOCKED' : status;

    switch (effectiveStatus) {
        case 'AVAILABLE':
            return 'border-green-500 hover:bg-green-50 cursor-pointer';
        case 'BOOKED':
            return `border-red-500 ${cursorClass} opacity-60`;
        case 'LOCKED':
            return `border-yellow-500 bg-yellow-50 ${cursorClass}`;
        case 'DISABLED':
            return `border-gray-400 ${cursorClass} opacity-40`;
        case 'SELECTED':
            return 'border-blue-500 bg-blue-50 cursor-pointer';
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
export function getSeatStatusLabel(status: SeatStatus, isAdmin: boolean = false): string {
    if (isAdmin) {
        return ['LOCKED', 'DISABLED'].includes(status) ? 'Đã khóa/Bảo trì' : 'Hoạt động';
    }

    switch (status) {
        case 'AVAILABLE':
            return 'Còn trống';
        case 'BOOKED':
            return 'Đã đặt';
        case 'LOCKED':
            return 'Đã khóa';
        case 'DISABLED':
            return 'Vô hiệu hóa';
        case 'SELECTED':
            return 'Đã chọn';
        default:
            return status;
    }
}
