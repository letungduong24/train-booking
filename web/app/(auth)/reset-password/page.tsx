'use client';

import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-zinc-950 flex flex-col items-center p-6 relative overflow-y-auto">
      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_-20%,#80222215,transparent_50%),radial-gradient(circle_at_70%_120%,#80222210,transparent_50%)] z-0 pointer-events-none" />
      
      <div className="flex w-full max-w-[440px] flex-col gap-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 py-12">
        <Suspense fallback={<div className="text-center py-20 font-bold text-muted-foreground/40 italic animate-pulse">Đang tải...</div>}>
          <ResetPasswordForm />
        </Suspense>
        
        <div className="text-center">
            <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">
                &copy; {new Date().getFullYear()} Railflow
            </p>
        </div>
      </div>
    </div>
  );
}
