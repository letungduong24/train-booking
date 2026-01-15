'use client';

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
            router.push('/onboard');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
            setApiError(errorMessage);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Tạo tài khoản mới</CardTitle>
                    <CardDescription>
                        Đăng ký bằng tài khoản Google hoặc email của bạn
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <FieldGroup>
                            <Field>
                                <Button variant="outline" type="button">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                        <path
                                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    Đăng ký với Google
                                </Button>
                            </Field>

                            {apiError && (
                                <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md">
                                    {apiError}
                                </div>
                            )}

                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="ten@example.com"
                                    {...register("email")}
                                    disabled={isLoading}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="name">Họ và tên (Tùy chọn)</FieldLabel>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Nguyễn Văn A"
                                    {...register("name")}
                                    disabled={isLoading}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register("password")}
                                    disabled={isLoading}
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                                )}
                            </Field>

                            <Field>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                                </Button>
                                <FieldDescription className="text-center">
                                    Đã có tài khoản? <a href="/login">Đăng nhập</a>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center">
                Bằng cách đăng ký, bạn đồng ý với <a href="#">Điều khoản dịch vụ</a>{" "}
                và <a href="#">Chính sách bảo mật</a> của chúng tôi.
            </FieldDescription>
        </div>
    )
}
