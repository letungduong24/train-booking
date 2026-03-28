'use client';

import { Suspense } from 'react';
import { ResetPinForm } from '@/components/reset-pin-form';

export default function ResetPinPage() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-zinc-950 flex flex-col items-center p-6 relative overflow-y-auto justify-center">
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_-20%,#80222215,transparent_50%),radial-gradient(circle_at_70%_120%,#80222210,transparent_50%)] z-0 pointer-events-none" />
      
      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Suspense fallback={<div className="text-center py-20 font-bold text-muted-foreground/40 italic animate-pulse">Đang tải...</div>}>
          <ResetPinForm />
        </Suspense>
        
         <div className="text-center mt-6">
            <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">
                &copy; {new Date().getFullYear()} Railflow Premium Experience
            </p>
        </div>
      </div>
    </div>
  );
}
