"use client"

import { useWallet } from "../hooks/use-wallet"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { formatCurrency } from "@/lib/utils"

const withdrawSchema = z.object({
    amount: z.coerce.number().min(50000, "Tối thiểu 50,000đ"),
    bankName: z.string().min(1, "Vui lòng nhập tên ngân hàng"),
    bankAccount: z.string().min(1, "Vui lòng nhập số tài khoản"),
    accountName: z.string().min(1, "Vui lòng nhập tên chủ tài khoản").toUpperCase(),
})

interface WithdrawDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    maxAmount: number
}

export function WithdrawDialog({ open, onOpenChange, maxAmount }: WithdrawDialogProps) {
    const { withdraw, isWithdrawing } = useWallet()

    const form = useForm<z.infer<typeof withdrawSchema>>({
        resolver: zodResolver(withdrawSchema),
        defaultValues: {
            amount: 0,
            bankName: "",
            bankAccount: "",
            accountName: "",
        },
    })

    const onSubmit = (values: z.infer<typeof withdrawSchema>) => {
        if (values.amount > maxAmount) {
            form.setError("amount", { message: "Số dư không đủ" })
            return
        }

        withdraw(values, {
            onSuccess: () => {
                onOpenChange(false)
                form.reset()
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rút tiền về ngân hàng</DialogTitle>
                    <DialogDescription>
                        Điền thông tin tài khoản nhận tiền. Số dư khả dụng: <span className="font-bold text-primary">{formatCurrency(maxAmount)}</span>
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Số tiền rút (VNĐ)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Nhập số tiền" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="bankName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ngân hàng</FormLabel>
                                    <FormControl>
                                        <Input placeholder="VD: Vietcombank" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="bankAccount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số tài khoản</FormLabel>
                                        <FormControl>
                                            <Input placeholder="098..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="accountName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Chủ tài khoản</FormLabel>
                                        <FormControl>
                                            <Input placeholder="NGUYEN VAN A" className="uppercase" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isWithdrawing}>
                                {isWithdrawing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Gửi yêu cầu
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
