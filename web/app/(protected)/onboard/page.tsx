'use client';

import { useAuthStore } from '@/lib/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function OnboardPage() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 md:p-10">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">Chào mừng đến với railflow! 🚂</CardTitle>
                    <CardDescription>
                        Bạn đã đăng nhập thành công
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-lg">
                            Xin chào, <span className="font-semibold">{user?.name || user?.email}</span>!
                        </p>
                        <p className="text-muted-foreground">
                            Email: {user?.email}
                        </p>
                    </div>

                    <div className="border-t pt-6 space-y-4">
                        <h3 className="font-semibold text-lg">Bước tiếp theo</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>Khám phá các tính năng của ứng dụng</li>
                            <li>Cập nhật thông tin cá nhân của bạn</li>
                            <li>Bắt đầu sử dụng dịch vụ</li>
                        </ul>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button className="flex-1" onClick={() => router.push('/')}>
                            Về trang chủ
                        </Button>
                        <Button variant="outline" onClick={handleLogout}>
                            Đăng xuất
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
