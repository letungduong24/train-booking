'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';

interface CancelBookingButtonProps {
    bookingCode: string;
    onCancelSuccess?: () => void;
    className?: string;
    children?: React.ReactNode;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function CancelBookingButton({ bookingCode, onCancelSuccess, className, children, variant = "outline" }: CancelBookingButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleCancel = async () => {
        try {
            setIsLoading(true);
            await apiClient.post(`/bookings/${bookingCode}/cancel`);
            toast.success('Đã hủy đơn hàng thành công');
            setIsOpen(false);

            if (onCancelSuccess) {
                onCancelSuccess();
            } else {
                router.refresh();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn hàng');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button variant={variant} className={className}>
                    {children || 'Hủy đơn'}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận hủy đơn hàng</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác và vé sẽ được giải phóng cho người khác.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Đóng</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleCancel();
                        }}
                        disabled={isLoading}
                        className="bg-destructive hover:bg-destructive/90 text-white"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Xác nhận hủy
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
