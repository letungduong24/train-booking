import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { getSeatName } from "@/lib/utils/seat-helper";

interface SelectedSeat {
    id: string;
    name: string;
    price: number;
    type: string;
}

interface BookingSummaryProps {
    selectedSeats: SelectedSeat[];
    onRemoveSeat: (seatId: string) => void;
    onProceed: () => void;
    isProcessing: boolean;
    className?: string;
}

export const BookingSummary = React.memo(({
    selectedSeats,
    onRemoveSeat,
    onProceed,
    isProcessing,
    className
}: BookingSummaryProps) => {
    const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

    return (
        <div className={`bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-zinc-800 h-fit ${className}`}>
            <div className="mb-6">
                <h3 className="text-lg font-bold text-[#802222] dark:text-rose-400 tracking-tight">Chi tiết đặt chỗ</h3>
            </div>
            
            <div className="space-y-5">
                {selectedSeats.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10 bg-gray-50 dark:bg-zinc-800/50 rounded-[1.5rem] border border-dashed border-gray-200">
                        <p className="text-sm font-medium opacity-50">Chưa có ghế nào được chọn</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-muted-foreground">Chỗ đã chọn</span>
                            <span className="bg-rose-50 dark:bg-rose-950/20 text-[#802222] dark:text-rose-400 px-3 py-1 rounded-full text-xs font-medium">
                                {selectedSeats.length} chỗ
                            </span>
                        </div>

                        <div className="relative overflow-hidden rounded-2xl border border-gray-100/50 dark:border-zinc-800/50 bg-gray-50/30">
                            <ScrollArea className="h-[280px] w-full">
                                <div className="p-4 space-y-3">
                                    {selectedSeats.map((seat) => (
                                        <div key={seat.id} className="flex items-center justify-between group p-3 rounded-xl bg-white shadow-sm border border-gray-100/50 transition-all">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className="font-bold text-sm text-[#802222] truncate">{getSeatName(seat.name, seat.type)}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-full hover:bg-red-50 hover:text-red-500 text-muted-foreground/30 hover:text-red-600 transition-all flex-shrink-0"
                                                onClick={() => onRemoveSeat(seat.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        <div className="pt-2 space-y-4">
                            <div className="flex justify-between items-center bg-[#802222]/[0.02] p-4 rounded-2xl border border-[#802222]/5">
                                <span className="text-sm font-semibold text-[#802222]/60">Tổng cộng</span>
                                <span className="text-xl font-bold text-[#802222] dark:text-rose-400 tabular-nums">
                                    {totalPrice.toLocaleString('vi-VN')} ₫
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8">
                <Button
                    className="w-full bg-[#802222] hover:bg-rose-900 text-white font-medium h-11 rounded-full text-sm shadow-xl shadow-rose-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] border-none"
                    onClick={onProceed}
                    disabled={selectedSeats.length === 0 || isProcessing}
                >
                    {isProcessing ? 'Đang xử lý...' : 'Tiếp tục thanh toán'}
                </Button>
            </div>
        </div>
    );
});
