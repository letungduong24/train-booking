'use client';

import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="bg-muted flex flex-1 flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="text-2xl font-bold text-center">railflow.</h1>
        <LoginForm />
      </div>
    </div>
  );
}
