import { Injectable } from '@nestjs/common';

export interface PriceCalculationParams {
    route: {
        basePricePerKm: number;
        stationFee: number;
    };
    coachTemplate: {
        coachMultiplier: number;
        tierMultipliers: any; // JSON object like {"0": 1.0, "1": 1.2, "2": 0.9}
    };
    seatTier: number;
    fromStationDistance: number; // distanceFromStart of from station
    toStationDistance: number; // distanceFromStart of to station
}

@Injectable()
export class PricingService {
    /**
     * Calculate ticket price based on route, coach, seat tier, and distance
     * Formula: ticketPrice = stationFee + (distance * basePricePerKm * coachMultiplier * tierMultiplier)
     */
    calculateSeatPrice(params: PriceCalculationParams): number {
        const { route, coachTemplate, seatTier, fromStationDistance, toStationDistance } = params;

        // Calculate distance between stations (absolute difference)
        const distance = Math.abs(toStationDistance - fromStationDistance);

        // Get tier multiplier from JSON (default to 1.0 if not found)
        const tierMultipliers = coachTemplate.tierMultipliers || {};
        const tierMultiplier = tierMultipliers[seatTier.toString()] || 1.0;

        // Calculate price using the formula
        const basePrice =
            distance * route.basePricePerKm * coachTemplate.coachMultiplier * tierMultiplier;
        const totalPrice = route.stationFee + basePrice;

        // Round to nearest integer
        return Math.round(totalPrice);
    }
}
