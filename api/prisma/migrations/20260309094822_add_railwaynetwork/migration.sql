-- CreateTable
CREATE TABLE "RailwayNetwork" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "pathCoordinates" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RailwayNetwork_pkey" PRIMARY KEY ("id")
);
