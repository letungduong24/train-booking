# Slide 04 - Data Model and Database Integrity

## Slide Title
Mô hình dữ liệu chính và ràng buộc toàn vẹn

## NotebookLM Instruction
Summarize the most important database entities. Do not show all fields. Emphasize why the schema supports railway-specific constraints.

## Main Slide Content
- Nhóm người dùng: `User`, `RefreshToken`, `Transaction`.
- Nhóm hạ tầng: `Network`, `Station`, `RailwayLine`, `Route`, `RouteStation`.
- Nhóm tàu/toa/ghế: `Train`, `CoachTemplate`, `Coach`, `Seat`.
- Nhóm vận hành: `Trip`, `TripDelayReport`, `SeatIssueReport`.
- Nhóm đặt vé: `Booking`, `Ticket`, `TicketSeatSegment`, `PassengerGroup`.
- Ràng buộc quan trọng: `TicketSeatSegment` có unique `(tripId, seatId, segmentIndex)` để ngăn bán trùng ghế theo từng đoạn giữa hai ga.
- Route có versioning bằng `code + version`; Network có `version` riêng để quản lý thay đổi bản đồ đường sắt.

## Speaker Notes
Giải thích tại sao cần `TicketSeatSegment`: vé A đi từ ga 1 đến ga 3 sẽ chiếm segment 1 và 2; vé khác chỉ có thể dùng cùng ghế nếu đoạn không giao nhau. Đây là lớp chặn cuối ở database.

## Visual Suggestion
- ERD rút gọn dạng 5 cụm: User/Wallet, Network/Route, Train/Seat, Trip, Booking/Ticket.
- Highlight `TicketSeatSegment` bằng màu khác.

## Source Evidence
- `api/prisma/schema.prisma`

