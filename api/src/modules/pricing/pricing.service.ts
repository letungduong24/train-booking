import { Injectable } from '@nestjs/common';

export interface PriceCalculationParams {
    route: {
        basePricePerKm: number;
        stationFee: number;
    };
    coachTemplate: {
        coachMultiplier: number;
        tierMultipliers: any; // Object JSON dạng {"0": 1.0, "1": 1.2, "2": 0.9}
    };
    seatTier: number;
    fromStationDistance: number; // Khoảng cách từ ga đi
    toStationDistance: number; // Khoảng cách từ ga đến
    discountRate?: number; // Tỉ lệ giảm giá theo đối tượng (0.1 = giảm 10%, 0.15 = giảm 15%)
}

@Injectable()
export class PricingService {
    /**
     * Tính giá vé dựa trên tuyến đường, toa tàu, tầng ghế, khoảng cách và giảm giá đối tượng
     * Công thức: giá vé = (phí ga + (khoảng cách * đơn giá mỗi km * hệ số toa * hệ số tầng)) * (1 - tỉ lệ giảm giá)
     */
    calculateSeatPrice(params: PriceCalculationParams): number {
        const { route, coachTemplate, seatTier, fromStationDistance, toStationDistance, discountRate = 0 } = params;

        // Tính khoảng cách giữa 2 ga (giá trị tuyệt đối)
        const distance = Math.abs(toStationDistance - fromStationDistance);

        // Lấy hệ số tầng từ JSON (mặc định là 1.0 nếu không tìm thấy)
        const tierMultipliers = coachTemplate.tierMultipliers || {};
        const tierMultiplier = tierMultipliers[seatTier.toString()] || 1.0;

        // Tính giá cơ bản theo công thức
        const basePrice =
            distance * route.basePricePerKm * coachTemplate.coachMultiplier * tierMultiplier;
        const priceBeforeDiscount = route.stationFee + basePrice;

        // Áp dụng giảm giá theo đối tượng
        const finalPrice = priceBeforeDiscount * (1 - discountRate);

        // Làm tròn số
        return Math.round(finalPrice);
    }
}
