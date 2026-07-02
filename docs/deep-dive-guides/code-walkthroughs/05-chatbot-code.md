# 05 - Chatbot Tool Calling Code Walkthrough

## Mục tiêu

Hiểu chatbot Railflow bằng code thật: normalize tiếng Việt, direct search trước LLM, parse ngày, resolve ga trong câu, tạo tool, và bảo vệ các tool cần đăng nhập.

File chính:

- `api/src/modules/chatbot/chatbot.service.ts`
- `api/src/modules/chatbot/chatbot.tools.ts`
- `api/src/modules/chatbot/chatbot.prompt.ts`
- `web/features/chatbot/components/chat-tool-part.tsx`

## 1. Normalize tiếng Việt

### Code

```ts
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
```

### Giải thích

Hàm này biến:

```text
"Hà Nội" -> "ha noi"
"Đà Nẵng" -> "da nang"
"Ninh-Bình!!!" -> "ninh binh"
```

Lý do:

- người dùng có thể gõ không dấu;
- chatbot cần match tên ga;
- regex intent dễ viết hơn với text đã normalize.

## 2. Nhận diện câu hỏi tìm chuyến

### Code

```ts
function shouldRequireTrainSearchToolCall(messages: UIMessage[]) {
  const text = normalizeVietnameseSearch(getLatestUserText(messages));
  if (!text) return false;

  const bookingOnlyText = text.replace(/^(cho toi|cho minh|toi|minh|em|anh|chi)\s+/, '');
  if (['dat ve', 'muon dat ve', 'can dat ve'].includes(bookingOnlyText)) return false;

  const isAccountIntent = /\b(so du|vi|ve da dat|lich su|hoan tien|huy ve|loai hanh khach|giam gia)\b/.test(text);
  if (isAccountIntent) return false;

  const hasTripKeyword = /\b(dat ve|tim|kiem|chuyen tau|tau|ga|khoi hanh|lich trinh)\b/.test(text);
  const hasDate = /\b(hom nay|ngay mai|ngay kia|hom qua)\b|\b\d{1,2}[/-]\d{1,2}\b|\b\d{4}-\d{2}-\d{2}\b/.test(
    text,
  );
  const hasRouteConnector = /\b(tu|den|di|toi|sang)\b/.test(text);
  const hasLocationLikePhrase = text.split(' ').length >= 5;

  return (hasTripKeyword && (hasDate || hasRouteConnector)) || (hasDate && hasLocationLikePhrase);
}
```

### Giải thích nghiệp vụ

Hàm này quyết định có nên ưu tiên direct search không.

Nếu user chỉ nói:

```text
"đặt vé"
```

thì chưa đủ thông tin, chatbot nên hỏi lại.

Nếu user hỏi:

```text
"tìm tàu từ Hà Nội đến Ninh Bình ngày mai"
```

thì đủ dấu hiệu tìm chuyến. Backend không cần đợi LLM tự gọi tool, mà tự parse và search.

Đoạn `isAccountIntent` để tránh nhầm câu như:

```text
"xem vé đã đặt hôm nay"
```

thành tìm chuyến.

## 3. Parse ngày

### Code

```ts
function parseRequestedDate(text: string, today: string) {
  const normalizedText = normalizeVietnameseSearch(text);
  if (/\bngay kia\b/.test(normalizedText)) return addDaysToDateString(today, 2);
  if (/\bngay mai\b/.test(normalizedText)) return addDaysToDateString(today, 1);
  if (/\bhom nay\b/.test(normalizedText)) return today;

  const isoMatch = normalizedText.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const shortDateMatch = normalizedText.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (!shortDateMatch) return null;

  const [, day, month, rawYear] = shortDateMatch;
  const currentYear = today.slice(0, 4);
  const year = rawYear ? (rawYear.length === 2 ? `20${rawYear}` : rawYear) : currentYear;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
```

### Giải thích

Hỗ trợ nhiều cách nói:

- hôm nay;
- ngày mai;
- ngày kia;
- `2026-07-01`;
- `01/07`;
- `01/07/2026`.

Output thống nhất:

```text
YYYY-MM-DD
```

Đây là format backend search trip dùng.

## 4. Direct search chạy trước LLM

### Code

```ts
async createChatResponse(req: Request, messages: UIMessage[]) {
  const userId = await this.authService.getUserIdFromRequest(req);
  const today = formatDateInVietnam(new Date());
  const directTrainSearchResponse = await this.createDirectTrainSearchResponse(messages, today);
  if (directTrainSearchResponse) return directTrainSearchResponse;

  const providerOptions = this.getProviderOptions(CHATBOT_MODEL);
  const tools = createChatbotTools({
    stationService: this.stationService,
    tripService: this.tripService,
    prisma: this.prisma,
    userId,
  });

  const result = streamText({
    model: this.getGroq()(CHATBOT_MODEL),
    ...(providerOptions ? { providerOptions } : {}),
    stopWhen: [
      stepCountIs(3),
      ({ steps }) =>
        steps.at(-1)?.toolCalls?.some((toolCall) =>
          CHATBOT_DATA_TOOL_NAMES.includes(toolCall.toolName as any),
        ) ?? false,
    ],
    system: buildChatbotSystemPrompt({ today, userId }),
    messages: await convertToModelMessages(messages),
    tools,
  });

  return result.toUIMessageStreamResponse();
}
```

### Giải thích

Thứ tự xử lý:

1. Lấy userId từ request nếu có.
2. Tính ngày hôm nay theo Việt Nam.
3. Thử direct search.
4. Nếu direct search không đủ dữ liệu, mới gọi Groq model.

Điểm hay:

- câu hỏi rõ ràng được xử lý bằng code nghiệp vụ;
- giảm hallucination;
- nhanh hơn;
- debug dễ hơn.

## 5. Tạo direct train search response

### Code

```ts
private async createDirectTrainSearchResponse(messages: UIMessage[], today: string) {
  if (!shouldRequireTrainSearchToolCall(messages)) return null;

  const text = getLatestUserText(messages);
  const date = parseRequestedDate(text, today);
  const stationPair = await this.resolveStationPairFromText(text);
  if (!date || !stationPair) return null;

  const [fromStation, toStation] = stationPair;
  const input = {
    fromStationId: fromStation.id,
    toStationId: toStation.id,
    date,
  };
  const output = await searchTrainTripsForChatbot(
    this.tripService,
    this.prisma,
    input.fromStationId,
    input.toStationId,
    input.date,
  );
```

### Giải thích nghiệp vụ

Direct search cần đủ:

- ngày;
- ga đi;
- ga đến.

Nếu thiếu một trong ba, trả `null` để LLM hỏi lại hoặc dùng tool khác.

Khi đủ, backend gọi `searchTrainTripsForChatbot`, tức là dùng service thật, không bịa lịch tàu.

## 6. Search trip tool dùng service thật

### Code

```ts
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
```

### Giải thích

Tool không query trip tùy tiện. Nó gọi:

```text
TripService.searchTrips
```

Đây là cùng logic search chuyến của hệ thống. Nhờ đó chatbot trả kết quả đồng bộ với trang đặt vé.

## 7. Tool cần đăng nhập

### Code

```ts
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
      ...
    });
```

### Giải thích

Tool xem booking phải có `userId`. Nếu không:

```text
{ error: 'Người dùng chưa đăng nhập' }
```

Nó không bao giờ trả booking của người khác. Đây là điểm bảo mật khi kết hợp AI với dữ liệu cá nhân.

## Tự kiểm tra

- Vì sao direct search chạy trước LLM?
- `normalizeVietnameseSearch` xử lý chữ "đ" thế nào?
- Nếu user hỏi "ví của tôi còn bao nhiêu", direct search có chạy không?
- Tool `getMyBookings` chặn user chưa login thế nào?
- Vì sao chatbot không được tự trả lịch tàu bằng text model?

