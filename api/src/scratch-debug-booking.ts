import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const bookingCode = 'RAILFLOW-20260521-9003';
  const booking = await prisma.booking.findUnique({
    where: { code: bookingCode },
    include: {
      trip: {
        include: {
          route: {
            include: {
              stations: {
                include: { station: true },
              },
            },
          },
          train: true,
        },
      },
      tickets: {
        include: {
          seat: {
            include: {
              coach: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    console.error('Booking not found:', bookingCode);
    return;
  }

  console.log('--- BOOKING ---');
  console.log('Code:', booking.code);
  console.log('Status:', booking.status);
  console.log('Trip ID:', booking.tripId);
  console.log('Trip Status:', booking.trip.status);
  console.log('Trip Departure Time:', booking.trip.departureTime);
  console.log('Trip End Time:', booking.trip.endTime);
  console.log('Trip Train Code:', booking.trip.train.code);
  console.log('Trip Train AverageSpeedKmH:', booking.trip.train.averageSpeedKmH);

  console.log('\n--- ROUTE STATIONS ---');
  booking.trip.route.stations.forEach((rs) => {
    console.log(`Index ${rs.index}: Station Name: ${rs.station.name}, Distance: ${rs.distanceFromStart} km, Duration: ${rs.durationFromStart} mins`);
  });

  console.log('\n--- TICKETS ---');
  booking.tickets.forEach((t) => {
    console.log(`Ticket ID: ${t.id}, Passenger: ${t.passengerName}, FromIndex: ${t.fromStationIndex}, ToIndex: ${t.toStationIndex}, Seat: ${t.seat?.name} (Coach: ${t.seat?.coach?.name})`);
  });
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
