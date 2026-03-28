import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

import data from "./data.json"

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-700">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Bảng điều khiển</h2>
                <p className="text-sm text-muted-foreground mt-1 font-medium italic opacity-60">Tổng quan hiệu suất hệ thống, doanh thu và thống kê vận hành thời gian thực</p>
            </div>
        </div>
        <SectionCards />
        <ChartAreaInteractive />
        <DataTable data={data} />
    </div>
  )
}
