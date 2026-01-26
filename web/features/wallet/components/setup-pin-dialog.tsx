"use client"

import { useState } from "react"
import { useWallet } from "../hooks/use-wallet"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface SetupPinDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SetupPinDialog({ open, onOpenChange }: SetupPinDialogProps) {
    const { setupPin, isSettingPin } = useWallet()
    const [pin, setPin] = useState("")
    const [confirmPin, setConfirmPin] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (pin.length !== 6 || !/^\d+$/.test(pin)) {
            setError("Mã PIN phải gồm 6 chữ số")
            return
        }

        if (pin !== confirmPin) {
            setError("Mã PIN xác nhận không khớp")
            return
        }

        setupPin(pin, {
            onSuccess: () => {
                onOpenChange(false)
                setPin("")
                setConfirmPin("")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Thiết lập mã PIN</DialogTitle>
                    <DialogDescription>
                        Tạo mã PIN 6 số để bảo vệ ví và xác thực thanh toán.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="pin">Mã PIN mới</Label>
                        <Input
                            id="pin"
                            type="password"
                            maxLength={6}
                            placeholder="------"
                            className="text-center text-2xl tracking-[0.5em] font-mono"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPin">Xác nhận mã PIN</Label>
                        <Input
                            id="confirmPin"
                            type="password"
                            maxLength={6}
                            placeholder="------"
                            className="text-center text-2xl tracking-[0.5em] font-mono"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isSettingPin || !pin || !confirmPin}>
                            {isSettingPin && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Thiết lập
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
