'use client';

import { useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { useTripDelayMutations } from "@/features/trips/hooks/use-trip-delay-mutations";
import { TripStatusBadge } from "@/lib/utils/trip-status";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DelayControlDialogProps {
    tripId: string;
    tripStatus: string;
    currentDepartureDelay: number;
    currentArrivalDelay: number;
}

export function DelayControlDialog({ tripId, tripStatus, currentDepartureDelay = 0, currentArrivalDelay = 0 }: DelayControlDialogProps) {
    const [open, setOpen] = useState(false);
    const [departureDelay, setDepartureDelay] = useState(currentDepartureDelay.toString());
    const [arrivalDelay, setArrivalDelay] = useState(currentArrivalDelay.toString());

    // Custom hook
    const {
        setDepartureDelay: mutateDepartureDelay,
        isSettingDepartureDelay,
        setArrivalDelay: mutateArrivalDelay,
        isSettingArrivalDelay
    } = useTripDelayMutations(tripId);

    const isScheduled = tripStatus === 'SCHEDULED';
    const isInProgress = tripStatus === 'IN_PROGRESS';

    if (!isScheduled && !isInProgress) {
        return null;
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (newOpen) {
            setDepartureDelay(currentDepartureDelay.toString());
            setArrivalDelay(currentArrivalDelay.toString());
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    className="h-12 px-6 rounded-xl border-gray-100 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-[#802222] dark:hover:text-rose-400 transition-all flex items-center gap-2 group/btn"
                >
                    <Clock className="w-4 h-4 opacity-40 group-hover/btn:opacity-100 group-hover/btn:scale-110 transition-all" />
                    <span className="text-xs font-bold uppercase tracking-wider">Quản lý Delay</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight flex items-center gap-2">
                        <Clock className="w-5 h-5 opacity-40" />
                        Quản lý Delay
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 pt-2 text-[10px] font-medium text-muted-foreground/50">
                        Trạng thái: <TripStatusBadge status={tripStatus} />
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-6 space-y-6">
                    {isScheduled && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-amber-50/50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-300 rounded-2xl text-[11px] font-medium border border-amber-100 dark:border-amber-900/20">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 opacity-60" />
                                <p>Delay khởi hành sẽ làm thay đổi giờ hành khách lên tàu.</p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="departure-delay" className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">Số phút delay (Khởi hành)</Label>
                                <Input
                                    id="departure-delay"
                                    type="number"
                                    value={departureDelay}
                                    onChange={(e) => setDepartureDelay(e.target.value)}
                                    placeholder="0"
                                    className="h-12 rounded-xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800"
                                />
                            </div>

                            <Button
                                className="w-full bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-12 font-bold shadow-lg shadow-rose-900/20"
                                onClick={() => {
                                    mutateDepartureDelay(parseInt(departureDelay) || 0, {
                                        onSuccess: () => setOpen(false)
                                    });
                                }}
                                disabled={isSettingDepartureDelay}
                            >
                                {isSettingDepartureDelay ? "Đang lưu..." : "Cập nhật Delay"}
                            </Button>
                        </div>
                    )}

                    {isInProgress && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-blue-50/50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300 rounded-2xl text-[11px] font-medium border border-blue-100 dark:border-blue-900/20">
                                <Clock className="w-4 h-4 flex-shrink-0 opacity-60" />
                                <p>Delay về bến chỉ ảnh hưởng đến thời gian dự kiến đến nơi.</p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="arrival-delay" className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">Số phút delay (Về bến)</Label>
                                <Input
                                    id="arrival-delay"
                                    type="number"
                                    value={arrivalDelay}
                                    onChange={(e) => setArrivalDelay(e.target.value)}
                                    placeholder="0"
                                    className="h-12 rounded-xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800"
                                />
                            </div>

                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-blue-900/20"
                                onClick={() => {
                                    mutateArrivalDelay(parseInt(arrivalDelay) || 0, {
                                        onSuccess: () => setOpen(false)
                                    });
                                }}
                                disabled={isSettingArrivalDelay}
                            >
                                {isSettingArrivalDelay ? "Đang lưu..." : "Cập nhật Delay"}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
