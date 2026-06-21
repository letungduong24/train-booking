"use client"

import * as React from "react"
import apiClient from "@/lib/api-client"
import { Loader2, Train, ChevronLeft, MapPin, Clock, Info, CheckCircle2, ShieldAlert, AlertTriangle, Timer } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"

import { BookingCoachNavigationBar } from "@/features/booking/components/booking-coach-navigation-bar"
import { useCoachWithPrices } from "@/features/booking/hooks/use-coach-with-prices"
import { SeatLayoutViewer } from "@/features/booking/components/seat-layout-viewer"
import { BedLayoutViewer } from "@/features/booking/components/bed-layout-viewer"
import { useSocketStore } from "@/lib/store/socket.store"
import { useQueryClient } from "@tanstack/react-query"
import { Spinner } from "@/components/ui/spinner"
import { Seat } from "@/lib/schemas/seat.schema"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TripDetailPage({ params }: PageProps) {
  const { id: tripId } = React.use(params)
  
  const [trip, setTrip] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [activeCoachId, setActiveCoachId] = React.useState<string>("")
  
  // Reporting state
  const [selectedSeat, setSelectedSeat] = React.useState<any>(null)
  const [issueType, setIssueType] = React.useState<string>("Ghế gãy/hỏng")
  const [description, setDescription] = React.useState<string>("")
  const [submitting, setSubmitting] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string>("")
  const [successMsg, setSuccessMsg] = React.useState<string>("")
  const [reportedSeatIds, setReportedSeatIds] = React.useState<Set<string>>(new Set())
  const [delayDialogOpen, setDelayDialogOpen] = React.useState(false)
  const [delayMinutes, setDelayMinutes] = React.useState("")
  const [delayReason, setDelayReason] = React.useState("")
  const [delaySubmitting, setDelaySubmitting] = React.useState(false)
  const [delayError, setDelayError] = React.useState("")
  const [delaySuccess, setDelaySuccess] = React.useState("")

  const { socket } = useSocketStore()
  const queryClient = useQueryClient()

  const fetchTripDetails = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/driver/trips/${tripId}`)
      setTrip(response.data)
      
      const coaches = response.data?.train?.coaches || []
      if (coaches.length > 0 && !activeCoachId) {
        // Find first active coach
        const firstActive = coaches.find((c: any) => c.status === "ACTIVE") || coaches[0]
        setActiveCoachId(firstActive.id)
      }
    } catch (error) {
      console.error("Failed to fetch trip details:", error)
    } finally {
      setLoading(false)
    }
  }, [tripId, activeCoachId])

  React.useEffect(() => {
    fetchTripDetails()
  }, [tripId])

  // Get stations for pricing context (standard full trip bounds)
  const fromStationId = trip?.route?.stations?.[0]?.stationId || ""
  const toStationId = trip?.route?.stations?.[trip?.route?.stations?.length - 1]?.stationId || ""

  // Fetch coach and seats layout dynamically using standard reusable hook
  const { data: coachWithPrices, isLoading: isCoachLoading } = useCoachWithPrices(
    {
      coachId: activeCoachId || "",
      tripId: tripId,
      fromStationId,
      toStationId,
    },
    !!activeCoachId && !!tripId && !!fromStationId && !!toStationId
  )

  // Real-time synchronization
  React.useEffect(() => {
    if (!socket) return

    function onSeatsBooked(data: { tripId: string, seatIds: string[] }) {
      if (data.tripId === tripId) {
        queryClient.invalidateQueries({ queryKey: ['coaches'] })
      }
    }

    function onSeatIssueUpdated() {
      queryClient.invalidateQueries({ queryKey: ['coaches'] })
    }

    socket.on("seats.booked", onSeatsBooked)
    socket.on("seat-issues.updated", onSeatIssueUpdated)

    return () => {
      socket.off("seats.booked", onSeatsBooked)
      socket.off("seat-issues.updated", onSeatIssueUpdated)
    }
  }, [socket, tripId, queryClient])

  if (loading && !trip) {
    return (
      <div className="flex flex-1 items-center justify-center p-20 min-h-[50vh]">
        <Loader2 className="size-10 animate-spin text-[#802222]" />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Không tìm thấy thông tin chuyến xe hoặc bạn không được phân công chuyến này.</p>
        <Button asChild className="mt-4 bg-[#802222]">
          <Link href="/driver/trips">Quay lại danh sách</Link>
        </Button>
      </div>
    )
  }

  const coaches = trip.train?.coaches || []
  const activeCoach = coaches.find((c: any) => c.id === activeCoachId)
  
  const depTimeStr = format(parseISO(trip.departureTime), "HH:mm, dd/MM/yyyy", { locale: vi })
  const arrTimeStr = format(parseISO(trip.endTime), "HH:mm, dd/MM/yyyy", { locale: vi })
  const canReportSeatIssue =
    Boolean(trip.canReportSeatIssue) &&
    ["SCHEDULED", "IN_PROGRESS"].includes(trip.status) &&
    new Date() <= new Date(trip.endTime)
  const delayType = trip.status === "SCHEDULED" ? "DEPARTURE" : "ARRIVAL"
  const canReportDelay = canReportSeatIssue && ["SCHEDULED", "IN_PROGRESS"].includes(trip.status)

  // Handle seat click
  const handleSeatClick = (seat: any) => {
    if (!canReportSeatIssue) {
      setErrorMsg("Chuyến tàu đã kết thúc hoặc không còn hoạt động. Không thể báo cáo sự cố ghế.")
      return
    }

    if (reportedSeatIds.has(seat.id)) {
      setErrorMsg("Ghế này đã có báo cáo sự cố đang chờ xử lý. Không thể gửi trùng báo cáo.")
      return
    }

    setSelectedSeat(seat)
    setIssueType("Ghế gãy/hỏng")
    setDescription("")
    setErrorMsg("")
    setSuccessMsg("")
  }

  // Handle submit report
  const handleSubmitReport = async () => {
    if (!description || description.trim().length < 10) {
      setErrorMsg("Mô tả chi tiết phải có tối thiểu 10 ký tự.")
      return
    }

    try {
      setSubmitting(true)
      setErrorMsg("")
      
      await apiClient.post('/driver/seat-issues', {
        tripId,
        seatId: selectedSeat.id,
        issueType,
        description: description.trim(),
      })

      setSuccessMsg("Đã gửi báo cáo sự cố thành công cho Admin phê duyệt!")
      setReportedSeatIds((current) => new Set(current).add(selectedSeat.id))
      
      // Invalidate queries to get instant visual feedback of the disabled seat state
      queryClient.invalidateQueries({ queryKey: ['coaches'] })

      // Close modal
      setTimeout(() => {
        setSelectedSeat(null)
      }, 1500)

    } catch (err: any) {
      console.error(err)
      const message = err.response?.data?.message || "Đã xảy ra lỗi khi gửi báo cáo sự cố. Vui lòng thử lại."
      setErrorMsg(message)
      if (err.response?.status === 409 && selectedSeat?.id) {
        setReportedSeatIds((current) => new Set(current).add(selectedSeat.id))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitDelayReport = async () => {
    const minutes = Number(delayMinutes)
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 720) {
      setDelayError("Số phút delay phải từ 1 đến 720 phút.")
      return
    }

    if (!delayReason.trim() || delayReason.trim().length < 10) {
      setDelayError("Lý do báo delay phải có tối thiểu 10 ký tự.")
      return
    }

    try {
      setDelaySubmitting(true)
      setDelayError("")
      await apiClient.post("/driver/trip-delay-reports", {
        tripId,
        type: delayType,
        minutes,
        reason: delayReason.trim(),
      })
      setDelaySuccess("Đã gửi báo cáo delay cho Admin phê duyệt.")
      setDelayMinutes("")
      setDelayReason("")
      setTimeout(() => {
        setDelayDialogOpen(false)
        setDelaySuccess("")
      }, 1400)
    } catch (err: any) {
      setDelayError(err.response?.data?.message || "Không thể gửi báo cáo delay. Vui lòng thử lại.")
    } finally {
      setDelaySubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-700">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild className="rounded-xl border-[#802222]/20 text-[#802222] font-bold text-xs h-9 px-4">
          <Link href="/driver/trips" className="flex items-center gap-1">
            <ChevronLeft className="size-4" />
            Lịch trình chuyến xe
          </Link>
        </Button>
      </div>

      {/* Grid 1: Trip Info Cards */}
      <div className="grid grid-cols-12 gap-6">
        {/* Main Details (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl text-[#802222] dark:text-rose-400">
                  <Train className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{trip.train?.name || "Tàu hỏa"}</h3>
                  <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3.5" />
                    {trip.route?.name || "Lộ trình"}
                  </p>
                </div>
              </div>
              <Badge className="text-xs px-3.5 py-1 rounded-full border-none bg-orange-50 text-orange-600 font-bold self-start sm:self-center">
                {trip.status === "SCHEDULED" ? "Sắp khởi hành" : trip.status === "IN_PROGRESS" ? "Đang chạy" : "Đã hoàn thành"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-2">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Thời gian đi</span>
                <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="size-4 text-[#802222]" />
                  {depTimeStr}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Thời gian đến</span>
                <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="size-4 text-emerald-600" />
                  {arrTimeStr}
                </p>
              </div>
            </div>
          </Card>

          {/* Interactive seat layout viewer */}
          <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6">
            <div className="pb-4 mb-4 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-[#802222]">Sơ đồ ghế ngồi & Báo cáo sự cố</h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Chọn toa và click chọn ghế bị hư hỏng trên sơ đồ để báo cáo cho Admin.
              </p>
            </div>

            {!canReportSeatIssue && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
                Chuyến tàu đã kết thúc hoặc không còn hoạt động. Chức năng báo cáo sự cố ghế đã bị khóa.
              </div>
            )}

            {/* Reusable Coach navigation bar */}
            {coaches.length > 0 ? (
              <div className="space-y-6">
                <BookingCoachNavigationBar
                  coaches={coaches}
                  selectedCoachId={activeCoachId}
                  onCoachSelect={setActiveCoachId}
                  trainCode={trip.train?.code || ""}
                />

                {/* Seat Layout Viewport */}
                <div className="min-h-[350px]">
                  {isCoachLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Spinner className="w-8 h-8 text-[#802222]" />
                    </div>
                  ) : coachWithPrices ? (
                    <div>
                      {coachWithPrices.template.layout === 'SEAT' ? (
                        <SeatLayoutViewer
                          seats={coachWithPrices.seats}
                          template={coachWithPrices.template}
                          onSeatClick={handleSeatClick}
                          tripId={tripId}
                          isAdmin={true} // Admin mode allows selecting any seat state and opens detailed layout
                          selectedSeats={[]}
                          highlightedSeatIds={[]}
                          focusedSeatId={null}
                          coachName={coachWithPrices.name}
                        />
                      ) : (
                        <BedLayoutViewer
                          seats={coachWithPrices.seats}
                          template={coachWithPrices.template}
                          onSeatClick={handleSeatClick}
                          tripId={tripId}
                          isAdmin={true}
                          selectedSeats={[]}
                          highlightedSeatIds={[]}
                          focusedSeatId={null}
                          coachName={coachWithPrices.name}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-muted-foreground italic text-xs">
                      Không có dữ liệu ghế cho toa này
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-xs text-muted-foreground font-semibold">Tàu hiện tại không có dữ liệu toa xe nào</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right side information (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4 tracking-wider flex items-center gap-1.5">
              <Timer className="size-4 text-[#802222]" />
              Báo cáo delay
            </h4>
            <div className="space-y-3 text-xs font-medium text-muted-foreground leading-relaxed">
              <p>
                {trip.status === "SCHEDULED"
                  ? "Chuyến chưa khởi hành: tài xế có thể báo trễ khởi hành để Admin duyệt."
                  : trip.status === "IN_PROGRESS"
                    ? "Chuyến đang chạy: tài xế có thể báo trễ thời gian đến ga để Admin duyệt."
                    : "Chuyến đã kết thúc hoặc không còn hoạt động nên không thể báo delay."}
              </p>
              <Button
                type="button"
                onClick={() => {
                  setDelayDialogOpen(true)
                  setDelayError("")
                  setDelaySuccess("")
                }}
                disabled={!canReportDelay}
                className="w-full rounded-xl bg-[#802222] hover:bg-rose-900 text-white font-bold text-xs h-11"
              >
                Gửi báo cáo delay
              </Button>
              {!canReportDelay && (
                <p className="rounded-xl bg-amber-50 p-3 text-[11px] font-semibold text-amber-700">
                  Chức năng báo cáo delay chỉ mở cho chuyến sắp khởi hành hoặc đang chạy.
                </p>
              )}
            </div>
          </Card>

          <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4 tracking-wider flex items-center gap-1.5">
              <Info className="size-4 text-[#802222]" />
              Hướng dẫn báo hỏng
            </h4>
            <div className="space-y-4 text-xs font-medium text-muted-foreground leading-relaxed">
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-rose-50 text-[#802222] flex items-center justify-center font-bold flex-none text-[10px]">1</div>
                <p>Chọn đúng Toa tàu đang có sự cố từ thanh chọn toa phía trên.</p>
              </div>
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-rose-50 text-[#802222] flex items-center justify-center font-bold flex-none text-[10px]">2</div>
                <p>Click chọn chiếc ghế ngồi/giường nằm bị hỏng tương ứng trên sơ đồ toa.</p>
              </div>
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-rose-50 text-[#802222] flex items-center justify-center font-bold flex-none text-[10px]">3</div>
                <p>Chọn loại sự cố (dropdown) và nhập mô tả tình trạng hư hỏng thực tế (tối thiểu 10 ký tự).</p>
              </div>
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-rose-50 text-[#802222] flex items-center justify-center font-bold flex-none text-[10px]">4</div>
                <p>Bấm nút <strong>Gửi báo cáo</strong>. Trạng thái ghế trên chuyến tàu này sẽ tự động khóa hỏng và thông báo ngay đến hệ thống của Admin để đổi ghế.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal báo hỏng ghế */}
      <Dialog open={selectedSeat !== null} onOpenChange={(open) => !open && setSelectedSeat(null)}>
        <DialogContent className="rounded-3xl border border-gray-100 max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#802222] flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Báo cáo ghế hỏng
            </DialogTitle>
            <DialogDescription className="text-xs mt-1">
              Bạn đang tạo báo cáo sự cố hư hỏng vật lý cho vị trí ghế ngồi này.
            </DialogDescription>
          </DialogHeader>

          {successMsg ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="size-12 text-emerald-500 mx-auto animate-bounce" />
              <p className="text-sm font-bold text-gray-900">{successMsg}</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Seat Details row */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl text-xs font-semibold">
                <div>
                  <span className="text-muted-foreground block font-bold text-[9px] uppercase tracking-wider mb-0.5">Số ghế</span>
                  <span className="text-gray-900 text-sm font-black">{selectedSeat?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold text-[9px] uppercase tracking-wider mb-0.5">Toa số</span>
                  <span className="text-gray-900 text-sm font-black">{activeCoach?.name || activeCoach?.order}</span>
                </div>
              </div>

              {/* Checks already disabled */}
              {selectedSeat?.status === "DISABLED" || selectedSeat?.status === "MAINTENANCE" ? (
                <div className="flex gap-2.5 bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs leading-relaxed font-semibold">
                  <ShieldAlert className="size-5 flex-none" />
                  <p>Ghế này đã mang trạng thái BỊ SỰ CỐ / ĐÃ KHÓA trên hệ thống. Không cần tạo thêm báo cáo mới.</p>
                </div>
              ) : (
                <>
                  {/* Select issue type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Loại sự cố</label>
                    <Select value={issueType} onValueChange={setIssueType}>
                      <SelectTrigger className="rounded-xl h-11 text-xs font-bold border-gray-200">
                        <SelectValue placeholder="Chọn loại sự cố" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Ghế gãy/hỏng" className="text-xs font-bold">Ghế gãy/hỏng</SelectItem>
                        <SelectItem value="Ghế bẩn" className="text-xs font-bold">Ghế bẩn</SelectItem>
                        <SelectItem value="Không điều chỉnh được" className="text-xs font-bold">Không điều chỉnh được</SelectItem>
                        <SelectItem value="Thiết bị hỏng (đèn, ổ cắm)" className="text-xs font-bold">Thiết bị hỏng (đèn, ổ cắm)</SelectItem>
                        <SelectItem value="Khác" className="text-xs font-bold">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Input description text */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Mô tả tình trạng sự cố</label>
                    <Textarea
                      placeholder="Mô tả cụ thể hư hỏng để Admin dễ kiểm duyệt và kỹ thuật viên sửa chữa (tối thiểu 10 ký tự)..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="rounded-xl min-h-[100px] text-xs font-semibold border-gray-200"
                    />
                  </div>

                  {errorMsg && (
                    <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl">{errorMsg}</p>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedSeat(null)} 
              className="rounded-xl text-xs font-bold"
              disabled={submitting}
            >
              Hủy bỏ
            </Button>
            
            {!(selectedSeat?.status === "DISABLED" || selectedSeat?.status === "MAINTENANCE") && !successMsg && (
              <Button
                onClick={handleSubmitReport}
                className="rounded-xl bg-[#802222] hover:bg-rose-900 text-white font-bold text-xs px-6 border-none shadow-md shadow-rose-900/10 flex items-center gap-1.5"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi báo cáo"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delayDialogOpen} onOpenChange={setDelayDialogOpen}>
        <DialogContent className="rounded-3xl border border-gray-100 max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#802222] flex items-center gap-2">
              <Timer className="size-5 text-amber-500" />
              Báo cáo delay chuyến tàu
            </DialogTitle>
            <DialogDescription className="text-xs mt-1">
              Báo cáo sẽ ở trạng thái chờ duyệt. Delay chỉ được áp dụng sau khi Admin xác nhận.
            </DialogDescription>
          </DialogHeader>

          {delaySuccess ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="size-12 text-emerald-500 mx-auto animate-bounce" />
              <p className="text-sm font-bold text-gray-900">{delaySuccess}</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl text-xs font-semibold">
                <div>
                  <span className="text-muted-foreground block font-bold text-[9px] uppercase tracking-wider mb-0.5">Loại delay</span>
                  <span className="text-gray-900 text-sm font-black">
                    {delayType === "DEPARTURE" ? "Trễ khởi hành" : "Trễ đến ga"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold text-[9px] uppercase tracking-wider mb-0.5">Trạng thái</span>
                  <span className="text-gray-900 text-sm font-black">
                    {trip.status === "SCHEDULED" ? "Sắp chạy" : "Đang chạy"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Số phút delay</label>
                <Input
                  type="number"
                  min={1}
                  max={720}
                  value={delayMinutes}
                  onChange={(event) => setDelayMinutes(event.target.value)}
                  placeholder="Ví dụ: 15"
                  className="rounded-xl h-11 text-xs font-semibold border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Lý do delay</label>
                <Textarea
                  placeholder="Nhập nguyên nhân delay thực tế để Admin kiểm duyệt..."
                  value={delayReason}
                  onChange={(event) => setDelayReason(event.target.value)}
                  className="rounded-xl min-h-[100px] text-xs font-semibold border-gray-200"
                />
              </div>

              {delayError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl">{delayError}</p>
              )}
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="ghost"
              onClick={() => setDelayDialogOpen(false)}
              className="rounded-xl text-xs font-bold"
              disabled={delaySubmitting}
            >
              Hủy bỏ
            </Button>
            {!delaySuccess && (
              <Button
                onClick={handleSubmitDelayReport}
                className="rounded-xl bg-[#802222] hover:bg-rose-900 text-white font-bold text-xs px-6 border-none shadow-md shadow-rose-900/10 flex items-center gap-1.5"
                disabled={delaySubmitting}
              >
                {delaySubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi báo cáo"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
