"use client"

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
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive font-bold flex items-center gap-2">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-foreground">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Đã hiểu
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
