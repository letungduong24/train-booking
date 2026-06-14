"use client"

import * as React from "react"
import apiClient from "@/lib/api-client"
import { Loader2, AlertTriangle, ChevronRight, Calendar, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"

export default function DriverIssuesPage() {
  const [issues, setIssues] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchIssues() {
      try {
        const response = await apiClient.get('/driver/seat-issues');
        setIssues(response.data || []);
      } catch (error) {
        console.error("Failed to fetch driver issues:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchIssues();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-20 min-h-[50vh]">
        <Loader2 className="size-10 animate-spin text-[#802222]" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Danh sách sự cố đã báo cáo</h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium opacity-65">
          Theo dõi và kiểm tra tình trạng phê duyệt/xử lý sự cố ghế hỏng từ Quản trị viên.
        </p>
      </div>

      <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6">
        {issues.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800 text-[10px] text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Vị trí ghế</th>
                  <th className="py-3 px-4">Chuyến xe</th>
                  <th className="py-3 px-4">Loại sự cố</th>
                  <th className="py-3 px-4">Mô tả</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => {
                  const dateStr = format(parseISO(issue.createdAt), "HH:mm, dd/MM/yyyy", { locale: vi });
                  return (
                    <tr
                      key={issue.id}
                      className="border-b border-gray-50 dark:border-zinc-800/40 hover:bg-gray-50/30 dark:hover:bg-zinc-800/10 transition-colors"
                    >
                      <td className="py-4 px-4 text-muted-foreground">{dateStr}</td>
                      <td className="py-4 px-4 text-gray-900 dark:text-white font-bold">
                        Toa {issue.seat?.coach?.name || issue.seat?.coach?.order} - Ghế {issue.seat?.name}
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {issue.trip?.route?.name}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className="bg-amber-50 text-amber-600 border-none px-2.5 py-0.5 rounded-full text-[9px]">
                          {issue.issueType}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 max-w-[200px] truncate text-muted-foreground" title={issue.description}>
                        {issue.description}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={`text-[8px] px-2.5 py-0.5 rounded-full border-none font-bold ${
                          issue.status === "PENDING"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                            : issue.status === "RESOLVED"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : issue.status === "REJECTED"
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                            : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                        }`}>
                          {issue.status === "PENDING"
                            ? "Chờ xử lý"
                            : issue.status === "RESOLVED"
                            ? "Đã giải quyết"
                            : issue.status === "REJECTED"
                            ? "Bị từ chối"
                            : "Chờ khách đổi"}
                        </Badge>
                        {issue.rejectReason && (
                          <span className="block text-[9px] text-rose-500 font-semibold mt-0.5">
                            Lý do: {issue.rejectReason}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button variant="ghost" size="sm" asChild className="h-8 px-3 rounded-lg text-xs font-bold text-[#802222] hover:bg-rose-50">
                          <Link href={`/driver/trips/${issue.tripId}`} className="flex items-center gap-0.5">
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
            <AlertTriangle className="size-10 text-muted-foreground opacity-30 mx-auto mb-4" />
            <p className="text-xs font-semibold text-muted-foreground opacity-60">Bạn chưa báo cáo sự cố ghế hỏng nào</p>
          </div>
        )}
      </Card>
    </div>
  )
}
