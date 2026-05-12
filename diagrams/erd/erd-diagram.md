# Biểu Đồ Quan Hệ Thực Thể (ERD) - Cơ Sở Dữ Liệu

Tài liệu này cung cấp Biểu đồ Quan hệ Thực thể (Entity-Relationship Diagram - ERD) sử dụng cú pháp `erDiagram` của Mermaid.
Biểu đồ này biểu diễn các thực thể, thuộc tính khóa, và mối quan hệ theo chuẩn Database Relational Design, được ánh xạ trực tiếp từ `schema.prisma`.

---

## Biểu Đồ ERD

```mermaid
erDiagram
    %% ENTITIES
    User {
        String id PK
        String profilePic
        String email
        String phone
        String password
        String name
        String googleId
        DateTime createdAt
        DateTime updatedAt
        UserRole role
        Boolean isEmailVerified
        String verificationToken
        DateTime verificationTokenExpires
        String passwordResetToken
        DateTime passwordResetTokenExpires
        String walletPinResetToken
        DateTime walletPinResetTokenExpires
        Float balance
        String walletPin
        Boolean isBanned
    }
    
    RefreshToken {
        String id PK
        String token
        String userId FK
        DateTime expiresAt
        DateTime createdAt
    }
    
    Transaction {
        String id PK
        String userId FK
        Float amount
        TransactionType type
        String paymentMethod
        TransactionStatus status
        String referenceId
        String description
        String bankName
        String bankAccount
        String accountName
        DateTime createdAt
        DateTime updatedAt
    }
    
    Station {
        String id PK
        String code
        String name
        Float latitude
        Float longitude
        DateTime createdAt
        DateTime updatedAt
    }
    
    Route {
        String id PK
        String code
        String name
        DateTime createdAt
        DateTime updatedAt
        RouteStatus status
        Int durationMinutes
        Int turnaroundMinutes
        Float totalDistanceKm
        Float basePricePerKm
        Float stationFee
        Json pathCoordinates
    }
    
    RouteStation {
        String routeId PK,FK
        String stationId PK,FK
        Int index
        Float distanceFromStart
        Int durationFromStart
        DateTime createdAt
        DateTime updatedAt
    }
    
    RailwayLine {
        String id PK
        String name
        Json pathCoordinates
        DateTime createdAt
        DateTime updatedAt
    }
    
    CoachTemplate {
        String id PK
        String code
        String name
        String description
        CoachLayout layout
        Int totalRows
        Int totalCols
        Int tiers
        DateTime createdAt
        DateTime updatedAt
        Float coachMultiplier
        Json tierMultipliers
    }
    
    Train {
        String id PK
        String code
        String name
        TrainStatus status
        Int averageSpeedKmH
        DateTime createdAt
        DateTime updatedAt
    }
    
    Coach {
        String id PK
        String name
        Int order
        CoachStatus status
        String trainId FK
        String templateId FK
        DateTime createdAt
        DateTime updatedAt
    }
    
    Seat {
        String id PK
        String name
        Int rowIndex
        Int colIndex
        SeatStatus status
        SeatType type
        Int tier
        String coachId FK
        DateTime createdAt
        DateTime updatedAt
    }
    
    Trip {
        String id PK
        String routeId FK
        String trainId FK
        DateTime departureTime
        DateTime endTime
        TripStatus status
        Int departureDelayMinutes
        Int arrivalDelayMinutes
        DateTime createdAt
        DateTime updatedAt
    }
    
    Booking {
        String id PK
        String code
        String tripId FK
        String userId FK
        String contactName
        String contactPhone
        String contactEmail
        BookingStatus status
        Float totalPrice
        Json metadata
        DateTime createdAt
        DateTime updatedAt
    }
    
    Ticket {
        String id PK
        String bookingId FK
        String tripId FK
        String seatId FK
        String passengerName
        String passengerId
        String passengerGroupId FK
        Int fromStationIndex
        Int toStationIndex
        Float price
        DateTime createdAt
        DateTime updatedAt
    }
    
    PassengerGroup {
        String id PK
        String code
        String name
        Float discountRate
        String description
        Int minAge
        Int maxAge
        DateTime createdAt
        DateTime updatedAt
    }

    %% RELATIONSHIPS
    
    User ||--o{ RefreshToken : "sở hữu"
    User ||--o{ Booking : "đặt vé"
    User ||--o{ Transaction : "thực hiện"
    
    Route ||--|{ RouteStation : "bao gồm"
    Station ||--o{ RouteStation : "dừng tại"
    
    Route ||--o{ Trip : "được chạy trên"
    Train ||--o{ Trip : "vận hành"
    
    Train ||--|{ Coach : "bao gồm"
    CoachTemplate ||--o{ Coach : "khởi tạo từ"
    Coach ||--|{ Seat : "chứa"
    
    Trip ||--o{ Booking : "có"
    Booking ||--|{ Ticket : "gồm"
    Trip ||--o{ Ticket : "áp dụng cho"
    Seat ||--o{ Ticket : "được cấp cho"
    PassengerGroup ||--o{ Ticket : "phân loại"
```

### Ý Nghĩa Các Mối Quan Hệ (Crow's Foot Notation)
- **`||--o{` (Một - Nhiều):** Một thực thể bên trái có thể liên kết với KHÔNG hoặc NHIỀU thực thể bên phải. Ví dụ: Một `User` có thể thực hiện nhiều `Transaction` hoặc chưa thực hiện `Transaction` nào.
- **`||--|{` (Một - Một hoặc Nhiều):** Một thực thể bên trái phải liên kết với MỘT hoặc NHIỀU thực thể bên phải. Ví dụ: Một `Booking` (Đơn hàng) bắt buộc phải chứa ít nhất một `Ticket` (Vé lẻ).
- **PK (Primary Key):** Khóa chính, định danh duy nhất cho thực thể.
- **FK (Foreign Key):** Khóa ngoại, tham chiếu đến một thực thể khác để tạo mối quan hệ.
- **PK,FK:** Thuộc tính vừa là khóa chính vừa là khóa ngoại (thường gặp trong các bảng trung gian như `RouteStation`).

### Ghi Chú Tích Hợp
- Biểu đồ này phản ánh chính xác cấu trúc CSDL từ `schema.prisma`.
- Thực thể `RailwayLine` lưu trữ tọa độ địa lý dạng GeoJSON và không có liên kết trực tiếp (Foreign Key) cứng với các bảng khác trong cơ sở dữ liệu (tọa độ sẽ được thuật toán Snap-to-Road xử lý ở tầng Application).
- Cấu trúc giá và đa tầng (tiers) của `Seat` phụ thuộc vào `CoachTemplate` và `PassengerGroup`.
