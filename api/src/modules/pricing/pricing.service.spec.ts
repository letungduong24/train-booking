import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';

describe('PricingService', () => {
    let service: PricingService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PricingService],
        }).compile();

        service = module.get<PricingService>(PricingService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('calculateSeatPrice', () => {
        const mockRoute = {
            basePricePerKm: 1000,
            stationFee: 10000, // 10k
        };

        const mockCoachTemplate = {
            coachMultiplier: 1.0,
            tierMultipliers: { "0": 1.0 },
        };

        // Distance = 100km
        // Base Price = 100 * 1000 * 1.0 * 1.0 = 100,000
        // Price Before Discount = 10,000 + 100,000 = 110,000

        const baseParams = {
            route: mockRoute,
            coachTemplate: mockCoachTemplate,
            seatTier: 0,
            fromStationDistance: 0,
            toStationDistance: 100,
        };

        it('should calculate correct price for ADULT (0% discount)', () => {
            const price = service.calculateSeatPrice({
                ...baseParams,
                discountRate: 0,
            });
            expect(price).toBe(110000);
        });

        it('should calculate correct price for STUDENT (10% discount)', () => {
            const price = service.calculateSeatPrice({
                ...baseParams,
                discountRate: 0.1,
            });
            // 110,000 * 0.9 = 99,000
            expect(price).toBe(99000);
        });

        it('should calculate correct price for ELDERLY (15% discount)', () => {
            const price = service.calculateSeatPrice({
                ...baseParams,
                discountRate: 0.15,
            });
            // 110,000 * 0.85 = 93,500
            expect(price).toBe(93500);
        });

        it('should calculate correct price for CHILD (25% discount)', () => {
            const price = service.calculateSeatPrice({
                ...baseParams,
                discountRate: 0.25,
            });
            // 110,000 * 0.75 = 82,500
            expect(price).toBe(82500);
        });

        it('should handle undefined discountRate as 0', () => {
            const price = service.calculateSeatPrice({
                ...baseParams,
                discountRate: undefined, // test default
            });
            expect(price).toBe(110000);
        });
    });
});
