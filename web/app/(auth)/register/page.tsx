import { RegisterForm } from "@/components/register-form";
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Đăng ký | DATN',
    description: 'Tạo tài khoản mới',
};

export default function RegisterPage() {
    return (
        <div className="bg-muted flex flex-1 flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <h1 className="text-2xl font-bold text-center">railflow.</h1>
                <RegisterForm />
            </div>
        </div>
    );
}
