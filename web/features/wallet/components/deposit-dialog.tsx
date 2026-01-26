"use client"

import { useState } from "react"
import { useWallet } from "../hooks/use-wallet"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, CreditCard } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface DepositDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const AMOUNTS = [100000, 200000, 500000, 1000000, 2000000]

export function DepositDialog({ open, onOpenChange }: DepositDialogProps) {
    const { deposit, isDepositing } = useWallet()
    const [amount, setAmount] = useState<number>(0)
    const [error, setError] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (amount < 10000) {
            setError("Số tiền nạp tối thiểu là 10.000đ")
            return
        }

        deposit(amount)
        // onSuccess handles redirect, no need to clear form here immediately
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nạp tiền vào ví</DialogTitle>
                    <DialogDescription>
                        Thanh toán an toàn qua cổng VNPAY. Tiền sẽ vào ví ngay lập tức.
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
                            Tiếp tục qua VNPAY
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
