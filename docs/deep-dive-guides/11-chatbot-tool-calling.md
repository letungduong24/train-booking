# 11 - Chatbot Tool Calling

## Mục tiêu học

Hiểu cách chatbot Railflow xử lý tiếng Việt, khi nào dùng direct search, khi nào dùng LLM tool calling, tool nào truy cập dữ liệu thật, và cách frontend render kết quả.

File cần đọc:

- `api/src/modules/chatbot/chatbot.service.ts`
- `api/src/modules/chatbot/chatbot.tools.ts`
- `api/src/modules/chatbot/chatbot.prompt.ts`
- `api/src/modules/chatbot/chatbot.controller.ts`
- `api/src/modules/chatbot/chatbot.schemas.ts`
- `api/src/modules/chatbot/chatbot.constants.ts`
- `web/components/chatbot/global-chatbot.tsx`
- `web/features/chatbot/lib/chatbot-api.ts`
- `web/features/chatbot/components/chat-tool-part.tsx`
- `web/features/chatbot/components/trip-search-result.tsx`
- `web/features/chatbot/components/booking-history-result.tsx`

## Mục tiêu chatbot trong project

Chatbot không phải phần trang trí. Nó hỗ trợ:

- tìm chuyến bằng ngôn ngữ tự nhiên;
- tìm ga;
- xem lịch sử đặt vé;
- xem số dư ví;
- xem nhóm hành khách;
- tra cứu route.

Nguyên tắc:

- dữ liệu lịch tàu/vé/ví phải lấy từ service thật;
- không để model tự bịa dữ liệu hệ thống.

## Backend controller

Controller nhận request chat, validate bằng schema rồi gọi:

```text
ChatbotService.createChatResponse(req, messages)
```

Schema đảm bảo:

- message đúng format UIMessage;
- số lượng message không vượt giới hạn;
- role/content hợp lệ.

## Chuẩn hóa tiếng Việt

Hàm:

```text
normalizeVietnameseSearch(value)
```

Mục tiêu:

- bỏ dấu;
- lowercase;
- bỏ ký tự đặc biệt;
- chuẩn hóa whitespace.

Ví dụ:

```text
"Hà Nội" -> "ha noi"
"ha noi" -> "ha noi"
```

Nhờ vậy user nhập sai dấu hoặc không dấu vẫn match station.

## Direct train search

Trong `ChatbotService.createChatResponse`:

```text
const directTrainSearchResponse = await createDirectTrainSearchResponse(...)
if (directTrainSearchResponse) return directTrainSearchResponse
```

Direct search chạy trước LLM.

### Khi nào direct search chạy

Hàm:

```text
shouldRequireTrainSearchToolCall(messages)
```

Nó kiểm tra:

- có keyword tìm chuyến/tàu/ga/lịch trình;
- có ngày hoặc connector ga;
- không phải intent tài khoản như ví/lịch sử/hoàn tiền.

### Parse ngày

Hàm:

```text
parseRequestedDate(text, today)
```

Hỗ trợ:

- hôm nay;
- ngày mai;
- ngày kia;
- YYYY-MM-DD;
- DD/MM;
- DD/MM/YYYY.

Time zone dùng `Asia/Bangkok`.

### Resolve ga từ text

Hàm:

```text
resolveStationPairFromText(text)
```

Quy trình:

1. Lấy danh sách station từ DB.
2. Normalize station name.
3. Tìm station name xuất hiện trong text.
4. Sắp xếp theo vị trí xuất hiện trong câu.
5. Nếu không đủ 2 ga, fallback sang `findStationsByName`.

Ví dụ:

```text
"tìm tàu từ Hà Nội đến Ninh Bình ngày mai"
-> from = Hà Nội
-> to = Ninh Bình
-> date = tomorrow
```

### Trả stream tool output

Direct search vẫn trả về dạng UI message stream có tool input/output:

- `tool-input-available`
- `tool-output-available`
- `finish`

Nhờ vậy frontend render giống tool calling thật.

## LLM tool calling

Nếu direct search không đủ thông tin, service dùng:

```text
streamText({
  model: Groq model,
  system: buildChatbotSystemPrompt(...),
  messages,
  tools
})
```

Model:

- khai báo trong `CHATBOT_MODEL`.

Stop condition:

- giới hạn số bước;
- dừng sau khi tool dữ liệu chạy.

## System prompt

File:

- `chatbot.prompt.ts`

Prompt quy định:

- khi hỏi dữ liệu hệ thống phải dùng tool;
- nếu thiếu ga/ngày thì hỏi lại;
- nếu hỏi ví/lịch sử cần user đăng nhập;
- trả lời tiếng Việt;
- không bịa lịch tàu.

## Tools

File:

- `chatbot.tools.ts`

Tools chính:

### findStationByName

Tìm ga theo tên gần đúng.

### searchTrainTrips

Gọi `TripService.searchTrips` hoặc helper `searchTrainTripsForChatbot`.

Trả:

- danh sách chuyến;
- route;
- train;
- giờ;
- giá nếu có;
- số ghế tổng/available tùy logic.

### getMyBookings

Lấy booking của user đang đăng nhập.

Nếu chưa đăng nhập:

- tool phải báo cần đăng nhập.

### getWalletBalance

Lấy balance và transaction gần đây.

### getPassengerGroups

Lấy loại hành khách và discount.

### getRoutes

Lấy route đang active để người dùng tham khảo.

## Frontend render chatbot

Frontend gửi message qua `chatbot-api`.

Khi stream về:

- text part hiển thị như chat thường;
- tool part được `chat-tool-part.tsx` phân loại;
- trip search result render bằng `trip-search-result.tsx`;
- booking history render bằng `booking-history-result.tsx`.

Điểm hay:

- chatbot có thể trả kết quả dạng card, không chỉ text.

## Vì sao direct search quan trọng

Nếu user hỏi rõ:

```text
"mai có tàu từ Hà Nội đi Ninh Bình không"
```

Không cần để LLM suy luận tool call. Backend tự:

- parse station;
- parse date;
- gọi dữ liệu thật;
- trả tool output.

Lợi ích:

- nhanh hơn;
- ít hallucination hơn;
- dễ debug hơn;
- nhất quán với nghiệp vụ search trip.

## Các lỗi thường gặp

### Chatbot bịa chuyến

Nguyên nhân:

- prompt không ép dùng tool;
- stop condition sai;
- frontend render text model thay vì tool output.

### Không tìm được ga có dấu

Kiểm tra normalize.

### Hỏi lịch sử nhưng chưa đăng nhập

Tool phải trả yêu cầu đăng nhập, không query toàn bộ booking.

### Ngày bị lệch timezone

Ngày phải tính theo `Asia/Bangkok`, không dùng UTC thuần.

## Câu hỏi bảo vệ

- Chatbot lấy dữ liệu thật bằng cách nào?
- Direct search khác tool calling qua LLM thế nào?
- Vì sao cần normalize tiếng Việt?
- Khi người dùng chưa đăng nhập, chatbot xử lý ví/lịch sử ra sao?
- Làm sao giảm hallucination?

