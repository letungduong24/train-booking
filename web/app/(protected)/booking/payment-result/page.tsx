'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentResultPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const success = searchParams.get('success') === 'true';
    const orderId = searchParams.get('orderId');
    const errorMessage = searchParams.get('error');

    return (
        <div className="container mx-auto py-16 px-4">
            <Card className="max-w-md mx-auto text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">
                        {success ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
                    </CardTitle>
                    <CardDescription>
                        Mã đơn hàng: {orderId}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-6">
                        {success
                            ? 'Cảm ơn bạn đã đặt vé. Vé điện tử sẽ được gửi đến email của bạn.'
                            : errorMessage || 'Giao dịch không thành công. Tiền sẽ được hoàn vào Ví điện tử của bạn.'
                        }
                    </p>
                    <div className="flex flex-col gap-2">
                        <Button onClick={() => router.push('/booking')}>
                            Đặt vé mới
                        </Button>
                        <Button variant="outline" onClick={() => router.push('/')}>
                            Về trang chủ
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
