"use client"

import { AlertCircle } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConflictDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title?: string
    description?: string
}

export function ConflictDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "Ghế đã bị đặt",
    description = "Một hoặc nhiều ghế bạn chọn vừa được người khác giữ chỗ. Chúng tôi đã cập nhật lại danh sách ghế trống."
}: ConflictDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold text-[#802222] dark:text-rose-400 uppercase tracking-tight flex items-center gap-3">
                        <AlertCircle className="h-6 w-6" />
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base font-medium text-muted-foreground pt-4">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-8">
                    <AlertDialogAction onClick={onConfirm} className="bg-[#802222] hover:bg-rose-900 text-white rounded-2xl h-12 px-8 font-bold uppercase tracking-widest text-[10px] border-none shadow-xl shadow-rose-900/20">
                        Đã hiểu
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
