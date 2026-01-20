import { PrismaClient, CoachLayout } from '../src/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Starting seed...');

    // Clear existing data (in correct order due to foreign keys)
    console.log('Clearing existing data...');
    await prisma.seat.deleteMany();
    await prisma.coach.deleteMany();
    await prisma.train.deleteMany();
    await prisma.coachTemplate.deleteMany();
    await prisma.routeStation.deleteMany();
    await prisma.route.deleteMany();
    await prisma.station.deleteMany();

    // 1. Create 10 Stations (Real Vietnam Railway Stations)
    console.log('Creating stations...');
    const stations = await Promise.all([
        prisma.station.create({
            data: {
                name: 'Ga Hà Nội',
                latitute: 21.0245,
                longtitute: 105.8412,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Vinh',
                latitute: 18.6792,
                longtitute: 105.6811,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Huế',
                latitute: 16.4637,
                longtitute: 107.5909,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Đà Nẵng',
                latitute: 16.0544,
                longtitute: 108.2022,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Quảng Ngãi',
                latitute: 15.1214,
                longtitute: 108.8044,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Nha Trang',
                latitute: 12.2388,
                longtitute: 109.1967,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Phan Thiết',
                latitute: 10.9333,
                longtitute: 108.1000,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Biên Hòa',
                latitute: 10.9450,
                longtitute: 106.8200,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Sài Gòn',
                latitute: 10.7820,
                longtitute: 106.6770,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Cần Thơ',
                latitute: 10.0340,
                longtitute: 105.7880,
            },
        }),
    ]);

    console.log(`Created ${stations.length} stations`);

    // 2. Create 5 Routes (Real Vietnam Railway Routes)
    console.log('Creating routes...');

    // Route 1: Hà Nội - Sài Gòn (Thống Nhất)
    const route1 = await prisma.route.create({
        data: {
            name: 'SE1 - Hà Nội - Sài Gòn (Thống Nhất)',
            status: 'active',
            durationMinutes: 1920, // 32 hours
            turnaroundMinutes: 240, // 4 hours
            stations: {
                create: [
                    { stationId: stations[0].id, index: 0, distanceFromStart: 0 },
                    { stationId: stations[1].id, index: 1, distanceFromStart: 319 },
                    { stationId: stations[2].id, index: 2, distanceFromStart: 688 },
                    { stationId: stations[3].id, index: 3, distanceFromStart: 791 },
                    { stationId: stations[4].id, index: 4, distanceFromStart: 900 },
                    { stationId: stations[5].id, index: 5, distanceFromStart: 1315 },
                    { stationId: stations[7].id, index: 6, distanceFromStart: 1650 },
                    { stationId: stations[8].id, index: 7, distanceFromStart: 1726 },
                ],
            },
        },
    });

    // Route 2: Sài Gòn - Hà Nội (Chiều ngược)
    const route2 = await prisma.route.create({
        data: {
            name: 'SE2 - Sài Gòn - Hà Nội',
            status: 'active',
            durationMinutes: 1920,
            turnaroundMinutes: 240,
            stations: {
                create: [
                    { stationId: stations[8].id, index: 0, distanceFromStart: 0 },
                    { stationId: stations[7].id, index: 1, distanceFromStart: 76 },
                    { stationId: stations[5].id, index: 2, distanceFromStart: 411 },
                    { stationId: stations[4].id, index: 3, distanceFromStart: 826 },
                    { stationId: stations[3].id, index: 4, distanceFromStart: 935 },
                    { stationId: stations[2].id, index: 5, distanceFromStart: 1038 },
                    { stationId: stations[1].id, index: 6, distanceFromStart: 1407 },
                    { stationId: stations[0].id, index: 7, distanceFromStart: 1726 },
                ],
            },
        },
    });

    // Route 3: Hà Nội - Đà Nẵng (Tàu nhanh)
    const route3 = await prisma.route.create({
        data: {
            name: 'SE3 - Hà Nội - Đà Nẵng',
            status: 'active',
            durationMinutes: 780, // 13 hours
            turnaroundMinutes: 120, // 2 hours
            stations: {
                create: [
                    { stationId: stations[0].id, index: 0, distanceFromStart: 0 },
                    { stationId: stations[1].id, index: 1, distanceFromStart: 319 },
                    { stationId: stations[2].id, index: 2, distanceFromStart: 688 },
                    { stationId: stations[3].id, index: 3, distanceFromStart: 791 },
                ],
            },
        },
    });

    // Route 4: Sài Gòn - Nha Trang (Tàu du lịch)
    const route4 = await prisma.route.create({
        data: {
            name: 'SNT1 - Sài Gòn - Nha Trang',
            status: 'active',
            durationMinutes: 480, // 8 hours
            turnaroundMinutes: 90, // 1.5 hours
            stations: {
                create: [
                    { stationId: stations[8].id, index: 0, distanceFromStart: 0 },
                    { stationId: stations[6].id, index: 1, distanceFromStart: 231 },
                    { stationId: stations[5].id, index: 2, distanceFromStart: 411 },
                ],
            },
        },
    });

    // Route 5: Sài Gòn - Cần Thơ (Tàu nội địa)
    const route5 = await prisma.route.create({
        data: {
            name: 'SCT1 - Sài Gòn - Cần Thơ',
            status: 'draft',
            durationMinutes: 240, // 4 hours
            turnaroundMinutes: 60, // 1 hour
            stations: {
                create: [
                    { stationId: stations[8].id, index: 0, distanceFromStart: 0 },
                    { stationId: stations[9].id, index: 1, distanceFromStart: 169 },
                ],
            },
        },
    });

    console.log(` Created 5 routes`);

    // 3. Create 6 Coach Templates
    console.log(' Creating coach templates...');

    const templates = await Promise.all([
        // 1. Ngồi mềm (Thường)
        prisma.coachTemplate.create({
            data: {
                code: 'SEAT_SOFT',
                name: 'Ngồi mềm (Thường)',
                description: 'Ghế ngồi mềm thường, bố trí 2-2.',
                layout: CoachLayout.SEAT,
                totalRows: 16,
                totalCols: 4,
                tiers: 1,
            },
        }),

        // 2. Ngồi mềm (Điều hòa)
        prisma.coachTemplate.create({
            data: {
                code: 'SEAT_AC',
                name: 'Ngồi mềm (Điều hòa)',
                description: 'Ghế ngồi mềm có điều hòa, bố trí 2-2.',
                layout: CoachLayout.SEAT,
                totalRows: 16,
                totalCols: 4,
                tiers: 1,
            },
        }),

        // 3. Ngồi cứng (Thường)
        prisma.coachTemplate.create({
            data: {
                code: 'SEAT_HARD_STD',
                name: 'Ngồi cứng (Thường)',
                description: 'Ghế ngồi cứng, cửa sổ mở, quạt trần.',
                layout: CoachLayout.SEAT,
                totalRows: 20,
                totalCols: 4,
                tiers: 1,
            },
        }),

        // 3.5. Ngồi cứng (Điều hòa)
        prisma.coachTemplate.create({
            data: {
                code: 'SEAT_HARD_AC',
                name: 'Ngồi cứng (Điều hòa)',
                description: 'Ghế ngồi cứng, không gian mát mẻ với điều hòa.',
                layout: CoachLayout.SEAT,
                totalRows: 20,
                totalCols: 4,
                tiers: 1,
            },
        }),

        // 4. Giường VIP (Khoang 2)
        prisma.coachTemplate.create({
            data: {
                code: 'BED_VIP2',
                name: 'Giường VIP (Khoang 2)',
                description: 'Mỗi khoang 2 giường đơn, riêng tư cao cấp.',
                layout: CoachLayout.BED,
                totalRows: 7,
                totalCols: 1,
                tiers: 1,
            },
        }),

        // 5. Giường nằm (Khoang 4)
        prisma.coachTemplate.create({
            data: {
                code: 'BED_K4',
                name: 'Giường nằm (Khoang 4)',
                description: 'Giường tầng 2 tầng, mỗi khoang 4 giường.',
                layout: CoachLayout.BED,
                totalRows: 7,
                totalCols: 1,
                tiers: 2,
            },
        }),

        // 6. Giường nằm (Khoang 6)
        prisma.coachTemplate.create({
            data: {
                code: 'BED_K6',
                name: 'Giường nằm (Khoang 6)',
                description: 'Giường tầng 3 tầng, mỗi khoang 6 giường.',
                layout: CoachLayout.BED,
                totalRows: 7,
                totalCols: 1,
                tiers: 3,
            },
        }),
    ]);

    console.log(` Created ${templates.length} coach templates`);

    console.log('');
    console.log(' Seed Summary:');
    console.log(`   - Stations: ${stations.length}`);
    console.log(`   - Routes: 5`);
    console.log(`   - Coach Templates: ${templates.length}`);
    console.log('');
    console.log(' Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(' Error during seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
