# Prisma Seed Instructions

## 📦 Seed Data Created

File: [`prisma/seed.ts`](file:///home/duong/Study/datn/source/api/prisma/seed.ts)

### Data Included:

#### 🚉 10 Stations (Real Vietnam Railway Stations)
1. Ga Hà Nội (21.0245, 105.8412)
2. Ga Vinh (18.6792, 105.6811)
3. Ga Huế (16.4637, 107.5909)
4. Ga Đà Nẵng (16.0544, 108.2022)
5. Ga Quảng Ngãi (15.1214, 108.8044)
6. Ga Nha Trang (12.2388, 109.1967)
7. Ga Phan Thiết (10.9333, 108.1000)
8. Ga Biên Hòa (10.9450, 106.8200)
9. Ga Sài Gòn (10.7820, 106.6770)
10. Ga Cần Thơ (10.0340, 105.7880)

#### 🛤️ 5 Routes (Real Vietnam Railway Routes)
1. **SE1 - Hà Nội - Sài Gòn (Thống Nhất)** - 8 stations, 1726 km
2. **SE2 - Sài Gòn - Hà Nội** - 8 stations (reverse direction)
3. **SE3 - Hà Nội - Đà Nẵng** - 4 stations, 791 km
4. **SNT1 - Sài Gòn - Nha Trang** - 3 stations, 411 km
5. **SCT1 - Sài Gòn - Cần Thơ** - 2 stations, 169 km (draft status)

#### 🚃 4 Coach Templates
1. **SEAT_S64** - Ngồi mềm điều hòa (64 chỗ)
   - Layout: SEAT
   - 16 rows × 4 cols × 1 tier = 64 seats

2. **BED_K6** - Giường nằm khoang 6 (42 giường)
   - Layout: BED
   - 7 rows × 1 col × 3 tiers = 42 beds

3. **BED_K4** - Giường nằm khoang 4 VIP (28 giường)
   - Layout: BED
   - 7 rows × 1 col × 2 tiers = 28 beds

4. **SEAT_AUX** - Ghế phụ (10 ghế)
   - Layout: SEAT
   - 10 rows × 1 col × 1 tier = 10 seats

---

## 🚀 How to Run Seed

### Option 1: Using Prisma CLI (Recommended)

```bash
cd source/api
npx prisma db seed
```

### Option 2: Using ts-node directly

```bash
cd source/api
npx ts-node prisma/seed.ts
```

### Option 3: After migration

Seed automatically runs after `prisma migrate dev`:

```bash
cd source/api
npx prisma migrate dev
```

---

## ⚠️ Important Notes

### Database Will Be Cleared

The seed script **clears all existing data** before seeding:
- ✅ Seats
- ✅ Coaches
- ✅ Trains
- ✅ Coach Templates
- ✅ Route Stations
- ✅ Routes
- ✅ Stations

**Users and RefreshTokens are NOT cleared** - you can still login with existing accounts.

### Order Matters

Data is deleted and created in the correct order to respect foreign key constraints:
1. Delete: Seats → Coaches → Trains → Templates → RouteStations → Routes → Stations
2. Create: Stations → Routes → RouteStations → Templates

---

## 🧪 Verify Seed Data

After running seed, verify in your database:

```sql
-- Check stations
SELECT COUNT(*) FROM "Station"; -- Should be 10

-- Check routes
SELECT COUNT(*) FROM "Route"; -- Should be 5

-- Check route stations
SELECT COUNT(*) FROM "RouteStation"; -- Should be 27

-- Check coach templates
SELECT COUNT(*) FROM "CoachTemplate"; -- Should be 4

-- View a route with stations
SELECT r.name, rs.index, s.name as station_name, rs."distanceFromStart"
FROM "Route" r
JOIN "RouteStation" rs ON r.id = rs."routeId"
JOIN "Station" s ON rs."stationId" = s.id
WHERE r.name LIKE '%SE1%'
ORDER BY rs.index;
```

---

## 📊 Expected Output

When running seed, you should see:

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

## 🔧 Troubleshooting

### Error: "Cannot find module"

Make sure you're in the correct directory:
```bash
cd source/api
```

### Error: "Prisma Client not generated"

Generate Prisma Client first:
```bash
npx prisma generate
```

### Error: Foreign key constraint

The seed script handles this automatically by deleting in the correct order. If you still get errors, try:
```bash
# Reset database completely
npx prisma migrate reset
```

---

## 🎯 Next Steps

After seeding:

1. **Test Routes API**
   ```bash
   curl http://localhost:8000/route
   ```

2. **Test Stations API**
   ```bash
   curl http://localhost:8000/station
   ```

3. **Test Coach Templates API**
   ```bash
   curl http://localhost:8000/coach-template
   ```

4. **View in Frontend**
   - Navigate to `/admin/routes`
   - Navigate to `/admin/stations`
   - Navigate to `/admin/trains`

---

**Created:** 2026-01-17  
**Database:** PostgreSQL  
**Prisma Version:** 7.2.0
