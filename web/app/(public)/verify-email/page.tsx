'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/lib/store/auth.store';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const hasStarted = useRef(false);
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác thực email của bạn...');

  useEffect(() => {
    if (hasStarted.current) return;
    
    if (!token) {
      setStatus('error');
      setMessage('Mã xác thực không tìm thấy');
      return;
    }
    
    hasStarted.current = true;

    const verify = async () => {
      try {
        const response = await apiClient.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Xác thực email thành công! Bạn đang được chuyển hướng...');
        
        // Update user state globally to remove verification banner
        await useAuthStore.getState().checkAuth();
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Xác thực thất bại. Mã có thể đã hết hạn.');
      }
    };

    verify();
  }, [token]);

  return (
    <Card className="rounded-[2.5rem] border-gray-100 dark:border-zinc-800 shadow-2xl shadow-rose-900/5 overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-8 text-center">
      <CardHeader>
        <div className="flex justify-center mb-6">
           <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic">
              Railflow<span className="text-[#802222]">.</span>
            </h1>
          </Link>
        </div>
        
        {status === 'loading' && (
          <div className="w-16 h-16 border-4 border-[#802222] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        )}
        
        {status === 'success' && (
          <div className="w-16 h-16 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        )}
        
        {status === 'error' && (
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 dark:text-rose-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        
        <CardTitle className="text-2xl font-bold">{status === 'loading' ? 'Đang xác thực' : status === 'success' ? 'Thành công!' : 'Thất bại'}</CardTitle>
        <CardDescription className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium">
          {message}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="mt-4">
        <Button className="w-full h-12 rounded-2xl bg-[#802222] hover:bg-rose-900 shadow-lg shadow-rose-900/20" asChild>
          <Link href="/login">Đến trang đăng nhập</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-zinc-950 flex flex-col items-center p-6 relative overflow-y-auto justify-center">
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_-20%,#80222215,transparent_50%),radial-gradient(circle_at_70%_120%,#80222210,transparent_50%)] z-0 pointer-events-none" />
      
      <div className="flex w-full max-w-[440px] flex-col gap-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Suspense fallback={<div className="text-center py-20 font-bold text-muted-foreground/40 italic">Đang tải...</div>}>
          <VerifyEmailContent />
        </Suspense>
        
        <div className="text-center mt-4">
            <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">
                &copy; {new Date().getFullYear()} Railflow
            </p>
        </div>
      </div>
    </div>
  );
}
