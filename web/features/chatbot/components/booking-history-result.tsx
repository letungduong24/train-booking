"use client";

import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { TicketCheck, Train, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BookingHistoryData {
    bookingCode: string;
    status: string;
    totalPrice: number;
    createdAt: string;
    routeName: string;
    trainCode: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PAID: { label: "Đã thanh toán", variant: "default" },
    PENDING: { label: "Chờ thanh toán", variant: "secondary" },
    CANCELLED: { label: "Đã hủy", variant: "destructive" },
    PAYMENT_FAILED: { label: "Thanh toán thất bại", variant: "destructive" },
};

function BookingHistoryCard({ booking }: { booking: BookingHistoryData }) {
    const status = STATUS_MAP[booking.status] ?? { label: booking.status, variant: "outline" as const };

    return (
        <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-xs font-mono text-muted-foreground">{booking.bookingCode}</p>
                    <p className="text-sm font-semibold truncate">{booking.routeName || "—"}</p>
                </div>
                <Badge variant={status.variant} className="text-[10px] shrink-0">{status.label}</Badge>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Train className="h-3 w-3" />
                    {booking.trainCode || "—"}
                </span>
                <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(booking.createdAt), "dd/MM/yyyy", { locale: vi })}
                </span>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-primary">
                    {booking.totalPrice.toLocaleString("vi-VN")} ₫
                </p>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                    <Link href={`/dashboard/history/${booking.bookingCode}`}>Xem chi tiết</Link>
                </Button>
            </div>
        </div>
    );
}

interface BookingHistoryResultProps {
    bookings: BookingHistoryData[];
}

export function BookingHistoryResult({ bookings }: BookingHistoryResultProps) {
    if (bookings.length === 0) {
        return (
            <div className="rounded-xl border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                Bạn chưa có đơn đặt vé nào.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 w-full">
            <p className="text-xs text-muted-foreground px-1">
                {bookings.length} đơn gần nhất
            </p>
            {bookings.map((b) => (
                <BookingHistoryCard key={b.bookingCode} booking={b} />
            ))}
        </div>
    );
}
