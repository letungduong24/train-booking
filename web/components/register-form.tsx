'use client';

import Link from "next/link";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterFormData } from "@/lib/schemas/auth.schema"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth.store"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function RegisterForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const router = useRouter();
    const registerUser = useAuthStore((state) => state.register);
    const isLoading = useAuthStore((state) => state.isLoading);
    const [apiError, setApiError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setApiError(null);

            // Register using Zustand store
            await registerUser(data.email, data.password, data.name);

            // Redirect to onboard page after successful registration
            router.push('/dashboard');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
            setApiError(errorMessage);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="rounded-[2.5rem] border-gray-100 dark:border-zinc-800 shadow-2xl shadow-rose-900/5 overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6">
                <CardHeader className="text-center">
                    <Link href="/" className="inline-block hover:opacity-80 transition-opacity mb-2">
                        <h1 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic">
                            Railflow<span className="text-[#802222]">.</span>
                        </h1>
                    </Link>
                </CardHeader>
                <CardContent className="">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <FieldGroup className="gap-5">
                            <Field>
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="w-full h-12 rounded-2xl border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 font-semibold transition-all duration-300"
                                    onClick={() => { window.location.href = `${API_URL}/auth/google`; }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-5 w-5">
                                        <path
                                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    Đăng ký với Google
                                </Button>
                            </Field>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-100 dark:border-zinc-800" />
                                </div>
                                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                                    <span className="bg-white dark:bg-zinc-900 px-3 text-muted-foreground/40">Hoặc đăng ký với email</span>
                                </div>
                            </div>

                            {apiError && (
                                <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 text-center p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900/20 animate-in fade-in zoom-in-95 duration-300">
                                    {apiError}
                                </div>
                            )}

                            <Field>
                                <FieldLabel htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Địa chỉ Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="h-12 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-200/50 dark:border-zinc-800/50 focus-visible:ring-rose-500/20 focus-visible:border-rose-500/50 transition-all"
                                    {...register("email")}
                                    disabled={isLoading}
                                />
                                {errors.email && (
                                    <p className="text-[11px] font-semibold text-rose-500 mt-1.5 ml-1">{errors.email.message}</p>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="name" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Họ và tên (Tùy chọn)</FieldLabel>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Nguyễn Văn A"
                                    className="h-12 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-200/50 dark:border-zinc-800/50 focus-visible:ring-rose-500/20 focus-visible:border-rose-500/50 transition-all"
                                    {...register("name")}
                                    disabled={isLoading}
                                />
                                {errors.name && (
                                    <p className="text-[11px] font-semibold text-rose-500 mt-1.5 ml-1">{errors.name.message}</p>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Mật khẩu</FieldLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-12 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-200/50 dark:border-zinc-800/50 focus-visible:ring-rose-500/20 focus-visible:border-rose-500/50 transition-all"
                                    {...register("password")}
                                    disabled={isLoading}
                                />
                                {errors.password && (
                                    <p className="text-[11px] font-semibold text-rose-500 mt-1.5 ml-1">{errors.password.message}</p>
                                )}
                            </Field>

                            <Field className="pt-2">
                                <Button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full h-12 rounded-2xl bg-[#802222] hover:bg-rose-900 text-white font-bold text-sm shadow-xl shadow-rose-900/20 transition-all hover:scale-[1.02] active:scale-95 duration-300"
                                >
                                    {isLoading ? 'Đang đăng ký...' : 'Tạo tài khoản ngay'}
                                </Button>
                                <div className="text-center mt-6">
                                    <p className="text-xs font-semibold text-muted-foreground/60">
                                        Đã có tài khoản?{" "}
                                        <Link href="/login" className="text-[#802222] hover:underline underline-offset-4 font-bold">
                                            Đăng nhập ngay
                                        </Link>
                                    </p>
                                </div>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
