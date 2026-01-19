# Prisma v7 Seed Setup - Walkthrough

Successfully configured and executed Prisma v7 database seeding with Vietnam railway data.

---

## ✅ What Was Done

### 1. Created Seed File

**File:** [`prisma/seed.ts`](file:///home/duong/Study/datn/source/api/prisma/seed.ts)

**Data seeded:**
- 🚉 **10 Stations** - Real Vietnam railway stations (Hà Nội → Cần Thơ)
- 🛤️ **5 Routes** - SE1, SE2, SE3, SNT1, SCT1 with realistic distances
- 🚃 **4 Coach Templates** - SEAT_S64, BED_K6, BED_K4, SEAT_AUX

### 2. Fixed Prisma v7 Initialization

**Problem:** Prisma v7 requires `PrismaPg` adapter initialization

**Before (Broken):**
```typescript
const prisma = new PrismaClient();
// ❌ Error: PrismaClient needs non-empty options
```

**After (Fixed):**
```typescript
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });
// ✅ Matches PrismaService configuration
```

### 3. Configured Prisma v7 Seed

**File:** [`prisma.config.ts`](file:///home/duong/Study/datn/source/api/prisma.config.ts)

```typescript
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts", // ✅ Added seed command
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

### 4. Installed Required Dependencies

```bash
npm install -D tsx
```

---

## 📊 Seed Results

```
🌱 Starting seed...
🗑️  Clearing existing data...
🚉 Creating stations...
✅ Created 10 stations
🛤️  Creating routes...
✅ Created 5 routes
🚃 Creating coach templates...
✅ Created 4 coach templates

📊 Seed Summary:
   - Stations: 10
   - Routes: 5
   - Coach Templates: 4

✨ Seed completed successfully!
```

---

## 🗺️ Seeded Data Details

### Stations (North → South)

| # | Station | Latitude | Longitude |
|---|---------|----------|-----------|
| 1 | Ga Hà Nội | 21.0245 | 105.8412 |
| 2 | Ga Vinh | 18.6792 | 105.6811 |
| 3 | Ga Huế | 16.4637 | 107.5909 |
| 4 | Ga Đà Nẵng | 16.0544 | 108.2022 |
| 5 | Ga Quảng Ngãi | 15.1214 | 108.8044 |
| 6 | Ga Nha Trang | 12.2388 | 109.1967 |
| 7 | Ga Phan Thiết | 10.9333 | 108.1000 |
| 8 | Ga Biên Hòa | 10.9450 | 106.8200 |
| 9 | Ga Sài Gòn | 10.7820 | 106.6770 |
| 10 | Ga Cần Thơ | 10.0340 | 105.7880 |

### Routes

1. **SE1 - Hà Nội - Sài Gòn (Thống Nhất)** - 8 stations, 1726 km
2. **SE2 - Sài Gòn - Hà Nội** - 8 stations (reverse)
3. **SE3 - Hà Nội - Đà Nẵng** - 4 stations, 791 km
4. **SNT1 - Sài Gòn - Nha Trang** - 3 stations, 411 km
5. **SCT1 - Sài Gòn - Cần Thơ** - 2 stations, 169 km (draft)

### Coach Templates

1. **SEAT_S64** - 16 rows × 4 cols = 64 seats
2. **BED_K6** - 7 rows × 3 tiers = 42 beds (khoang 6)
3. **BED_K4** - 7 rows × 2 tiers = 28 beds (VIP)
4. **SEAT_AUX** - 10 rows × 1 col = 10 auxiliary seats

---

## 🚀 How to Run Seed

```bash
cd source/api
npx prisma db seed
```

Or directly:
```bash
npx tsx prisma/seed.ts
```

---

## 🔧 Key Learnings

### Prisma v7 Changes

1. **Seed configuration** moved from `package.json` to `prisma.config.ts`
2. **Uses `tsx`** instead of `ts-node` for TypeScript execution
3. **Requires adapter** - Must use `PrismaPg` for PostgreSQL
4. **No auto-seed** - Only runs when explicitly called with `npx prisma db seed`

### Adapter Pattern

Prisma v7 requires explicit adapter initialization:

```typescript
// Required for PostgreSQL
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });
```

This matches the pattern used in `PrismaService` for consistency.

---

## ✅ Verification

Check seeded data in database:

```sql
-- Stations
SELECT COUNT(*) FROM "Station"; -- 10

-- Routes  
SELECT COUNT(*) FROM "Route"; -- 5

-- Route Stations
SELECT COUNT(*) FROM "RouteStation"; -- 27

-- Coach Templates
SELECT COUNT(*) FROM "CoachTemplate"; -- 4
```

Or via API:
```bash
curl http://localhost:8000/station
curl http://localhost:8000/route
```

---

**Status:** ✅ Complete  
**Files Modified:** 2  
**Dependencies Added:** tsx  
**Data Created:** 10 stations, 5 routes, 27 route-stations, 4 templates
