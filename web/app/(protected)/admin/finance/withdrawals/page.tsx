"use client"

import { useAdminWithdrawals } from "@/features/wallet/hooks/use-admin-wallet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
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
            <div className="flex-1 space-y-4 p-8 pt-6">
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
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Yêu cầu rút tiền</h2>
                    <p className="text-muted-foreground">
                        Danh sách các yêu cầu rút tiền đang chờ duyệt.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách chờ ({withdrawals?.length || 0})</CardTitle>
                    <CardDescription>
                        Vui lòng kiểm tra và chuyển khoản thủ công trước khi bấm duyệt.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!withdrawals || withdrawals.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">Không có yêu cầu nào</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Người yêu cầu</TableHead>
                                    <TableHead>Số tiền</TableHead>
                                    <TableHead>Thông tin ngân hàng</TableHead>
                                    <TableHead>Thời gian</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {withdrawals.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="font-medium">{req.user?.name || 'Unknown'}</div>
                                            <div className="text-xs text-muted-foreground">{req.user?.email}</div>
                                        </TableCell>
                                        <TableCell className="font-bold text-red-600">
                                            {formatCurrency(Math.abs(req.amount))}
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1 text-sm">
                                                <div className="font-medium">{req.bankName}</div>
                                                <div>{req.bankAccount}</div>
                                                <div className="uppercase text-xs text-muted-foreground">{req.accountName}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(req.createdAt), 'PP pp', { locale: vi })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                Chờ duyệt
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => setActionState({ id: req.id, type: 'approve' })}
                                                disabled={isApproving || isRejecting}
                                            >
                                                {isApproving && actionState?.id === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                                                Duyệt
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => setActionState({ id: req.id, type: 'reject' })}
                                                disabled={isApproving || isRejecting}
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Từ chối
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!actionState} onOpenChange={(open) => !open && setActionState(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionState?.type === 'approve' ? 'Xác nhận duyệt yêu cầu' : 'Xác nhận từ chối yêu cầu'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionState?.type === 'approve'
                                ? 'Bạn có chắc chắn muốn duyệt yêu cầu này? Hãy đảm bảo đã chuyển khoản thủ công cho khách hàng.'
                                : 'Bạn có chắc chắn muốn từ chối yêu cầu này? Tiền sẽ được hoàn lại vào ví khách hàng.'
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmedAction}
                            className={actionState?.type === 'approve' ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"}
                        >
                            {actionState?.type === 'approve' ? 'Duyệt ngay' : 'Từ chối'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
