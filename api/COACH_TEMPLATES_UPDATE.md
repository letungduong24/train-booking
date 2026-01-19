# Coach Templates Update Summary

Updated coach templates from 4 to 6 types to match Vietnam railway standards.

---

## ✅ Changes Made

### 1. Updated Seed File

**File:** [`prisma/seed.ts`](file:///home/duong/Study/datn/source/api/prisma/seed.ts)

**Before:** 4 coach templates  
**After:** 6 coach templates

### 2. Updated Mock Data

**File:** [`lib/mock-data/train.ts`](file:///home/duong/Study/datn/source/web/lib/mock-data/train.ts)

**Before:** 5 coaches  
**After:** 6 coaches

---

## 📊 New Coach Templates

| # | Code | Name | Layout | Rows | Cols | Tiers | Total | Description |
|---|------|------|--------|------|------|-------|-------|-------------|
| 1 | `SEAT_SOFT` | Ngồi mềm (Thường) | SEAT | 16 | 4 | 1 | 64 | Ghế ngồi mềm thường, bố trí 2-2 |
| 2 | `SEAT_AC` | Ngồi mềm (Điều hòa) | SEAT | 16 | 4 | 1 | 64 | Ghế ngồi mềm có điều hòa, bố trí 2-2 |
| 3 | `SEAT_HARD` | Ngồi cứng | SEAT | 20 | 4 | 1 | 80 | Ghế ngồi cứng, có bàn ở giữa mỗi cặp hàng |
| 4 | `BED_VIP2` | Giường VIP (Khoang 2) | BED | 7 | 1 | 1 | 14 | Mỗi khoang 2 giường đơn, riêng tư cao cấp |
| 5 | `BED_K4` | Giường nằm (Khoang 4) | BED | 7 | 1 | 2 | 28 | Giường tầng 2 tầng, mỗi khoang 4 giường |
| 6 | `BED_K6` | Giường nằm (Khoang 6) | BED | 7 | 1 | 3 | 42 | Giường tầng 3 tầng, mỗi khoang 6 giường |

---

## 🚂 Mock Train Configuration

**Train:** SE1 - Tàu Thống Nhất  
**Total Coaches:** 6  
**Total Seats/Beds:** 306

### Coach Breakdown

1. **Toa 1** - SEAT_AC (64 ghế)
2. **Toa 2** - BED_K6 (42 giường)
3. **Toa 3** - BED_K4 (28 giường)
4. **Toa 4** - BED_VIP2 (14 giường)
5. **Toa 5** - SEAT_SOFT (64 ghế)
6. **Toa 6** - SEAT_HARD (80 ghế)

---

## 🎨 Frontend Notes

### SEAT Layouts (2-2 Configuration)

All SEAT types use 2-2 layout:
```
[Seat] [Seat]  | aisle |  [Seat] [Seat]
```

### SEAT_HARD Special Feature

Has table between each pair of rows (to be implemented in frontend).

### BED Layouts

- **BED_VIP2**: 1 tier (2 beds per compartment)
- **BED_K4**: 2 tiers (4 beds per compartment)
- **BED_K6**: 3 tiers (6 beds per compartment)

---

## ✅ Seed Results

```
🌱 Starting seed...
🗑️  Clearing existing data...
🚉 Creating stations...
✅ Created 10 stations
🛤️  Creating routes...
✅ Created 5 routes
🚃 Creating coach templates...
✅ Created 6 coach templates

📊 Seed Summary:
   - Stations: 10
   - Routes: 5
   - Coach Templates: 6

✨ Seed completed successfully!
```

---

## 🔄 Database State

After running seed:

- **Stations:** 10 (Vietnam railway stations)
- **Routes:** 5 (SE1, SE2, SE3, SNT1, SCT1)
- **Coach Templates:** 6 (as per table above)

---

**Updated:** 2026-01-18  
**Status:** ✅ Complete
