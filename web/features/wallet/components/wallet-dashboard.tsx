"use client"

import { useState, useEffect } from "react"
import { useWallet } from "../hooks/use-wallet"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Wallet, ArrowUpCircle, ArrowDownCircle, History, ShieldCheck, CreditCard, Plus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { WithdrawDialog } from "./withdraw-dialog"
import { SetupPinDialog } from "./setup-pin-dialog"
import { DepositDialog } from "./deposit-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"

export function WalletDashboard() {
    const { wallet, isLoading } = useWallet()
    const [showWithdraw, setShowWithdraw] = useState(false)
    const [showSetupPin, setShowSetupPin] = useState(false)
    const [showDeposit, setShowDeposit] = useState(false)

    // Check for payment callback params
    const searchParams = useSearchParams()
    const router = useRouter()

    const queryClient = useQueryClient()

    useEffect(() => {
        const depositStatus = searchParams.get('deposit')
        const amount = searchParams.get('amount')

        if (depositStatus === 'success') {
            queryClient.invalidateQueries({ queryKey: ['wallet'] })
            toast.success(`Nạp tiền thành công! +${formatCurrency(amount ? Number(amount) : 0)}`)
            router.replace('/user/wallet') // Clear params
        } else if (depositStatus === 'failed') {
            toast.error('Nạp tiền thất bại hoặc bị hủy.')
            router.replace('/user/wallet')
        }
    }, [searchParams, router, queryClient])

    if (isLoading) {
        return <WalletSkeleton />
    }

    if (!wallet) return null

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Balance Card */}
                <Card className="col-span-2 bg-linear-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wallet className="w-32 h-32" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Số dư khả dụng
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold tracking-tight text-primary">
                            {formatCurrency(wallet.balance)}
                        </div>
                        <div className="flex gap-2 mt-6">
                            <Button
                                onClick={() => setShowDeposit(true)}
                                className="gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Nạp tiền
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowWithdraw(true)}
                                disabled={wallet.balance < 10000}
                                className="gap-2"
                            >
                                <ArrowUpCircle className="w-4 h-4" />
                                Rút tiền
                            </Button>
                            {!wallet.hasPin ? (
                                <Button variant="outline" onClick={() => setShowSetupPin(true)} className="gap-2 border-orange-500 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30">
                                    <ShieldCheck className="w-4 h-4" />
                                    Thiết lập mã PIN
                                </Button>
                            ) : (
                                <Button variant="ghost" disabled className="gap-2 text-muted-foreground">
                                    <ShieldCheck className="w-4 h-4" />
                                    Đã bảo vệ bằng PIN
                                </Button>
                            )}
                        </div>
                        {!wallet.hasPin && (
                            <p className="text-xs text-orange-600 mt-2 font-medium">
                                * Bạn cần thiết lập mã PIN để thanh toán
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Stats or Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Thông tin ví</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Bảo mật</p>
                                <p className="text-xs text-muted-foreground">Ví được bảo vệ an toàn</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Thanh toán nhanh</p>
                                <p className="text-xs text-muted-foreground">Không cần chuyển khoản lại</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>Lịch sử giao dịch</CardTitle>
                            <CardDescription>20 giao dịch gần nhất của bạn</CardDescription>
                        </div>
                        <History className="w-4 h-4 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                            {wallet.transactions.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    Chưa có giao dịch nào
                                </div>
                            ) : (
                                wallet.transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${tx.amount > 0
                                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                                                : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                                                }`}>
                                                {tx.amount > 0 ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="font-medium flex items-center gap-2">
                                                    {tx.description || getTxTitle(tx.type)}
                                                    {tx.paymentMethod && tx.type === 'PAYMENT' && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {tx.paymentMethod}
                                                        </Badge>
                                                    )}
                                                    <StatusBadge status={tx.status} />
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {format(new Date(tx.createdAt), 'PP pp', { locale: vi })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <WithdrawDialog open={showWithdraw} onOpenChange={setShowWithdraw} maxAmount={wallet.balance} />
            <SetupPinDialog open={showSetupPin} onOpenChange={setShowSetupPin} />
            <DepositDialog open={showDeposit} onOpenChange={setShowDeposit} />
        </div>
    )
}

function getTxTitle(type: string) {
    switch (type) {
        case 'DEPOSIT': return 'Nạp tiền';
        case 'WITHDRAW': return 'Rút tiền';
        case 'PAYMENT': return 'Thanh toán vé';
        case 'REFUND': return 'Hoàn tiền';
        default: return 'Giao dịch';
    }
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'COMPLETED': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Thành công</Badge>;
        case 'PENDING': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Đang xử lý</Badge>;
        case 'FAILED': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Thất bại</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}

function WalletSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
    )
}
