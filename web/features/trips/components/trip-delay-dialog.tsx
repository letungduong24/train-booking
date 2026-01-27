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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isScheduled ? "Delay Khởi Hành" : "Delay Kết Thúc"}
          </DialogTitle>
          <DialogDescription>
            {isScheduled
              ? "Delay cả thời gian khởi hành và kết thúc"
              : "Chỉ delay thời gian kết thúc (tàu đang chạy)"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="delay">Số phút delay</Label>
            <Input
              id="delay"
              type="number"
              min="0"
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(Number(e.target.value))}
              placeholder="Nhập số phút"
            />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Khởi hành gốc:</span>
              <span>{dayjs(trip.departureTime).format("HH:mm DD/MM/YYYY")}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Khởi hành thực tế:</span>
              <span className="text-primary">{actualDeparture}</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kết thúc gốc:</span>
              <span>{dayjs(trip.endTime).format("HH:mm DD/MM/YYYY")}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Kết thúc thực tế:</span>
              <span className="text-primary">{actualEnd}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading || delayMinutes === 0}>
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
