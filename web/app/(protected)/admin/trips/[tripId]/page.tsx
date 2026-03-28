'use client';

import * as React from 'react';

import { useTrip } from "@/features/trips/hooks/use-trips";
import { AdminTripHeader } from "@/features/admin/components/admin-trip-header";
import { AdminSeatMap } from "@/features/admin/components/admin-seat-map";
import { DelayControlDialog } from "@/features/admin/components/delay-control-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, TrendingUp, Users, Ticket, Wallet, CheckCircle2 } from "lucide-react";
import { useTripStats } from "@/features/trips/hooks/use-trip-stats";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function TripDetailPage({ params }: { params: Promise<{ tripId: string }> }) {
    const { tripId } = React.use(params);
    const { data: trip, isLoading, error } = useTrip(tripId);
    const { data: stats } = useTripStats(tripId);

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
        <div className="flex flex-col gap-6">
            <AdminTripHeader trip={trip} />
            
            {/* 4 Key Metrics Card */}
            <div className="rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-lg shadow-rose-900/[0.015] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-8 relative group">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground/60">
                            <Wallet className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Doanh thu dự kiến</span>
                        </div>
                        <div className="text-2xl font-bold text-[#802222] dark:text-rose-400 tabular-nums">
                            {formatCurrency(stats?.revenue || 0)}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground/60">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Tỷ lệ lấp đầy</span>
                        </div>
                        <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
                            {stats?.occupancy || 0}%
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground/60">
                            <Ticket className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Vé đã bán</span>
                        </div>
                        <div className="text-2xl font-bold text-emerald-600 tabular-nums">
                            {stats?.ticketsSold || 0}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground/60">
                            <Users className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Giữ chỗ (Pending)</span>
                        </div>
                        <div className="text-2xl font-bold text-amber-500 tabular-nums">
                            {stats?.ticketsPending || 0}
                        </div>
                    </div>
                </div>
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-rose-100/20 dark:bg-rose-900/5 rounded-full blur-3xl z-0" />
            </div>

            {/* Quản lý & Vận hành */}
            <div className="rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-lg shadow-rose-900/[0.015] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 relative group">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-none">Quản lý & Vận hành</h3>
                        <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest">Thiết lập trạng thái và tra cứu hành khách</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <DelayControlDialog
                            tripId={trip.id}
                            tripStatus={trip.status}
                            currentDepartureDelay={trip.departureDelayMinutes || 0}
                            currentArrivalDelay={trip.arrivalDelayMinutes || 0}
                        />
                        
                        <Button 
                            variant="outline" 
                            className="h-12 px-6 rounded-xl border-gray-100 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-[#802222] dark:hover:text-rose-400 transition-all flex items-center gap-2 group/btn"
                            onClick={() => {
                                const searchBtn = document.querySelector('[data-search-passenger="true"]') as HTMLButtonElement;
                                if (searchBtn) searchBtn.click();
                            }}
                        >
                            <Users className="w-4 h-4 opacity-40 group-hover/btn:opacity-100 group-hover/btn:scale-110 transition-all" />
                            <span className="text-xs font-bold uppercase tracking-wider">Tìm hành khách</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Admin Seat Map */}
            <AdminSeatMap trip={trip} />
        </div>
    );
}
