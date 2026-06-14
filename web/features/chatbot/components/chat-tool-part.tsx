"use client";

import { Search } from "lucide-react";
import { BookingHistoryResult } from "./booking-history-result";
import { BouncingDots } from "./chat-loading";
import { TripSearchResult } from "./trip-search-result";

interface ChatToolPartProps {
  part: any;
}

export function ChatToolPart({ part }: ChatToolPartProps) {
  switch (part.type) {
    case "tool-findStationByName": {
      if (part.state === "input-streaming" || part.state === "input-available") {
        return (
          <div className="self-start flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1">
            <Search className="h-3 w-3 animate-pulse" />
            <span>Đang tìm ga tàu...</span>
          </div>
        );
      }
      return null;
    }

    case "tool-searchTrainTrips": {
      if (part.state === "input-streaming" || part.state === "input-available") {
        return (
          <div className="self-start bg-muted rounded-xl rounded-tl-sm p-3 space-y-2 w-full max-w-[90%]">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
                  />
                ))}
              </div>
              <span>Đang tìm chuyến tàu...</span>
            </div>
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-muted-foreground/10 animate-pulse" />
              ))}
            </div>
          </div>
        );
      }

      if (part.state === "output-available") {
        const output = part.output as { trips: any[]; date: string };
        return (
          <div className="self-start w-full max-w-[90%]">
            <TripSearchResult trips={output.trips} date={output.date} />
          </div>
        );
      }

      return null;
    }

    case "tool-getMyBookings": {
      if (part.state === "input-streaming" || part.state === "input-available") {
        return <BouncingDots label="Đang lấy lịch sử đặt vé..." />;
      }

      if (part.state === "output-available") {
        const output = part.output as { bookings?: any[]; error?: string };
        if (output.error) {
          return <p className="self-start text-xs text-muted-foreground px-2">{output.error}</p>;
        }

        return (
          <div className="self-start w-full max-w-[90%]">
            <BookingHistoryResult bookings={output.bookings ?? []} />
          </div>
        );
      }

      return null;
    }

    case "tool-getWalletBalance": {
      if (part.state === "input-streaming" || part.state === "input-available") {
        return <BouncingDots label="Đang lấy thông tin ví..." />;
      }

      if (part.state === "output-available") {
        const output = part.output as { balance?: number; error?: string };
        if (output.error) {
          return <p className="self-start text-xs text-muted-foreground px-2">{output.error}</p>;
        }

        return (
          <div className="self-start rounded-xl border bg-card p-3 w-full max-w-[90%] space-y-1">
            <p className="text-xs text-muted-foreground">Số dư ví</p>
            <p className="text-lg font-bold text-primary">
              {(output.balance ?? 0).toLocaleString("vi-VN")} ₫
            </p>
          </div>
        );
      }

      return null;
    }

    case "tool-getPassengerGroups": {
      if (part.state === "output-available") {
        const groups = part.output as { name: string; discountPercent: number }[];
        return (
          <div className="self-start rounded-xl border bg-card p-3 w-full max-w-[90%] space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Loại hành khách</p>
            {groups.map((group, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span>{group.name}</span>
                <span className="text-xs text-primary font-semibold">
                  {group.discountPercent === 0 ? "Giá gốc" : `-${group.discountPercent}%`}
                </span>
              </div>
            ))}
          </div>
        );
      }

      return null;
    }

    case "tool-getRoutes": {
      if (part.state === "output-available") {
        const routes = part.output as { name: string; stations: string[] }[];
        return (
          <div className="self-start rounded-xl border bg-card p-3 w-full max-w-[90%] space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Tuyến đường</p>
            {routes.map((route, index) => (
              <div key={index}>
                <p className="font-medium text-sm">{route.name}</p>
                <p className="text-xs text-muted-foreground">{route.stations.join(" → ")}</p>
              </div>
            ))}
          </div>
        );
      }

      return null;
    }

    default:
      return null;
  }
}
