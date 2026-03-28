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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/schemas/auth.schema"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import apiClient from "@/lib/api-client"

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setApiError('Mã khôi phục không tìm thấy');
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);

      await apiClient.post('/auth/reset-password', {
        token,
        password: data.password,
      });
      setIsSuccess(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Không thể đặt lại mật khẩu. Mã khôi phục có thể đã hết hạn.';
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
     return (
        <Card className="rounded-[2.5rem] border-gray-100 dark:border-zinc-800 shadow-2xl shadow-rose-900/5 overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-8 text-center">
          <CardTitle className="text-xl font-bold mb-4">Mã khôi phục không hợp lệ</CardTitle>
          <CardDescription className="mb-6">
            Bạn cần một liên kết khôi phục hợp lệ để đặt lại mật khẩu.
          </CardDescription>
          <Button className="w-full rounded-2xl bg-[#802222]" asChild>
            <Link href="/forgot-password">Yêu cầu liên kết mới</Link>
          </Button>
        </Card>
     );
  }

  if (isSuccess) {
    return (
      <Card className="rounded-[2.5rem] border-gray-100 dark:border-zinc-800 shadow-2xl shadow-rose-900/5 overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <CardTitle className="text-2xl font-bold mb-2">Thành công!</CardTitle>
        <CardDescription className="mb-6 font-medium text-zinc-600 dark:text-zinc-400">
          Mật khẩu của bạn đã được cập nhật thành công. Bạn có thể đăng nhập ngay bây giờ.
        </CardDescription>
        <Button className="w-full h-12 rounded-2xl bg-[#802222] hover:bg-rose-900 shadow-lg shadow-rose-900/20" asChild>
          <Link href="/login">Đăng nhập ngay</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="rounded-[2.5rem] border-gray-100 dark:border-zinc-800 shadow-2xl shadow-rose-900/5 overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity mb-2">
            <h1 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic">
              Railflow<span className="text-[#802222]">.</span>
            </h1>
          </Link>
          <CardTitle className="text-xl font-bold mt-4">Đặt lại mật khẩu</CardTitle>
          <CardDescription className="text-xs font-medium text-muted-foreground/60"> Nhập mật khẩu mới cho tài khoản của bạn </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup className="gap-5">
              {apiError && (
                <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 text-center p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                  {apiError}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Mật khẩu mới</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="h-12 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-200/50 dark:border-zinc-800/50 focus-visible:ring-rose-500/20 focus-visible:border-rose-500/50 transition-all"
                  {...register("password")}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1.5 ml-1">{errors.password.message}</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Xác nhận mật khẩu</FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className="h-12 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-200/50 dark:border-zinc-800/50 focus-visible:ring-rose-500/20 focus-visible:border-rose-500/50 transition-all"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1.5 ml-1">{errors.confirmPassword.message}</p>
                )}
              </Field>

              <Field className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-12 rounded-2xl bg-[#802222] hover:bg-rose-900 text-white font-bold text-sm shadow-xl shadow-rose-900/20 transition-all hover:scale-[1.02] active:scale-95 duration-300"
                >
                  {isLoading ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
