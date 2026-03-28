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
import { resetPinSchema, type ResetPinFormData } from "@/lib/schemas/auth.schema"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import apiClient from "@/lib/api-client"

export function ResetPinForm({
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
  } = useForm<ResetPinFormData>({
    resolver: zodResolver(resetPinSchema),
  });

  const onSubmit = async (data: ResetPinFormData) => {
    if (!token) {
      setApiError('Mã khôi phục không tìm thấy');
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);

      await apiClient.post('/wallet/reset-pin', {
        token,
        pin: data.pin,
      });
      setIsSuccess(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Không thể đặt lại mã PIN. Mã khôi phục có thể đã hết hạn.';
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
     return (
        <Card className="rounded-[2.5rem] border-gray-100 dark:border-zinc-800 shadow-2xl shadow-rose-900/5 overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-8 text-center text-rose-500 font-bold italic">
          Mã khôi phục PIN không hợp lệ hoặc đã qua thời gian sử dụng.
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
          Mã PIN ví của bạn đã được cập nhật thành công.
        </CardDescription>
        <Button className="w-full h-12 rounded-2xl bg-[#802222] hover:bg-rose-900" onClick={() => router.push('/dashboard/wallet')}>
          Về ví của tôi
        </Button>
      </Card>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="rounded-[2.5rem] border-gray-100 dark:border-zinc-800 shadow-2xl shadow-rose-900/5 overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">Đặt lại mã PIN ví</CardTitle>
          <CardDescription className="text-xs font-medium text-muted-foreground/60"> Thiết lập mã PIN mới cho các giao dịch thanh toán </CardDescription>
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
                <FieldLabel htmlFor="pin" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Mã PIN mới</FieldLabel>
                <Input
                  id="pin"
                  type="password"
                  maxLength={6}
                  placeholder="_ _ _ _ _ _"
                  className="h-14 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-200/50 dark:border-zinc-800/50 focus-visible:ring-rose-500/20 focus-visible:border-rose-500/50 transition-all text-center tracking-[0.5em] text-xl font-black placeholder:tracking-normal placeholder:font-normal placeholder:opacity-30"
                  {...register("pin")}
                  disabled={isLoading}
                />
                {errors.pin && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1.5 ml-1">{errors.pin.message}</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPin" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Xác nhận mã PIN</FieldLabel>
                <Input
                  id="confirmPin"
                  type="password"
                  maxLength={6}
                  placeholder="_ _ _ _ _ _"
                  className="h-14 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-200/50 dark:border-zinc-800/50 focus-visible:ring-rose-500/20 focus-visible:border-rose-500/50 transition-all text-center tracking-[0.5em] text-xl font-black placeholder:tracking-normal placeholder:font-normal placeholder:opacity-30"
                  {...register("confirmPin")}
                  disabled={isLoading}
                />
                {errors.confirmPin && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1.5 ml-1">{errors.confirmPin.message}</p>
                )}
              </Field>

              <Field className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-12 rounded-2xl bg-[#802222] hover:bg-rose-900 text-white font-bold text-sm shadow-xl shadow-rose-900/20 transition-all hover:scale-[1.02] active:scale-95 duration-300"
                >
                  {isLoading ? 'Đang cập nhật…' : 'Cập nhật mã PIN'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
