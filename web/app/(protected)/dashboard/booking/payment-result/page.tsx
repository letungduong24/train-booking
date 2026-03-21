'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Ticket, Home, ArrowRight, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function PaymentResultPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const success = searchParams.get('success') === 'true';
    const orderId = searchParams.get('orderId');
    const errorMessage = searchParams.get('error');

    return (
        <div className="flex flex-col items-center justify-center p-6 animate-in fade-in duration-700 min-h-[60vh]">
            {/* Main Content Area */}
            <div className="w-full max-w-2xl space-y-8 text-center">
                {/* Visual Indicator */}
                <div className="flex flex-col items-center space-y-4">
                    <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center shadow-xl",
                        success ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    )}>
                        {success ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                    </div>
                    
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">
                            {success ? 'Thành công!' : 'Thất bại'}
                        </h1>
                        <p className={cn(
                            "text-sm font-medium opacity-80",
                            success ? "text-green-600" : "text-red-600"
                        )}>
                            Mã đơn hàng: {orderId}
                        </p>
                    </div>
                </div>

                {/* Message & Status Details */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-100 dark:border-zinc-800 shadow-md">
                    <p className="text-base font-medium leading-relaxed text-gray-700 dark:text-gray-300">
                        {success
                            ? 'Vé điện tử đã được xác nhận và sẽ sớm được gửi đến email của bạn. Xin cảm ơn!'
                            : errorMessage || 'Giao dịch không thành công. Vui lòng kiểm tra lại phương thức thanh toán.'
                        }
                    </p>
                </div>

                {/* Action Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-4">
                    <Button 
                        size="lg" 
                        className="rounded-xl h-12 bg-[#802222] hover:bg-rose-900 text-white font-medium text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] border-none group"
                        onClick={() => router.push('/dashboard/booking')}
                    >
                        <Ticket className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                        Tiếp tục đặt vé
                        <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                    </Button>
                    
                    <Button 
                        size="lg" 
                        variant="outline" 
                        className="rounded-xl h-12 font-medium text-sm border-gray-200 hover:bg-gray-50 hover:scale-[1.02] transition-all"
                        onClick={() => router.push('/dashboard')}
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Về trang chủ
                    </Button>
                </div>

                {/* Secondary Actions */}
                <div className="flex items-center justify-center gap-8 pt-8">
                    <Link href="/dashboard/history" className="flex items-center gap-2 text-muted-foreground hover:text-[#802222] transition-colors font-medium text-xs">
                        <Ticket className="w-3.5 h-3.5" />
                        Lịch sử đặt vé
                    </Link>
                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                    <Link href="/dashboard/wallet" className="flex items-center gap-2 text-muted-foreground hover:text-[#802222] transition-colors font-medium text-xs">
                        <CreditCard className="w-3.5 h-3.5" />
                        Ví tiền của tôi
                    </Link>
                </div>
            </div>
        </div>
    );
}
