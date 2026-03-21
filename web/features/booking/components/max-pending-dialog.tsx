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
            <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-black text-[#802222] dark:text-rose-400 uppercase tracking-tight">
                        Quá giới hạn đơn hàng
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base font-medium text-muted-foreground pt-4">
                        {message || "Bạn đang có quá nhiều đơn hàng chưa thanh toán (tối đa 3 đơn). Vui lòng thanh toán hoặc hủy các đơn hàng cũ trước khi đặt thêm đơn mới."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-8 gap-3">
                    <AlertDialogCancel className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] border-gray-100 hover:bg-gray-50">
                        Đóng
                    </AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => router.push('/dashboard/history?tab=pending')}
                        className="bg-[#802222] hover:bg-rose-900 text-white rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] border-none shadow-xl shadow-rose-900/20"
                    >
                        Xem đơn hàng chờ thanh toán
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
