import { tool } from 'ai';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { FilterStationDto } from '../station/dto/filter-station.dto';
import { StationService } from '../station/station.service';
import { TripService } from '../trip/trip.service';

interface CreateChatbotToolsOptions {
  stationService: StationService;
  tripService: TripService;
  prisma: PrismaService;
  userId: string | null;
}

interface ChatbotStationMatch {
  id: string;
  name: string;
}

const BOOKING_STATUS_VALUES = ['PENDING', 'PAID', 'CANCELLED', 'PAYMENT_FAILED'] as const;

function normalizeBookingStatus(status?: string | null) {
  const normalizedStatus = normalizeVietnameseSearch(status ?? '').replace(/\s+/g, '_').toUpperCase();
  if (!normalizedStatus || ['ALL', 'TAT_CA', 'TOAN_BO'].includes(normalizedStatus)) return undefined;
  if (BOOKING_STATUS_VALUES.includes(normalizedStatus as (typeof BOOKING_STATUS_VALUES)[number])) {
    return normalizedStatus as (typeof BOOKING_STATUS_VALUES)[number];
  }

  const text = normalizeVietnameseSearch(status ?? '');
  if (/\b(da thanh toan|thanh toan|paid)\b/.test(text)) return 'PAID';
  if (/\b(cho thanh toan|dang cho|pending)\b/.test(text)) return 'PENDING';
  if (/\b(huy|da huy|cancelled|canceled)\b/.test(text)) return 'CANCELLED';
  if (/\b(thanh toan loi|that bai|failed|payment failed)\b/.test(text)) return 'PAYMENT_FAILED';

  return undefined;
}

export function normalizeVietnameseSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreStationName(stationName: string, search: string) {
  const normalizedName = normalizeVietnameseSearch(stationName);
  const normalizedSearch = normalizeVietnameseSearch(search);

  if (!normalizedName || !normalizedSearch) return null;
  if (normalizedName === normalizedSearch) return 0;
  if (normalizedName.startsWith(normalizedSearch)) return 1;
  if (normalizedName.includes(normalizedSearch)) return 2;

  const stationTokens = normalizedName.split(' ');
  const searchTokens = normalizedSearch.split(' ');
  if (searchTokens.every((token) => normalizedName.includes(token))) return 3;

  const matchedStationTokens = stationTokens.filter((token) => searchTokens.includes(token)).length;
  if (stationTokens.length >= 2 && matchedStationTokens === stationTokens.length) {
    return 4 + searchTokens.length - matchedStationTokens;
  }

  return null;
}

export async function findStationsByName(
  stationService: StationService,
  prisma: PrismaService,
  stationName: string,
) {
  const [directResult, stations] = await Promise.all([
    stationService
      .findAll(Object.assign(new FilterStationDto(), { search: stationName, page: 1, limit: 5 }))
      .catch(() => ({ data: [] as ChatbotStationMatch[] })),
    prisma.station.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const matchedStations = new Map<string, { station: ChatbotStationMatch; score: number }>();
  const addStation = (station: ChatbotStationMatch, score: number) => {
    const current = matchedStations.get(station.id);
    if (!current || score < current.score) {
      matchedStations.set(station.id, { station, score });
    }
  };

  directResult.data.forEach((station, index) => addStation(station, index));
  stations.forEach((station) => {
    const score = scoreStationName(station.name, stationName);
    if (score !== null) addStation(station, score + 10);
  });

  return Array.from(matchedStations.values())
    .sort((left, right) => left.score - right.score || left.station.name.length - right.station.name.length)
    .slice(0, 5)
    .map(({ station }) => ({ id: station.id, name: station.name }));
}

export async function searchTrainTripsForChatbot(
  tripService: TripService,
  prisma: PrismaService,
  fromStationId: string,
  toStationId: string,
  date: string,
) {
  const [trips, requestedFromStation, requestedToStation] = await Promise.all([
    tripService.searchTrips(fromStationId, toStationId, date),
    prisma.station.findUnique({ where: { id: fromStationId }, select: { name: true } }),
    prisma.station.findUnique({ where: { id: toStationId }, select: { name: true } }),
  ]);
  const fromStationKey = normalizeVietnameseSearch(requestedFromStation?.name ?? '');
  const toStationKey = normalizeVietnameseSearch(requestedToStation?.name ?? '');
  const resolveRouteStation = (routeStations: any[], stationId: string, stationKey: string) =>
    routeStations.find((routeStation) => routeStation.stationId === stationId) ??
    routeStations.find(
      (routeStation) =>
        stationKey && normalizeVietnameseSearch(routeStation.station?.name ?? '') === stationKey,
    );

  return {
    fromStationId,
    toStationId,
    date,
    trips: trips.map((trip) => {
      const fromRouteStation = resolveRouteStation(trip.route.stations, fromStationId, fromStationKey);
      const toRouteStation = resolveRouteStation(trip.route.stations, toStationId, toStationKey);
      const totalSeats = trip.train.coaches.reduce(
        (sum: number, coach: any) => sum + (coach._count?.seats ?? 0),
        0,
      );

      return {
        tripId: trip.id,
        routeName: trip.route.name,
        trainCode: trip.train.code,
        departureTime: trip.departureTime,
        endTime: trip.endTime,
        fromStation: fromRouteStation?.station?.name ?? '',
        toStation: toRouteStation?.station?.name ?? '',
        fromStationId: fromRouteStation?.stationId ?? fromStationId,
        toStationId: toRouteStation?.stationId ?? toStationId,
        durationFromStart: fromRouteStation?.durationFromStart ?? 0,
        durationToEnd: toRouteStation?.durationFromStart ?? 0,
        totalSeats,
        status: trip.status,
      };
    }),
  };
}

export function createChatbotTools({
  stationService,
  tripService,
  prisma,
  userId,
}: CreateChatbotToolsOptions) {
  return {
    findStationByName: tool({
      description: 'Tìm kiếm ga tàu theo tên, hỗ trợ không dấu/sai dấu và cụm có nhiều tên ga.',
      inputSchema: z.object({
        stationName: z.string().describe('Tên ga cần tìm, ví dụ: "Hà Nội", "ninh binh", "phúc yên ninh bình"'),
      }),
      execute: async ({ stationName }) => findStationsByName(stationService, prisma, stationName),
    }),

    searchTrainTrips: tool({
      description: 'Tìm kiếm các chuyến tàu từ ga đi đến ga đến theo ngày.',
      inputSchema: z.object({
        fromStationId: z.string().describe('ID của ga đi'),
        toStationId: z.string().describe('ID của ga đến'),
        date: z.string().describe('Ngày khởi hành YYYY-MM-DD'),
      }),
      execute: async ({ fromStationId, toStationId, date }) => {
        return searchTrainTripsForChatbot(tripService, prisma, fromStationId, toStationId, date);
      },
    }),

    getMyBookings: tool({
      description: 'Xem danh sách vé / đơn đặt chỗ của người dùng hiện tại. Chỉ dùng khi người dùng đã đăng nhập.',
      inputSchema: z.object({
        status: z
          .string()
          .nullable()
          .optional()
          .describe('Trạng thái đơn hàng muốn lọc, ví dụ: PAID, PENDING, CANCELLED. Bỏ trống để xem tất cả.'),
      }),
      execute: async ({ status }) => {
        if (!userId) return { error: 'Người dùng chưa đăng nhập' };
        const bookingStatus = normalizeBookingStatus(status);

        const bookings = await prisma.booking.findMany({
          where: {
            userId,
            ...(bookingStatus && { status: bookingStatus }),
          },
          include: {
            trip: {
              include: {
                route: { select: { name: true } },
                train: { select: { code: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        return {
          bookings: bookings.map((booking) => ({
            bookingCode: booking.code,
            status: booking.status,
            totalPrice: booking.totalPrice,
            createdAt: booking.createdAt,
            routeName: booking.trip?.route?.name ?? '',
            trainCode: booking.trip?.train?.code ?? '',
          })),
        };
      },
    }),

    getWalletBalance: tool({
      description: 'Xem số dư ví và lịch sử giao dịch gần nhất của người dùng. Chỉ dùng khi đã đăng nhập.',
      inputSchema: z.object({}),
      execute: async () => {
        if (!userId) return { error: 'Người dùng chưa đăng nhập' };

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { balance: true },
        });
        const transactions = await prisma.transaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            amount: true,
            type: true,
            status: true,
            description: true,
            createdAt: true,
          },
        });

        return {
          balance: user?.balance ?? 0,
          recentTransactions: transactions,
        };
      },
    }),

    getPassengerGroups: tool({
      description: 'Lấy danh sách các loại hành khách và mức giảm giá tương ứng (người lớn, trẻ em, sinh viên, v.v.).',
      inputSchema: z.object({}),
      execute: async () => {
        const groups = await prisma.passengerGroup.findMany({
          orderBy: { discountRate: 'asc' },
        });

        return groups.map((group) => ({
          id: group.id,
          name: group.name,
          discountRate: group.discountRate,
          discountPercent: Math.round(group.discountRate * 100),
        }));
      },
    }),

    getRoutes: tool({
      description: 'Tìm kiếm tuyến đường tàu theo tên hoặc ga. Dùng khi người dùng hỏi về các tuyến đường có sẵn.',
      inputSchema: z.object({
        search: z.string().optional().describe('Từ khoá tìm kiếm tuyến đường hoặc tên ga'),
      }),
      execute: async ({ search }) => {
        const routes = await prisma.route.findMany({
          where: search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  {
                    stations: {
                      some: {
                        station: { name: { contains: search, mode: 'insensitive' } },
                      },
                    },
                  },
                ],
              }
            : {},
          include: {
            stations: {
              include: { station: { select: { name: true } } },
              orderBy: { index: 'asc' },
            },
          },
          take: 5,
        });

        return routes.map((route) => ({
          id: route.id,
          name: route.name,
          stations: route.stations.map((routeStation) => routeStation.station.name),
        }));
      },
    }),
  };
}
