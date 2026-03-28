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
    const [selectedPendingSession, setSelectedPendingSession] = useState<{url: string, expiresAt: string, transactionId: string, amount: number} | null>(null)

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
            router.replace('/dashboard/wallet') // Clear params
        } else if (depositStatus === 'failed') {
            toast.error('Nạp tiền thất bại hoặc bị hủy.')
            router.replace('/dashboard/wallet')
        }
    }, [searchParams, router, queryClient])

    if (isLoading) {
        return <WalletSkeleton />
    }

    if (!wallet) return null

    return (
        <div className="space-y-8">
            <div className="">
                {/* Balance Card */}
                <div className="relative rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-[#802222] to-rose-900 shadow-xl p-8 text-white group border border-rose-800/20">
                    <div className="z-10 relative">
                        <p className="text-xs font-medium mb-2 opacity-80 text-rose-100">Số dư khả dụng</p>
                        <div className="text-4xl font-bold mb-6 tracking-tight tabular-nums">
                            {formatCurrency(wallet.balance)}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-auto">
                            <Button
                                onClick={() => setShowDeposit(true)}
                                className="bg-white text-[#802222] hover:bg-rose-50 font-medium text-sm px-5 py-5 rounded-[1.2rem] transition-all shadow-lg shadow-rose-950/20 hover:scale-105 active:scale-95"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Nạp tiền
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowWithdraw(true)}
                                disabled={wallet.balance < 10000}
                                className="bg-rose-950/30 text-white border-white/20 hover:bg-rose-900/50 font-medium text-sm px-5 py-5 rounded-[1.2rem] transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                            >
                                <ArrowUpCircle className="w-4 h-4 mr-2" />
                                Rút tiền
                            </Button>
                            {!wallet.hasPin ? (
                                <Button 
                                    onClick={() => setShowSetupPin(true)} 
                                    className="bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm px-5 py-5 rounded-[1.2rem] transition-all shadow-lg shadow-amber-950/20 hover:scale-105 active:scale-95"
                                >
                                    <ShieldCheck className="w-4 h-4 mr-2" />
                                    Thiết lập mã PIN
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white/80">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm font-medium">Đã bảo vệ bằng PIN</span>
                                </div>
                            )}
                        </div>
                        {!wallet.hasPin && (
                            <div className="mt-3 flex items-center gap-2 text-rose-200/80 animate-pulse">
                                <Plus className="w-3.5 h-3.5 rotate-45" />
                                <p className="text-xs font-medium">
                                    Bạn cần thiết lập mã PIN để có thể thực hiện thanh toán
                                </p>
                            </div>
                        )}
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute right-0 top-0 w-1/3 h-full bg-white/5 skew-x-[-20deg] translate-x-12 -z-0" />
                    <Wallet className="absolute -right-8 -bottom-8 w-48 h-48 opacity-[0.05] -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                </div>
            </div>

            {/* Transactions */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl shadow-rose-900/[0.03] border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <div className="flex flex-row items-center justify-between gap-4 pb-2 mb-6 relative z-10">
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-none">Lịch sử giao dịch</h3>
                        <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest">20 giao dịch gần đây của bạn</p>
                    </div>
                </div>
                
                <ScrollArea className="max-h-[600px] pr-4 -mr-4">
                    <div className="space-y-3">
                        {wallet.transactions.length === 0 ? (
                            <div className="text-center py-16 bg-gray-50/30 dark:bg-zinc-800/20 rounded-[1.5rem] border-2 border-dashed border-gray-100 dark:border-zinc-800">
                                <p className="text-sm font-medium text-muted-foreground opacity-60">Chưa có giao dịch nào</p>
                            </div>
                        ) : (
                            wallet.transactions.map((tx) => (
                                <div 
                                    key={tx.id} 
                                    className={`group flex items-center justify-between p-4 rounded-2xl border bg-white dark:bg-zinc-900 transition-all ${
                                        tx.status === 'PENDING' && tx.type === 'DEPOSIT' 
                                        ? 'cursor-pointer border-amber-200 hover:border-amber-300 dark:border-amber-900/50 hover:bg-amber-50/30' 
                                        : 'border-gray-50 dark:border-zinc-800 hover:shadow-md hover:shadow-gray-100 dark:hover:shadow-none hover:-translate-y-0.5'
                                    }`}
                                    onClick={() => {
                                        if (tx.status === 'PENDING' && tx.type === 'DEPOSIT' && tx.vnpayUrl && tx.expiresAt) {
                                            if (new Date(tx.expiresAt) > new Date()) {
                                                setSelectedPendingSession({
                                                    url: tx.vnpayUrl,
                                                    expiresAt: tx.expiresAt,
                                                    transactionId: tx.id,
                                                    amount: tx.amount
                                                })
                                                setShowDeposit(true)
                                            } else {
                                                 toast.error("Giao dịch này đã hết hạn.");
                                            }
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${tx.amount > 0
                                            ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                                            : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
                                            }`}>
                                            {tx.amount > 0 ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-medium text-sm text-gray-900 dark:text-white">
                                                    {tx.description || getTxTitle(tx.type)}
                                                </span>
                                                <StatusBadge status={tx.status} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    {format(new Date(tx.createdAt), 'HH:mm • dd/MM/yyyy', { locale: vi })}
                                                </span>
                                                {tx.paymentMethod && tx.type === 'PAYMENT' && (
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-500">
                                                        {tx.paymentMethod}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-base font-bold tabular-nums transition-transform group-hover:scale-110 ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            <WithdrawDialog open={showWithdraw} onOpenChange={setShowWithdraw} maxAmount={wallet.balance} />
            <SetupPinDialog open={showSetupPin} onOpenChange={setShowSetupPin} />
            <DepositDialog 
                open={showDeposit} 
                onOpenChange={(open) => {
                    setShowDeposit(open)
                    if (!open) setSelectedPendingSession(null)
                }} 
                existingSession={selectedPendingSession}
            />
        </div>
    )
}

function getTxTitle(type: string) {
    switch (type) {
        case 'DEPOSIT': return 'Nạp tiền vào ví';
        case 'WITHDRAW': return 'Rút tiền từ ví';
        case 'PAYMENT': return 'Thanh toán vé tàu';
        case 'REFUND': return 'Hoàn tiền vé tàu';
        default: return 'Giao dịch';
    }
}

function StatusBadge({ status }: { status: string }) {
    const getStyles = () => {
        switch (status) {
            case 'COMPLETED': return { bg: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500', label: 'Thành công' };
            case 'PENDING': return { bg: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500', label: 'Đang xử lý' };
            case 'FAILED': return { bg: 'bg-rose-50 text-rose-600', dot: 'bg-rose-500', label: 'Thất bại' };
            default: return { bg: 'bg-gray-50 text-gray-600', dot: 'bg-gray-500', label: status };
        }
    };
    const styles = getStyles();
    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border-none shadow-sm ${styles.bg}`}>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${status === 'PENDING' ? 'animate-pulse' : ''} ${styles.dot}`} />
            <span className="text-[10px] font-medium leading-none">
                {styles.label}
            </span>
        </div>
    );
}

function WalletSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
    )
}
