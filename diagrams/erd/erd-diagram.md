# Entity Relationship Diagram - RailFlow

Tai lieu nay mo ta ERD dang bang bang Mermaid `erDiagram`.
No duoc dong bo voi `api/prisma/schema.prisma` va uu tien de nhin trong bao cao/slide hon so do Chen XML.

## ERD Dang Bang

```mermaid
erDiagram
    User {
        String id PK
        String email UK
        String phone UK
        String googleId UK
        String password
        String name
        String profilePic
        UserRole role
        Boolean isEmailVerified
        String verificationToken UK
        DateTime verificationTokenExpires
        String passwordResetToken UK
        DateTime passwordResetTokenExpires
        String walletPinResetToken UK
        DateTime walletPinResetTokenExpires
        Int balance
        String walletPin
        Boolean isBanned
        DateTime createdAt
        DateTime updatedAt
    }

    RefreshToken {
        String id PK
        String token UK
        String userId FK
        DateTime expiresAt
        DateTime createdAt
    }

    Transaction {
        String id PK
        String userId FK
        Int amount
        TransactionType type
        String paymentMethod
        TransactionStatus status
        String referenceId
        String idempotencyKey UK
        String description
        String bankName
        String bankAccount
        String accountName
        DateTime createdAt
        DateTime updatedAt
    }

    Network {
        String id PK
        Int version UK
        String name
        DateTime createdAt
        DateTime updatedAt
    }

    Station {
        String id PK
        String code
        String code_networkId UK
        String name
        Float latitude
        Float longitude
        String networkId FK
        DateTime createdAt
        DateTime updatedAt
    }

    RailwayLine {
        String id PK
        String name
        Json pathCoordinates
        String networkId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Route {
        String id PK
        String code
        Int version
        String code_version UK
        String networkId FK
        String name
        RouteStatus status
        Int durationMinutes
        Int turnaroundMinutes
        Float totalDistanceKm
        Int basePricePerKm
        Int stationFee
        Json pathCoordinates
        DateTime createdAt
        DateTime updatedAt
    }

    RouteStation {
        String routeId PK_FK
        String stationId PK_FK
        Int index
        String routeId_index UK
        Float distanceFromStart
        Int durationFromStart
        DateTime createdAt
        DateTime updatedAt
    }

    CoachTemplate {
        String id PK
        String code UK
        String name
        String description
        CoachLayout layout
        Int totalRows
        Int totalCols
        Int tiers
        Float coachMultiplier
        Json tierMultipliers
        DateTime createdAt
        DateTime updatedAt
    }

    Train {
        String id PK
        String code UK
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
        String coachId_row_col_tier UK
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
        String driverId FK
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
        String code UK
        String tripId FK
        String userId FK
        String contactName
        String contactPhone
        String contactEmail
        BookingStatus status
        Int totalPrice
        Json metadata
        DateTime createdAt
        DateTime updatedAt
    }

    PassengerGroup {
        String id PK
        String code UK
        String name
        Float discountRate
        String description
        Int minAge
        Int maxAge
        DateTime createdAt
        DateTime updatedAt
    }

    Ticket {
        String id PK
        String bookingId_seatId UK
        String bookingId FK
        String tripId FK
        String seatId FK
        String passengerGroupId FK
        String passengerName
        String passengerId
        Int fromStationIndex
        Int toStationIndex
        Int price
        DateTime createdAt
        DateTime updatedAt
    }

    TicketSeatSegment {
        String id PK
        String tripId_seatId_segmentIndex UK
        String ticketId FK
        String tripId FK
        String seatId FK
        Int segmentIndex
        DateTime createdAt
    }

    SeatIssueReport {
        String id PK
        String tripId FK
        String seatId FK
        String reportedById FK
        String proposedSeatId FK
        String issueType
        String description
        SeatIssueStatus status
        String rejectReason
        String token UK
        DateTime tokenExpires
        DateTime createdAt
        DateTime updatedAt
    }

    TripDelayReport {
        String id PK
        String tripId FK
        String reportedById FK
        TripDelayType type
        Int minutes
        String reason
        TripDelayReportStatus status
        String rejectReason
        DateTime reviewedAt
        DateTime createdAt
        DateTime updatedAt
    }

    User ||--o{ RefreshToken : owns
    User ||--o{ Transaction : makes
    User ||--o{ Booking : places
    User ||--o{ Trip : drives
    User ||--o{ SeatIssueReport : reports
    User ||--o{ TripDelayReport : reports

    Network ||--o{ Station : contains
    Network ||--o{ RailwayLine : contains
    Network ||--o{ Route : versions
    Route ||--|{ RouteStation : has
    Station ||--o{ RouteStation : appears_in

    Route ||--o{ Trip : schedules
    Train ||--o{ Trip : operates
    Train ||--|{ Coach : contains
    CoachTemplate ||--o{ Coach : templates
    Coach ||--|{ Seat : contains

    Trip ||--o{ Booking : has
    Booking ||--|{ Ticket : includes
    Trip ||--o{ Ticket : issues
    Seat ||--o{ Ticket : assigned
    PassengerGroup ||--o{ Ticket : classifies

    Ticket ||--|{ TicketSeatSegment : occupies
    Trip ||--o{ TicketSeatSegment : locks
    Seat ||--o{ TicketSeatSegment : locks

    Trip ||--o{ SeatIssueReport : has
    Seat ||--o{ SeatIssueReport : reported_for
    Seat ||--o{ SeatIssueReport : proposed_as
    Trip ||--o{ TripDelayReport : has
```

## Ghi Chu

- `PK`: khoa chinh.
- `FK`: khoa ngoai.
- `UK`: unique key. Cac unique tong hop duoc viet thanh dong dai dien nhu `code_networkId`, `routeId_index`, `tripId_seatId_segmentIndex`.
- `TicketSeatSegment` la bang chan trung ghe theo chang: mot ve di qua nhieu doan thi co nhieu dong segment.
- Cac quan he `Train-Coach-Seat` va `Ticket-TicketSeatSegment` co `onDelete: Cascade` o database theo schema; cac quan he lich su/ve/chuyen dung restrict hoac association de giu toan ven du lieu.
