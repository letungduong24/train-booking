import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import dayjs from 'dayjs';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string) {
    const now = new Date();

    const [
      upcomingTrips,
      pendingBookings,
      recentTransactions,
      userStats,
      totalBookings,
      pendingCount,
      activeTrips,
    ] = await Promise.all([
      // 1. Up to 3 upcoming PAID trips
      this.prisma.booking.findMany({
        where: {
          userId,
          status: 'PAID',
          trip: {
            departureTime: { gt: now },
            status: 'SCHEDULED', // Only scheduled ones for "Upcoming"
          },
        },
        take: 3,
        include: {
          trip: {
            include: {
              route: true,
              train: true,
            },
          },
          tickets: true,
        },
        orderBy: {
          trip: {
            departureTime: 'asc',
          },
        },
      }),

      // 2. Up to 3 PENDING bookings
      this.prisma.booking.findMany({
        where: {
          userId,
          status: 'PENDING',
        },
        take: 3,
        include: {
          trip: {
            include: {
              route: true,
              train: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),

      // 3. Up to 5 recent transactions
      this.prisma.transaction.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),

      // 4. User stats (balance)
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      }),

      // 5. Total bookings count
      this.prisma.booking.count({
        where: { userId },
      }),

      // 6. Pending bookings count
      this.prisma.booking.count({
        where: { userId, status: 'PENDING' },
      }),

      // 7. Up to 3 active trips (IN_PROGRESS)
      this.prisma.booking.findMany({
        where: {
          userId,
          status: 'PAID',
          trip: {
            status: 'IN_PROGRESS',
          },
        },
        take: 3,
        include: {
          trip: {
            include: {
              route: true,
              train: true,
            },
          },
        },
      }),
    ]);

    return {
      upcomingTrips,
      pendingBookings,
      recentTransactions,
      activeTrips,
      stats: {
        balance: userStats?.balance || 0,
        totalBookings,
        pendingCount,
        activeCount: activeTrips.length,
      },
    };
  }
}
