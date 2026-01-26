'use client';

import * as React from 'react';

import { useTrip } from "@/features/trips/hooks/use-trips";
import { AdminTripHeader } from "@/features/admin/components/admin-trip-header";
import { AdminSeatMap } from "@/features/admin/components/admin-seat-map";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function TripDetailPage({ params }: { params: Promise<{ tripId: string }> }) {
    const { tripId } = React.use(params);
    const { data: trip, isLoading, error } = useTrip(tripId);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    if (error || !trip) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>
                        Không thể tải thông tin chuyến đi. Vui lòng thử lại sau.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8">
            <AdminTripHeader trip={trip} />

            {/* Admin Seat Map */}
            <AdminSeatMap trip={trip} />

            {/* Passenger Manifest */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {/* Passenger Manifest Removed - Integrated into Seat Map */}
                    <div className="p-4 border rounded-lg bg-muted/20 text-center text-muted-foreground">
                        Danh sách hành khách đã được tích hợp vào sơ đồ ghế.
                        <br />Sử dụng thanh tìm kiếm trên sơ đồ để tìm khách.
                    </div>
                </div>
                <div>
                    {/* Operation Panel Placeholder */}
                    <div className="min-h-[200px] border rounded-lg bg-card p-4">
                        <h3 className="font-semibold mb-2">Vận hành</h3>
                        <p className="text-sm text-muted-foreground">Các chức năng Delay, Hủy chuyến sẽ được thêm vào đây.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
