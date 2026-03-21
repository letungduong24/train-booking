'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store/auth.store';
import apiClient from '@/lib/api-client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const profileSchema = z.object({
    name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').optional(),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').or(z.literal('')).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const { user, setUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
            password: '',
        },
    });

    useEffect(() => {
        if (user) {
            form.reset({
                name: user.name || '',
                password: '',
            });
        }
    }, [user, form]);

    async function onSubmit(data: ProfileFormValues) {
        setIsLoading(true);
        try {
            const payload: any = {};
            if (data.name && data.name !== user?.name) {
                payload.name = data.name;
            }
            if (data.password) {
                payload.password = data.password;
            }

            if (Object.keys(payload).length === 0) {
                toast.info('Không có thay đổi nào');
                return;
            }

            const res = await apiClient.post('/auth/profile', payload);
            setUser(res.data);
            toast.success('Cập nhật thông tin thành công');
            form.reset({ ...data, password: '' });
        } catch (error) {
            toast.error('Cập nhật thất bại');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Thông tin cá nhân</h1>

            <div className="bg-card p-6 rounded-lg shadow-sm border">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input value={user?.email || ''} disabled className="bg-muted" />
                        </div>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Họ và tên</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập họ tên của bạn" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mật khẩu mới (Bỏ trống nếu không đổi)</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="******" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}
