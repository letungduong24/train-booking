'use client';

import { useAuthStore } from '@/lib/store/auth.store';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, X } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

export function VerificationBanner() {
    const { user } = useAuthStore();
    const [isVisible, setIsVisible] = useState(true);
    const [isSending, setIsSending] = useState(false);

    if (!user || user.isEmailVerified || !isVisible) return null;

    const handleResend = async () => {
        try {
            setIsSending(true);
            await apiClient.post('/auth/resend-verification');
            toast.success("Mã xác thực mới đã được gửi!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể gửi mã xác thực.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-500 relative z-50">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-sm font-bold text-amber-900 dark:text-amber-200 tracking-tight">Email của bạn chưa được xác thực</p>
                    <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400/70 uppercase tracking-widest">Vui lòng kiểm tra hộp thư để bảo vệ tài khoản của bạn</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleResend}
                    disabled={isSending}
                    className="h-9 rounded-xl text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-bold text-xs"
                >
                    {isSending ? "Đang gửi..." : "Gửi lại mã"}
                </Button>
                <button 
                    onClick={() => setIsVisible(false)}
                    className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl text-amber-500 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
