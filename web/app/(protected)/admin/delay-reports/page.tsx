"use client"

import * as React from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { AlertTriangle, CheckCircle2, Loader2, Timer, XCircle } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

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

export default function AdminDelayReportsPage() {
  const [reports, setReports] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [processingId, setProcessingId] = React.useState<string | null>(null)
  const [rejectingReport, setRejectingReport] = React.useState<any>(null)
  const [rejectReason, setRejectReason] = React.useState("")

  const fetchReports = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.get("/admin/trip-delay-reports")
      setReports(response.data || [])
    } catch (error) {
      console.error("Failed to fetch admin delay reports:", error)
      toast.error("Không thể tải danh sách báo cáo delay.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const approveReport = async (report: any) => {
    try {
      setProcessingId(report.id)
      await apiClient.patch(`/admin/trip-delay-reports/${report.id}/approve`)
      toast.success("Đã duyệt báo cáo delay và cập nhật chuyến tàu.")
      fetchReports()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể duyệt báo cáo delay.")
    } finally {
      setProcessingId(null)
    }
  }

  const rejectReport = async () => {
    if (!rejectingReport) return
    if (rejectReason.trim().length < 5) {
      toast.error("Lý do từ chối phải có tối thiểu 5 ký tự.")
      return
    }

    try {
      setProcessingId(rejectingReport.id)
      await apiClient.patch(`/admin/trip-delay-reports/${rejectingReport.id}/reject`, {
        rejectReason: rejectReason.trim(),
      })
      toast.success("Đã từ chối báo cáo delay.")
      setRejectingReport(null)
      setRejectReason("")
      fetchReports()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể từ chối báo cáo delay.")
    } finally {
      setProcessingId(null)
    }
  }

  if (loading && reports.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-20 min-h-[50vh]">
        <Loader2 className="size-10 animate-spin text-[#802222]" />
      </div>
    )
  }

  const pendingReports = reports.filter((report) => report.status === "PENDING")
  const approvedReports = reports.filter((report) => report.status === "APPROVED")
  const rejectedReports = reports.filter((report) => report.status === "REJECTED")

  const renderTable = (items: any[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-16 bg-gray-50/20 dark:bg-zinc-800/10 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-zinc-800/40">
          <p className="text-xs font-semibold text-muted-foreground opacity-60">Không có báo cáo delay nào trong danh sách</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-semibold">
          <thead>
            <tr className="border-b border-gray-100 dark:border-zinc-800 text-[10px] text-muted-foreground uppercase tracking-wider">
              <th className="py-3 px-4">Ngày báo</th>
              <th className="py-3 px-4">Chuyến tàu</th>
              <th className="py-3 px-4">Loại delay</th>
              <th className="py-3 px-4">Số phút</th>
              <th className="py-3 px-4">Người báo</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((report) => {
              const dateStr = format(parseISO(report.createdAt), "HH:mm dd/MM", { locale: vi })
              return (
                <tr key={report.id} className="border-b border-gray-50 dark:border-zinc-800/40 hover:bg-gray-50/30 dark:hover:bg-zinc-800/10 transition-colors">
                  <td className="py-4 px-4 text-muted-foreground">{dateStr}</td>
                  <td className="py-4 px-4 text-gray-900 dark:text-white font-bold">
                    <Link href={`/admin/trips/${report.tripId}`} className="hover:text-[#802222]">
                      {report.trip?.train?.name || "Tàu"} - {report.trip?.route?.name || "Tuyến đường"}
                    </Link>
                    <span className="block text-[10px] text-muted-foreground font-medium mt-0.5" title={report.reason}>
                      {report.reason}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <Badge className="bg-blue-50 text-blue-600 border-none px-2.5 py-0.5 rounded-full text-[9px]">
                      {report.type === "DEPARTURE" ? "Trễ khởi hành" : "Trễ đến ga"}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-gray-900 dark:text-white font-black">{report.minutes} phút</td>
                  <td className="py-4 px-4 text-muted-foreground">{report.reportedBy?.name || report.reportedBy?.email || "Tài xế"}</td>
                  <td className="py-4 px-4">
                    <Badge className={`text-[8px] px-2.5 py-0.5 rounded-full border-none font-bold ${statusClass[report.status] || statusClass.PENDING}`}>
                      {statusLabel[report.status] || report.status}
                    </Badge>
                    {report.rejectReason && (
                      <span className="block text-[9px] text-rose-500 font-semibold mt-0.5">Lý do: {report.rejectReason}</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {report.status === "PENDING" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          className="h-8 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"
                          disabled={processingId === report.id}
                          onClick={() => approveReport(report)}
                        >
                          <CheckCircle2 className="mr-1 size-3.5" />
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg border-rose-200 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50"
                          disabled={processingId === report.id}
                          onClick={() => {
                            setRejectingReport(report)
                            setRejectReason("")
                          }}
                        >
                          <XCircle className="mr-1 size-3.5" />
                          Từ chối
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" asChild className="h-8 px-3 rounded-lg text-xs font-bold border-[#802222]/20 text-[#802222] hover:bg-rose-50">
                        <Link href={`/admin/trips/${report.tripId}`}>Xem chuyến</Link>
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Duyệt báo cáo delay</h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium opacity-65">
          Tiếp nhận báo cáo trễ khởi hành/trễ đến ga từ Lái tàu. Delay chỉ áp dụng sau khi Admin duyệt.
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="flex flex-wrap w-full md:w-auto h-auto items-center justify-start rounded-xl bg-gray-100/50 dark:bg-zinc-800/50 p-1 text-muted-foreground mb-6 border border-gray-100 dark:border-zinc-800/20">
          <TabsTrigger value="pending" className="rounded-lg px-5 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#802222]">
            Chờ duyệt ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-lg px-5 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#802222]">
            Đã duyệt ({approvedReports.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-lg px-5 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#802222]">
            Đã từ chối ({rejectedReports.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg px-5 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#802222]">
            Tất cả ({reports.length})
          </TabsTrigger>
        </TabsList>

        <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6">
          <TabsContent value="pending" className="mt-0 focus-visible:outline-none">{renderTable(pendingReports)}</TabsContent>
          <TabsContent value="approved" className="mt-0 focus-visible:outline-none">{renderTable(approvedReports)}</TabsContent>
          <TabsContent value="rejected" className="mt-0 focus-visible:outline-none">{renderTable(rejectedReports)}</TabsContent>
          <TabsContent value="all" className="mt-0 focus-visible:outline-none">{renderTable(reports)}</TabsContent>
        </Card>
      </Tabs>

      <Dialog open={!!rejectingReport} onOpenChange={(open) => !open && setRejectingReport(null)}>
        <DialogContent className="rounded-3xl border border-gray-100 max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#802222] flex items-center gap-2">
              <AlertTriangle className="size-5 text-rose-500" />
              Từ chối báo cáo delay
            </DialogTitle>
            <DialogDescription className="text-xs mt-1">
              Lý do từ chối sẽ hiển thị cho tài xế ở trang theo dõi báo cáo.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Nhập lý do từ chối..."
            className="rounded-xl min-h-[100px] text-xs font-semibold border-gray-200"
          />
          <DialogFooter className="mt-4 gap-2">
            <Button variant="ghost" onClick={() => setRejectingReport(null)} className="rounded-xl text-xs font-bold">
              Hủy bỏ
            </Button>
            <Button
              onClick={rejectReport}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-6 border-none"
              disabled={processingId === rejectingReport?.id}
            >
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
