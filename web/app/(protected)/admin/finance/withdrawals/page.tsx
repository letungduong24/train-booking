"use client"

import { useAdminWithdrawals } from "@/features/wallet/hooks/use-admin-wallet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { CheckCircle, XCircle, Loader2, CreditCard } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import { useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AdminWithdrawalsPage() {
    const { withdrawals, isLoading, approve, reject, isApproving, isRejecting } = useAdminWithdrawals()
    const [actionState, setActionState] = useState<{ id: string, type: 'approve' | 'reject' } | null>(null)

    const handleConfirmedAction = () => {
        if (!actionState) return

        if (actionState.type === 'approve') {
            approve(actionState.id)
        } else {
            reject(actionState.id)
        }
        setActionState(null)
    }

    if (isLoading) {
        return (
        <div className="flex flex-1 flex-col gap-6">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Quản lý Tài chính</h2>
                    <p className="text-sm text-muted-foreground mt-1 font-medium italic opacity-60">Duyệt các yêu cầu rút tiền và theo dõi dòng tiền hệ thống</p>
                </div>
            </div>

            <Card className="rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-lg shadow-rose-900/[0.015] bg-white dark:bg-zinc-900 overflow-hidden">
                <CardHeader className="p-8 pb-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold text-zinc-900">Danh sách chờ duyệt</CardTitle>
                            <CardDescription className="text-sm font-medium text-muted-foreground/50 mt-1">
                                Hiển thị {withdrawals?.length || 0} yêu cầu đang chờ xử lý
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 pt-6">
                    {!withdrawals || withdrawals.length === 0 ? (
                        <div className="text-center py-20 bg-rose-50/20 rounded-[2rem] border-2 border-dashed border-rose-100/50">
                            <p className="text-sm font-medium text-muted-foreground/60">Không có yêu cầu rút tiền nào cần xử lý</p>
                        </div>
                    ) : (
                        <div className="rounded-[2rem] bg-rose-50/10 dark:bg-zinc-800/10 border border-gray-100 dark:border-zinc-800 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-rose-50/20 dark:bg-zinc-800/20">
                                    <TableRow className="hover:bg-transparent border-none h-16">
                                        <TableHead className="text-xs font-bold uppercase tracking-widest text-[#802222]/50 pl-8">Người yêu cầu</TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-widest text-[#802222]/50">Số tiền</TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-widest text-[#802222]/50">Thông tin ngân hàng</TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-widest text-[#802222]/50">Thời gian</TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-widest text-[#802222]/50">Trạng thái</TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-widest text-[#802222]/50 text-right pr-8">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawals.map((req) => (
                                        <TableRow key={req.id} className="hover:bg-rose-50/5 dark:hover:bg-zinc-800/5 border-none transition-colors h-20">
                                            <TableCell className="pl-8 py-5">
                                                <div className="font-bold text-zinc-900">{req.user?.name || 'Guest User'}</div>
                                                <div className="text-xs font-medium text-muted-foreground/60">{req.user?.email}</div>
                                            </TableCell>
                                            <TableCell className="font-black text-rose-600 tabular-nums">
                                                {formatCurrency(Math.abs(req.amount))}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="text-xs font-bold uppercase tracking-wider text-[#802222]">{req.bankName}</div>
                                                    <div className="font-bold text-sm text-zinc-800">{req.bankAccount}</div>
                                                    <div className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                                        <CreditCard className="w-3 h-3" />
                                                        {req.accountName}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-medium text-muted-foreground/80">
                                                {format(new Date(req.createdAt), 'HH:mm • dd/MM/yyyy', { locale: vi })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter">
                                                    Chờ duyệt
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-8 space-x-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => setActionState({ id: req.id, type: 'approve' })}
                                                    disabled={isApproving || isRejecting}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                                                >
                                                    {isApproving && actionState?.id === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                                                    Duyệt
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setActionState({ id: req.id, type: 'reject' })}
                                                    disabled={isApproving || isRejecting}
                                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl px-4 font-bold transition-all active:scale-95"
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    Từ chối
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!actionState} onOpenChange={(open) => !open && setActionState(null)}>
                <AlertDialogContent className="rounded-[2rem] border-none p-8 gap-6 shadow-2xl bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-[#802222]">
                            {actionState?.type === 'approve' ? 'Xác nhận duyệt yêu cầu' : 'Xác nhận từ chối yêu cầu'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground/60 leading-relaxed">
                            {actionState?.type === 'approve'
                                ? 'Bạn có chắc chắn muốn duyệt yêu cầu này? Hãy đảm bảo đã chuyển khoản thủ công cho khách hàng theo thông tin ngân hàng đã cung cấp.'
                                : 'Bạn có chắc chắn muốn từ chối yêu cầu này? Tiền sẽ được hoàn lại vào ví khách hàng và yêu cầu sẽ được đánh dấu là từ chối.'
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-xl border-gray-100 font-bold px-6">Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmedAction}
                            className={actionState?.type === 'approve' 
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 font-bold shadow-lg shadow-emerald-900/20" 
                                : "bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-6 font-bold shadow-lg shadow-rose-900/20"}
                        >
                            {actionState?.type === 'approve' ? 'Duyệt ngay' : 'Từ chối'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
