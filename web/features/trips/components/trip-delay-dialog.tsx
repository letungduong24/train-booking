"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";

interface TripDelayDialogProps {
  trip: {
    id: string;
    status: string;
    departureTime: string;
    endTime: string;
    departureDelayMinutes: number;
    arrivalDelayMinutes: number;
  };
  onSuccess?: () => void;
}

export function TripDelayDialog({ trip, onSuccess }: TripDelayDialogProps) {
  const [open, setOpen] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [loading, setLoading] = useState(false);

  const isScheduled = trip.status === "SCHEDULED";
  const isInProgress = trip.status === "IN_PROGRESS";
  const canSetDelay = isScheduled || isInProgress;

  if (!canSetDelay) {
    return null;
  }

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const endpoint = isScheduled ? "departure-delay" : "arrival-delay";
      const response = await fetch(`/api/trip/${trip.id}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes: delayMinutes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to set delay");
      }

      toast.success(`Đã set delay ${delayMinutes} phút`);
      setOpen(false);
      setDelayMinutes(0);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // Calculate actual times
  const actualDeparture = dayjs(trip.departureTime)
    .add(isScheduled ? delayMinutes : trip.departureDelayMinutes, "minute")
    .format("HH:mm DD/MM/YYYY");

  const actualEnd = dayjs(trip.endTime)
    .add(trip.departureDelayMinutes, "minute")
    .add(isInProgress ? delayMinutes : trip.arrivalDelayMinutes, "minute")
    .format("HH:mm DD/MM/YYYY");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Set Delay
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:top-8 [&>button:last-child]:right-8">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 opacity-40" />
            {isScheduled ? "Delay Khởi Hành" : "Delay Kết Thúc"}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-muted-foreground/50">
            {isScheduled
              ? "Cập nhật thời gian khởi hành và kết thúc dự kiến"
              : "Chỉ cập nhật thời gian kết thúc dự kiến (tàu đang chạy)"}
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 pb-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="delay" className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">Số phút delay</Label>
            <Input
              id="delay"
              type="number"
              min="0"
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(Number(e.target.value))}
              placeholder="Nhập số phút"
              className="h-12 rounded-xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800 focus:ring-rose-500/20"
            />
          </div>

          <div className="space-y-3 p-4 rounded-2xl bg-gray-50/50 dark:bg-zinc-900/10 border border-gray-100 dark:border-zinc-800/50">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                <span>Khởi hành gốc</span>
                <span className="text-zinc-400">{dayjs(trip.departureTime).format("HH:mm DD/MM/YYYY")}</span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-xs font-bold text-[#802222]/60 dark:text-rose-400/60">Khởi hành mới</span>
                <span className="text-sm font-bold text-[#802222] dark:text-rose-400">{actualDeparture}</span>
              </div>
            </div>

            <div className="h-px bg-zinc-200/50 dark:bg-zinc-800/50" />

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                <span>Kết thúc gốc</span>
                <span className="text-zinc-400">{dayjs(trip.endTime).format("HH:mm DD/MM/YYYY")}</span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-xs font-bold text-[#802222]/60 dark:text-rose-400/60">Kết thúc mới</span>
                <span className="text-sm font-bold text-[#802222] dark:text-rose-400">{actualEnd}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 pt-2 gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-medium">
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading || delayMinutes === 0} className="bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-11 font-bold shadow-lg shadow-rose-900/20 px-8">
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
