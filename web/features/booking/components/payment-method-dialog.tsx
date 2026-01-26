"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Wallet, CreditCard, ChevronRight, Loader2, Lock } from "lucide-react"
import { useWallet } from "@/features/wallet/hooks/use-wallet"
import { formatCurrency } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import apiClient from '@/lib/api-client'
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface PaymentMethodDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    amount: number
    paymentUrl: string
    bookingCode: string
}

export function PaymentMethodDialog({ open, onOpenChange, amount, paymentUrl, bookingCode }: PaymentMethodDialogProps) {
    const { wallet, isLoading } = useWallet()
    const [method, setMethod] = useState<"vnpay" | "wallet">("vnpay")
    const [pin, setPin] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const router = useRouter()

    const handlePayment = async () => {
        if (method === "vnpay") {
            window.location.href = paymentUrl
            return
        }

        if (method === "wallet") {
            if (!pin || pin.length !== 6) {
                toast.error("Vui lòng nhập mã PIN 6 số")
                return
            }

            setIsProcessing(true)
            try {
                await apiClient.post('/wallet/pay', {
                    bookingCode,
                    pin
                })
                toast.success("Thanh toán thành công!")
                router.push(`/booking/payment-result?success=true&orderId=${bookingCode}`)
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Thanh toán thất bại")
                setIsProcessing(false)
            }
        }
    }

    const isWalletSufficient = wallet ? wallet.balance >= amount : false

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Chọn phương thức thanh toán</DialogTitle>
                    <DialogDescription>
                        Khoản thanh toán: <span className="font-bold text-foreground">{formatCurrency(amount)}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <RadioGroup value={method} onValueChange={(v) => {
                        setMethod(v as any)
                        setPin("")
                    }}>
                        {/* VNPAY Option */}
                        <div className={`flex items-center space-x-4 border rounded-lg p-4 cursor-pointer transition-all ${method === 'vnpay' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-accent'}`} onClick={() => setMethod('vnpay')}>
                            <RadioGroupItem value="vnpay" id="vnpay" />
                            <Label htmlFor="vnpay" className="flex-1 cursor-pointer flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium">VNPAY / Thẻ Ngân Hàng</p>
                                        <p className="text-xs text-muted-foreground">Quét mã QR hoặc thẻ ATM</p>
                                    </div>
                                </div>
                            </Label>
                        </div>

                        {/* Wallet Option */}
                        <div className={`flex flex-col space-y-4 border rounded-lg p-4 cursor-pointer transition-all ${method === 'wallet' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-accent'}`} onClick={() => setMethod('wallet')}>
                            <div className="flex items-center space-x-4">
                                <RadioGroupItem value="wallet" id="wallet" disabled={!isWalletSufficient && !isLoading} />
                                <Label htmlFor="wallet" className="flex-1 cursor-pointer flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-100 rounded-md flex items-center justify-center text-orange-600">
                                            <Wallet className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Ví Điện Tử</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-muted-foreground">
                                                    Số dư: {wallet ? formatCurrency(wallet.balance) : <Loader2 className="w-3 h-3 inline animate-spin" />}
                                                </p>
                                                {!isWalletSufficient && wallet && (
                                                    <span className="text-xs text-red-500 font-medium">(Không đủ)</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Label>
                            </div>

                            {/* PIN Input (Only shown when Wallet selected) */}
                            {method === 'wallet' && (
                                <div className="pl-14 pr-4 animate-in slide-in-from-top-2">
                                    {!wallet?.hasPin ? (
                                        <p className="text-sm text-red-500 py-2">Bạn chưa thiết lập mã PIN. Vui lòng vào Ví cá nhân để cài đặt.</p>
                                    ) : isWalletSufficient ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="pin" className="text-xs">Nhập mã PIN xác nhận (6 số)</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="pin"
                                                    type="password"
                                                    maxLength={6}
                                                    placeholder="• • • • • •"
                                                    className="pl-9 tracking-widest"
                                                    value={pin}
                                                    onChange={(e) => setPin(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-red-500 py-2">Vui lòng nạp thêm tiền để thanh toán.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </RadioGroup>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handlePayment} disabled={isProcessing || (method === 'wallet' && (!isWalletSufficient || !pin))}>
                        {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {method === 'vnpay' ? 'Tiếp tục qua VNPAY' : 'Thanh toán ngay'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
