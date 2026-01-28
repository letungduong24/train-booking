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
                <Button variant="outline" className="w-full justify-start gap-2">
                    <Clock className="w-4 h-4" />
                    Quản lý Delay
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Quản lý Delay Chuyến Tàu</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 pt-2">
                        Trạng thái: <TripStatusBadge status={tripStatus} />
                    </DialogDescription>
                </DialogHeader>

                {isScheduled && (
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm border border-yellow-200">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <p>Delay khởi hành sẽ làm thay đổi giờ hành khách lên tàu.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="departure-delay">Số phút delay (Khởi hành)</Label>
                            <Input
                                id="departure-delay"
                                type="number"
                                value={departureDelay}
                                onChange={(e) => setDepartureDelay(e.target.value)}
                                placeholder="0"
                            />
                        </div>

                        <Button
                            className="w-full"
                            onClick={() => {
                                mutateDepartureDelay(parseInt(departureDelay) || 0, {
                                    onSuccess: () => setOpen(false)
                                });
                            }}
                            disabled={isSettingDepartureDelay}
                        >
                            {isSettingDepartureDelay ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </div>
                )}

                {isInProgress && (
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-800 rounded-md text-sm border border-blue-200">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <p>Delay về bến chỉ ảnh hưởng đến thời gian dự kiến đến nơi.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="arrival-delay">Số phút delay (Về bến)</Label>
                            <Input
                                id="arrival-delay"
                                type="number"
                                value={arrivalDelay}
                                onChange={(e) => setArrivalDelay(e.target.value)}
                                placeholder="0"
                            />
                        </div>

                        <Button
                            className="w-full"
                            onClick={() => {
                                mutateArrivalDelay(parseInt(arrivalDelay) || 0, {
                                    onSuccess: () => setOpen(false)
                                });
                            }}
                            disabled={isSettingArrivalDelay}
                        >
                            {isSettingArrivalDelay ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
