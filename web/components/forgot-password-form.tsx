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
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/schemas/auth.schema"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import apiClient from "@/lib/api-client"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setApiError(null);

      await apiClient.post('/auth/forgot-password', data);
      setIsSuccess(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="rounded-[2.5rem] border-gray-100 dark:border-zinc-800 shadow-2xl shadow-rose-900/5 overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <CardTitle className="text-2xl font-bold mb-2">Kiểm tra Email</CardTitle>
        <CardDescription className="text-zinc-600 dark:text-zinc-400 mb-6 font-medium">
          Nếu email tồn tại trong hệ thống, chúng tôi đã gửi một liên kết khôi phục mật khẩu đến địa chỉ email của bạn.
        </CardDescription>
        <Button variant="outline" className="w-full h-12 rounded-2xl" asChild>
          <Link href="/login">Quay lại đăng nhập</Link>
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
          <CardTitle className="text-xl font-bold mt-4">Quên mật khẩu?</CardTitle>
          <CardDescription className="text-xs font-medium text-muted-foreground/60"> Nhập email của bạn để nhận liên kết khôi phục </CardDescription>
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

              <Field className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-12 rounded-2xl bg-[#802222] hover:bg-rose-900 text-white font-bold text-sm shadow-xl shadow-rose-900/20 transition-all hover:scale-[1.02] active:scale-95 duration-300"
                >
                  {isLoading ? 'Đang gửi…' : 'Gửi liên kết khôi phục'}
                </Button>
                <div className="text-center mt-6">
                  <p className="text-xs font-semibold text-muted-foreground/60 font-bold italic tracking-tighter">
                    <Link href="/login" className="text-[#802222] hover:underline underline-offset-4">
                      Quay lại đăng nhập
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
