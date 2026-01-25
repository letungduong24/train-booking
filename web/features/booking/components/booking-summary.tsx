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

export function BookingSummary({
    selectedSeats,
    onRemoveSeat,
    onProceed,
    isProcessing,
    className
}: BookingSummaryProps) {
    const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

    return (
        <Card className={`h-fit ${className}`}>
            <CardHeader>
                <CardTitle>Chi tiết đặt chỗ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {selectedSeats.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        Chưa có ghế nào được chọn
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span>Chỗ đã chọn</span>
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                                {selectedSeats.length} chỗ
                            </span>
                        </div>

                        <ScrollArea className="h-fit">
                            <div className="space-y-3">
                                {selectedSeats.map((seat) => (
                                    <div key={seat.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="font-medium text-sm">{getSeatName(seat.name, seat.type)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-sm">
                                                {seat.price.toLocaleString('vi-VN')} ₫
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => onRemoveSeat(seat.id)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <Separator />

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tạm tính</span>
                                <span>{totalPrice.toLocaleString('vi-VN')} ₫</span>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex justify-between items-center pt-2">
                            <span className="font-bold text-lg">Tổng cộng</span>
                            <span className="font-bold text-xl text-primary">
                                {totalPrice.toLocaleString('vi-VN')} ₫
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full"
                    size="lg"
                    onClick={onProceed}
                    disabled={selectedSeats.length === 0 || isProcessing}
                >
                    {isProcessing ? 'Đang xử lý...' : 'Tiếp tục thanh toán'}
                </Button>
            </CardFooter>
        </Card>
    );
}
