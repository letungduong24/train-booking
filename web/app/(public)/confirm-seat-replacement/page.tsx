"use client"

import * as React from "react"
import apiClient from "@/lib/api-client"
import { Loader2, Train, AlertTriangle, CheckCircle2, ChevronRight, User, HelpCircle, PhoneCall, ArrowRight, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import Link from "next/link"

export default function ConfirmSeatReplacementPage() {
  const [token, setToken] = React.useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = React.useState(false);
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedSeatId, setSelectedSeatId] = React.useState<string>("");
  const [processing, setProcessing] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");
  
  // Support state
  const [supportRequested, setSupportRequested] = React.useState(false);

  React.useEffect(() => {
    // Get token from URL parameters
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenParam = urlParams.get("token");
      setToken(tokenParam);
      setTokenChecked(true);
      if (!tokenParam) {
        setLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    if (!token) return;

    async function fetchOptions() {
      try {
        setLoading(true);
        setErrorMsg("");
        const response = await apiClient.get(`/tickets/replacement-options?token=${token}`);
        setData(response.data);
        
        // Auto-select first proposed seat
        const optionsList = response.data?.options || [];
        if (optionsList.length > 0) {
          setSelectedSeatId(optionsList[0].id);
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.response?.data?.message || "Token đổi ghế không hợp lệ, đã được xử lý hoặc hết hạn 24 giờ.");
      } finally {
        setLoading(false);
      }
    }

    fetchOptions();
  }, [token]);

  const handleConfirmReplacement = async () => {
    if (!selectedSeatId) {
      setErrorMsg("Vui lòng chọn một ghế ngồi từ danh sách đề xuất.");
      return;
    }

    try {
      setProcessing(true);
      setErrorMsg("");
      
      await apiClient.post('/tickets/confirm-replacement', {
        token,
        seatId: selectedSeatId
      });

      setSuccessMsg("Đổi ghế ngồi thành công! Vé của bạn đã được cập nhật vị trí mới.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Đã xảy ra sự cố khi lưu đổi ghế. Vui lòng chọn ghế khác.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectReplacement = async () => {
    try {
      setProcessing(true);
      setErrorMsg("");

      await apiClient.post('/tickets/reject-replacement', {
        token,
      });

      setSuccessMsg("Yêu cầu hoàn tiền đã được xử lý. Vé bị ảnh hưởng đã được hủy và tiền đã được hoàn về ví của bạn.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Không thể xử lý yêu cầu hoàn tiền. Vui lòng thử lại.");
    } finally {
      setProcessing(false);
    }
  };

  if (!tokenChecked || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <Loader2 className="size-10 animate-spin text-[#802222]" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50 p-6">
        <Card className="rounded-[2.5rem] border border-gray-100 max-w-md w-full p-8 text-center space-y-4 shadow-xl">
          <AlertTriangle className="size-12 text-rose-500 mx-auto" />
          <h3 className="text-xl font-bold text-gray-900">Thiếu mã xác thực</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Đường dẫn xác thực đổi ghế thiếu mã token hợp lệ. Vui lòng kiểm tra lại liên kết trong hòm thư email của bạn.
          </p>
        </Card>
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50 p-6">
        <Card className="rounded-[2.5rem] border border-gray-100 max-w-md w-full p-8 text-center space-y-4 shadow-xl">
          <AlertTriangle className="size-12 text-rose-500 mx-auto animate-pulse" />
          <h3 className="text-xl font-bold text-gray-900">Liên kết hết hạn</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {errorMsg}
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <Button asChild className="rounded-xl bg-[#802222] hover:bg-rose-900 text-white font-bold text-xs h-11 border-none shadow-md shadow-rose-900/10">
              <Link href="/">Quay về Trang chủ</Link>
            </Button>
            <Button variant="ghost" className="rounded-xl text-xs font-bold text-[#802222] hover:bg-rose-50" onClick={() => setSupportRequested(true)}>
              Liên hệ bộ phận CSKH
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { report, ticket, options = [] } = data || {};
  const oldSeat = report?.seat;
  const oldCoach = oldSeat?.coach;
  const trip = report?.trip;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/30 to-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full space-y-6">
        {/* Brand logo header */}
        <div className="text-center">
          <span className="text-2xl font-black italic tracking-tight text-gray-900">Railflow<span className="text-[#802222]">.</span></span>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#802222] mt-0.5">Xác nhận đổi ghế sự cố</p>
        </div>

        {successMsg ? (
          <Card className="rounded-[2.5rem] border border-gray-100 shadow-xl bg-white p-8 text-center space-y-6 animate-in zoom-in duration-500">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="size-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">{successMsg}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vị trí ghế ngồi mới đã được cập nhật trực tiếp vào mã vé điện tử của bạn. Email xác nhận thông tin vé mới đã được tự động gửi đi.
              </p>
            </div>
            <div className="pt-4">
              <Button asChild className="rounded-xl bg-[#802222] hover:bg-rose-900 text-white font-bold text-xs h-11 px-8 border-none shadow-md shadow-rose-900/10">
                <Link href="/">Quay về Trang chủ</Link>
              </Button>
            </div>
          </Card>
        ) : supportRequested ? (
          <Card className="rounded-[2.5rem] border border-gray-100 shadow-xl bg-white p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-50 text-[#802222] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-900/10">
              <PhoneCall className="size-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Yêu cầu hỗ trợ đã được gửi</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Quản trị viên đã nhận được yêu cầu của bạn. Bộ phận CSKH Railflow sẽ liên hệ hỗ trợ bạn đổi ghế thủ công qua Email hoặc Số điện thoại đặt vé trong vòng vài phút.
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-2">
              <Button onClick={() => setSupportRequested(false)} variant="outline" className="rounded-xl text-xs font-bold h-11 border-gray-200">
                Quay lại sơ đồ đổi ghế
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Banner Warning */}
            <div className="flex gap-3 bg-amber-500/10 text-amber-800 p-5 rounded-[1.5rem] border border-amber-500/20 text-xs font-semibold leading-relaxed">
              <AlertTriangle className="size-6 flex-none text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900">Sự cố kỹ thuật ghế ngồi</p>
                <p className="mt-1 text-amber-800/80">
                  Rất tiếc! Vị trí ghế ngồi ban đầu của bạn (<strong>Ghế {oldSeat?.name} - Toa {oldCoach?.name || oldCoach?.order}</strong>) trên chuyến đi gặp sự cố kỹ thuật vật lý đột xuất và đã được khóa để sửa chữa. Hệ thống đã tự động lọc các vị trí ghế trống tương đương phù hợp nhất dưới đây để bạn xác nhận đổi ghế hoàn toàn miễn phí.
                </p>
              </div>
            </div>

            {/* Ticket & Trip details */}
            <Card className="rounded-[2rem] border border-gray-100 shadow-xl bg-white p-6">
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
                <div className="p-3 bg-rose-50 text-[#802222] rounded-2xl">
                  <Train className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{trip?.route?.name || "Hành trình"}</h4>
                  <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                    <User className="size-3" />
                    Hành khách: {ticket?.passengerName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider mb-0.5">Mã đặt vé</span>
                  <span className="text-gray-900 font-bold">{ticket?.id?.substring(0, 8).toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider mb-0.5">Ghế bị sự cố</span>
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    Toa {oldCoach?.name || oldCoach?.order} - Ghế {oldSeat?.name} ⚠️
                  </span>
                </div>
              </div>
            </Card>

            {/* Recommendation list */}
            <Card className="rounded-[2rem] border border-gray-100 shadow-xl bg-white p-6">
              <div className="pb-4 mb-4 border-b border-gray-100">
                <h4 className="text-sm font-bold text-gray-900">Danh sách ghế trống đề xuất</h4>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                  Railflow tự động chọn 1 phương án tối ưu nhất. Bạn có thể thay đổi sang ghế mong muốn khác.
                </p>
              </div>

              <div className="space-y-2.5">
                {options.map((option: any, index: number) => {
                  const isSelected = selectedSeatId === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedSeatId(option.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-xs font-bold ${
                        isSelected
                          ? "bg-rose-50/40 border-[#802222] text-[#802222] shadow-sm shadow-[#802222]/5"
                          : "bg-gray-50/50 hover:bg-gray-50 border-gray-100 text-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl text-rose-500 shadow-sm ${isSelected ? "bg-white" : "bg-white"}`}>
                          <Train className="size-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-gray-900 font-bold">Toa {option.coach?.name || option.coach?.order} - Ghế {option.name}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5 font-medium">Ghế {option.type} - Cùng tầng và cùng mức giá vé</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Badge className="bg-emerald-50 text-emerald-600 border-none px-2 rounded-full text-[8px] font-bold">
                            Tối ưu nhất
                          </Badge>
                        )}
                        <div className={`size-4 rounded-full border flex items-center justify-center ${isSelected ? "border-[#802222] bg-[#802222]" : "border-gray-300"}`}>
                          {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {errorMsg && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl mt-4">{errorMsg}</p>
              )}

              {/* Action buttons */}
              <div className="pt-6 flex flex-col gap-2">
                <Button
                  onClick={handleConfirmReplacement}
                  className="w-full rounded-xl bg-[#802222] hover:bg-rose-900 text-white font-bold text-xs h-11 border-none shadow-md shadow-rose-900/10 flex items-center justify-center gap-1.5"
                  disabled={processing || options.length === 0}
                >
                  {processing ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Đang xử lý đổi ghế...
                    </>
                  ) : (
                    <>
                      Xác nhận đổi ghế
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleRejectReplacement}
                  variant="ghost"
                  className="rounded-xl text-xs font-bold text-gray-500 hover:bg-rose-50 hover:text-[#802222] h-10 mt-1"
                  disabled={processing}
                >
                  Tôi không ưng ý với các ghế đề xuất này
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
