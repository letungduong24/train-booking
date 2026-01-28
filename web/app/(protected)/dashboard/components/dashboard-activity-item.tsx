'use client';

import { Booking } from '@/features/booking/hooks/use-my-bookings';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Clock, XCircle, Ticket } from 'lucide-react';

interface DashboardActivityItemProps {
    booking: Booking;
}

export function DashboardActivityItem({ booking }: DashboardActivityItemProps) {
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'PAID':
                return {
                    icon: CreditCard,
                    label: 'Thanh toán thành công',
                    color: 'text-green-600',
                    bgColor: 'bg-green-100',
                    badge: <Badge className="bg-green-600 hover:bg-green-700">Đã thanh toán</Badge>
                };
            case 'PENDING':
                return {
                    icon: Clock,
                    label: 'Đặt vé mới (Chờ thanh toán)',
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-100',
                    badge: <Badge variant="outline" className="text-yellow-600 border-yellow-600">CC</Badge>
                };
            case 'CANCELLED':
                return {
                    icon: XCircle,
                    label: 'Đã hủy vé',
                    color: 'text-red-600',
                    bgColor: 'bg-red-100',
                    badge: <Badge variant="destructive">Đã hủy</Badge>
                };
            default:
                return {
                    icon: Ticket,
                    label: 'Đặt vé',
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-100',
                    badge: <Badge variant="secondary">{status}</Badge>
                };
        }
    };

    const statusInfo = getStatusInfo(booking.status);
    const StatusIcon = statusInfo.icon;

    return (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
                    <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                </div>
                <div>
                    <p className="font-medium text-sm">{statusInfo.label} - {booking.code}</p>
                    <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                    </p>
                </div>
            </div>
            <div className="font-semibold text-sm">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalPrice)}
            </div>
        </div>
    );
}
