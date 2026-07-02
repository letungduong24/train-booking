# Master Prompt for NotebookLM - Railflow Graduation Slides

## Role
You are an academic presentation assistant. Create a Vietnamese graduation project slide deck for the software project **Railflow - hệ thống đặt vé và quản lý vận tải đường sắt trực tuyến**.

## Output Requirement
- Generate a coherent slide deck in Vietnamese.
- Keep the tone academic, concise, and suitable for a Vietnamese graduation defense.
- Do not invent features that are not present in the project.
- Prioritize the most technically valuable features instead of listing every CRUD screen.
- Use screenshots/demo images when available, but the explanation must still make sense without them.
- Each slide should have a clear title, 3-6 main bullets, and optional speaker notes.
- Use diagrams where helpful: architecture diagram, booking workflow, route path algorithm, real-time GPS flow.
- Avoid marketing language. Focus on the problem, design, implementation, and achieved result.

## Project Context
Railflow is a full-stack train ticketing and railway operation management system.

Frontend:
- Next.js 16, React 19, TypeScript.
- UI: Tailwind CSS, Radix UI, shadcn-style components, MapLibre map, TanStack Query, Zustand, Socket.IO client.
- Main routes: public booking search, passenger dashboard, admin dashboard, driver panel.

Backend:
- NestJS 11, Prisma 7, PostgreSQL, Redis, BullMQ, Socket.IO Gateway.
- Authentication: email/password, email verification, Google OAuth, JWT refresh token.
- Payment: VNPAY sandbox flow and internal wallet with PIN.
- Email: Resend for verification, receipt, seat replacement, refund.
- Ticket PDF: PDFKit + QRCode.
- AI chatbot: Vercel AI SDK, Groq provider, tool calling against real database services.

Database:
- PostgreSQL with Prisma schema.
- Important tables: User, Network, Station, RailwayLine, Route, RouteStation, Train, CoachTemplate, Coach, Seat, Trip, Booking, Ticket, TicketSeatSegment, Transaction, SeatIssueReport, TripDelayReport.

## Core Technical Highlights to Emphasize
1. Network versioning:
   - `Network.version` allows railway map data to evolve.
   - `Station` and `RailwayLine` are scoped by `networkId`.
   - `Route` also references `networkId`.

2. Route creation with real railway path calculation:
   - Admin selects ordered stations on a MapLibre map.
   - Backend validates the selected station sequence against physical railway lines.
   - Algorithm snaps stations to railway segments, tries direct segment first, then BFS over connected railway line segments.
   - Prevents invalid paths, intermediate station overlap, and excessive backtracking.
   - Stores `Route.pathCoordinates`, `Route.totalDistanceKm`, and each `RouteStation.distanceFromStart`.

3. Real-time segmented seat locking:
   - Redis lock is used during seat selection / pending booking.
   - Lock key includes `tripId`, `seatId`, `fromStationIndex`, `toStationIndex`.
   - Lock overlap logic allows seat reuse on non-overlapping travel segments.
   - BullMQ expires unpaid bookings.
   - Socket.IO updates seat state for other clients.

4. Final database integrity with TicketSeatSegment:
   - After payment, tickets are created in PostgreSQL.
   - Each ticket expands into multiple `TicketSeatSegment` rows.
   - Unique constraint `@@unique([tripId, seatId, segmentIndex])` prevents double-selling a seat on the same segment.
   - This is the final defensive layer after Redis.

5. Real-time trip GPS simulation:
   - Uses `Route.pathCoordinates`.
   - Calculates progress by time, train average speed, departure delay, and arrival delay.
   - Interpolates latitude, longitude, bearing, speed.
   - Auto-marks trip completed when simulation reaches the end.

6. Driver operation workflow:
   - Driver sees assigned trips.
   - Driver reports seat issues and trip delays.
   - Admin reviews delay reports.
   - Seat issue flow can propose replacement seat, send email confirmation, or refund wallet.

7. Chatbot tool calling:
   - Natural Vietnamese input is normalized.
   - Bot can find station names, search trips, retrieve user bookings, wallet balance, passenger groups, and routes.
   - Direct search path bypasses LLM guesswork when the user gives enough station/date information.

8. Ticket and notification:
   - Successful payment generates tickets, QR code, PDF attachment, and email receipt.
   - Seat replacement and refund also send emails.

## Source Files NotebookLM Should Treat as Important Evidence
- Database schema: `api/prisma/schema.prisma`
- Seed data: `api/prisma/seed.ts`
- App module: `api/src/app.module.ts`
- Booking core: `api/src/modules/booking/booking.service.ts`
- Booking real-time gateway: `api/src/modules/booking/booking.gateway.ts`
- Booking metadata interface: `api/src/modules/booking/interfaces/booking-metadata.interface.ts`
- Route path algorithm: `api/src/modules/route/utils/route-path-calculator.ts`
- Route service: `api/src/modules/route/route.service.ts`
- GeoJSON sync: `api/src/modules/geojson/geojson.service.ts`
- Trip service and live GPS: `api/src/modules/trip/trip.service.ts`
- Live location calculator: `api/src/modules/trip/utils/live-location-calculator.ts`
- Trip delay reports: `api/src/modules/trip-delay-reports/trip-delay-reports.service.ts`
- Seat issues: `api/src/modules/seat-issues/seat-issues.service.ts`
- Mail service: `api/src/modules/mail/mail.service.ts`
- Ticket PDF service: `api/src/modules/ticket/ticket.service.ts`
- Payment: `api/src/modules/payment/payment.service.ts`, `api/src/modules/payment/payment.controller.ts`
- Wallet: `api/src/modules/wallet/wallet.service.ts`
- Chatbot: `api/src/modules/chatbot/chatbot.service.ts`, `chatbot.tools.ts`, `chatbot.prompt.ts`
- Frontend booking page: `web/app/(protected)/dashboard/booking/[tripId]/page.tsx`
- Frontend route create page: `web/app/(protected)/admin/routes/create/page.tsx`
- Interactive route builder: `web/features/routes/components/interactive-route-builder.tsx`
- Socket store: `web/lib/store/socket.store.ts`
- Seat UI helpers: `web/lib/utils/seat-helper.ts`

## Deck Structure
Use the files `01-...md` onward in README order. Some complex features are intentionally split into multiple slides, for example:
- `06.1` and `06.2` for route creation and path calculation internals.
- `08.1`, `08.2`, and `08.3` for seat locking from business problem to Redis and PostgreSQL.
- `10.1` and `10.2` for GPS simulation overview and delay calculation.
- `12.1` and `12.2` for chatbot concept and implementation flow.

Do not compress these technical sections into one slide. Each numbered Markdown file should become one slide.

## Visual Style Guidance
- Use a clean academic style.
- Color palette can use Railflow primary red/burgundy `#802222`, dark text, white background, light gray sections.
- Include code/module labels sparingly; do not paste long code blocks on slides.
- For algorithm slides, use simple flow diagrams rather than code.
- For demo slides, use screenshots of the actual web app if available.
