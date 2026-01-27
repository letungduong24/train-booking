/*
  Warnings:

  - The `status` column on the `Coach` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Route` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Train` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Trip` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'DRIVER');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TrainStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "CoachStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Coach" DROP COLUMN "status",
ADD COLUMN     "status" "CoachStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Route" DROP COLUMN "status",
ADD COLUMN     "status" "RouteStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Train" DROP COLUMN "status",
ADD COLUMN     "status" "TrainStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "status",
ADD COLUMN     "status" "TripStatus" NOT NULL DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';
