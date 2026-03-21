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
                    color: 'text-[#802222]',
                    bgColor: 'bg-rose-50',
                    badge: <Badge className="bg-[#802222] hover:bg-rose-900 border-none text-[8px] font-bold uppercase h-4 px-1.5">Đã thanh toán</Badge>
                };
            case 'PENDING':
                return {
                    icon: Clock,
                    label: 'Chờ thanh toán',
                    color: 'text-amber-600',
                    bgColor: 'bg-amber-50',
                    badge: <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-[8px] font-bold uppercase h-4 px-1.5">Chờ xử lý</Badge>
                };
            case 'CANCELLED':
                return {
                    icon: XCircle,
                    label: 'Đã hủy vé',
                    color: 'text-gray-400',
                    bgColor: 'bg-gray-50',
                    badge: <Badge variant="destructive" className="bg-gray-100 text-gray-400 border-none text-[8px] font-bold uppercase h-4 px-1.5">Đã hủy</Badge>
                };
            default:
                return {
                    icon: Ticket,
                    label: 'Đặt vé',
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                    badge: <Badge variant="secondary" className="text-[8px] font-bold uppercase h-4 px-1.5">{status}</Badge>
                };
        }
    };

    const statusInfo = getStatusInfo(booking.status);
    const StatusIcon = statusInfo.icon;

    return (
        <div className="flex items-center justify-between p-4 rounded-[1.2rem] border border-gray-100 bg-white dark:bg-zinc-900 hover:shadow-lg hover:shadow-gray-100 transition-all group">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${statusInfo.bgColor}`}>
                    <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-black text-sm text-gray-900 dark:text-gray-100 uppercase tracking-tight">{statusInfo.label}</p>
                        <span className="text-[9px] font-bold text-muted-foreground opacity-40">#{booking.code}</span>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                        {format(new Date(booking.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                    </p>
                </div>
            </div>
            <div className="font-black text-base tabular-nums text-[#802222]">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalPrice)}
            </div>
        </div>
    );
}
