'use client';

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Clock, AlertTriangle } from "lucide-react";

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
    const queryClient = useQueryClient();
    const [departureDelay, setDepartureDelay] = useState(currentDepartureDelay.toString());
    const [arrivalDelay, setArrivalDelay] = useState(currentArrivalDelay.toString());

    // Mutations
    const setDepartureDelayMutation = useMutation({
        mutationFn: async (minutes: number) => {
            await apiClient.patch(`/trip/${tripId}/departure-delay`, { minutes });
        },
        onSuccess: () => {
            toast.success("Cập nhật delay khởi hành thành công");
            queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
            setOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật delay");
        }
    });

    const setArrivalDelayMutation = useMutation({
        mutationFn: async (minutes: number) => {
            await apiClient.patch(`/trip/${tripId}/arrival-delay`, { minutes });
        },
        onSuccess: () => {
            toast.success("Cập nhật delay đến nơi thành công");
            queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
            setOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật delay");
        }
    });

    const isScheduled = tripStatus === 'SCHEDULED';
    const isInProgress = tripStatus === 'IN_PROGRESS';

    if (!isScheduled && !isInProgress) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                    <Clock className="w-4 h-4" />
                    Quản lý Delay
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Quản lý Delay Chuyến Tàu</DialogTitle>
                    <DialogDescription>
                        Trạng thái: <span className="font-bold">{tripStatus}</span>
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
                            onClick={() => setDepartureDelayMutation.mutate(parseInt(departureDelay) || 0)}
                            disabled={setDepartureDelayMutation.isPending}
                        >
                            {setDepartureDelayMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
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
                            onClick={() => setArrivalDelayMutation.mutate(parseInt(arrivalDelay) || 0)}
                            disabled={setArrivalDelayMutation.isPending}
                        >
                            {setArrivalDelayMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
