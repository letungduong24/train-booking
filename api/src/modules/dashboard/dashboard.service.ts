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

  async getAdminOverview() {
    const now = new Date();
    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();
    const sixtyDaysAgo = dayjs().subtract(60, 'day').toDate();

    const [
      totalRevenue,
      totalUsers,
      totalBookings,
      bookingStatusBreakdown,
      activeTrains,
      scheduledTripsToday,
      recentBookings,
      revenueTimeSeries,
      // Metrics for trend calculation
      prevPeriodRevenue,
      currentPeriodUsers,
      prevPeriodUsers,
      currentPeriodBookings,
      prevPeriodBookings,
    ] = await Promise.all([
      // 1. Total Revenue
      this.prisma.booking.aggregate({
        where: { status: 'PAID' },
        _sum: { totalPrice: true },
      }),

      // 2. Total Users
      this.prisma.user.count(),

      // 3. Total Bookings
      this.prisma.booking.count(),

      // 4. Booking Status Breakdown
      this.prisma.booking.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),

      // 5. Active Trains
      this.prisma.train.count({
        where: { status: 'ACTIVE' },
      }),

      // 6. Scheduled Trips Today
      this.prisma.trip.count({
        where: {
          departureTime: {
            gte: dayjs().startOf('day').toDate(),
            lte: dayjs().endOf('day').toDate(),
          },
        },
      }),

      // 7. Recent 5 bookings
      this.prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true },
          },
          trip: {
            include: { route: true },
          },
        },
      }),

      // 8. Revenue & Booking Time Series (Last 30 days)
      this.prisma.booking.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: 'PAID',
        },
        select: {
          createdAt: true,
          totalPrice: true,
        },
      }),

      // --- Trend Calculations ---
      // Revenue prev 30-60 days
      this.prisma.booking.aggregate({
        where: {
          status: 'PAID',
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
        _sum: { totalPrice: true },
      }),
      // Users current 30 days
      this.prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      // Users prev 30-60 days
      this.prisma.user.count({
        where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
      // Bookings current 30 days
      this.prisma.booking.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      // Bookings prev 30-60 days
      this.prisma.booking.count({
        where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
    ]);

    // Format time series data
    const dailyData: Record<string, { date: string; revenue: number; bookings: number }> = {};
    for (let i = 0; i < 30; i++) {
        const dateStr = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        dailyData[dateStr] = { date: dateStr, revenue: 0, bookings: 0 };
    }

    revenueTimeSeries.forEach((b) => {
      const dateStr = dayjs(b.createdAt).format('YYYY-MM-DD');
      if (dailyData[dateStr]) {
        dailyData[dateStr].revenue += b.totalPrice;
        dailyData[dateStr].bookings += 1;
      }
    });

    const chartData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate Trend Percentages
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat(((current - previous) / previous * 100).toFixed(1));
    };

    const currentPeriodRevenue = revenueTimeSeries.reduce((acc, b) => acc + b.totalPrice, 0);
    const revenueTrend = calculateTrend(currentPeriodRevenue, prevPeriodRevenue._sum.totalPrice || 0);
    const usersTrend = calculateTrend(currentPeriodUsers, prevPeriodUsers);
    const bookingsTrend = calculateTrend(currentPeriodBookings, prevPeriodBookings);

    return {
      stats: {
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        totalUsers,
        totalBookings,
        activeTrains,
        scheduledTripsToday,
        revenueTrend,
        usersTrend,
        bookingsTrend,
        statusBreakdown: bookingStatusBreakdown.reduce((acc, curr) => {
          acc[curr.status] = curr._count._all;
          return acc;
        }, {} as Record<string, number>),
      },
      recentBookings,
      chartData,
    };
  }
}
