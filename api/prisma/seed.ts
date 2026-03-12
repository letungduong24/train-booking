import { PrismaClient, CoachLayout, UserRole, RouteStatus } from '../src/generated/client';
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
    await prisma.ticket.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.transaction.deleteMany(); // Delete transactions first
    await prisma.passengerGroup.deleteMany();
    await prisma.seat.deleteMany();
    await prisma.coach.deleteMany();
    await prisma.train.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.coachTemplate.deleteMany();
    await prisma.routeStation.deleteMany();
    await prisma.route.deleteMany();
    await prisma.station.deleteMany();
    await prisma.refreshToken.deleteMany(); // Delete refresh tokens first
    await prisma.user.deleteMany();

    // 0. Create Passenger Groups
    console.log('Creating passenger groups...');
    const passengerGroups = await Promise.all([
        prisma.passengerGroup.create({
            data: {
                code: 'ADULT',
                name: 'Người lớn',
                discountRate: 0,
                description: 'Hành khách từ 18-59 tuổi',
                minAge: 18,
                maxAge: 59,
            },
        }),
        prisma.passengerGroup.create({
            data: {
                code: 'STUDENT',
                name: 'Sinh viên',
                discountRate: 0.1, // Giảm 10%
                description: 'Sinh viên từ 18-25 tuổi (yêu cầu thẻ sinh viên)',
                minAge: 18,
                maxAge: 25,
            },
        }),
        prisma.passengerGroup.create({
            data: {
                code: 'ELDERLY',
                name: 'Người cao tuổi',
                discountRate: 0.15, // Giảm 15%
                description: 'Hành khách từ 60 tuổi trở lên',
                minAge: 60,
                maxAge: null,
            },
        }),
        prisma.passengerGroup.create({
            data: {
                code: 'CHILD',
                name: 'Trẻ em',
                discountRate: 0.25, // Giảm 25%
                description: 'Trẻ em dưới 12 tuổi (không yêu cầu CCCD)',
                minAge: null,
                maxAge: 11,
            },
        }),
    ]);

    console.log(`Created ${passengerGroups.length} passenger groups`);

    // 1. Create 10 Stations (Real Vietnam Railway Stations)
    console.log('Creating stations...');
    const stations = await Promise.all([
        prisma.station.create({
            data: {
                name: 'Ga Hà Nội',
                latitude: 21.0245,
                longitude: 105.8412,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Vinh',
                latitude: 18.6792,
                longitude: 105.6811,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Huế',
                latitude: 16.4637,
                longitude: 107.5909,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Đà Nẵng',
                latitude: 16.0544,
                longitude: 108.2022,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Quảng Ngãi',
                latitude: 15.1214,
                longitude: 108.8044,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Nha Trang',
                latitude: 12.2388,
                longitude: 109.1967,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Phan Thiết',
                latitude: 10.9333,
                longitude: 108.1000,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Biên Hòa',
                latitude: 10.9450,
                longitude: 106.8200,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Sài Gòn',
                latitude: 10.7820,
                longitude: 106.6770,
            },
        }),
        prisma.station.create({
            data: {
                name: 'Ga Cần Thơ',
                latitude: 10.0340,
                longitude: 105.7880,
            },
        }),
    ]);

    console.log(`Created ${stations.length} stations`);

    // Route seeding has been temporarily removed because the schema was updated 
    // to separate physical RailwayLines from commercial Routes.
    // Routes will be created dynamically via the admin interface.
    console.log(` Skipped routes seeding due to schema update`);

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
                coachMultiplier: 1.0,
                tierMultipliers: { "0": 1.0 },
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
                coachMultiplier: 1.2,
                tierMultipliers: { "0": 1.0 },
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
                coachMultiplier: 0.8,
                tierMultipliers: { "0": 1.0 },
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
                coachMultiplier: 0.9,
                tierMultipliers: { "0": 1.0 },
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
                coachMultiplier: 2.0,
                tierMultipliers: { "0": 1.0 },
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
                coachMultiplier: 1.5,
                tierMultipliers: { "0": 1.2, "1": 1.0 },
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
                coachMultiplier: 1.3,
                tierMultipliers: { "0": 1.3, "1": 1.1, "2": 0.9 },
            },
        }),
    ]);

    console.log(` Created ${templates.length} coach templates`);

    // 4. Create Users
    console.log('Creating users...');
    const passwordHash = await import('bcrypt').then(m => m.hash('Password@123', 10));

    const users = await Promise.all([
        prisma.user.create({
            data: {
                email: 'admin@gmail.com',
                password: passwordHash,
                name: 'Admin User',
                role: UserRole.ADMIN,
            },
        }),
        prisma.user.create({
            data: {
                email: 'user@gmail.com',
                password: passwordHash,
                name: 'Normal User',
                role: UserRole.USER,
            },
        }),
    ]);
    console.log(`Created ${users.length} users`);


    console.log('');
    console.log('✅ Seed Summary:');
    console.log(`   - Passenger Groups: ${passengerGroups.length}`);
    console.log(`   - Stations: ${stations.length}`);
    console.log(`   - Routes: 5`);
    console.log(`   - Coach Templates: ${templates.length}`);
    console.log(`   - Users: ${users.length}`);
    console.log('');
    console.log('✅ Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(' Error during seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
