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

                        <ScrollArea className="max-h-[300px] pr-4">
                            <div className="space-y-4">
                                {selectedSeats.map((seat) => (
                                    <div key={seat.id} className="flex items-center justify-between group p-3 rounded-2xl bg-gray-50/50 hover:bg-white hover:shadow-md transition-all">
                                        <div>
                                            <p className="font-semibold text-sm text-[#802222]">{getSeatName(seat.name, seat.type)}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                                                {seat.price.toLocaleString('vi-VN')} ₫
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-full hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => onRemoveSeat(seat.id)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <Separator className="bg-gray-100 dark:bg-zinc-800/50" />

                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-xs font-medium text-muted-foreground">Tạm tính</span>
                                <span className="font-medium text-gray-600 dark:text-gray-400">{totalPrice.toLocaleString('vi-VN')} ₫</span>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-sm font-semibold text-[#802222]">Tổng cộng</span>
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
