"use client"

import * as React from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { RecentBookingsTable } from "@/components/recent-bookings-table"
import apiClient from "@/lib/api-client"
import { IconLoader2 } from "@tabler/icons-react"

export default function Page() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await apiClient.get('/dashboard/admin');
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-20">
        <IconLoader2 className="size-10 animate-spin text-[#802222]" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-700 p-4 lg:p-6">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400 uppercase italic">Bảng điều khiển</h2>
                <p className="text-sm text-muted-foreground mt-1 font-medium opacity-60">Tổng quan hiệu suất hệ thống, doanh thu và thống kê vận hành thời gian thực</p>
            </div>
        </div>
        
        <SectionCards data={data?.stats} />
        
        <div className="grid grid-cols-1 gap-6">
            <ChartAreaInteractive data={data?.chartData} />
        </div>

        <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#802222] dark:text-rose-400">Đơn hàng gần đây</h3>
            <RecentBookingsTable data={data?.recentBookings || []} />
        </div>
    </div>
  )
}
