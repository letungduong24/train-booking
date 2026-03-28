import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export const registerSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    name: z.string().min(1, 'Tên không được để trống').optional(),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
});

export const resetPasswordSchema = z.object({
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
});

export const resetPinSchema = z.object({
    pin: z.string().min(6, 'Mã PIN phải có ít nhất 6 ký tự'),
    confirmPin: z.string().min(6, 'Mã PIN phải có ít nhất 6 ký tự'),
}).refine((data) => data.pin === data.confirmPin, {
    message: "Mã PIN xác nhận không khớp",
    path: ["confirmPin"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ResetPinFormData = z.infer<typeof resetPinSchema>;
