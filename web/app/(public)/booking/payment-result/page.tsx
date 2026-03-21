'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PublicPaymentResultRedirect() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        // Construct the new URL in the dashboard
        const params = searchParams.toString();
        const newUrl = `/dashboard/booking/payment-result${params ? `?${params}` : ''}`;
        
        // Absolute redirect to the protected dashboard area
        // The middleware/AuthGuard will handle login if the user isn't authenticated
        router.replace(newUrl);
    }, [searchParams, router]);

    return (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium animate-pulse">
                Đang chuyển hướng đến kết quả thanh toán...
            </p>
        </div>
    );
}
