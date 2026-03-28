"use client"

import { useEffect, useState } from "react"
import { useWallet } from "../hooks/use-wallet"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, CreditCard, ChevronRight, XCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { BookingTimer } from "@/features/booking/components/booking-timer"

interface DepositDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    existingSession?: { transactionId: string, url: string, expiresAt: string, amount: number } | null
}

const AMOUNTS = [100000, 200000, 500000, 1000000, 2000000]

export function DepositDialog({ open, onOpenChange, existingSession }: DepositDialogProps) {
    const { depositAsync, isDepositing, cancelDeposit, isCancelingDeposit } = useWallet()
    const [amount, setAmount] = useState<number>(0)
    const [error, setError] = useState("")
    const [pendingSession, setPendingSession] = useState<{ transactionId: string, url: string, expiresAt: string } | null>(null)

    useEffect(() => {
        if (open) {
            if (existingSession) {
                setPendingSession({
                    transactionId: existingSession.transactionId,
                    url: existingSession.url,
                    expiresAt: existingSession.expiresAt
                })
                setAmount(existingSession.amount)
            }
        } else {
            // reset when closed
            setPendingSession(null)
            setAmount(0)
            setError("")
        }
    }, [open, existingSession])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (amount < 10000) {
            setError("Số tiền nạp tối thiểu là 10.000đ")
            return
        }

        try {
            const res = await depositAsync(amount)
            setPendingSession(res.data)
        } catch (err: any) {
            // Error handled by mutation
        }
    }

    const handleCancel = () => {
        if (pendingSession) {
            cancelDeposit(pendingSession.transactionId, {
                onSuccess: () => {
                    setPendingSession(null)
                    onOpenChange(false)
                }
            });
        }
    }

    const handleExpire = () => {
        setPendingSession(null)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                {!pendingSession ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Nạp tiền vào ví</DialogTitle>
                            <DialogDescription>
                                Thanh toán an toàn qua cổng VNPAY. Tiền sẽ vào ví ngay sau khi hoàn tất giao dịch.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2">
                                    {AMOUNTS.map((amt) => (
                                        <Button
                                            key={amt}
                                            type="button"
                                            variant={amount === amt ? "default" : "outline"}
                                            onClick={() => {
                                                setAmount(amt)
                                                setError("")
                                            }}
                                            className="text-xs"
                                        >
                                            {formatCurrency(amt)}
                                        </Button>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount">Nhập số tiền khác (VNĐ)</Label>
                                    <div className="relative">
                                        <Input
                                            id="amount"
                                            type="number"
                                            min={10000}
                                            step={10000}
                                            placeholder="0"
                                            className="pl-9 text-lg font-medium"
                                            value={amount || ""}
                                            onChange={(e) => {
                                                setAmount(parseInt(e.target.value) || 0)
                                                setError("")
                                            }}
                                        />
                                        <span className="absolute left-3 top-2.5 text-muted-foreground">đ</span>
                                    </div>
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}

                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={isDepositing || amount < 10000} className="w-full sm:w-auto">
                                    {isDepositing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Tạo giao dịch nạp tiền
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex justify-between items-center pr-6">
                                Đang chờ thanh toán
                                <BookingTimer expiresAt={pendingSession.expiresAt} onExpire={handleExpire} />
                            </DialogTitle>
                            <DialogDescription>
                                Vui lòng hoàn tất thanh toán qua VNPAY trong thời gian quy định.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-6 space-y-4">
                            <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Số tiền yêu cầu nạp:</span>
                                <span className="text-lg font-bold text-[#802222] dark:text-rose-400">{formatCurrency(amount)}</span>
                            </div>
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-col gap-2">
                            <Button 
                                onClick={() => window.location.href = pendingSession.url}
                                className="w-full bg-[#802222] hover:bg-[#802222]/90 text-white"
                            >
                                Chuyển đến VNPAY ngay
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={handleCancel}
                                disabled={isCancelingDeposit}
                                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center"
                            >
                                {isCancelingDeposit ?? <Loader2 className=" animate-spin" />}
                                Hủy giao dịch này
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
