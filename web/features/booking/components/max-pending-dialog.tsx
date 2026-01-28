import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

interface MaxPendingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    message?: string;
}

export function MaxPendingDialog({ open, onOpenChange, message }: MaxPendingDialogProps) {
    const router = useRouter();

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Quá giới hạn đơn hàng chờ xử lý</AlertDialogTitle>
                    <AlertDialogDescription>
                        {message || "Bạn đang có quá nhiều đơn hàng chưa thanh toán (tối đa 3 đơn). Vui lòng thanh toán hoặc hủy các đơn hàng cũ trước khi đặt thêm đơn mới."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Đóng</AlertDialogCancel>
                    <AlertDialogAction onClick={() => router.push('/dashboard/history?tab=pending')}>
                        Xem đơn hàng chờ thanh toán
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
