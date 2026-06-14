"use client"

import * as React from "react"
import apiClient from "@/lib/api-client"
import { Loader2, Train, AlertTriangle, CheckCircle2, ChevronLeft, User, MessageSquare, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { useQueryClient } from "@tanstack/react-query"
import { useSocketStore } from "@/lib/store/socket.store"
import { BookingCoachNavigationBar } from "@/features/booking/components/booking-coach-navigation-bar"
import { useCoachWithPrices } from "@/features/booking/hooks/use-coach-with-prices"
import { SeatLayoutViewer } from "@/features/booking/components/seat-layout-viewer"
import { BedLayoutViewer } from "@/features/booking/components/bed-layout-viewer"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AdminSeatIssueDetailPage({ params }: PageProps) {
  const { id: issueId } = React.use(params)
  const router = useRouter()

  const [issue, setIssue] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [activeCoachId, setActiveCoachId] = React.useState<string>("")

  // Action states
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState("")
  const [processing, setProcessing] = React.useState(false)
  const [actionError, setActionError] = React.useState("")
  const [actionSuccess, setActionSuccess] = React.useState("")

  const { socket } = useSocketStore()
  const queryClient = useQueryClient()

  // Fetch issue details
  const fetchIssueDetail = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/admin/seat-issues/${issueId}`)
      setIssue(response.data)
      if (response.data?.seat?.coachId && !activeCoachId) {
        setActiveCoachId(response.data.seat.coachId)
      }
    } catch (error) {
      console.error("Failed to fetch admin issue detail:", error)
      toast.error("Không tìm thấy thông tin sự cố ghế hỏng.")
    } finally {
      setLoading(false)
    }
  }, [issueId, activeCoachId])

  React.useEffect(() => {
    fetchIssueDetail()
  }, [issueId])

  // Real-time synchronization
  React.useEffect(() => {
    if (!socket) return
    function onSeatIssueUpdated(data: { tripId: string, seatId: string }) {
      if (data.tripId === issue?.tripId) {
        fetchIssueDetail()
        queryClient.invalidateQueries({ queryKey: ['coaches'] })
      }
    }
    socket.on("seat-issues.updated", onSeatIssueUpdated)
    return () => {
      socket.off("seat-issues.updated", onSeatIssueUpdated)
    }
  }, [socket, issue?.tripId, queryClient, fetchIssueDetail])

  // Get stations for pricing context
  const fromStationId = issue?.trip?.route?.stations?.[0]?.stationId || ""
  const toStationId = issue?.trip?.route?.stations?.[issue?.trip?.route?.stations?.length - 1]?.stationId || ""

  // Load coach details & seats layout
  const { data: coachWithPrices, isLoading: isCoachLoading } = useCoachWithPrices(
    {
      coachId: activeCoachId || "",
      tripId: issue?.tripId || "",
      fromStationId,
      toStationId,
    },
    !!activeCoachId && !!issue?.tripId && !!fromStationId && !!toStationId
  )

  // Actions
  const handleReject = async () => {
    if (!rejectReason || rejectReason.trim().length < 5) {
      setActionError("Vui lòng nhập lý do từ chối tối thiểu 5 ký tự.")
      return
    }

    try {
      setProcessing(true)
      setActionError("")
      
      await apiClient.patch(`/admin/seat-issues/${issueId}/reject`, {
        rejectReason: rejectReason.trim()
      })

      setActionSuccess("Đã từ chối báo cáo sự cố thành công!")
      toast.success("Đã từ chối báo cáo sự cố")
      setRejectDialogOpen(false)
      setRejectReason("")
      
      setTimeout(() => {
        fetchIssueDetail()
      }, 1500)

    } catch (err: any) {
      console.error(err)
      setActionError(err.response?.data?.message || "Đã xảy ra lỗi khi từ chối sự cố.")
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirm = async () => {
    try {
      setProcessing(true)
      setActionError("")
      
      const response = await apiClient.patch(`/admin/seat-issues/${issueId}/confirm`)
      const result = response.data

      if (result.status === "WAITING_CUSTOMER_CONFIRMATION") {
        setActionSuccess(`Duyệt thành công! Đã đề xuất ghế trống thay thế: Toa ${result.proposedSeat?.coach?.name} - Ghế ${result.proposedSeat?.name} và gửi email xác nhận cho khách hàng.`)
        toast.success("Xác nhận sự cố thành công. Đề xuất đổi ghế đã gửi đến hành khách.")
      } else if (result.status === "RESOLVED") {
        if (result.refundAmount && result.refundAmount > 0) {
          setActionSuccess(`Duyệt thành công! Không tìm thấy ghế thay thế phù hợp nên hệ thống đã hủy vé bị ảnh hưởng và hoàn ${result.refundAmount.toLocaleString()}đ về ví hành khách.`)
          toast.success("Xác nhận sự cố thành công. Hệ thống đã hoàn tiền cho hành khách.")
        } else {
          setActionSuccess("Duyệt thành công! Ghế hỏng đã được khóa, không có vé bị ảnh hưởng.")
          toast.success("Xác nhận sự cố thành công (Không có vé bị ảnh hưởng).")
        }
      }

      setTimeout(() => {
        fetchIssueDetail()
      }, 1500)

    } catch (err: any) {
      console.error(err)
      setActionError(err.response?.data?.message || "Đã xảy ra lỗi khi xác nhận sự cố.")
    } finally {
      setProcessing(false)
    }
  }

  if (loading && !issue) {
    return (
      <div className="flex flex-1 items-center justify-center p-20 min-h-[50vh]">
        <Loader2 className="size-10 animate-spin text-[#802222]" />
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground font-medium">Không tìm thấy thông tin chi tiết sự cố.</p>
        <Button asChild className="mt-4 bg-[#802222]">
          <Link href="/admin/seat-issues">Quay lại danh sách</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild className="rounded-xl border-[#802222]/20 text-[#802222] font-bold text-xs h-9 px-4">
          <Link href="/admin/seat-issues" className="flex items-center gap-1">
            <ChevronLeft className="size-4" />
            Danh sách sự cố
          </Link>
        </Button>

        <Badge className={`text-xs px-3.5 py-1 rounded-full border-none font-bold ${
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
      </div>

      {/* Main Spacious Grid (12 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Details & Actions (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-900 p-6 space-y-4">
            <div className="pb-3 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Thông tin ghế sự cố</h3>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">
                Chi tiết chặng & thời gian
              </p>
            </div>

            {/* Info Badges Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-3 bg-gray-50/50 dark:bg-zinc-800/30 rounded-2xl">
                <span className="text-muted-foreground block font-bold text-[9px] uppercase tracking-wider mb-1">Số ghế</span>
                <span className="text-[#802222] text-lg font-black">Ghế {issue.seat?.name}</span>
              </div>
              <div className="p-3 bg-gray-50/50 dark:bg-zinc-800/30 rounded-2xl">
                <span className="text-muted-foreground block font-bold text-[9px] uppercase tracking-wider mb-1">Tàu & Toa</span>
                <span className="text-gray-900 dark:text-white text-xs font-bold block truncate">
                  {issue.seat?.coach?.train?.name} - Toa {issue.seat?.coach?.name || issue.seat?.coach?.order}
                </span>
              </div>
              <div className="p-3 bg-gray-50/50 dark:bg-zinc-800/30 rounded-2xl col-span-2">
                <span className="text-muted-foreground block font-bold text-[9px] uppercase tracking-wider mb-1">Thời gian báo cáo</span>
                <span className="text-gray-900 dark:text-white text-xs font-bold block">
                  {format(parseISO(issue.createdAt), "HH:mm, dd MMMM yyyy", { locale: vi })}
                </span>
              </div>
            </div>

            {/* Reported By & Description */}
            <div className="space-y-3 bg-gray-50/20 dark:bg-zinc-800/10 p-4 rounded-2xl border border-gray-100/50 dark:border-zinc-800/50 font-semibold text-xs text-muted-foreground">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5">
                <User className="size-4 text-[#802222]" />
                Người báo cáo (Lái tàu)
              </span>
              <p className="text-gray-900 dark:text-white font-bold text-sm">
                {issue.reportedBy?.name} <span className="text-xs text-muted-foreground font-medium">({issue.reportedBy?.email})</span>
              </p>
              
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5 pt-2">
                <MessageSquare className="size-4 text-[#802222]" />
                Mô tả sự cố từ Lái tàu
              </span>
              <p className="text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 font-medium leading-relaxed mt-1 text-xs">
                "{issue.description}"
              </p>
            </div>

            {/* Status alerts / Proposals */}
            {issue.status === "REJECTED" && (
              <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-4 rounded-2xl space-y-1 text-xs font-semibold animate-in fade-in duration-200">
                <span className="font-bold text-[9px] uppercase tracking-wider">Lý do từ chối phê duyệt</span>
                <p className="font-medium leading-relaxed">{issue.rejectReason}</p>
              </div>
            )}

            {issue.status === "WAITING_CUSTOMER_CONFIRMATION" && issue.proposedSeat && (
              <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 p-4 rounded-2xl space-y-1.5 text-xs font-semibold animate-in fade-in duration-200">
                <span className="font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-blue-600" />
                  Phương án đề xuất đã gửi khách
                </span>
                <p className="font-bold text-sm text-blue-900 dark:text-blue-200">
                  Toa {issue.proposedSeat?.coach?.name || issue.proposedSeat?.coach?.order} - Ghế {issue.proposedSeat?.name}
                </p>
                <p className="text-[10px] font-medium opacity-80 mt-1">Đang chờ hành khách xác thực chọn đổi ghế hoặc hoàn tiền (Hạn chót 24 giờ).</p>
              </div>
            )}

            {issue.status === "RESOLVED" && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl space-y-1.5 text-xs font-semibold animate-in fade-in duration-200">
                <span className="font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  Sự cố đã được giải quyết
                </span>
                {issue.rejectReason === "CUSTOMER_REJECTED_REPLACEMENT" ? (
                  <p className="font-medium leading-relaxed">Hành khách không đồng ý với các ghế đề xuất. Hệ thống đã hủy vé bị ảnh hưởng và hoàn tiền về ví hành khách.</p>
                ) : issue.rejectReason === "EXPIRED_AUTO_REFUND" ? (
                  <p className="font-medium leading-relaxed">Hành khách không phản hồi trong 24 giờ. Cron job đã tự động hủy vé bị ảnh hưởng và hoàn tiền về ví hành khách.</p>
                ) : issue.rejectReason === "NO_REPLACEMENT_AUTO_REFUND" ? (
                  <p className="font-medium leading-relaxed">Không tìm thấy ghế thay thế phù hợp. Hệ thống đã tự động hủy vé bị ảnh hưởng và hoàn tiền về ví hành khách.</p>
                ) : issue.proposedSeat ? (
                  <p className="font-medium leading-relaxed">
                    Hành khách đã xác nhận đổi sang Toa {issue.proposedSeat?.coach?.name || issue.proposedSeat?.coach?.order} - Ghế {issue.proposedSeat?.name}.
                  </p>
                ) : (
                  <p className="font-medium leading-relaxed">Ghế hỏng đã được khóa. Không có vé hành khách bị ảnh hưởng trên chuyến này.</p>
                )}
              </div>
            )}

            {/* Action Feedback alerts */}
            {actionSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl text-xs font-bold leading-relaxed flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="size-5 flex-none" />
                {actionSuccess}
              </div>
            )}

            {actionError && (
              <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 p-4 rounded-2xl text-xs font-bold leading-relaxed flex items-center gap-2 animate-in fade-in duration-200">
                <AlertTriangle className="size-5 flex-none text-rose-600" />
                {actionError}
              </div>
            )}

            {/* Reject Form */}
            {rejectDialogOpen && (
              <div className="space-y-2.5 p-4 bg-gray-50 dark:bg-zinc-800/40 rounded-2xl border border-gray-200 dark:border-zinc-800 animate-in fade-in duration-200">
                <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Lý do từ chối phê duyệt</label>
                <Textarea
                  placeholder="Nhập lý do từ chối cụ thể để Lái tàu được biết (tối thiểu 5 ký tự)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="rounded-xl min-h-[80px] text-xs font-semibold bg-white dark:bg-zinc-950"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="ghost" size="sm" onClick={() => setRejectDialogOpen(false)} disabled={processing} className="text-xs rounded-lg">Hủy</Button>
                  <Button variant="destructive" size="sm" onClick={handleReject} disabled={processing} className="px-4 text-xs rounded-lg">Xác nhận từ chối</Button>
                </div>
              </div>
            )}

            {/* Main Action buttons */}
            {issue.status === "PENDING" && !rejectDialogOpen && !actionSuccess && (
              <div className="flex gap-3 pt-3">
                <Button
                  onClick={() => setRejectDialogOpen(true)}
                  variant="ghost"
                  className="flex-1 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-100 dark:border-rose-950/50"
                  disabled={processing}
                >
                  Từ chối
                </Button>
                
                <Button
                  onClick={handleConfirm}
                  className="flex-1 rounded-xl bg-[#802222] hover:bg-rose-900 text-white font-bold text-xs px-6 border-none shadow-lg shadow-rose-950/10 flex items-center justify-center gap-1.5"
                  disabled={processing}
                >
                  {processing ? <Loader2 className="size-3.5 animate-spin" /> : "Xác nhận & Đề xuất"}
                </Button>
              </div>
            )}

          </Card>
        </div>

        {/* Right Side: Spacious Real-time Seat Map (7 Columns) */}
        <div className="lg:col-span-7">
          <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-900 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Sơ đồ Toa tàu thời gian thực</h3>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">
                  Chuyến tàu phụ trách {issue.seat?.coach?.train?.code || "Tàu"}
                </p>
              </div>
              <Badge className="bg-[#802222]/10 text-[#802222] border-none font-bold text-[9px] px-3 py-1 rounded-full">
                {issue.seat?.coach?.train?.name || "Tàu"}
              </Badge>
            </div>

            {/* Reusable premium coach navigation */}
            {issue?.trip?.train?.coaches && issue?.trip?.train?.coaches?.length > 0 && (
              <BookingCoachNavigationBar
                coaches={issue.trip.train.coaches}
                selectedCoachId={activeCoachId}
                onCoachSelect={setActiveCoachId}
                trainCode={issue.trip.train.code || ""}
              />
            )}

            {/* Layout Viewport with standard interactive viewer */}
            <div className="min-h-[400px] border border-dashed rounded-3xl bg-zinc-50/50 dark:bg-zinc-950/20 p-6 flex flex-col justify-center relative">
              {isCoachLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <Spinner className="w-10 h-10 text-[#802222]" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">Đang tải sơ đồ...</span>
                </div>
              ) : coachWithPrices ? (
                <div className="w-full">
                  {coachWithPrices.template.layout === 'SEAT' ? (
                    <SeatLayoutViewer
                      seats={coachWithPrices.seats}
                      template={coachWithPrices.template}
                      onSeatClick={() => {}}
                      tripId={issue.tripId}
                      isAdmin={true}
                      selectedSeats={[]}
                      highlightedSeatIds={issue.status === "PENDING" || issue.status === "WAITING_CUSTOMER_CONFIRMATION" ? [issue.seatId] : []}
                      focusedSeatId={issue.status === "PENDING" || issue.status === "WAITING_CUSTOMER_CONFIRMATION" ? issue.seatId : null}
                      coachName={coachWithPrices.name}
                    />
                  ) : (
                    <BedLayoutViewer
                      seats={coachWithPrices.seats}
                      template={coachWithPrices.template}
                      onSeatClick={() => {}}
                      tripId={issue.tripId}
                      isAdmin={true}
                      selectedSeats={[]}
                      highlightedSeatIds={issue.status === "PENDING" || issue.status === "WAITING_CUSTOMER_CONFIRMATION" ? [issue.seatId] : []}
                      focusedSeatId={issue.status === "PENDING" || issue.status === "WAITING_CUSTOMER_CONFIRMATION" ? issue.seatId : null}
                      coachName={coachWithPrices.name}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-20 text-xs text-muted-foreground italic">
                  Không có dữ liệu ghế cho toa xe của chuyến này
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
