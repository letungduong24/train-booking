'use client';

import { Train, ArrowRight, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Booking } from '@/features/booking/hooks/use-my-bookings';
import { cn } from '@/lib/utils';

interface DashboardTripCardProps {
    booking: Booking;
    showStatus?: boolean;
}

export function DashboardTripCard({ booking, showStatus }: DashboardTripCardProps) {
    const router = useRouter();
    const departureDate = new Date(booking.trip.departureTime);

    return (
        <div 
            className="group relative bg-gradient-to-br from-[#802222] to-rose-900 text-white rounded-2xl p-5 shadow-lg shadow-rose-900/10 border border-rose-800/20 transition-all hover:scale-[1.02] cursor-pointer overflow-hidden active:scale-[0.98]"
            onClick={() => router.push(`/dashboard/history/${booking.code}`)}
        >
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#802222] shadow-sm">
                        <Train className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-base font-semibold tracking-tight leading-none mb-1">{booking.trip.route.name}</h4>
                        <p className="text-xs font-medium text-rose-100/80 leading-none">Tàu {booking.trip.train.code}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    {showStatus && (() => {
                        const getStatusStyles = (status: string) => {
                            switch (status) {
                                case 'PENDING': return { bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' };
                                case 'PAID': return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' };
                                case 'CANCELLED': return { bg: 'bg-gray-500/10', text: 'text-gray-600', dot: 'bg-gray-500' };
                                case 'PAYMENT_FAILED': return { bg: 'bg-rose-500/10', text: 'text-rose-600', dot: 'bg-rose-500' };
                                default: return { bg: 'bg-muted/20', text: 'text-muted-foreground', dot: 'bg-muted-foreground' };
                            }
                        };
                        const getStatusLabel = (status: string) => {
                            switch (status) {
                                case 'PENDING': return 'Chờ thanh toán';
                                case 'PAID': return 'Đã thanh toán';
                                case 'CANCELLED': return 'Đã hủy';
                                case 'PAYMENT_FAILED': return 'Lỗi thanh toán';
                                default: return status;
                            }
                        };
                        const styles = getStatusStyles(booking.status);
                        return (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 text-white">
                                <div className={cn("w-2 h-2 rounded-full shrink-0", 
                                    booking.status === 'PAID' ? 'bg-emerald-400' :
                                    booking.status === 'PENDING' ? 'bg-amber-400' :
                                    booking.status === 'PAYMENT_FAILED' ? 'bg-rose-400' :
                                    'bg-gray-300'
                                )} />
                                <span className="text-xs font-medium leading-none">
                                    {getStatusLabel(booking.status)}
                                </span>
                            </div>
                        );
                    })()}
                    <ArrowRight className="h-4 w-4 text-white/80 group-hover:translate-x-1 transition-all" />
                </div>
            </div>

            <div className="flex justify-between items-center px-1 relative z-10">
                <div className="flex flex-col">
                    <span className="text-xl font-semibold tabular-nums leading-none mb-1">
                        {format(departureDate, 'HH:mm')}
                    </span>
                    <span className="text-xs font-medium text-rose-100/80">{format(departureDate, 'dd/MM/yyyy')}</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-4">
                    <div className="w-full h-[1px] bg-white/20 relative flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    </div>
                    <p className="text-[10px] font-medium text-white/60 mt-1.5">Lộ trình</p>
                </div>

                <div className="text-right">
                    <p className="text-sm font-semibold leading-none mb-1 truncate max-w-[100px]">
                        {booking.trip.route.name.split(' - ')[1]}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                        <MapPin className="h-3.5 w-3.5 text-white/60" />
                        <span className="text-[10px] font-medium text-rose-100/80 leading-none">Ga đến</span>
                    </div>
                </div>
            </div>

            {/* Decorative background element */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl z-0" />
        </div>
    );
}
