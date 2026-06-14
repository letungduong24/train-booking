# CHƯƠNG 3: XÂY DỰNG VÀ CÀI ĐẶT HỆ THỐNG

Tài liệu này trình bày chi tiết về quá trình xây dựng, cài đặt môi trường, cấu trúc mã nguồn, giải thuật cốt lõi và các bước triển khai dự án **Hệ thống đặt vé tàu trực tuyến (Railway Booking System - RailFlow)**.

---

## 3.1 CÀI ĐẶT MÔI TRƯỜNG VÀ CÁC PLUGIN, PACKAGE LIÊN QUAN

Hệ thống được thiết kế theo kiến trúc tách biệt hoàn toàn giữa Backend (NestJS API) và Frontend (Next.js), sử dụng cơ sở dữ liệu quan hệ PostgreSQL làm lưu trữ chính và Redis cho bộ nhớ đệm (caching).

### 3.1.1 Cài đặt phần mềm và công cụ

Để phát triển và chạy ứng dụng một cách ổn định, môi trường phát triển cần cài đặt các công cụ và phần mềm với phiên bản chi tiết như sau:

| STT | Tên phần mềm / Công cụ | Phiên bản khuyến nghị | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| 1 | **Node.js** | v20 LTS trở lên | Chạy môi trường Runtime cho cả Backend NestJS và Frontend Next.js. |
| 2 | **PostgreSQL** | v16-alpine (Docker) | Hệ quản trị cơ sở dữ liệu quan hệ chính của hệ thống. |
| 3 | **Redis** | v7-alpine (Docker) | Lưu trữ Session, bộ nhớ đệm, quản lý hàng đợi và cache trạng thái. |
| 4 | **Docker & Docker Compose** | v24.0.0 trở lên | Đóng gói toàn bộ ứng dụng dưới dạng Container để chuẩn hóa việc triển khai. |
| 5 | **Git** | v2.40.0 trở lên | Quản lý phiên bản và mã nguồn dự án. |
| 6 | **Visual Studio Code** | Mới nhất | Trình soạn thảo mã nguồn chính được cài thêm các Plugin bổ trợ. |
| 7 | **PNPM / NPM** | v9.x / v10.x | Trình quản lý package hiệu năng cao, giảm thiểu bộ nhớ đệm. |

**Các extension cần thiết trên VS Code:**
*   **Prisma**: Hỗ trợ đắc lực trong việc syntax highlighting và auto-formatting cho file cơ sở dữ liệu `schema.prisma`.
*   **ESLint & Prettier**: Định dạng code chuẩn hóa theo tiêu chuẩn dự án TypeScript.
*   **Tailwind CSS IntelliSense**: Hỗ trợ tự động hoàn thành class CSS trên Frontend.

---

### 3.1.2 Khởi tạo dự án

Dự án được khởi tạo theo mô hình cấu trúc Monorepo phẳng (flat structure) với thư mục gốc chứa cấu hình Docker và hai dự án con chính:

```text
train-booking/
├── api/                  # Backend API (NestJS)
│   ├── src/              # Mã nguồn TS
│   ├── prisma/           # Cấu hình Prisma Schema, Migrations & Seed
│   └── package.json      # Dependencies Backend
├── web/                  # Frontend Web Client (Next.js)
│   ├── src/              # Các Page, Component UI React
│   └── package.json      # Dependencies Frontend
├── docker-compose.yml    # File điều phối chạy các dịch vụ Container
├── Caddyfile             # Cấu hình Reverse Proxy & SSL tự động
└── .env                  # Lưu trữ biến môi trường tập trung
```

#### Quy trình khởi tạo dự án thực tế:

1.  **Backend NestJS**: Khởi tạo bằng Nest CLI (`nest new api`), cấu hình các thư viện cốt lõi và tích hợp TypeScript.
2.  **Prisma ORM**: Khởi tạo Prisma ORM tại thư mục `api` (`npx prisma init`), kết nối với PostgreSQL thông qua biến môi trường `DATABASE_URL` trong file `.env`, định nghĩa các Model dữ liệu và thực hiện ánh xạ di cư CSDL (`npx prisma migrate dev`).
3.  **Frontend Next.js**: Khởi tạo dự án Next.js tại thư mục `web` (`create-next-app`) hỗ trợ React Component, TypeScript và cấu hình Tailwind CSS cho giao diện người dùng.

---

## 3.2 KIẾN TRÚC MÃ NGUỒN VÀ XÂY DỰNG CÁC PHÂN HỆ BACKEND (BACKEND MODULES DESIGN)

Kiến trúc Backend được thiết kế bám sát triết lý của **NestJS**, xây dựng theo mô hình phát triển hướng Module (Module-Driven Development). Mỗi module đóng vai trò là một khối logic đóng gói chứa đầy đủ ba thành phần:
*   **Module**: Khai báo và liên kết các Controller, Service và cấu hình cơ sở dữ liệu.
*   **Controller**: Tiếp nhận các yêu cầu HTTP Request, thực hiện phân tích tham số truyền lên và định tuyến kết quả phản hồi HTTP Response về Frontend.
*   **Service**: Chứa toàn bộ logic nghiệp vụ (Business Logic), thực thi các giải thuật xử lý và tương tác trực tiếp với cơ sở dữ liệu PostgreSQL thông qua Prisma ORM.

Hệ thống Backend được phân chia và cài đặt chặt chẽ thành 5 phân hệ (Module) cốt lõi như sau:

---

### 3.2.1 Phân hệ Quản lý Tài khoản và Phân quyền (Authentication & User Module)

#### A. Kiến trúc thiết kế
Phân hệ này đảm nhận nhiệm vụ đăng ký, đăng nhập, bảo mật thông tin người dùng, cấp phát token xác thực và thiết lập cơ chế phân quyền đa cấp trên toàn bộ hệ thống.
*   **Thành phần quản lý**: `AuthModule`, `UserModule`.
*   **Thực thể dữ liệu tương tác (CSDL)**: Bảng `User` (lưu trữ thông tin hồ sơ, mật khẩu băm, số dư ví, trạng thái ban/active), Bảng `RefreshToken` (lưu vết token để làm mới phiên).

#### B. Quy trình xử lý nghiệp vụ chính
1.  **Xác thực đa phương thức**: Hỗ trợ đăng nhập truyền thống (mã hóa mật khẩu một chiều bằng thuật toán an toàn **Bcrypt**) và xác thực một chạm thông qua Google OAuth (đối với các tài khoản không sử dụng mật khẩu).
2.  **Cơ chế cấp phát Token (JWT & Refresh Token)**: Khi đăng nhập thành công, hệ thống cấp phát hai chuỗi JWT: Access Token (thời hạn ngắn, dùng để truy cập API có bảo mật) và Refresh Token (thời hạn dài, lưu trong HTTP-Only Cookie hoặc CSDL để gia hạn tự động khi Access Token hết hạn).
3.  **Kiểm soát truy cập đa vai trò (RBAC - Role-Based Access Control)**: Sử dụng các `Guard` trong NestJS để chặn và phân quyền nghiêm ngặt các API theo vai trò `UserRole` (bao gồm `USER` - Khách hàng, `ADMIN` - Quản trị viên, và `DRIVER` - Lái tàu).

---

### 3.2.2 Phân hệ Quản lý Đầu tàu, Toa xe và Sắp đặt Ghế (Train, Coach & Seat Module)

#### A. Kiến trúc thiết kế
Phân hệ này số hóa toàn bộ cơ cấu vật lý của đoàn tàu hỏa thực tế vào trong cơ sở dữ liệu, cho phép quản lý chi tiết cấu trúc từ đầu máy, các toa xe cho đến sơ đồ ghế ngồi.
*   **Thành phần quản lý**: `TrainModule`, `CoachesModule`, `SeatsModule`.
*   **Thực thể dữ liệu tương tác (CSDL)**: `Train`, `Coach`, `Seat`, `CoachTemplate`.

#### B. Quy trình xử lý nghiệp vụ chính
1.  **Giải thuật tự động sinh ghế ngồi dạng lưới (Bulk Seat Generation Algorithm)**:
    *   Admin không cần tạo thủ công từng chiếc ghế cho toa xe. Khi tạo một `Coach` mới và liên kết với một `CoachTemplate` (Mẫu toa xe), Backend tự động đọc cấu hình mẫu bao gồm: loại bố cục (`SEAT`/`BED`), số hàng (`totalRows`), số cột (`totalCols`), và số tầng (`tiers`).
    *   Hệ thống chạy thuật toán lặp 3 cấp (Hàng $\times$ Cột $\times$ Tầng) để tính toán tọa độ lưới, tự động sinh nhãn tên ghế theo thứ tự tăng dần và ghi đồng thời vào bảng `Seat`.
    *   Toàn bộ quy trình được bọc trong một **Database Transaction (`$transaction`)** để đảm bảo tính nguyên tử (Atomicity). Nếu bất kỳ ghế nào bị trùng lặp tọa độ hoặc lỗi ghi CSDL, toàn bộ toa xe sẽ bị hủy tạo để tránh dữ liệu rác.
2.  **Quản lý trạng thái ghế linh hoạt (`SeatsService`)**:
    *   Hỗ trợ thay đổi trạng thái ghế (`ACTIVE`, `DISABLED`, `MAINTENANCE`) thủ công qua API `PATCH /seats/:id` phục vụ công tác vệ sinh, sửa chữa.
    *   Tích hợp giải thuật tự động đổi ghế hoặc hủy vé hoàn tiền khi nhận báo cáo ghế hỏng từ Lái tàu (duyệt báo cáo sự cố $\rightarrow$ khóa ghế hỏng sang `DISABLED` $\rightarrow$ tự động tìm ghế trống tương đương $\rightarrow$ gửi email link xác thực đổi ghế có thời hạn 48 giờ $\rightarrow$ hoàn tiền 100% tự động về ví nếu không còn ghế trống).

---

### 3.2.3 Phân hệ Quản lý Lộ trình và Giám sát GIS (Trip, Route & GIS Geolocation Module)

#### A. Kiến trúc thiết kế
Phân hệ này xây dựng hạ tầng chạy tàu bao gồm các nhà ga, tuyến đường sắt nối liền các tỉnh thành và lập lịch điều phối hành trình cho các chuyến tàu.
*   **Thành phần quản lý**: `GeojsonModule`, `RouteModule`, `TripModule`.
*   **Thực thể dữ liệu tương tác (CSDL)**: `Network`, `Station`, `Route`, `RailwayLine`, `RouteStation`, `Trip`.

#### B. Quy trình xử lý nghiệp vụ chính
1.  **Đồng bộ hóa không gian tự động từ bản đồ GeoJSON**:
    *   Hỗ trợ Admin tải lên file GeoJSON (`mapData`) chứa dữ liệu nhà ga và ray qua cổng API `POST /geojson/sync`.
    *   Hệ thống tự động tạo phiên bản mạng lưới `Network` mới với mã phiên bản tự tăng (`version`) để lưu trữ lịch sử cấu trúc hạ tầng.
    *   Bóc tách Feature hình học dạng `Point` để lưu danh sách nhà ga `Station` (đồng thời tự động sinh mã ga `code` không dấu bằng regex để tránh trùng lặp).
    *   Bóc tách Feature hình học dạng `LineString`/`MultiLineString` để tự động gộp các phân khúc ray theo tuyến và lưu trữ vào bảng `RailwayLine`.
2.  **Lập lịch chuyến tàu và kiểm tra xung đột**:
    *   Khi lập lịch chuyến tàu mới (`Trip`), hệ thống tự động kiểm tra xung đột thời gian chạy trên cơ sở dữ liệu để đảm bảo đoàn tàu vật lý không bị bận hoặc trùng chéo lịch chạy trong cùng một khoảng thời gian.
3.  **Thuật toán nội suy GPS thời gian thực (Real-time GPS Interpolation)**:
    *   Để Admin và Khách hàng có thể giám sát vị trí di chuyển động của tàu trên bản đồ GIS, hệ thống sử dụng thuật toán giả lập:
        *   *Bước 1*: Tính toán tỷ lệ phần trăm thời gian trôi qua thực tế ($Progress$) từ lúc xuất phát thực tế (giờ gốc cộng/trừ số phút delay khởi hành `departureDelayMinutes`) so với tổng thời gian chặng chạy.
        *   *Bước 2*: Sử dụng thư viện không gian **Turf.js** để đo tổng chiều dài thực tế của tuyến đường ray uốn lượn ($Distance_{total}$) dạng GeoJSON LineString. Tọa độ hiện thời của tàu được xác định ở khoảng cách:
            $$Distance_{current} = Progress \times Distance_{total}$$
        *   *Bước 3*: Gọi hàm `turf.along` trích xuất tọa độ GPS `[Vĩ độ, Kinh độ]` tương ứng và trả về qua API `GET /trips/:id/live-location` để cập nhật icon tàu chạy động trên bản đồ MapLibre mỗi 30 giây.

---

### 3.2.4 Phân hệ Đặt vé, Thanh toán và Ví điện tử (Booking, Ticket & Wallet Module)

#### A. Kiến trúc thiết kế
Phân hệ này quản lý toàn bộ quy trình thương mại của hệ thống từ lúc giữ ghế, tính toán giá vé theo khoảng cách hành trình, thanh toán trực tuyến cho đến hoàn tiền tự động khi xảy ra sự cố.
*   **Thành phần quản lý**: `BookingsModule`, `TicketModule`, `WalletModule`, `PricingModule`.
*   **Thực thể dữ liệu tương tác (CSDL)**: `Booking`, `Ticket`, `Transaction`, `PassengerGroup`.

#### B. Quy trình xử lý nghiệp vụ chính
1.  **Quy trình Đặt vé và Kiểm soát giữ ghế an toàn**:
    *   Khi khách hàng chọn ghế và nhấn đặt vé, hệ thống thực thi cơ chế khóa tạm thời vị trí ghế ngồi trong database trong vòng 10 phút. Sử dụng cơ chế khóa bi quan (Pessimistic Locking) trong PostgreSQL để xử lý triệt để bài toán tranh chấp đặt vé đồng thời (Race Condition) khi hàng ngàn người cùng đặt một ghế vào dịp cao điểm.
2.  **Tính toán giá vé động chặng dừng (`PricingService`)**:
    *   Giá vé được tính tự động dựa trên khoảng cách giữa ga đi và ga đến cấu hình trong `RouteStation` nhân với đơn giá mặc định của tuyến (`basePricePerKm`), cộng thêm phí dịch vụ ga (`stationFee`), sau đó nhân hệ số nhân của toa xe (`coachMultiplier`), hệ số tầng (`tierMultipliers`) và giảm trừ theo phần trăm ưu đãi của nhóm hành khách (`PassengerGroup` như Sinh viên, Trẻ em, Người cao tuổi).
3.  **Tích hợp thanh toán trực tuyến và tự động xuất vé PDF**:
    *   Hệ thống liên kết với cổng thanh toán **VNPay Gateway** để sinh liên kết thanh toán an toàn.
    *   Sau khi nhận tín hiệu giao dịch thành công thông qua VNPay Webhook, hệ thống chính thức chuyển trạng thái Booking thành `PAID` (Đã thanh toán), chốt ghế thành công (`BOOKED`), gọi thư viện PDFKit tự động sinh file vé điện tử dạng **PDF** có tích hợp **Mã QR xác thực** và kích hoạt Email Service gửi trực tiếp tới hòm thư khách hàng. Nếu quá 10 phút không thanh toán, hệ thống tự động hủy booking và nhả ghế trống.
4.  **Hệ thống Ví điện tử nội bộ và hoàn tiền tự động**:
    *   Hỗ trợ người dùng nạp tiền qua cổng thanh toán hoặc rút tiền an toàn có mã PIN bảo mật.
    *   Khi xảy ra sự cố hủy chuyến khẩn cấp (`UC-15`) hoặc sự cố ghế hỏng không có ghế thay thế phù hợp (`UC-13`), hệ thống tự động gọi API ví để thực hiện giao dịch hoàn trả 100% giá trị vé trực tiếp vào Ví điện tử của khách hàng ngay lập tức và gửi email xác nhận.

---

## 3.3 TRIỂN KHAI DỰ ÁN (DEPLOYMENT CONFIGURATION)

Dự án được xây dựng và triển khai bằng phương pháp đóng gói Container thông qua Docker Compose, kết hợp cấu hình máy chủ Web server Caddy để làm Reverse Proxy điều phối dịch vụ và tự động đăng ký chứng chỉ SSL.

### 3.3.1 Cấu hình điều phối Docker Compose

Hệ thống triển khai 4 dịch vụ container chạy song song, thiết lập liên kết phụ thuộc chặt chẽ:
*   **postgres**: Container chạy PostgreSQL 16 Alpine, cấu hình lưu trữ dữ liệu bền vững (Persistent Volume) tại thư mục `postgres_data` và có tích hợp kịch bản kiểm tra sức khỏe `healthcheck`.
*   **redis**: Container chạy bộ nhớ đệm Redis 7 Alpine phục vụ lưu cache và session.
*   **api**: Container đóng gói mã nguồn Backend NestJS, chỉ khởi chạy sau khi PostgreSQL và Redis đã báo trạng thái khỏe mạnh (`service_healthy`).
*   **web**: Container đóng gói giao diện Frontend Next.js Client, truyền sẵn địa chỉ URL API của Backend tại thời điểm build ứng dụng.

---

### 3.3.2 Cấu hình Reverse Proxy & SSL tự động với Caddy

Caddy Server đóng vai trò tiếp nhận request từ tên miền internet của người dùng, thực hiện nén dữ liệu bằng thuật toán hiện đại Gzip/Zstd để tăng tốc truyền tải, và định tuyến trực tiếp vào cổng cổng của container tương ứng:
*   Tên miền **`railflow.duongle.dev`**: Tự động trỏ reverse proxy vào cổng `4000` của Frontend Next.js.
*   Tên miền **`railflow-api.duongle.dev`**: Tự động trỏ reverse proxy vào cổng `9000` của Backend NestJS.
*   Caddy tự động đăng ký, gia hạn chứng chỉ bảo mật SSL miễn phí qua Let's Encrypt cho hai tên miền này.

---

### 3.3.3 Các lệnh khởi chạy triển khai thực tế

Để đưa hệ thống lên môi trường staging hoặc production, thực hiện tuần tự các lệnh sau:

**Lệnh 1: Xây dựng và khởi chạy container chạy nền (dưới background)**
```bash
docker compose up -d --build
```

**Lệnh 2: Tiến hành chạy Migrate Database tạo các bảng vật lý trong CSDL PostgreSQL**
```bash
docker compose exec api npx prisma migrate deploy
```

**Lệnh 3: Nạp dữ liệu nền ban đầu (Seed Data) như các vai trò, mẫu toa xe, giá trị mặc định**
```bash
docker compose exec api npx prisma db seed
```

**Lệnh 4: Giám sát trạng thái hoạt động và Log của các Container**
```bash
docker compose logs -f --tail=100
```
