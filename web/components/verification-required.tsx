'use client';

import { useAuthStore } from '@/lib/store/auth.store';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, RefreshCw, LogOut } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import Link from 'next/link';

export function VerificationRequired() {
    const { user, logout } = useAuthStore();
    const [isSending, setIsSending] = useState(false);

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
        <div className="min-h-screen bg-[#FDFCFB] dark:bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_-20%,#80222215,transparent_50%),radial-gradient(circle_at_70%_120%,#80222210,transparent_50%)] z-0 pointer-events-none" />
            
            <div className="flex w-full max-w-[440px] flex-col gap-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="rounded-[2.5rem] border-gray-100 dark:border-zinc-800 shadow-2xl shadow-rose-900/5 overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-8 text-center">
                    <CardHeader>
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center text-[#802222] animate-pulse">
                                <Mail className="w-10 h-10" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Xác thực tài khoản</CardTitle>
                        <CardDescription className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium">
                            Tài khoản <span className="text-[#802222] font-bold">{user?.email}</span> của bạn cần được xác thực để tiếp tục sử dụng dịch vụ.
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 mt-4">
                        <Button 
                            className="w-full h-14 rounded-2xl bg-[#802222] hover:bg-rose-900 shadow-lg shadow-rose-900/20 text-white font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                            onClick={handleResend}
                            disabled={isSending}
                        >
                            {isSending ? (
                                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <Mail className="w-5 h-5 mr-2" />
                            )}
                            {isSending ? "Đang gửi..." : "Gửi lại mã xác thực"}
                        </Button>
                        
                        <div className="pt-2">
                             <Button 
                                variant="ghost"
                                className="w-full h-12 rounded-2xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 font-bold transition-all"
                                onClick={() => logout()}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Đăng xuất
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="text-center">
                    <p className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">
                        &copy; {new Date().getFullYear()} Railflow Premium Experience
                    </p>
                </div>
            </div>
        </div>
    );
}
