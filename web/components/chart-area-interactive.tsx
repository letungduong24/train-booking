"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

interface ChartAreaInteractiveProps {
  data?: {
    date: string;
    revenue: number;
    bookings: number;
  }[];
}

const chartConfig = {
  revenue: {
    label: "Doanh thu",
    color: "#802222",
  },
  bookings: {
    label: "Số lượng vé",
    color: "#f43f5e",
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ data = [] }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = React.useMemo(() => {
    if (!data.length) return [];
    
    // Since our backend already returns the last 30 days, we just filter it here if needed
    // But for now let's just use the last N items based on range
    let sliceCount = 30;
    if (timeRange === "7d") sliceCount = 7;
    
    return data.slice(-sliceCount);
  }, [data, timeRange]);

  return (
    <Card className="rounded-[2rem] border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.03] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2 p-6 relative z-10">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-none">
            Biểu đồ hoạt động
          </CardTitle>
          <CardDescription className="text-[10px] font-medium text-muted-foreground/50">
            Thống kê doanh thu và lượt đặt vé
          </CardDescription>
        </div>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="30d">30 ngày qua</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 ngày qua</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="p-6 pt-0 relative z-10">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillBookings" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-bookings)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-bookings)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("vi-VN", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("vi-VN", {
                      month: "long",
                      day: "numeric",
                      year: "numeric"
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="bookings"
              type="monotone"
              fill="url(#fillBookings)"
              stroke="var(--color-bookings)"
              stackId="a"
              strokeWidth={2}
            />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              stroke="var(--color-revenue)"
              stackId="b"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
