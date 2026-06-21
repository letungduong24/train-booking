"use client"

import * as React from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { AlertTriangle, ChevronRight, Loader2, Timer } from "lucide-react"
import apiClient from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const statusLabel: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
}

const statusClass: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
  APPROVED: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
  REJECTED: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
}

export default function DriverDelayReportsPage() {
  const [reports, setReports] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchReports() {
      try {
        const response = await apiClient.get("/driver/trip-delay-reports")
        setReports(response.data || [])
      } catch (error) {
        console.error("Failed to fetch driver delay reports:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-20 min-h-[50vh]">
        <Loader2 className="size-10 animate-spin text-[#802222]" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Báo cáo delay đã gửi</h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium opacity-65">
          Theo dõi trạng thái phê duyệt các báo cáo trễ khởi hành hoặc trễ đến ga.
        </p>
      </div>

      <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6">
        {reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800 text-[10px] text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Thời gian gửi</th>
                  <th className="py-3 px-4">Chuyến tàu</th>
                  <th className="py-3 px-4">Loại delay</th>
                  <th className="py-3 px-4">Số phút</th>
                  <th className="py-3 px-4">Lý do</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const dateStr = format(parseISO(report.createdAt), "HH:mm, dd/MM/yyyy", { locale: vi })
                  return (
                    <tr key={report.id} className="border-b border-gray-50 dark:border-zinc-800/40 hover:bg-gray-50/30 dark:hover:bg-zinc-800/10 transition-colors">
                      <td className="py-4 px-4 text-muted-foreground">{dateStr}</td>
                      <td className="py-4 px-4 text-gray-900 dark:text-white font-bold">
                        {report.trip?.train?.name || "Tàu"} - {report.trip?.route?.name || "Tuyến đường"}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className="bg-blue-50 text-blue-600 border-none px-2.5 py-0.5 rounded-full text-[9px]">
                          {report.type === "DEPARTURE" ? "Trễ khởi hành" : "Trễ đến ga"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-gray-900 dark:text-white font-black">{report.minutes} phút</td>
                      <td className="py-4 px-4 max-w-[240px] truncate text-muted-foreground" title={report.reason}>{report.reason}</td>
                      <td className="py-4 px-4">
                        <Badge className={`text-[8px] px-2.5 py-0.5 rounded-full border-none font-bold ${statusClass[report.status] || statusClass.PENDING}`}>
                          {statusLabel[report.status] || report.status}
                        </Badge>
                        {report.rejectReason && (
                          <span className="block text-[9px] text-rose-500 font-semibold mt-0.5">Lý do: {report.rejectReason}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button variant="ghost" size="sm" asChild className="h-8 px-3 rounded-lg text-xs font-bold text-[#802222] hover:bg-rose-50">
                          <Link href={`/driver/trips/${report.tripId}`} className="flex items-center gap-0.5">
                            Chi tiết chuyến
                            <ChevronRight className="size-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50/20 dark:bg-zinc-800/10 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-zinc-800/40">
            <Timer className="size-10 text-muted-foreground opacity-30 mx-auto mb-4" />
            <p className="text-xs font-semibold text-muted-foreground opacity-60">Bạn chưa gửi báo cáo delay nào</p>
            <p className="text-[10px] font-medium text-muted-foreground opacity-50 mt-1">
              Chỉ báo cáo delay khi chuyến sắp khởi hành hoặc đang chạy.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
