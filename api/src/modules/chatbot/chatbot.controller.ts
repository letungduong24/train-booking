import { Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createGroq, type GroqLanguageModelOptions } from '@ai-sdk/groq';
import { streamText, convertToModelMessages, type UIMessage, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { StationService } from '../station/station.service';
import { TripService } from '../trip/trip.service';
import { FilterStationDto } from '../station/dto/filter-station.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

@Controller('api/chat')
export class ChatbotController {
  constructor(
    private readonly stationService: StationService,
    private readonly tripService: TripService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) { }

  @Post()
  async handleChat(@Req() req: Request, @Res() res: Response) {
    const { messages }: { messages: UIMessage[] } = req.body;

    // Delegate auth to AuthService — clean, centralized, reuses existing logic
    const userId = await this.authService.getUserIdFromRequest(req);

    const today = new Date().toISOString().split('T')[0];

    const result = streamText({
      model: groq('qwen/qwen3-32b'),
      providerOptions: {
        groq: {
          reasoningFormat: 'parsed',
        } satisfies GroqLanguageModelOptions,
      },
      // Stop immediately after a data-rendering tool runs — prevents a new reasoning cycle.
      // Docs: "stopWhen is evaluated when the last step contains tool results" = before next step starts.
      stopWhen: [
        stepCountIs(3),
        ({ steps }) => {
          const DATA_TOOLS = ['getMyBookings', 'getWalletBalance', 'getPassengerGroups', 'getRoutes', 'searchTrainTrips'];
          return steps.at(-1)?.toolCalls?.some(tc => DATA_TOOLS.includes(tc.toolName)) ?? false;
        },
      ],
      system: `Bạn là trợ lý ảo thân thiện của hệ thống đặt vé tàu Railflow tại Việt Nam.
Ngày hôm nay: ${today}.
${userId ? `Người dùng đã đăng nhập (userId: ${userId}).` : 'Người dùng chưa đăng nhập.'}

Hướng dẫn sử dụng tools:
- Tìm chuyến tàu: dùng findStationByName để lấy ID ga → rồi searchTrainTrips.
- Xem vé đã đặt: dùng getMyBookings (chỉ khi đã đăng nhập).
- Xem số dư ví: dùng getWalletBalance (chỉ khi đã đăng nhập).
- Hỏi về loại hành khách / giảm giá: dùng getPassengerGroups.
- Hỏi về tuyến đường: dùng getRoutes.
- Nếu chưa đăng nhập mà hỏi về vé/ví, hãy thông báo cần đăng nhập.
- Nếu thiếu thông tin, hỏi lại người dùng.
Trả lời súc tích bằng tiếng Việt. Không dùng markdown (**, *, #).`,
      messages: await convertToModelMessages(messages),
      tools: {
        // ─── EXISTING TOOLS ───────────────────────────────────────────────────
        findStationByName: tool({
          description: 'Tìm kiếm ga tàu theo tên (hỗ trợ tìm kiếm gần đúng).',
          inputSchema: z.object({
            stationName: z.string().describe('Tên ga cần tìm, ví dụ: "Hà Nội", "Đà Nẵng"'),
          }),
          execute: async ({ stationName }) => {
            const result = await this.stationService.findAll(
              Object.assign(new FilterStationDto(), { search: stationName, page: 1, limit: 5 }),
            );
            return result.data.map((s) => ({ id: s.id, name: s.name }));
          },
        }),

        searchTrainTrips: tool({
          description: 'Tìm kiếm các chuyến tàu từ ga đi đến ga đến theo ngày.',
          inputSchema: z.object({
            fromStationId: z.string().describe('ID của ga đi'),
            toStationId: z.string().describe('ID của ga đến'),
            date: z.string().describe('Ngày khởi hành YYYY-MM-DD'),
          }),
          execute: async ({ fromStationId, toStationId, date }) => {
            const trips = await this.tripService.searchTrips(fromStationId, toStationId, date);
            return {
              fromStationId,
              toStationId,
              date,
              trips: trips.map((trip) => {
                const fromRS = trip.route.stations.find((rs: any) => rs.stationId === fromStationId);
                const toRS = trip.route.stations.find((rs: any) => rs.stationId === toStationId);
                const totalSeats = trip.train.coaches.reduce(
                  (sum: number, coach: any) => sum + (coach._count?.seats ?? 0), 0,
                );
                return {
                  tripId: trip.id,
                  routeName: trip.route.name,
                  trainCode: trip.train.code,
                  departureTime: trip.departureTime,
                  fromStation: fromRS?.station?.name ?? '',
                  toStation: toRS?.station?.name ?? '',
                  fromStationId,
                  toStationId,
                  durationFromStart: fromRS?.durationFromStart ?? 0,
                  durationToEnd: toRS?.durationFromStart ?? 0,
                  totalSeats,
                  status: trip.status,
                };
              }),
            };
          },
        }),

        // ─── NEW TOOLS ────────────────────────────────────────────────────────
        getMyBookings: tool({
          description: 'Xem danh sách vé / đơn đặt chỗ của người dùng hiện tại. Chỉ dùng khi người dùng đã đăng nhập.',
          inputSchema: z.object({
            status: z.enum(['PENDING', 'PAID', 'CANCELLED', 'PAYMENT_FAILED']).optional()
              .describe('Lọc theo trạng thái đơn hàng (tuỳ chọn)'),
          }),
          execute: async ({ status }) => {
            if (!userId) return { error: 'Người dùng chưa đăng nhập' };
            const bookings = await this.prisma.booking.findMany({
              where: {
                userId,
                ...(status && { status }),
              },
              include: {
                trip: {
                  include: {
                    route: { select: { name: true } },
                    train: { select: { code: true } },
                  },
                },
                tickets: {
                  take: 1,
                  include: { seat: true },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            });

            return {
              bookings: bookings.map((b) => ({
                bookingCode: b.code,
                status: b.status,
                totalPrice: b.totalPrice,
                createdAt: b.createdAt,
                routeName: b.trip?.route?.name ?? '',
                trainCode: b.trip?.train?.code ?? '',
                ticketCount: b.tickets.length,
              })),
            };
          },
        }),

        getWalletBalance: tool({
          description: 'Xem số dư ví và lịch sử giao dịch gần nhất của người dùng. Chỉ dùng khi đã đăng nhập.',
          inputSchema: z.object({}),
          execute: async () => {
            if (!userId) return { error: 'Người dùng chưa đăng nhập' };
            const user = await this.prisma.user.findUnique({
              where: { id: userId },
              select: { balance: true },
            });
            const transactions = await this.prisma.transaction.findMany({
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
            const groups = await this.prisma.passengerGroup.findMany({
              orderBy: { discountRate: 'asc' },
            });
            return groups.map((g) => ({
              id: g.id,
              name: g.name,
              discountRate: g.discountRate,
              discountPercent: Math.round(g.discountRate * 100),
            }));
          },
        }),

        getRoutes: tool({
          description: 'Tìm kiếm tuyến đường tàu theo tên hoặc ga. Dùng khi người dùng hỏi về các tuyến đường có sẵn.',
          inputSchema: z.object({
            search: z.string().optional().describe('Từ khoá tìm kiếm tuyến đường hoặc tên ga'),
          }),
          execute: async ({ search }) => {
            const routes = await this.prisma.route.findMany({
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
            return routes.map((r) => ({
              id: r.id,
              name: r.name,
              stations: r.stations.map((s) => s.station.name),
            }));
          },
        }),
      },
    });

    const response = result.toUIMessageStreamResponse();

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      const reader = response.body.getReader();
      const read = async () => {
        const { done, value } = await reader.read();
        if (done) { res.end(); return; }
        res.write(value);
        read();
      };
      read();
    } else {
      res.end();
    }
  }
}
